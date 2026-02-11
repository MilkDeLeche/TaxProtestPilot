"""
REST API for the Tax Protest app – uses the same DB and logic as app.py (Streamlit).
Run: uvicorn api:app --reload --port 8000
"""
from __future__ import annotations

import base64
import datetime as dt
import os
import sqlite3
import time
from typing import Annotated, List, Optional

import jwt
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import app's DB and auth (no Streamlit calls in these)
import pandas as pd
from app import (
    CANON,
    DB_PATH,
    authenticate,
    create_org_with_admin,
    db,
    get_setting,
    init_db,
    normalize_name,
    qb_export_csv,
    set_setting,
)
from app import SessionUser  # dataclass

# JWT config
JWT_SECRET = os.environ.get("APP_JWT_SECRET", "taxpilot-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXP_SECONDS = 86400 * 7  # 7 days

app = FastAPI(title="TaxPilot API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ----- Auth -----
class LoginRequest(BaseModel):
    org_name: str
    email: str
    password: str


class CreateOrgRequest(BaseModel):
    org_name: str
    email: str
    password: str


def encode_token(u: SessionUser) -> str:
    payload = {
        "user_id": u.user_id,
        "org_id": u.org_id,
        "email": u.email,
        "org_name": u.org_name,
        "role": u.role,
        "exp": time.time() + JWT_EXP_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[SessionUser]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return SessionUser(
            user_id=payload["user_id"],
            org_id=payload["org_id"],
            email=payload["email"],
            org_name=payload["org_name"],
            role=payload["role"],
        )
    except Exception:
        return None


def get_current_user(
    authorization: Annotated[Optional[str], Header(alias="Authorization")] = None,
) -> SessionUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    u = decode_token(token)
    if not u:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return u


# ----- Routes -----
@app.post("/api/auth/login")
def api_login(body: LoginRequest):
    ok, user, msg = authenticate(body.org_name.strip(), body.email.strip(), body.password.strip())
    if not ok or not user:
        raise HTTPException(status_code=401, detail=msg)
    token = encode_token(user)
    return {
        "token": token,
        "user": {
            "user_id": user.user_id,
            "org_id": user.org_id,
            "email": user.email,
            "org_name": user.org_name,
            "role": user.role,
        },
    }


@app.post("/api/auth/register")
def api_register(body: CreateOrgRequest):
    ok, msg = create_org_with_admin(body.org_name.strip(), body.email.strip(), body.password.strip())
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}


@app.get("/api/dashboard/stats")
def api_dashboard_stats(user: Annotated[SessionUser, Depends(get_current_user)]):
    conn = db()
    try:
        cur = conn.execute(
            "SELECT COUNT(*) AS n FROM customers WHERE org_id=? AND is_active=1",
            (user.org_id,),
        )
        total_customers = cur.fetchone()[0]

        cur = conn.execute("SELECT COUNT(*) AS n FROM batches WHERE org_id=?", (user.org_id,))
        files_processed = cur.fetchone()[0]

        cur = conn.execute(
            """
            SELECT AVG(br.tax_saved) AS avg_savings, SUM(CASE WHEN br.status='REVIEW' THEN 1 ELSE 0 END) AS review_count
            FROM batch_rows br
            INNER JOIN batches b ON br.batch_id = b.id
            WHERE b.org_id=?
            """,
            (user.org_id,),
        )
        row = cur.fetchone()
        avg_savings = float(row[0] or 0)
        active_reviews = int(row[1] or 0)
    finally:
        conn.close()

    return {
        "total_customers": total_customers,
        "files_processed": files_processed,
        "avg_savings": round(avg_savings, 2),
        "active_reviews": active_reviews,
    }


@app.get("/api/customers")
def api_list_customers(
    user: Annotated[SessionUser, Depends(get_current_user)],
    q: Optional[str] = None,
    show_inactive: bool = False,
):
    conn = db()
    try:
        where = "org_id=?"
        params = [user.org_id]
        if not show_inactive:
            where += " AND is_active=1"
        if q and q.strip():
            where += " AND (name LIKE ? OR email LIKE ?)"
            params.extend([f"%{q.strip()}%", f"%{q.strip()}%"])

        rows = conn.execute(
            f"""
            SELECT id, name, email, phone, address1, city, state, zip, qb_customer_ref, is_active, created_at
            FROM customers WHERE {where} ORDER BY name
            """,
            params,
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    qb_customer_ref: Optional[str] = None


@app.post("/api/customers")
def api_create_customer(body: CustomerCreate, user: Annotated[SessionUser, Depends(get_current_user)]):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    conn = db()
    try:
        conn.execute(
            """
            INSERT INTO customers(org_id, name, name_norm, email, phone, address1, city, state, zip, qb_customer_ref, is_active, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (
                user.org_id,
                name,
                normalize_name(name),
                (body.email or "").strip() or None,
                (body.phone or "").strip() or None,
                (body.address1 or "").strip() or None,
                (body.city or "").strip() or None,
                (body.state or "").strip() or None,
                (body.zip or "").strip() or None,
                (body.qb_customer_ref or "").strip() or None,
                dt.datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT last_insert_rowid() AS id").fetchone()
        return {"id": row[0], "name": name}
    except Exception as e:
        if "UNIQUE" in str(e) or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="A customer with this name already exists.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# Settings: app.py uses key/value per org. Expose as one object.
SETTING_KEYS = [
    "tax_rate_pct",
    "contingency_pct",
    "flat_fee",
    "review_min_tax_saved",
    "charge_flat_if_no_win",
    "days_due",
    "qb_item_name",
    "qb_desc_prefix",
    "next_invoice_no",
]

DEFAULTS = {
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


@app.get("/api/settings")
def api_get_settings(user: Annotated[SessionUser, Depends(get_current_user)]):
    out = {}
    for k in SETTING_KEYS:
        out[k] = get_setting(user.org_id, k, DEFAULTS.get(k, ""))
    # Coerce numeric for frontend
    out["tax_rate_pct"] = float(out["tax_rate_pct"])
    out["contingency_pct"] = float(out["contingency_pct"])
    out["flat_fee"] = float(out["flat_fee"])
    out["review_min_tax_saved"] = float(out["review_min_tax_saved"])
    out["charge_flat_if_no_win"] = bool(int(out["charge_flat_if_no_win"]))
    out["days_due"] = int(out["days_due"])
    out["next_invoice_no"] = int(out["next_invoice_no"])
    return out


class SettingsUpdate(BaseModel):
    tax_rate_pct: Optional[float] = None
    contingency_pct: Optional[float] = None
    flat_fee: Optional[float] = None
    review_min_tax_saved: Optional[float] = None
    charge_flat_if_no_win: Optional[bool] = None
    days_due: Optional[int] = None
    qb_item_name: Optional[str] = None
    qb_desc_prefix: Optional[str] = None
    next_invoice_no: Optional[int] = None


@app.put("/api/settings")
def api_put_settings(body: SettingsUpdate, user: Annotated[SessionUser, Depends(get_current_user)]):
    updates = body.model_dump(exclude_none=True)
    for k, v in updates.items():
        if k not in SETTING_KEYS:
            continue
        if isinstance(v, bool):
            v = "1" if v else "0"
        elif isinstance(v, (int, float)):
            v = str(v)
        set_setting(user.org_id, k, v)
    return {"ok": True}


# ----- Batches (same as app.py Run Batch / Batches) -----
class BatchRowCreate(BaseModel):
    row_index: int
    raw_client_name: str
    property_id: str
    notice_value: float
    final_value: float
    reduction: float
    tax_saved: float
    base_fee: float
    manual_discount: float
    final_invoice: float
    status: str
    matched_customer_id: Optional[int] = None
    matched_customer_name: Optional[str] = None


class BatchCreate(BaseModel):
    source_filename: str
    tax_rate_pct: float
    contingency_pct: float
    flat_fee: float
    review_min_tax_saved: float
    charge_flat_if_no_win: bool
    invoice_date: str  # YYYY-MM-DD
    days_due: int
    qb_item_name: str
    qb_desc_prefix: str
    notes: Optional[str] = None
    rows: List[BatchRowCreate]


@app.post("/api/batches")
def api_create_batch(body: BatchCreate, user: Annotated[SessionUser, Depends(get_current_user)]):
    conn = db()
    try:
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
                user.org_id,
                user.user_id,
                dt.datetime.utcnow().isoformat(),
                body.source_filename,
                float(body.tax_rate_pct),
                float(body.contingency_pct),
                float(body.flat_fee),
                float(body.review_min_tax_saved),
                1 if body.charge_flat_if_no_win else 0,
                body.invoice_date,
                int(body.days_due),
                (body.qb_item_name or "Property Tax Protest").strip(),
                (body.qb_desc_prefix or "Tax savings").strip(),
                (body.notes or "").strip() or None,
            ),
        )
        batch_id = cur.lastrowid
        for r in body.rows:
            cur.execute(
                """
                INSERT INTO batch_rows(
                    batch_id, row_index, raw_client_name, property_id,
                    notice_value, final_value, reduction, tax_saved,
                    base_fee, manual_discount, final_invoice,
                    status, matched_customer_id, matched_customer_name
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    batch_id,
                    r.row_index,
                    r.raw_client_name,
                    r.property_id,
                    float(r.notice_value),
                    float(r.final_value),
                    float(r.reduction),
                    float(r.tax_saved),
                    float(r.base_fee),
                    float(r.manual_discount),
                    float(r.final_invoice),
                    r.status,
                    r.matched_customer_id,
                    r.matched_customer_name,
                ),
            )
        conn.commit()
        return {"id": batch_id, "message": f"Saved batch #{batch_id}."}
    finally:
        conn.close()


@app.get("/api/batches")
def api_list_batches(user: Annotated[SessionUser, Depends(get_current_user)]):
    conn = db()
    try:
        rows = conn.execute(
            """
            SELECT b.id, b.created_at, b.source_filename, b.invoice_date,
                   b.tax_rate_pct, b.contingency_pct, b.flat_fee,
                   (SELECT COUNT(*) FROM batch_rows br WHERE br.batch_id = b.id) AS row_count,
                   (SELECT COUNT(*) FROM batch_rows br WHERE br.batch_id = b.id AND br.final_invoice > 0) AS billable_count,
                   (SELECT COALESCE(SUM(br.final_invoice), 0) FROM batch_rows br WHERE br.batch_id = b.id) AS total_invoice
            FROM batches b
            WHERE b.org_id = ?
            ORDER BY b.id DESC
            """,
            (user.org_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/batches/{batch_id}")
def api_get_batch(
    batch_id: int,
    user: Annotated[SessionUser, Depends(get_current_user)],
):
    conn = db()
    try:
        b = conn.execute(
            "SELECT * FROM batches WHERE org_id = ? AND id = ?",
            (user.org_id, batch_id),
        ).fetchone()
        if not b:
            raise HTTPException(status_code=404, detail="Batch not found")
        rows = conn.execute(
            "SELECT * FROM batch_rows WHERE batch_id = ? ORDER BY row_index",
            (batch_id,),
        ).fetchall()
        return {"batch": dict(b), "rows": [dict(r) for r in rows]}
    finally:
        conn.close()


class BatchRowUpdate(BaseModel):
    id: int
    manual_discount: float


@app.patch("/api/batches/{batch_id}/rows")
def api_update_batch_rows(
    batch_id: int,
    body: List[BatchRowUpdate],
    user: Annotated[SessionUser, Depends(get_current_user)],
):
    conn = db()
    try:
        b = conn.execute(
            "SELECT id FROM batches WHERE org_id = ? AND id = ?",
            (user.org_id, batch_id),
        ).fetchone()
        if not b:
            raise HTTPException(status_code=404, detail="Batch not found")
        for item in body:
            conn.execute(
                "UPDATE batch_rows SET manual_discount = ?, final_invoice = MAX(0, base_fee - ?) WHERE id = ? AND batch_id = ?",
                (float(item.manual_discount), float(item.manual_discount), item.id, batch_id),
            )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@app.get("/api/batches/{batch_id}/export")
def api_batch_export(
    batch_id: int,
    user: Annotated[SessionUser, Depends(get_current_user)],
    store: bool = False,
):
    """Generate QB CSV. If store=True, save export and increment next_invoice_no."""
    conn = db()
    try:
        b = conn.execute(
            "SELECT * FROM batches WHERE org_id = ? AND id = ?",
            (user.org_id, batch_id),
        ).fetchone()
        if not b:
            raise HTTPException(status_code=404, detail="Batch not found")
        rows = conn.execute(
            "SELECT * FROM batch_rows WHERE batch_id = ? AND final_invoice > 0 ORDER BY row_index",
            (batch_id,),
        ).fetchall()
        if not rows:
            raise HTTPException(status_code=400, detail="No billable rows in this batch")
        # Build billable df with CANON columns for qb_export_csv
        billable = pd.DataFrame(
            [
                {
                    CANON["client_name"]: r["raw_client_name"],
                    CANON["property_id"]: r["property_id"],
                    CANON["tax_saved"]: r["tax_saved"],
                    CANON["final_invoice"]: r["final_invoice"],
                    CANON["matched_customer_name"]: r["matched_customer_name"],
                }
                for r in rows
            ]
        )
        next_inv = int(get_setting(user.org_id, "next_invoice_no", "1001"))
        invoice_date = dt.date.fromisoformat(b["invoice_date"])
        days_due = int(b["days_due"])
        qb_item = (b["qb_item_name"] or "Property Tax Protest").strip()
        qb_prefix = (b["qb_desc_prefix"] or "Tax savings").strip()
        qb_df, csv_bytes = qb_export_csv(
            billable_df=billable,
            invoice_start_no=next_inv,
            invoice_date=invoice_date,
            days_due=days_due,
            qb_item_name=qb_item,
            qb_desc_prefix=qb_prefix,
        )
        filename = f"QB_Import_Batch_{batch_id}_{dt.date.today().isoformat()}.csv"
        if store:
            total = sum(r["final_invoice"] for r in rows)
            conn.execute(
                """
                INSERT INTO exports(batch_id, created_at, created_by_user_id,
                    invoice_start_no, invoice_count, total_amount, filename, csv_blob)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    batch_id,
                    dt.datetime.utcnow().isoformat(),
                    user.user_id,
                    next_inv,
                    len(qb_df),
                    float(billable[CANON["final_invoice"]].sum()),
                    filename,
                    sqlite3.Binary(csv_bytes),
                ),
            )
            set_setting(user.org_id, "next_invoice_no", str(next_inv + len(qb_df)))
            conn.commit()
        return {
            "filename": filename,
            "csv_base64": base64.b64encode(csv_bytes).decode("utf-8"),
            "invoice_start_no": next_inv,
            "invoice_count": len(qb_df),
            "stored": store,
        }
    finally:
        conn.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "db": DB_PATH}
