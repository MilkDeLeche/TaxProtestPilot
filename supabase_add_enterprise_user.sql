-- Run this in Supabase Dashboard → SQL Editor to grant Enterprise plan to any user.
-- The user must already exist in auth.users (sign up / sign in at least once with that email).

INSERT INTO public.subscriptions (user_id, plan)
SELECT id, 'enterprise'
FROM auth.users
WHERE email = 'co.estrada01@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET plan = 'enterprise', updated_at = now();
