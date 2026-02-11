from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import io
import os
import re
import sqlite3
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import pandas as pd
import streamlit as st


# =========================
# Configuration
# =========================
APP_TITLE = "Tax Protest SaaS Mockup (Local)"
DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")

# Canonical columns used throughout the app
CANON = {
    "row_id": "row_id",
    "client_name": "Client_Name",
    "property_id": "Property_ID",
    "notice_value": "Notice_Value",
    "final_value": "Final_Value",
    "reduction": "Reduction",
    "tax_saved": "Tax_Saved",
    "base_fee": "Base_Fee",
    "manual_discount": "Manual_Discount",
    "final_invoice": "Final_Invoice",
    "status": "Status",
    "matched_customer_id": "Matched_Customer_ID",
    "matched_customer_name": "Matched_Customer_Name",
}

ROLE_ADMIN = "admin"
ROLE_STAFF = "staff"
ROLE_VIEW = "view"


# =========================
# Security helpers (simple, local POC)
# =========================
def _pbkdf2_hash_password(password: str, salt: bytes, iterations: int = 200_000) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = _pbkdf2_hash_password(password, salt)
    return f"pbkdf2_sha256$200000${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, dk_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
        dk = _pbkdf2_hash_password(password, salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def normalize_name(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^a-z0-9 \-']", "", s)
    return s


# =========================
# DB layer
# =========================
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            org_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(org_id, email),
            FOREIGN KEY(org_id) REFERENCES organizations(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            org_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (org_id, key),
            FOREIGN KEY(org_id) REFERENCES organizations(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            org_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            name_norm TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address1 TEXT,
            address2 TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            qb_customer_ref TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            UNIQUE(org_id, name_norm),
            FOREIGN KEY(org_id) REFERENCES organizations(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            org_id INTEGER NOT NULL,
            created_by_user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            source_filename TEXT NOT NULL,
            tax_rate_pct REAL NOT NULL,
            contingency_pct REAL NOT NULL,
            flat_fee REAL NOT NULL,
            review_min_tax_saved REAL NOT NULL,
            charge_flat_if_no_win INTEGER NOT NULL,
            invoice_date TEXT NOT NULL,
            days_due INTEGER NOT NULL,
            qb_item_name TEXT NOT NULL,
            qb_desc_prefix TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(org_id) REFERENCES organizations(id),
            FOREIGN KEY(created_by_user_id) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS batch_rows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            row_index INTEGER NOT NULL,
            raw_client_name TEXT NOT NULL,
            property_id TEXT NOT NULL,
            notice_value REAL NOT NULL,
            final_value REAL NOT NULL,
            reduction REAL NOT NULL,
            tax_saved REAL NOT NULL,
            base_fee REAL NOT NULL,
            manual_discount REAL NOT NULL,
            final_invoice REAL NOT NULL,
            status TEXT NOT NULL,
            matched_customer_id INTEGER,
            matched_customer_name TEXT,
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            created_by_user_id INTEGER NOT NULL,
            invoice_start_no INTEGER NOT NULL,
            invoice_count INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            filename TEXT NOT NULL,
            csv_blob BLOB NOT NULL,
            FOREIGN KEY(batch_id) REFERENCES batches(id),
            FOREIGN KEY(created_by_user_id) REFERENCES users(id)
        )
        """
    )

    conn.commit()
    conn.close()


def set_setting(org_id: int, key: str, value: str) -> None:
    conn = db()
    conn.execute(
        "INSERT INTO settings(org_id, key, value) VALUES(?, ?, ?) "
        "ON CONFLICT(org_id, key) DO UPDATE SET value=excluded.value",
        (org_id, key, value),
    )
    conn.commit()
    conn.close()


def get_setting(org_id: int, key: str, default: str) -> str:
    conn = db()
    row = conn.execute(
        "SELECT value FROM settings WHERE org_id=? AND key=?",
        (org_id, key),
    ).fetchone()
    conn.close()
    return row["value"] if row else default


def bootstrap_org_defaults(org_id: int) -> None:
    defaults = {
        "tax_rate_pct": "2.500000",
        "contingency_pct": "25",
        "flat_fee": "150",
        "review_min_tax_saved": "700",
        "charge_flat_if_no_win": "0",
        "days_due": "30",
        "qb_item_name": "Property Tax Protest",
        "qb_desc_prefix": "Tax savings",
        "next_invoice_no": "1001",
    }
    for k, v in defaults.items():
        set_setting(org_id, k, v)


# =========================
# Auth / Session
# =========================
@dataclass
class SessionUser:
    user_id: int
    org_id: int
    email: str
    role: str
    org_name: str


def session_user() -> Optional[SessionUser]:
    return st.session_state.get("user")


def require_login() -> SessionUser:
    u = session_user()
    if not u:
        st.stop()
    return u


def is_admin(u: SessionUser) -> bool:
    return u.role == ROLE_ADMIN


def create_org_with_admin(org_name: str, email: str, password: str) -> Tuple[bool, str]:
    org_name = org_name.strip()
    email = email.strip().lower()

    if not org_name or not email or not password:
        return False, "All fields are required."

    conn = db()
    cur = conn.cursor()

    try:
        cur.execute("INSERT INTO organizations(name, created_at) VALUES(?, ?)", (org_name, dt.datetime.utcnow().isoformat()))
        org_id = cur.lastrowid

        cur.execute(
            "INSERT INTO users(org_id, email, password_hash, role, created_at) VALUES(?, ?, ?, ?, ?)",
            (org_id, email, hash_password(password), ROLE_ADMIN, dt.datetime.utcnow().isoformat()),
        )

        conn.commit()
        conn.close()

        bootstrap_org_defaults(org_id)
        return True, "Organization created. You can sign in now."
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        if "organizations.name" in str(e).lower():
            return False, "Organization name already exists."
        return False, "That user already exists for this organization."
    except Exception:
        conn.rollback()
        conn.close()
        return False, "Failed to create organization."


def authenticate(org_name: str, email: str, password: str) -> Tuple[bool, Optional[SessionUser], str]:
    org_name = org_name.strip()
    email = email.strip().lower()

    conn = db()
    org = conn.execute("SELECT id, name FROM organizations WHERE name=?", (org_name,)).fetchone()
    if not org:
        conn.close()
        return False, None, "Invalid organization or credentials."

    user = conn.execute(
        "SELECT id, org_id, email, password_hash, role FROM users WHERE org_id=? AND email=?",
        (org["id"], email),
    ).fetchone()
    conn.close()

    if not user or not verify_password(password, user["password_hash"]):
        return False, None, "Invalid organization or credentials."

    u = SessionUser(
        user_id=int(user["id"]),
        org_id=int(user["org_id"]),
        email=user["email"],
        role=user["role"],
        org_name=org["name"],
    )
    return True, u, "Signed in."


def logout() -> None:
    st.session_state.pop("user", None)
    st.session_state.pop("active_batch_id", None)


# =========================
# Data / Math engine
# =========================
def to_money(series: pd.Series) -> pd.Series:
    s = series.astype(str).str.strip()
    s = s.str.replace(r"[\$,]", "", regex=True)
    s = s.str.replace(r"^\((.*)\)$", r"-\1", regex=True)
    return pd.to_numeric(s, errors="coerce").fillna(0.0)


def guess_column(cols: list[str], keywords: list[str]) -> str:
    lower = {c: c.lower() for c in cols}
    for c in cols:
        if any(k in lower[c] for k in keywords):
            return c
    return cols[0] if cols else ""


def compute_batch_df(
    df_raw: pd.DataFrame,
    col_owner: str,
    col_propid: str,
    col_notice: str,
    col_final: str,
    tax_rate_pct: float,
    contingency_pct: float,
    flat_fee: float,
    review_min_tax_saved: float,
    charge_flat_if_no_win: bool,
    customers_by_norm: Dict[str, dict],
) -> pd.DataFrame:
    df = df_raw.copy().reset_index(drop=True)
    df[CANON["row_id"]] = df.index.astype(int)

    df[CANON["client_name"]] = df[col_owner].astype(str).fillna("").str.strip()
    df[CANON["property_id"]] = df[col_propid].astype(str).fillna("").str.strip()

    df[CANON["notice_value"]] = to_money(df[col_notice])
    df[CANON["final_value"]] = to_money(df[col_final])

    df[CANON["reduction"]] = (df[CANON["notice_value"]] - df[CANON["final_value"]]).clip(lower=0.0)
    tax_rate = tax_rate_pct / 100.0
    df[CANON["tax_saved"]] = (df[CANON["reduction"]] * tax_rate).clip(lower=0.0)

    df[CANON["base_fee"]] = 0.0
    wins = df[CANON["tax_saved"]] > 0
    df.loc[wins, CANON["base_fee"]] = (df.loc[wins, CANON["tax_saved"]] * (contingency_pct / 100.0)) + float(flat_fee)
    if charge_flat_if_no_win:
        df.loc[~wins, CANON["base_fee"]] = float(flat_fee)

    df[CANON["manual_discount"]] = 0.0
    df[CANON["final_invoice"]] = (df[CANON["base_fee"]] - df[CANON["manual_discount"]]).clip(lower=0.0)

    def status(ts: float) -> str:
        if ts <= 0:
            return "NO_CHARGE"
        if ts < review_min_tax_saved:
            return "REVIEW"
        return "STANDARD"

    df[CANON["status"]] = df[CANON["tax_saved"]].apply(status)

    # Customer matching (exact normalized name match)
    matched_ids = []
    matched_names = []
    for raw_name in df[CANON["client_name"]].tolist():
        key = normalize_name(raw_name)
        cust = customers_by_norm.get(key)
        if cust:
            matched_ids.append(int(cust["id"]))
            matched_names.append(str(cust["name"]))
        else:
            matched_ids.append(None)
            matched_names.append(None)

    df[CANON["matched_customer_id"]] = matched_ids
    df[CANON["matched_customer_name"]] = matched_names

    return df


def qb_export_csv(
    billable_df: pd.DataFrame,
    invoice_start_no: int,
    invoice_date: dt.date,
    days_due: int,
    qb_item_name: str,
    qb_desc_prefix: str,
) -> Tuple[pd.DataFrame, bytes]:
    due_date = invoice_date + dt.timedelta(days=int(days_due))

    out = billable_df.copy().reset_index(drop=True)
    out["InvoiceNo"] = range(invoice_start_no, invoice_start_no + len(out))

    customer_name = out[CANON["matched_customer_name"]].fillna(out[CANON["client_name"]]).astype(str)

    item_desc = (
        qb_desc_prefix
        + ": $"
        + out[CANON["tax_saved"]].round(2).astype(str)
        + " | Prop: "
        + out[CANON["property_id"]].astype(str)
    )

    qb = pd.DataFrame(
        {
            "InvoiceNo": out["InvoiceNo"],
            "Customer": customer_name,
            "InvoiceDate": invoice_date.strftime("%m/%d/%Y"),
            "DueDate": due_date.strftime("%m/%d/%Y"),
            "Item(Product/Service)": qb_item_name,
            "ItemDescription": item_desc,
            "ItemQuantity": 1,
            "ItemRate": out[CANON["final_invoice"]].round(2),
            "ItemAmount": out[CANON["final_invoice"]].round(2),
        }
    )
    csv_bytes = qb.to_csv(index=False).encode("utf-8")
    return qb, csv_bytes


# =========================
# UI Pages
# =========================
def page_login() -> None:
    st.title(APP_TITLE)
    st.write("Local proof-of-concept for a multi-company tax protest billing SaaS.")

    tab1, tab2 = st.tabs(["Sign in", "Create organization"])

    with tab1:
        org_name = st.text_input("Organization name")
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_pw")

        if st.button("Sign in", type="primary"):
            ok, u, msg = authenticate(org_name, email, password)
            if ok and u:
                st.session_state["user"] = u
                st.rerun()
            else:
                st.error(msg)

    with tab2:
        org_name2 = st.text_input("Organization name", key="org_create_name")
        email2 = st.text_input("Admin email", key="org_create_email")
        pw2 = st.text_input("Admin password", type="password", key="org_create_pw")
        pw3 = st.text_input("Confirm password", type="password", key="org_create_pw2")

        if st.button("Create organization", type="primary"):
            if pw2 != pw3:
                st.error("Passwords do not match.")
            else:
                ok, msg = create_org_with_admin(org_name2, email2, pw2)
                if ok:
                    st.success(msg)
                else:
                    st.error(msg)


def sidebar_nav(u: SessionUser) -> str:
    with st.sidebar:
        st.subheader("Navigation")
        st.write(f"Org: {u.org_name}")
        st.write(f"User: {u.email}")
        st.write(f"Role: {u.role}")

        choice = st.radio(
            "Go to",
            ["Run Batch", "Customers", "Batches", "Settings"] + (["Users"] if is_admin(u) else []),
            index=0,
        )

        st.divider()
        if st.button("Sign out"):
            logout()
            st.rerun()

    return choice


def fetch_customers_by_norm(org_id: int) -> Dict[str, dict]:
    conn = db()
    rows = conn.execute(
        "SELECT id, name, name_norm, email, qb_customer_ref, is_active FROM customers WHERE org_id=? AND is_active=1",
        (org_id,),
    ).fetchall()
    conn.close()
    out: Dict[str, dict] = {}
    for r in rows:
        out[r["name_norm"]] = dict(r)
    return out


def page_customers(u: SessionUser) -> None:
    st.header("Customers")

    conn = db()
    q = st.text_input("Search name/email")
    show_inactive = st.checkbox("Show inactive", value=False)

    where = "org_id=?"
    params = [u.org_id]

    if not show_inactive:
        where += " AND is_active=1"
    if q.strip():
        where += " AND (name LIKE ? OR email LIKE ?)"
        params.extend([f"%{q.strip()}%", f"%{q.strip()}%"])

    rows = conn.execute(
        f"""
        SELECT id, name, email, phone, city, state, zip, qb_customer_ref, is_active, created_at
        FROM customers
        WHERE {where}
        ORDER BY name
        """,
        params,
    ).fetchall()
    conn.close()

    df = pd.DataFrame([dict(r) for r in rows]) if rows else pd.DataFrame(columns=["id", "name", "email", "phone", "city", "state", "zip", "qb_customer_ref", "is_active", "created_at"])
    st.dataframe(df, use_container_width=True, hide_index=True)

    st.divider()
    st.subheader("Add customer")

    c1, c2 = st.columns(2)
    with c1:
        name = st.text_input("Name")
        email = st.text_input("Email", key="cust_email")
        phone = st.text_input("Phone")
    with c2:
        address1 = st.text_input("Address 1")
        city = st.text_input("City")
        state = st.text_input("State", value="TX")
        zipc = st.text_input("ZIP")

    qb_ref = st.text_input("QuickBooks Customer Ref (optional)")

    if st.button("Add customer", type="primary"):
        if not name.strip():
            st.error("Name is required.")
        else:
            conn = db()
            try:
                conn.execute(
                    """
                    INSERT INTO customers(org_id, name, name_norm, email, phone, address1, city, state, zip, qb_customer_ref, is_active, created_at)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                    """,
                    (
                        u.org_id,
                        name.strip(),
                        normalize_name(name),
                        (email or "").strip() or None,
                        (phone or "").strip() or None,
                        (address1 or "").strip() or None,
                        (city or "").strip() or None,
                        (state or "").strip() or None,
                        (zipc or "").strip() or None,
                        (qb_ref or "").strip() or None,
                        dt.datetime.utcnow().isoformat(),
                    ),
                )
                conn.commit()
                st.success("Customer added.")
                st.rerun()
            except sqlite3.IntegrityError:
                conn.rollback()
                st.error("That customer already exists (same normalized name) in this organization.")
            finally:
                conn.close()

    st.divider()
    st.subheader("Import customers (CSV)")

    st.caption("CSV columns supported: name, email, phone, address1, city, state, zip, qb_customer_ref")
    up = st.file_uploader("Upload CSV", type=["csv"], key="cust_import")
    if up and st.button("Import CSV", type="primary"):
        try:
            imp = pd.read_csv(up)
            imp.columns = [c.strip().lower() for c in imp.columns]
            if "name" not in imp.columns:
                st.error("CSV must include a 'name' column.")
                return

            conn = db()
            added = 0
            skipped = 0
            for _, r in imp.iterrows():
                nm = str(r.get("name", "")).strip()
                if not nm:
                    continue
                try:
                    conn.execute(
                        """
                        INSERT INTO customers(org_id, name, name_norm, email, phone, address1, city, state, zip, qb_customer_ref, is_active, created_at)
                        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                        """,
                        (
                            u.org_id,
                            nm,
                            normalize_name(nm),
                            (str(r.get("email", "")).strip() or None),
                            (str(r.get("phone", "")).strip() or None),
                            (str(r.get("address1", "")).strip() or None),
                            (str(r.get("city", "")).strip() or None),
                            (str(r.get("state", "")).strip() or None),
                            (str(r.get("zip", "")).strip() or None),
                            (str(r.get("qb_customer_ref", "")).strip() or None),
                            dt.datetime.utcnow().isoformat(),
                        ),
                    )
                    added += 1
                except sqlite3.IntegrityError:
                    skipped += 1
            conn.commit()
            conn.close()

            st.success(f"Import complete. Added={added}, skipped(duplicates)={skipped}.")
            st.rerun()
        except Exception as e:
            st.error(f"Import failed: {e}")


def page_settings(u: SessionUser) -> None:
    st.header("Settings")

    tax_rate_pct = float(get_setting(u.org_id, "tax_rate_pct", "2.500000"))
    contingency_pct = float(get_setting(u.org_id, "contingency_pct", "25"))
    flat_fee = float(get_setting(u.org_id, "flat_fee", "150"))
    review_min_tax_saved = float(get_setting(u.org_id, "review_min_tax_saved", "700"))
    charge_flat_if_no_win = int(get_setting(u.org_id, "charge_flat_if_no_win", "0"))
    days_due = int(get_setting(u.org_id, "days_due", "30"))
    qb_item_name = get_setting(u.org_id, "qb_item_name", "Property Tax Protest")
    qb_desc_prefix = get_setting(u.org_id, "qb_desc_prefix", "Tax savings")
    next_invoice_no = int(get_setting(u.org_id, "next_invoice_no", "1001"))

    c1, c2, c3 = st.columns(3)
    with c1:
        tax_rate_pct = st.number_input("Tax rate (%)", value=tax_rate_pct, format="%.6f")
        contingency_pct = st.number_input("Contingency (%)", value=contingency_pct, step=1.0)
        flat_fee = st.number_input("Flat fee ($)", value=flat_fee, step=10.0)
    with c2:
        review_min_tax_saved = st.number_input("Review if Tax Saved < ($)", value=review_min_tax_saved, step=50.0)
        charge_flat_if_no_win = st.checkbox("Charge flat fee if no win", value=bool(charge_flat_if_no_win))
        days_due = st.number_input("Default days due", value=days_due, step=1)
    with c3:
        qb_item_name = st.text_input("QuickBooks item name", value=qb_item_name)
        qb_desc_prefix = st.text_input("QuickBooks description prefix", value=qb_desc_prefix)
        next_invoice_no = st.number_input("Next invoice number", value=next_invoice_no, step=1)

    if st.button("Save settings", type="primary"):
        set_setting(u.org_id, "tax_rate_pct", f"{tax_rate_pct:.6f}")
        set_setting(u.org_id, "contingency_pct", str(int(contingency_pct)))
        set_setting(u.org_id, "flat_fee", str(float(flat_fee)))
        set_setting(u.org_id, "review_min_tax_saved", str(float(review_min_tax_saved)))
        set_setting(u.org_id, "charge_flat_if_no_win", "1" if charge_flat_if_no_win else "0")
        set_setting(u.org_id, "days_due", str(int(days_due)))
        set_setting(u.org_id, "qb_item_name", qb_item_name.strip() or "Property Tax Protest")
        set_setting(u.org_id, "qb_desc_prefix", qb_desc_prefix.strip() or "Tax savings")
        set_setting(u.org_id, "next_invoice_no", str(int(next_invoice_no)))
        st.success("Saved.")
        st.rerun()


def page_users(u: SessionUser) -> None:
    if not is_admin(u):
        st.error("Admins only.")
        return

    st.header("Users")

    conn = db()
    rows = conn.execute(
        "SELECT id, email, role, created_at FROM users WHERE org_id=? ORDER BY email",
        (u.org_id,),
    ).fetchall()
    conn.close()

    df = pd.DataFrame([dict(r) for r in rows]) if rows else pd.DataFrame(columns=["id", "email", "role", "created_at"])
    st.dataframe(df, use_container_width=True, hide_index=True)

    st.divider()
    st.subheader("Add user")

    email = st.text_input("Email", key="new_user_email").strip().lower()
    pw = st.text_input("Temp password", type="password", key="new_user_pw")
    role = st.selectbox("Role", [ROLE_ADMIN, ROLE_STAFF, ROLE_VIEW], index=1)

    if st.button("Create user", type="primary"):
        if not email or not pw:
            st.error("Email and password are required.")
            return
        conn = db()
        try:
            conn.execute(
                "INSERT INTO users(org_id, email, password_hash, role, created_at) VALUES(?, ?, ?, ?, ?)",
                (u.org_id, email, hash_password(pw), role, dt.datetime.utcnow().isoformat()),
            )
            conn.commit()
            st.success("User created.")
            st.rerun()
        except sqlite3.IntegrityError:
            conn.rollback()
            st.error("User already exists.")
        finally:
            conn.close()


def page_run_batch(u: SessionUser) -> None:
    st.header("Run Batch")

    # Load org settings defaults
    tax_rate_pct = float(get_setting(u.org_id, "tax_rate_pct", "2.500000"))
    contingency_pct = float(get_setting(u.org_id, "contingency_pct", "25"))
    flat_fee = float(get_setting(u.org_id, "flat_fee", "150"))
    review_min_tax_saved = float(get_setting(u.org_id, "review_min_tax_saved", "700"))
    charge_flat_if_no_win = bool(int(get_setting(u.org_id, "charge_flat_if_no_win", "0")))
    days_due = int(get_setting(u.org_id, "days_due", "30"))
    qb_item_name = get_setting(u.org_id, "qb_item_name", "Property Tax Protest")
    qb_desc_prefix = get_setting(u.org_id, "qb_desc_prefix", "Tax savings")

    st.subheader("Batch parameters")
    c1, c2, c3 = st.columns(3)
    with c1:
        tax_rate_pct = st.number_input("Tax rate (%)", value=tax_rate_pct, format="%.6f")
        contingency_pct = st.number_input("Contingency (%)", value=contingency_pct, step=1.0)
        flat_fee = st.number_input("Flat fee ($)", value=flat_fee, step=10.0)
    with c2:
        review_min_tax_saved = st.number_input("Review if Tax Saved < ($)", value=review_min_tax_saved, step=50.0)
        charge_flat_if_no_win = st.checkbox("Charge flat fee if no win", value=charge_flat_if_no_win)
        invoice_date = st.date_input("Invoice date", value=dt.date.today())
    with c3:
        days_due = st.number_input("Days due", value=days_due, step=1)
        qb_item_name = st.text_input("QB item name", value=qb_item_name)
        qb_desc_prefix = st.text_input("QB description prefix", value=qb_desc_prefix)

    st.divider()
    st.subheader("Upload county sheet")
    up = st.file_uploader("Upload CSV or XLSX", type=["csv", "xlsx"], key="batch_upload")

    if not up:
        st.info("Upload a file to continue.")
        return

    # Load file
    try:
        if up.name.lower().endswith(".csv"):
            df_raw = pd.read_csv(up)
        else:
            df_raw = pd.read_excel(up)
    except Exception as e:
        st.error(f"Failed to read file: {e}")
        return

    if df_raw.empty:
        st.error("The uploaded file contains 0 rows.")
        return

    cols = list(df_raw.columns)
    if not cols:
        st.error("No columns detected.")
        return

    st.subheader("Map columns")
    guess_owner = guess_column(cols, ["owner", "name", "taxpayer", "client"])
    guess_propid = guess_column(cols, ["prop", "property", "id", "account", "pid"])
    guess_notice = guess_column(cols, ["notice", "initial", "appraised", "market", "value"])
    guess_final = guess_column(cols, ["final", "certified", "settled", "value"])

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        col_owner = st.selectbox("Owner/Client column", cols, index=cols.index(guess_owner) if guess_owner in cols else 0)
    with m2:
        col_propid = st.selectbox("Property ID column", cols, index=cols.index(guess_propid) if guess_propid in cols else 0)
    with m3:
        col_notice = st.selectbox("Notice/Initial value column", cols, index=cols.index(guess_notice) if guess_notice in cols else 0)
    with m4:
        col_final = st.selectbox("Final value column", cols, index=cols.index(guess_final) if guess_final in cols else 0)

    customers_by_norm = fetch_customers_by_norm(u.org_id)

    df_calc = compute_batch_df(
        df_raw=df_raw,
        col_owner=col_owner,
        col_propid=col_propid,
        col_notice=col_notice,
        col_final=col_final,
        tax_rate_pct=float(tax_rate_pct),
        contingency_pct=float(contingency_pct),
        flat_fee=float(flat_fee),
        review_min_tax_saved=float(review_min_tax_saved),
        charge_flat_if_no_win=bool(charge_flat_if_no_win),
        customers_by_norm=customers_by_norm,
    )

    st.divider()
    st.subheader("Summary")
    total_clients = len(df_calc)
    total_tax_saved = float(df_calc[CANON["tax_saved"]].sum())
    total_base = float(df_calc[CANON["base_fee"]].sum())
    review_count = int((df_calc[CANON["status"]] == "REVIEW").sum())
    no_charge_count = int((df_calc[CANON["final_invoice"]] <= 0).sum())
    matched_count = int(df_calc[CANON["matched_customer_id"]].notna().sum())

    a, b, c, d, e = st.columns(5)
    a.metric("Rows", total_clients)
    b.metric("Total Tax Saved", f"${total_tax_saved:,.2f}")
    c.metric("Total Calculated Fees", f"${total_base:,.2f}")
    d.metric("Review", review_count)
    e.metric("Matched Customers", matched_count)

    st.caption(f"Rows with zero invoice: {no_charge_count}. Unmatched customers: {total_clients - matched_count}.")

    st.divider()
    st.subheader("Review and edit discounts")

    view = df_calc[
        [
            CANON["row_id"],
            CANON["client_name"],
            CANON["property_id"],
            CANON["tax_saved"],
            CANON["base_fee"],
            CANON["manual_discount"],
            CANON["final_invoice"],
            CANON["status"],
            CANON["matched_customer_name"],
        ]
    ].copy()

    edited = st.data_editor(
        view,
        hide_index=True,
        use_container_width=True,
        height=520,
        disabled=[
            CANON["row_id"],
            CANON["client_name"],
            CANON["property_id"],
            CANON["tax_saved"],
            CANON["base_fee"],
            CANON["status"],
            CANON["matched_customer_name"],
            CANON["final_invoice"],
        ],
        column_config={
            CANON["client_name"]: st.column_config.TextColumn("Client Name"),
            CANON["property_id"]: st.column_config.TextColumn("Property ID"),
            CANON["tax_saved"]: st.column_config.NumberColumn("Tax Saved", format="$%.2f"),
            CANON["base_fee"]: st.column_config.NumberColumn("Calc Fee", format="$%.2f"),
            CANON["manual_discount"]: st.column_config.NumberColumn("Manual Discount", format="$%.2f"),
            CANON["final_invoice"]: st.column_config.NumberColumn("Final Invoice", format="$%.2f"),
            CANON["status"]: st.column_config.TextColumn("Status"),
            CANON["matched_customer_name"]: st.column_config.TextColumn("Matched Customer"),
        },
    )

    # Apply discounts back
    edited[CANON["manual_discount"]] = pd.to_numeric(edited[CANON["manual_discount"]], errors="coerce").fillna(0.0)
    df_calc = df_calc.merge(
        edited[[CANON["row_id"], CANON["manual_discount"]]],
        on=CANON["row_id"],
        suffixes=("", "_new"),
        how="left",
    )
    df_calc[CANON["manual_discount"]] = df_calc[f"{CANON['manual_discount']}_new"].fillna(df_calc[CANON["manual_discount"]])
    df_calc.drop(columns=[f"{CANON['manual_discount']}_new"], inplace=True)

    df_calc[CANON["final_invoice"]] = (df_calc[CANON["base_fee"]] - df_calc[CANON["manual_discount"]]).clip(lower=0.0)

    billable = df_calc[df_calc[CANON["final_invoice"]] > 0].copy()
    st.write(f"Billable invoices: {len(billable)}")
    st.write(f"Billable total: ${float(billable[CANON['final_invoice']].sum()):,.2f}")

    st.divider()
    st.subheader("Save batch and export")

    notes = st.text_input("Batch notes (optional)")

    save_col1, save_col2 = st.columns([1, 1])
    with save_col1:
        if st.button("Save batch to database", type="primary"):
            conn = db()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO batches(
                    org_id, created_by_user_id, created_at,
                    source_filename, tax_rate_pct, contingency_pct, flat_fee,
                    review_min_tax_saved, charge_flat_if_no_win,
                    invoice_date, days_due, qb_item_name, qb_desc_prefix, notes
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    u.org_id,
                    u.user_id,
                    dt.datetime.utcnow().isoformat(),
                    up.name,
                    float(tax_rate_pct),
                    float(contingency_pct),
                    float(flat_fee),
                    float(review_min_tax_saved),
                    1 if charge_flat_if_no_win else 0,
                    invoice_date.isoformat(),
                    int(days_due),
                    qb_item_name.strip() or "Property Tax Protest",
                    qb_desc_prefix.strip() or "Tax savings",
                    notes.strip() or None,
                ),
            )
            batch_id = cur.lastrowid

            # Insert rows
            for _, r in df_calc.iterrows():
                cur.execute(
                    """
                    INSERT INTO batch_rows(
                        batch_id, row_index,
                        raw_client_name, property_id,
                        notice_value, final_value, reduction, tax_saved,
                        base_fee, manual_discount, final_invoice,
                        status, matched_customer_id, matched_customer_name
                    )
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        batch_id,
                        int(r[CANON["row_id"]]),
                        str(r[CANON["client_name"]]),
                        str(r[CANON["property_id"]]),
                        float(r[CANON["notice_value"]]),
                        float(r[CANON["final_value"]]),
                        float(r[CANON["reduction"]]),
                        float(r[CANON["tax_saved"]]),
                        float(r[CANON["base_fee"]]),
                        float(r[CANON["manual_discount"]]),
                        float(r[CANON["final_invoice"]]),
                        str(r[CANON["status"]]),
                        int(r[CANON["matched_customer_id"]]) if pd.notna(r[CANON["matched_customer_id"]]) else None,
                        str(r[CANON["matched_customer_name"]]) if pd.notna(r[CANON["matched_customer_name"]]) else None,
                    ),
                )

            conn.commit()
            conn.close()

            st.session_state["active_batch_id"] = batch_id
            st.success(f"Saved batch #{batch_id}.")
            st.rerun()

    with save_col2:
        active_batch_id = st.session_state.get("active_batch_id")
        if active_batch_id:
            st.write(f"Active batch: #{active_batch_id}")
        else:
            st.caption("Save the batch first to enable export storage and invoice numbering.")

    if st.session_state.get("active_batch_id"):
        batch_id = int(st.session_state["active_batch_id"])

        # Pull next invoice number from settings
        next_inv = int(get_setting(u.org_id, "next_invoice_no", "1001"))
        qb_df, csv_bytes = qb_export_csv(
            billable_df=billable,
            invoice_start_no=next_inv,
            invoice_date=invoice_date,
            days_due=int(days_due),
            qb_item_name=qb_item_name.strip() or "Property Tax Protest",
            qb_desc_prefix=qb_desc_prefix.strip() or "Tax savings",
        )

        filename = f"QB_Import_Batch_{batch_id}_{dt.date.today().isoformat()}.csv"

        st.download_button(
            "Download QuickBooks CSV",
            data=csv_bytes,
            file_name=filename,
            mime="text/csv",
            type="primary",
        )

        if st.button("Store export in database and increment invoice numbers"):
            conn = db()
            conn.execute(
                """
                INSERT INTO exports(
                    batch_id, created_at, created_by_user_id,
                    invoice_start_no, invoice_count, total_amount,
                    filename, csv_blob
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    batch_id,
                    dt.datetime.utcnow().isoformat(),
                    u.user_id,
                    next_inv,
                    int(len(qb_df)),
                    float(billable[CANON["final_invoice"]].sum()),
                    filename,
                    sqlite3.Binary(csv_bytes),
                ),
            )
            # Increment invoice number
            set_setting(u.org_id, "next_invoice_no", str(next_inv + int(len(qb_df))))
            conn.commit()
            conn.close()
            st.success("Export stored and next invoice number updated.")
            st.rerun()

        with st.expander("Preview export (first 25 rows)", expanded=False):
            st.dataframe(qb_df.head(25), use_container_width=True, hide_index=True)


def page_batches(u: SessionUser) -> None:
    st.header("Batches")

    conn = db()
    batches = conn.execute(
        """
        SELECT b.id, b.created_at, b.source_filename, b.invoice_date, b.tax_rate_pct, b.contingency_pct, b.flat_fee,
               (SELECT COUNT(*) FROM batch_rows br WHERE br.batch_id=b.id) AS row_count,
               (SELECT COUNT(*) FROM batch_rows br WHERE br.batch_id=b.id AND br.final_invoice > 0) AS billable_count,
               (SELECT COALESCE(SUM(br.final_invoice), 0) FROM batch_rows br WHERE br.batch_id=b.id) AS total_invoice
        FROM batches b
        WHERE b.org_id=?
        ORDER BY b.id DESC
        """,
        (u.org_id,),
    ).fetchall()

    if not batches:
        conn.close()
        st.info("No batches yet.")
        return

    dfb = pd.DataFrame([dict(r) for r in batches])
    st.dataframe(dfb, use_container_width=True, hide_index=True)

    st.divider()
    batch_id = st.number_input("Open batch ID", min_value=1, value=int(dfb.iloc[0]["id"]), step=1)

    # Load batch + rows
    b = conn.execute("SELECT * FROM batches WHERE org_id=? AND id=?", (u.org_id, int(batch_id))).fetchone()
    if not b:
        conn.close()
        st.error("Batch not found in your organization.")
        return

    rows = conn.execute(
        """
        SELECT * FROM batch_rows
        WHERE batch_id=?
        ORDER BY row_index
        """,
        (int(batch_id),),
    ).fetchall()

    st.subheader(f"Batch #{batch_id}")
    st.caption(f"Source: {b['source_filename']} | Created: {b['created_at']} | Invoice date: {b['invoice_date']}")

    dfr = pd.DataFrame([dict(r) for r in rows]) if rows else pd.DataFrame()
    if dfr.empty:
        st.info("No rows in this batch.")
        conn.close()
        return

    # Editable discount for re-export
    view = dfr[
        [
            "id",
            "raw_client_name",
            "property_id",
            "tax_saved",
            "base_fee",
            "manual_discount",
            "final_invoice",
            "status",
            "matched_customer_name",
        ]
    ].copy()

    st.subheader("Edit discounts and re-export")
    edited = st.data_editor(
        view,
        hide_index=True,
        use_container_width=True,
        height=520,
        disabled=["id", "raw_client_name", "property_id", "tax_saved", "base_fee", "status", "matched_customer_name", "final_invoice"],
        column_config={
            "raw_client_name": st.column_config.TextColumn("Client Name"),
            "property_id": st.column_config.TextColumn("Property ID"),
            "tax_saved": st.column_config.NumberColumn("Tax Saved", format="$%.2f"),
            "base_fee": st.column_config.NumberColumn("Calc Fee", format="$%.2f"),
            "manual_discount": st.column_config.NumberColumn("Manual Discount", format="$%.2f"),
            "final_invoice": st.column_config.NumberColumn("Final Invoice", format="$%.2f"),
            "status": st.column_config.TextColumn("Status"),
            "matched_customer_name": st.column_config.TextColumn("Matched Customer"),
        },
    )

    edited["manual_discount"] = pd.to_numeric(edited["manual_discount"], errors="coerce").fillna(0.0)
    # Recompute final_invoice
    edited["final_invoice"] = (edited["base_fee"] - edited["manual_discount"]).clip(lower=0.0)

    if st.button("Save discount changes"):
        cur = conn.cursor()
        for _, r in edited.iterrows():
            cur.execute(
                "UPDATE batch_rows SET manual_discount=?, final_invoice=? WHERE id=?",
                (float(r["manual_discount"]), float(r["final_invoice"]), int(r["id"])),
            )
        conn.commit()
        st.success("Saved.")
        st.rerun()

    # Export section
    billable = edited[edited["final_invoice"] > 0].copy()
    st.write(f"Billable invoices: {len(billable)}")
    st.write(f"Billable total: ${float(billable['final_invoice'].sum()):,.2f}")

    next_inv = int(get_setting(u.org_id, "next_invoice_no", "1001"))
    invoice_date = dt.date.fromisoformat(b["invoice_date"])
    days_due = int(b["days_due"])
    qb_item_name = b["qb_item_name"]
    qb_desc_prefix = b["qb_desc_prefix"]

    # Build pseudo df with canonical fields for export function
    tmp = pd.DataFrame(
        {
            CANON["client_name"]: billable["raw_client_name"],
            CANON["property_id"]: billable["property_id"],
            CANON["tax_saved"]: billable["tax_saved"],
            CANON["final_invoice"]: billable["final_invoice"],
            CANON["matched_customer_name"]: billable["matched_customer_name"],
        }
    )

    qb_df, csv_bytes = qb_export_csv(
        billable_df=tmp,
        invoice_start_no=next_inv,
        invoice_date=invoice_date,
        days_due=days_due,
        qb_item_name=qb_item_name,
        qb_desc_prefix=qb_desc_prefix,
    )

    filename = f"QB_Import_Batch_{batch_id}_{dt.date.today().isoformat()}.csv"

    st.download_button(
        "Download QuickBooks CSV",
        data=csv_bytes,
        file_name=filename,
        mime="text/csv",
        type="primary",
    )

    if st.button("Store export and increment invoice numbers", key="store_export_from_batches"):
        conn.execute(
            """
            INSERT INTO exports(
                batch_id, created_at, created_by_user_id,
                invoice_start_no, invoice_count, total_amount,
                filename, csv_blob
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(batch_id),
                dt.datetime.utcnow().isoformat(),
                u.user_id,
                next_inv,
                int(len(qb_df)),
                float(tmp[CANON["final_invoice"]].sum()),
                filename,
                sqlite3.Binary(csv_bytes),
            ),
        )
        set_setting(u.org_id, "next_invoice_no", str(next_inv + int(len(qb_df))))
        conn.commit()
        st.success("Export stored and invoice numbers incremented.")
        st.rerun()

    st.divider()
    st.subheader("Exports for this batch")
    exports = conn.execute(
        "SELECT id, created_at, invoice_start_no, invoice_count, total_amount, filename FROM exports WHERE batch_id=? ORDER BY id DESC",
        (int(batch_id),),
    ).fetchall()

    if exports:
        dfe = pd.DataFrame([dict(r) for r in exports])
        st.dataframe(dfe, use_container_width=True, hide_index=True)

        export_id = st.number_input("Download stored export ID", min_value=1, value=int(dfe.iloc[0]["id"]), step=1)
        exp = conn.execute("SELECT filename, csv_blob FROM exports WHERE id=? AND batch_id=?", (int(export_id), int(batch_id))).fetchone()
        if exp:
            st.download_button(
                "Download stored export",
                data=bytes(exp["csv_blob"]),
                file_name=exp["filename"],
                mime="text/csv",
            )
    else:
        st.caption("No exports stored yet for this batch.")

    conn.close()


# =========================
# App Entrypoint
# =========================
def main() -> None:
    init_db()

    st.set_page_config(page_title=APP_TITLE, layout="wide")
    u = session_user()

    if not u:
        page_login()
        return

    choice = sidebar_nav(u)

    if choice == "Run Batch":
        page_run_batch(u)
    elif choice == "Customers":
        page_customers(u)
    elif choice == "Batches":
        page_batches(u)
    elif choice == "Settings":
        page_settings(u)
    elif choice == "Users":
        page_users(u)
    else:
        st.error("Unknown page.")


if __name__ == "__main__":
    main()
