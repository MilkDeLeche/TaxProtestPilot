# Stripe setup for Tax Protest Pilot

Use Stripe so customers can pay for **Starter** or **Professional** yearly plans. This doc covers the flow and what to implement.

## Email sign-up and Supabase

- **Sign up (email only)** is available at `/login?mode=signup`. Users who create an account with email/password are stored in **Supabase Auth** (`auth.users`), so **yes, email sign-up users are added to your Supabase project**.
- New users (Google or email) have **no row** in `public.subscriptions` until they subscribe. The app treats “no row” as **Starter** (free tier). When they pay via Stripe, your webhook inserts/updates `subscriptions` for that `user_id`.
- **Premium for email users** works the same as for Google users: after they sign up they see Starter until they complete a Stripe checkout. Your backend (Stripe webhook) maps the paying customer to the Supabase `user_id` (e.g. by `client_reference_id` or email) and updates `public.subscriptions`. The app then shows their plan and limits from `useAuth()` (`plan`, `canUseFeature`, `propertyLimit`).

## 1. Stripe dashboard

1. Create products and prices (Dashboard → Product catalog):
   - **Starter**: $249/year — create a Price with interval `year`.
   - **Professional**: $599/year — same.

2. Copy the **Price IDs** (e.g. `price_xxx`) and keep them in env (e.g. `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PROFESSIONAL`).

3. (Optional) Enable **Customer Portal** so users can manage subscription / cancel from a link you provide.

## 2. Backend (webhook + Supabase)

You need a small backend that:

- Listens for Stripe webhooks (e.g. `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
- Uses Supabase **service_role** key (not anon) to insert/update `public.subscriptions` so RLS doesn’t block it.

**On successful subscription (e.g. `checkout.session.completed` or `customer.subscription.updated`):**

- Read `customer_email` or `client_reference_id` (if you pass `user_id` from the app).
- Map that to your Supabase `auth.users` user (e.g. by email or stored mapping).
- Insert or update `subscriptions`:

```sql
INSERT INTO public.subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, updated_at)
VALUES (
  'user-uuid-here',
  'professional',  -- or 'starter' from price id
  'cus_xxx',
  'sub_xxx',
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  updated_at = now();
```

**On subscription deleted/canceled:** set `plan` back to `'starter'` (or cancel at period end and only then downgrade).

**New users:** If a user has no row in `subscriptions`, the app treats them as `starter`. So you only need to create/update rows when they pay (or when you give them a trial upgrade).

## 3. Frontend: “Start Free Trial” / “Subscribe”

- **Option A – Stripe Checkout:** Create a Checkout Session from your backend (POST with price id, `client_reference_id: user.id`, `customer_email: user.email`). Redirect the user to `session.url`. After payment, Stripe redirects back to your success URL; your webhook has already updated `subscriptions`.
- **Option B – Customer Portal:** Create a billing portal session (backend) and redirect the user there so they can pick a plan and pay. Same webhook flow.

The frontend already has `plan`, `canUseFeature()`, and `propertyLimit` from `useAuth()`. Use them to hide/disable Professional features and show an “Upgrade” prompt for Starter users.

## 4. Enforcing limits in the app

- **Property limit:** When creating a new batch or adding rows, your backend (or Supabase function) should count total properties for that user in the current year and reject if over `plan.propertyLimit` (500 for Starter, 2500 for Professional). The frontend can use `propertyLimit` from `useAuth()` to show a message or disable “Add batch” when near the limit.
- **Features:** For routes or UI that are Professional-only (e.g. client management, appeal package generation), check `canUseFeature('client_management')` and either redirect or show an upgrade CTA.

## 5. Summary

| Step | Where | What |
|------|--------|------|
| Products & prices | Stripe Dashboard | Starter $249/yr, Professional $599/yr |
| Webhook endpoint | Your backend | Handle subscription events, update `subscriptions` with Supabase service_role |
| Checkout or Portal | Backend + frontend | Redirect user to Stripe to pay; webhook sets plan |
| Enforce plan | Frontend + backend | Use `plan` / `canUseFeature` / `propertyLimit`; backend enforces property count and feature access |

Yes, you need Stripe (or another payment provider) to collect payments; Stripe is the usual choice and fits this flow.
