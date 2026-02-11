import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { apiLogin, apiRegister, getApiUrl } from '../lib/api';
import {
  DEFAULT_PLAN,
  PLANS,
  planHasFeature,
  getPropertyLimit,
  getPlanLabel,
} from '../lib/plans';

const API_TOKEN_KEY = 'taxpilot_api_token';
const API_USER_KEY = 'taxpilot_api_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [apiToken, setApiToken] = useState(() => localStorage.getItem(API_TOKEN_KEY));
  const [apiUser, setApiUser] = useState(() => {
    try {
      const raw = localStorage.getItem(API_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setSession(session);
          const su = session?.user ?? null;
          setUser(su);
          if (!su && apiToken && apiUser) {
            setUser({
              id: `org-${apiUser.user_id}`,
              email: apiUser.email,
              user_metadata: { full_name: apiUser.org_name },
            });
            setSession({ user: { id: apiUser.user_id, email: apiUser.email, user_metadata: { full_name: apiUser.org_name } } });
          }
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        if (mounted && apiToken && apiUser) {
          setUser({
            id: `org-${apiUser.user_id}`,
            email: apiUser.email,
            user_metadata: { full_name: apiUser.org_name },
          });
          setSession({ user: { id: apiUser.user_id, email: apiUser.email, user_metadata: { full_name: apiUser.org_name } } });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [apiToken, apiUser]);

  // Fetch subscription (plan) when user changes — only for Supabase auth users. Demo gets full (Enterprise) plan.
  useEffect(() => {
    const uid = user?.id;
    if (uid === 'demo-user-id') {
      setPlan(PLANS.ENTERPRISE);
      return;
    }
    const isSupabaseUser = uid && !String(uid).startsWith('org-');
    if (!isSupabaseUser) {
      setPlan(DEFAULT_PLAN);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', uid)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.warn('Subscription fetch failed, using default plan:', error.message);
        setPlan(DEFAULT_PLAN);
        return;
      }
      setPlan(data?.plan ?? DEFAULT_PLAN);
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  /** Sign up with email/password. User is created in Supabase Auth (auth.users) and will appear in your Supabase project. */
  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  };

  /** Sign in with email/password (Supabase Auth). */
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setApiToken(null);
    setApiUser(null);
    localStorage.removeItem(API_TOKEN_KEY);
    localStorage.removeItem(API_USER_KEY);
  };

  const signInAsDemo = () => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('taxpilot_demo_practice_type') : null;
    let profileMeta = {};
    try {
      const profileRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('taxpilot_demo_profile') : null;
      if (profileRaw) profileMeta = JSON.parse(profileRaw);
    } catch (_) {}
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@taxpilot.demo',
      user_metadata: {
        full_name: 'Demo User',
        ...(stored && { practice_type: stored }),
        ...profileMeta,
      },
    };
    setUser(demoUser);
    setSession({ user: demoUser });
  };

  const completeOnboarding = async (practiceType, profile = null) => {
    const meta = {
      practice_type: practiceType,
      ...(profile && {
        display_name: profile.displayName?.trim() || null,
        phone: profile.phone?.trim() || null,
        contact_email: profile.email?.trim() || null,
      }),
    };
    if (user?.id === 'demo-user-id') {
      const updated = {
        ...user,
        user_metadata: { ...user.user_metadata, ...meta },
      };
      setUser(updated);
      setSession({ user: updated });
      try {
        localStorage.setItem('taxpilot_demo_practice_type', practiceType);
        if (profile) {
          localStorage.setItem('taxpilot_demo_profile', JSON.stringify({
            display_name: meta.display_name,
            phone: meta.phone,
            contact_email: meta.contact_email,
          }));
        }
      } catch (_) {}
      return;
    }
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) throw error;
    setUser((prev) =>
      prev ? { ...prev, user_metadata: { ...prev.user_metadata, ...meta } } : null
    );
    setSession((prev) =>
      prev?.user
        ? { ...prev, user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, ...meta } } }
        : null
    );
  };

  const updateProfile = async (profile) => {
    const meta = {
      display_name: profile.displayName?.trim() || null,
      phone: profile.phone?.trim() || null,
      contact_email: profile.email?.trim() || null,
    };
    if (user?.id === 'demo-user-id') {
      const updated = {
        ...user,
        user_metadata: { ...user.user_metadata, ...meta },
      };
      setUser(updated);
      setSession({ user: updated });
      try {
        localStorage.setItem('taxpilot_demo_profile', JSON.stringify(meta));
      } catch (_) {}
      return;
    }
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) throw error;
    setUser((prev) =>
      prev ? { ...prev, user_metadata: { ...prev.user.user_metadata, ...meta } } : null
    );
    setSession((prev) =>
      prev?.user
        ? { ...prev, user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, ...meta } } }
        : null
    );
  };

  const loginWithOrg = async (orgName, email, password) => {
    const baseUrl = getApiUrl();
    const { token, user: apiUserData } = await apiLogin(baseUrl, orgName, email, password);
    setApiToken(token);
    setApiUser(apiUserData);
    localStorage.setItem(API_TOKEN_KEY, token);
    localStorage.setItem(API_USER_KEY, JSON.stringify(apiUserData));
    setUser({
      id: `org-${apiUserData.user_id}`,
      email: apiUserData.email,
      user_metadata: { full_name: apiUserData.org_name },
    });
    setSession({ user: { id: apiUserData.user_id, email: apiUserData.email, user_metadata: { full_name: apiUserData.org_name } } });
  };

  const registerWithOrg = async (orgName, email, password) => {
    const baseUrl = getApiUrl();
    await apiRegister(baseUrl, orgName, email, password);
    await loginWithOrg(orgName, email, password);
  };

  const canUseFeature = useCallback(
    (feature) => planHasFeature(plan, feature),
    [plan]
  );
  const propertyLimit = getPropertyLimit(plan);
  const planLabel = getPlanLabel(plan);

  const value = {
    session,
    user,
    loading,
    plan,
    planLabel,
    canUseFeature,
    propertyLimit,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    signInAsDemo,
    completeOnboarding,
    updateProfile,
    loginWithOrg,
    registerWithOrg,
    apiToken,
    apiUser,
    apiBaseUrl: getApiUrl(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
