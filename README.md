# Tax Protest Pilot — Property Tax Protest SaaS

Property tax protest software. Upload county data, calculate savings and fees, export to QuickBooks.

---

## Quick start

```bash
# Frontend
cd frontend
cp .env.example .env   # Add your Supabase URL + anon key
yarn install
yarn start

# Optional: Backend (org-based login)
# From project root
pip install -r requirements-api.txt
uvicorn api:app --reload --port 8000
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** | Full deployment guide — Supabase, Stripe, env vars, deploy steps |
| [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) | Pre-launch checklist |
| [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) | Stripe products, webhook, subscriptions |
| [docs/SUPPORT_EMAIL_SETUP.md](docs/SUPPORT_EMAIL_SETUP.md) | Support email configuration |

---

## Stack

- **Frontend:** React, Tailwind, Framer Motion, Supabase
- **Auth:** Supabase (Google OAuth, email, password reset)
- **Data:** Supabase (or optional SQLite backend via `api.py`)
- **Payments:** Stripe (webhook + subscriptions to be wired)

---

## License

Proprietary. By MODO.
