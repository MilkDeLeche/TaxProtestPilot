# Tax Protest Pilot Production Readiness Checklist

> **Full deployment guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step Supabase, Stripe, and deploy instructions.

## Before going live

### 1. Update production URL
- **File:** `frontend/public/index.html`
- **Change:** `link rel="canonical"` — Replace `https://taxprotestpilot.com/` with your actual production URL
- **Change:** `og:image` / `twitter:image` — Use absolute URLs (e.g. `https://yoursite.com/images/TAXPILOT2.png`) for best social sharing

### 2. Support email
- **File:** `frontend/src/pages/Support.jsx` (line ~20)
- **File:** `frontend/src/pages/Settings.jsx` (line ~27)
- **Change:** Replace `support@taxprotestpilot.com` with your real support email

### 3. Supabase configuration
- Ensure **Email Auth** is enabled in Supabase Dashboard → Authentication → Providers
- Configure **Email templates** for password reset (Auth → Email Templates)
- Set **Site URL** in Supabase Auth settings to your production URL
- Add production URL to **Redirect URLs** in Supabase Auth

### 4. Environment variables
- Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` for production
- Use your production Supabase project, not development

---

## What's included (production-ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Forgot password | ✅ | `/forgot-password` → email reset link → `/set-new-password` |
| Delete account | ✅ | Danger zone in Settings → mailto to request deletion |
| All internal links | ✅ | Footer uses React Router `Link` (no full reloads) |
| Copyright | ✅ | 2026 |
| Meta tags & SEO | ✅ | Title, description, keywords, OG, Twitter, canonical, author (MODO) |
| Support form | ✅ | Opens email client with pre-filled message |
| Auth flows | ✅ | Sign in, sign up, Google OAuth, demo, password reset |

---

## Links overview

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Sign in / Sign up |
| `/forgot-password` | Request password reset email |
| `/set-new-password` | Set new password (from reset link) |
| `/auth/callback` | OAuth & password reset callback |
| `/documentation` | Docs |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/support` | Support & FAQ |
| `/dashboard` | App dashboard (protected) |
| `/upload` | Upload & calculate (protected) |
| `/batches` | Saved uploads (protected) |
| `/customers` | Customers (protected) |
| `/settings` | Settings + Danger zone (protected) |
| `/onboarding` | Onboarding (protected) |
