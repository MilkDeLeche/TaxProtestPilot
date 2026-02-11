# Tax Protest Pilot SaaS — Deployment & Configuration Guide

**Ship it tomorrow.** This guide covers everything you need to deploy Tax Protest Pilot, connect your own Supabase, Stripe, and other services, and understand how the app works.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supabase Setup](#2-supabase-setup)
3. [Stripe Setup](#3-stripe-setup)
4. [Environment Variables](#4-environment-variables)
5. [Pre-Launch Checklist](#5-pre-launch-checklist)
6. [Deploying the App](#6-deploying-the-app)
7. [Features Summary](#7-features-summary)
8. [Support & Other Docs](#8-support--other-docs)

---

## 1. Architecture Overview

### How the app works

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React (Create React App + CRACO) | SPA with routing, auth, landing page, app |
| **Auth & Data** | Supabase | Google OAuth, email sign-up, password reset, storage (settings, batches, customers, subscriptions) |
| **Optional Backend** | FastAPI (`api.py`) + SQLite | Alternative org-based login. *Not required for Supabase users.* |
| **Payments** | Stripe | Subscriptions (Starter $249/yr, Professional $599/yr). Requires webhook backend. |

### Auth flows

- **Supabase (primary):** Google OAuth, email/password sign-up, forgot password, demo mode  
  → User data stored in Supabase (`settings`, `batches`, `batch_rows`, `customers`, `subscriptions`).

- **Organization API (optional):** Org name + email + password  
  → User data stored in SQLite via `api.py`. Used if you run the backend and users choose org login.

### Routes

| Route | Public? | Purpose |
|-------|---------|---------|
| `/` | Yes | Landing page |
| `/login` | Yes | Sign in / Sign up (Google, email, demo) |
| `/forgot-password` | Yes | Request password reset email |
| `/set-new-password` | Yes | Set new password (from reset link) |
| `/auth/callback` | Yes | OAuth & password reset callback |
| `/documentation` | Yes | Docs |
| `/terms` | Yes | Terms of Service |
| `/privacy` | Yes | Privacy Policy |
| `/support` | Yes | Support & FAQ (with FAQ schema for SEO) |
| `/dashboard` | No | App dashboard |
| `/upload` | No | Upload CSV, calculate fees, save batch |
| `/batches` | No | Saved uploads, export to QuickBooks |
| `/customers` | No | Client management |
| `/settings` | No | Fee settings, delete account |
| `/onboarding` | No | First-time practice type & profile |

---

## 2. Supabase Setup

### Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → create a new project.
2. Note your **Project URL** and **anon (public) key** from **Settings → API**.

### Step 2: Run the schema

1. In Supabase Dashboard → **SQL Editor** → **New query**.
2. Copy the contents of `supabase_schema.sql` from the project root.
3. Run it. This creates:
   - `settings` — per-user fee and QuickBooks settings
   - `batches` — saved uploads
   - `batch_rows` — rows per batch
   - `subscriptions` — plan per user (updated by Stripe webhook)
   - `customers` — client records

### Step 3: Enable auth providers

1. **Authentication → Providers**
   - Enable **Email** (included).
   - Enable **Google** if you want Google sign-in:
     - Add OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Client ID, Web application).
     - Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.

2. **Authentication → URL Configuration**
   - **Site URL:** `https://yourdomain.com` (production URL).
   - **Redirect URLs:** Add `https://yourdomain.com/auth/callback`.

### Step 4: Email templates (password reset)

1. **Authentication → Email Templates**
2. Customize **Reset Password** if desired.
3. Ensure magic link / reset URL points to your production domain.

### Step 5: Frontend env vars

In `frontend/.env` (or your hosting platform):

```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```

### Step 6: hCaptcha (optional bot protection)

To protect sign-in/sign-up from bots:

1. Sign up at [hCaptcha](https://www.hcaptcha.com/) and create a site; copy the **Sitekey** and **Secret key**.
2. In Supabase Dashboard → **Authentication** → **Bot and Abuse Protection** → enable CAPTCHA, select hCaptcha, and paste the **Secret key**.
3. Add to `frontend/.env`: `REACT_APP_HCAPTCHA_SITEKEY=your-sitekey`

If `REACT_APP_HCAPTCHA_SITEKEY` is not set, the captcha is hidden and sign-in works without it.

---

## 3. Stripe Setup

See **[docs/STRIPE_SETUP.md](STRIPE_SETUP.md)** for full details. Summary:

1. **Stripe Dashboard**
   - Create products and prices: Starter $249/yr, Professional $599/yr.
   - Copy Price IDs (e.g. `price_xxx`).

2. **Webhook endpoint**
   - Create a backend endpoint that receives Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
   - Use Supabase **service_role** key to insert/update `public.subscriptions` for the paying user.

3. **Checkout flow**
   - When user clicks “Subscribe”, create a Stripe Checkout Session (backend) with `client_reference_id: user.id`, `customer_email: user.email`.
   - Redirect user to Stripe. After payment, webhook updates `subscriptions`; app reads plan from `useAuth()`.

4. **Plan limits (frontend)**
   - `plan`, `canUseFeature()`, `propertyLimit` from `useAuth()`.
   - Starter: 500 properties/yr; Professional: 2500; Enterprise: unlimited.

**Note:** Stripe integration is not wired in the frontend yet. You need to add “Subscribe” / “Upgrade” buttons and a backend that creates Checkout sessions and handles webhooks.

---

## 4. Environment Variables

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_SUPABASE_URL` | Yes | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `REACT_APP_API_URL` | No | Backend API URL (only if using org login). Default: `http://localhost:8000` |

### Backend (`api.py` — optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_JWT_SECRET` | Yes (prod) | Strong secret for JWT. Default dev value is insecure. |
| `CORS_ORIGINS` | Optional | Comma-separated origins, e.g. `https://yourdomain.com` |

### Stripe webhook backend (you build)

| Variable | Description |
|----------|-------------|
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks |
| `STRIPE_SECRET_KEY` | For Stripe API calls |
| `SUPABASE_SERVICE_ROLE_KEY` | To update `subscriptions` (bypasses RLS) |

---

## 5. Pre-Launch Checklist

### URLs & branding

- [ ] **Production URL** — Update `frontend/public/index.html`:
  - `link rel="canonical"` → your real domain
  - `og:image` / `twitter:image` → absolute URLs (e.g. `https://yourdomain.com/images/TAXPILOT2.png`)
- [ ] **Sitemap & robots** — `sitemap.xml` and `robots.txt` use `https://taxprotestpilot.com/`. Change to your domain in `frontend/public/sitemap.xml` and `frontend/public/robots.txt`.

### Support email

- [ ] **Support.jsx** — Replace `support@taxprotestpilot.com` with your email (line ~20).
- [ ] **Settings.jsx** — Same for delete-account mailto (line ~27).

### Supabase

- [ ] **Site URL** and **Redirect URLs** configured for production.
- [ ] **Email templates** reviewed (password reset).
- [ ] **Schema** applied (`supabase_schema.sql`).

### SEO & meta

- [ ] **index.html** — Meta tags, OG, Twitter already set. Update descriptions if needed.
- [ ] **Google Search Console** — Add site, verify (meta tag or HTML file), submit sitemap `https://yourdomain.com/sitemap.xml`.

### Security

- [ ] **JWT secret** — If using `api.py`, set strong `APP_JWT_SECRET`.
- [ ] **CORS** — `api.py` allows origins from `CORS_ORIGINS` env var.

---

## 6. Deploying the App

### Frontend (React)

**Option A: Vercel**

1. Connect your repo to Vercel.
2. Set root to `frontend` or configure build: `cd frontend && yarn install && yarn build`.
3. Add env vars: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`.
4. Deploy.

**Option B: Netlify**

1. Connect repo.
2. Build command: `cd frontend && yarn build` (or use `netlify.toml` with `base = "frontend"`).
3. Publish directory: `frontend/build` (or `build` if base is `frontend`).
4. Add env vars in Site settings: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`.
5. **Secrets scanner fix:** Netlify blocks builds when it detects keys in the output. The Supabase anon key is public by design (it goes in the frontend bundle). Add this env var to allow it:
   - **SECRETS_SCAN_OMIT_KEYS** = `REACT_APP_SUPABASE_ANON_KEY,REACT_APP_SUPABASE_URL`

**Option C: Static hosting (S3, GitHub Pages, etc.)**

1. Run `cd frontend && yarn build`
2. Upload contents of `frontend/build` to your host.
3. Ensure SPA routing: redirect all routes to `index.html`.

### Backend (`api.py` — optional)

If you use org-based login:

1. Deploy to a Python host (Railway, Render, Fly.io, etc.).
2. Set `APP_JWT_SECRET`, `CORS_ORIGINS`.
3. SQLite `app.db` is created on first run. For production, consider PostgreSQL or managed DB.
4. Set `REACT_APP_API_URL` in frontend to your backend URL.

### Stripe webhook

Deploy a small server (e.g. Vercel serverless, Railway, AWS Lambda) that:

- Receives `POST` from Stripe with `Stripe-Signature` header.
- Verifies signature with `STRIPE_WEBHOOK_SECRET`.
- On `checkout.session.completed` / `customer.subscription.updated`, updates `subscriptions` in Supabase via service_role.

---

## 7. Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ | Hero, features, pricing, CTA |
| Auth (Google, email, demo) | ✅ | Supabase + demo mode |
| Forgot password | ✅ | `/forgot-password` → email → `/set-new-password` |
| Onboarding | ✅ | Practice type, profile |
| Dashboard | ✅ | Stats, links to Upload, Batches, Customers |
| Upload & calculate | ✅ | CSV drag-drop, column mapping, fee calculation |
| Saved batches | ✅ | Supabase or API |
| Export to QuickBooks | ✅ | CSV download |
| Customers | ✅ | Add, edit, sync from batches |
| Settings | ✅ | Tax rate, contingency, flat fee, QB settings |
| Delete account | ✅ | Danger zone → mailto to request deletion |
| Support page | ✅ | Contact form (mailto), FAQ accordion |
| FAQ schema (JSON-LD) | ✅ | Support page — for Google rich results |
| Terms, Privacy | ✅ | Static pages |
| robots.txt | ✅ | Allows crawlers, points to sitemap |
| sitemap.xml | ✅ | Public pages listed |
| Meta tags, OG, Twitter | ✅ | `index.html` |
| Plan tiers (Starter/Pro/Enterprise) | ✅ | Frontend logic; Stripe integration to be added |

---

## 8. Support & Other Docs

| Document | Purpose |
|----------|---------|
| [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) | Short pre-launch checklist |
| [STRIPE_SETUP.md](STRIPE_SETUP.md) | Stripe products, webhook, Supabase mapping |
| [SUPPORT_EMAIL_SETUP.md](SUPPORT_EMAIL_SETUP.md) | Mailto vs. backend form, Formspree option |

---

## Quick Reference: Files to Edit Before Shipping

| File | What to change |
|------|----------------|
| `frontend/public/index.html` | Canonical URL, `og:image` URLs |
| `frontend/public/sitemap.xml` | Replace `taxprotestpilot.com` with your domain |
| `frontend/public/robots.txt` | Replace `taxprotestpilot.com` in Sitemap line |
| `frontend/src/pages/Support.jsx` | `SUPPORT_EMAIL` constant |
| `frontend/src/pages/Settings.jsx` | Support email in delete-account mailto |
| `frontend/.env` | `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` |
| Supabase Dashboard | Site URL, Redirect URLs, email templates |

---

**Good luck with launch.** 🚀
