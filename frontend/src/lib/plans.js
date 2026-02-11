/**
 * Plan tiers and limits. Keep in sync with Stripe products/prices and backend enforcement.
 */
export const PLANS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

/** Max properties allowed per year per plan (enforce in backend when creating batches / counting rows). */
export const PLAN_PROPERTY_LIMITS = {
  [PLANS.STARTER]: 500,
  [PLANS.PROFESSIONAL]: 2500,
  [PLANS.ENTERPRISE]: null, // unlimited
};

/** Features only available on Professional or above. */
export const PROFESSIONAL_FEATURES = [
  'priority_support',
  'client_management',
  'appeal_package_generation',
  'custom_fee_structures',
];

/** Default plan for new users (e.g. before first payment or on free trial). */
export const DEFAULT_PLAN = PLANS.STARTER;

/**
 * Whether the given plan can use a feature (by feature key).
 * @param {string} plan - One of PLANS.*
 * @param {string} feature - e.g. 'client_management', 'appeal_package_generation'
 */
export function planHasFeature(plan, feature) {
  if (!plan) return false;
  if (plan === PLANS.ENTERPRISE) return true;
  if (plan === PLANS.PROFESSIONAL && PROFESSIONAL_FEATURES.includes(feature)) return true;
  if (plan === PLANS.STARTER && PROFESSIONAL_FEATURES.includes(feature)) return false;
  return true; // non-gated features
}

/**
 * Property limit for plan (null = unlimited).
 * @param {string} plan
 */
export function getPropertyLimit(plan) {
  return PLAN_PROPERTY_LIMITS[plan] ?? PLAN_PROPERTY_LIMITS[PLANS.STARTER];
}

/**
 * Human-readable plan label.
 */
export function getPlanLabel(plan) {
  const labels = {
    [PLANS.STARTER]: 'Starter',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.ENTERPRISE]: 'Enterprise',
  };
  return labels[plan] || 'Starter';
}
