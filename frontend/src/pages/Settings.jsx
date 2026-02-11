import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowDownIcon, ArrowPathIcon, UserIcon, ArrowUpTrayIcon, UserGroupIcon, BookOpenIcon, QuestionMarkCircleIcon, RectangleStackIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { apiGetSettings, apiPutSettings, apiLogin } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

const defaultApiSettings = {
  tax_rate_pct: 2.5,
  contingency_pct: 25,
  flat_fee: 150,
  review_min_tax_saved: 700,
  charge_flat_if_no_win: false,
  days_due: 30,
  qb_item_name: 'Property Tax Protest',
  qb_desc_prefix: 'Tax savings',
  next_invoice_no: 1001,
};

const SUPPORT_EMAIL = 'support@taxprotestpilot.com';

const getDeleteAccountMailto = (userEmail) => {
  const subject = 'Account Deletion Request';
  const body = `I would like to delete my Tax Protest Pilot account.\n\nEmail: ${userEmail || '(not provided)'}\n\nPlease confirm deletion and remove all my data.`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export default function Settings() {
  const { user, apiToken, apiBaseUrl, apiUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    email: '',
  });
  const [settings, setSettings] = useState({
    id: null,
    contingency_fee_pct: 0,
    flat_fee: 0,
    tax_rate_pct: 0,
    min_savings_threshold: 0,
    ...defaultApiSettings,
  });

  const DEMO_SETTINGS_KEY = 'taxpilot_demo_settings';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteVerifying, setDeleteVerifying] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      if (apiToken && apiBaseUrl) {
        const data = await apiGetSettings(apiBaseUrl, apiToken);
        setSettings((prev) => ({ ...prev, ...data }));
      } else if (user?.id === 'demo-user-id') {
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_SETTINGS_KEY) : null;
          if (raw) {
            const data = JSON.parse(raw);
            setSettings((prev) => ({
              ...prev,
              tax_rate_pct: data.tax_rate_pct ?? prev.tax_rate_pct,
              contingency_pct: data.contingency_pct ?? data.contingency_fee_pct ?? prev.contingency_pct,
              contingency_fee_pct: data.contingency_fee_pct ?? data.contingency_pct ?? prev.contingency_fee_pct,
              flat_fee: data.flat_fee ?? prev.flat_fee,
              min_savings_threshold: data.min_savings_threshold ?? data.review_min_tax_saved ?? prev.min_savings_threshold,
              review_min_tax_saved: data.review_min_tax_saved ?? data.min_savings_threshold ?? prev.review_min_tax_saved,
              charge_flat_if_no_win: data.charge_flat_if_no_win ?? prev.charge_flat_if_no_win,
              days_due: data.days_due ?? prev.days_due,
              qb_item_name: data.qb_item_name ?? prev.qb_item_name,
              qb_desc_prefix: data.qb_desc_prefix ?? prev.qb_desc_prefix,
              next_invoice_no: data.next_invoice_no ?? prev.next_invoice_no,
            }));
          }
        } catch (_) {}
      } else {
        const userId = user?.id || null;
        const query = userId
          ? supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
          : supabase.from('settings').select('*').limit(1).single();
        const { data, error } = await query;
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setSettings({
            id: data.id,
            user_id: data.user_id,
            tax_rate_pct: data.tax_rate_pct ?? 0,
            contingency_pct: data.contingency_pct ?? data.contingency_fee_pct ?? 0,
            contingency_fee_pct: data.contingency_fee_pct ?? data.contingency_pct ?? 0,
            flat_fee: data.flat_fee ?? 0,
            min_savings_threshold: data.min_savings_threshold ?? data.review_min_tax_saved ?? 0,
            review_min_tax_saved: data.review_min_tax_saved ?? data.min_savings_threshold ?? 0,
            charge_flat_if_no_win: data.charge_flat_if_no_win ?? false,
            days_due: data.days_due ?? 30,
            qb_item_name: data.qb_item_name ?? 'Property Tax Protest',
            qb_desc_prefix: data.qb_desc_prefix ?? 'Tax savings',
            next_invoice_no: data.next_invoice_no ?? 1001,
            ...defaultApiSettings,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, apiBaseUrl, user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!user?.user_metadata) return;
    const m = user.user_metadata;
    setProfile({
      displayName: m.display_name || '',
      phone: m.phone || '',
      email: m.contact_email || user.email || '',
    });
  }, [user?.user_metadata, user?.email]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({
        displayName: profile.displayName,
        phone: profile.phone,
        email: profile.email,
      });
      toast.success('Profile updated.');
    } catch (err) {
      const msg = err.message || '';
      toast.error(/network|failed to fetch|auth/i.test(msg) ? 'Could not save profile. Check your connection and try again.' : (msg || 'Failed to update profile.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (apiToken && apiBaseUrl) {
        await apiPutSettings(apiBaseUrl, apiToken, {
          tax_rate_pct: parseFloat(settings.tax_rate_pct) || 0,
          contingency_pct: parseFloat(settings.contingency_pct ?? settings.contingency_fee_pct) || 0,
          flat_fee: parseFloat(settings.flat_fee) || 0,
          review_min_tax_saved: parseFloat(settings.review_min_tax_saved ?? settings.min_savings_threshold) || 0,
          charge_flat_if_no_win: settings.charge_flat_if_no_win,
          days_due: parseInt(settings.days_due, 10) || 0,
          qb_item_name: settings.qb_item_name || '',
          qb_desc_prefix: settings.qb_desc_prefix || '',
          next_invoice_no: parseInt(settings.next_invoice_no, 10) || 0,
        });
      } else {
        const payload = {
          tax_rate_pct: parseFloat(settings.tax_rate_pct) || 0,
          contingency_pct: parseFloat(settings.contingency_pct ?? settings.contingency_fee_pct) || 0,
          contingency_fee_pct: parseFloat(settings.contingency_fee_pct ?? settings.contingency_pct) || 0,
          flat_fee: parseFloat(settings.flat_fee) || 0,
          min_savings_threshold: parseFloat(settings.min_savings_threshold ?? settings.review_min_tax_saved) || 0,
          review_min_tax_saved: parseFloat(settings.review_min_tax_saved ?? settings.min_savings_threshold) || 0,
          charge_flat_if_no_win: !!settings.charge_flat_if_no_win,
          days_due: parseInt(settings.days_due, 10) || 30,
          qb_item_name: (settings.qb_item_name || 'Property Tax Protest').trim(),
          qb_desc_prefix: (settings.qb_desc_prefix || 'Tax savings').trim(),
          next_invoice_no: parseInt(settings.next_invoice_no, 10) || 1001,
        };
        if (user?.id === 'demo-user-id') {
          try {
            localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(payload));
            toast.success('Settings saved successfully!');
          } catch (_) {
            toast.error('Failed to save settings.');
          }
          setSaving(false);
          return;
        }
        const userId = user?.id || null;
        if (userId) payload.user_id = userId;

        if (settings.id) {
          const updateQuery = userId
            ? supabase.from('settings').update(payload).eq('id', settings.id).eq('user_id', userId)
            : supabase.from('settings').update(payload).eq('id', settings.id);
          const { error } = await updateQuery;
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('settings').insert([payload]).select().single();
          if (error) throw error;
          if (data) setSettings((s) => ({ ...s, id: data.id }));
        }
      }
      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      const msg = err.message || '';
      toast.error(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Something went wrong. Check your connection and try again.' : (msg || 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (apiToken) {
      setSettings((prev) => ({ ...prev, ...defaultApiSettings }));
    } else {
      setSettings((prev) => ({
        ...prev,
        contingency_fee_pct: 0,
        flat_fee: 0,
        tax_rate_pct: 0,
        min_savings_threshold: 0,
      }));
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Configure your fee structure and calculation parameters
        </p>
      </motion.div>

      {/* Profile + Manage subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8 mb-8">
        {/* Profile */}
        <GlassCard className="p-8 lg:col-span-7 xl:col-span-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <UserIcon className="w-5 h-5 text-[#1e40af]" />
            Profile
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Your name or business details. Used for invoices and communications.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="sm:col-span-2">
              <Label htmlFor="profile-display-name" className="text-slate-700">
                {user?.user_metadata?.practice_type === 'company' ? 'Company or LLC name' : 'Your name'}
              </Label>
              <Input
                id="profile-display-name"
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                className="bg-white/50 mt-1"
                placeholder={user?.user_metadata?.practice_type === 'company' ? 'e.g. Acme Tax LLC' : 'e.g. Jane Smith'}
              />
            </div>
            <div>
              <Label htmlFor="profile-phone" className="text-slate-700">Phone</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="bg-white/50 mt-1"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-slate-700">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="bg-white/50 mt-1"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <MotionButton onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Save profile
              </>
            )}
          </MotionButton>
        </GlassCard>

        {/* Manage subscription */}
        <div className="mt-6 lg:mt-0 lg:col-span-5 xl:col-span-4">
          <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Manage subscription</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>Upgrade or downgrade your plan, update payment methods, and view billing history.</p>
              </div>
              <div className="mt-5">
                <Link
                  to="/#pricing"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  Change plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form + Right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8">
        <GlassCard className="p-8 lg:col-span-7 xl:col-span-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          How you charge
        </h2>
        <p className="text-sm text-slate-500 -mt-4 mb-6">Fees, tax rate, and when to flag for review.</p>

        <div className="space-y-6">
          {/* Contingency Fee */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="contingency_pct" className="text-slate-700">
              Contingency Fee (%)
            </Label>
            <Input
              id="contingency_pct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.contingency_pct ?? settings.contingency_fee_pct}
              onChange={(e) => setSettings({ ...settings, contingency_pct: e.target.value, contingency_fee_pct: e.target.value })}
              className="bg-white/50"
              data-testid="contingency-fee-input"
              placeholder="e.g., 25"
            />
            <p className="text-xs text-slate-500">
              Percentage of savings charged as fee
            </p>
          </motion.div>

          {/* Flat Fee */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="flat_fee" className="text-slate-700">
              Flat Fee ($)
            </Label>
            <Input
              id="flat_fee"
              type="number"
              step="1"
              min="0"
              value={settings.flat_fee}
              onChange={(e) => setSettings({ ...settings, flat_fee: e.target.value })}
              className="bg-white/50"
              data-testid="flat-fee-input"
              placeholder="e.g., 500"
            />
            <p className="text-xs text-slate-500">
              Fixed fee charged per review
            </p>
          </motion.div>

          {/* Tax Rate */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-2"
          >
            <Label htmlFor="tax_rate_pct" className="text-slate-700">
              Tax Rate (%)
            </Label>
            <Input
              id="tax_rate_pct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.tax_rate_pct}
              onChange={(e) => setSettings({ ...settings, tax_rate_pct: e.target.value })}
              className="bg-white/50"
              data-testid="tax-rate-input"
              placeholder="e.g., 2.5"
            />
            <p className="text-xs text-slate-500">
              Local property tax rate for calculations
            </p>
          </motion.div>

          {/* Review threshold */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="space-y-2"
          >
            <Label htmlFor="review_min_tax_saved" className="text-slate-700">
              Savings threshold ($)
            </Label>
            <Input
              id="review_min_tax_saved"
              type="number"
              step="1"
              min="0"
              value={settings.review_min_tax_saved ?? settings.min_savings_threshold}
              onChange={(e) => setSettings({ ...settings, review_min_tax_saved: e.target.value, min_savings_threshold: e.target.value })}
              className="bg-white/50"
              data-testid="min-savings-input"
              placeholder="e.g., 700"
            />
            <p className="text-xs text-slate-500">
              Below this amount: flag for your review. At or above: use standard fee.
            </p>
          </motion.div>

          {/* Charge flat fee if no win */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
            className="space-y-2 flex items-center justify-between gap-4"
          >
            <div className="space-y-0.5">
              <Label className="text-slate-700">Charge flat fee when there are no savings</Label>
              <p className="text-xs text-slate-500">
                Still charge your flat fee when the client didn’t save any tax
              </p>
            </div>
            <Switch
              checked={!!settings.charge_flat_if_no_win}
              onCheckedChange={(v) => setSettings({ ...settings, charge_flat_if_no_win: v })}
              data-testid="charge-flat-if-no-win"
            />
          </motion.div>

          {(apiToken || user?.id) && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.46 }}
                className="space-y-2"
              >
                <Label htmlFor="days_due" className="text-slate-700">Default days due</Label>
                <Input
                  id="days_due"
                  type="number"
                  min="0"
                  value={settings.days_due}
                  onChange={(e) => setSettings({ ...settings, days_due: e.target.value })}
                  className="bg-white/50"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.47 }}
                className="space-y-2"
              >
                <Label htmlFor="qb_item_name" className="text-slate-700">QuickBooks item name</Label>
                <Input
                  id="qb_item_name"
                  value={settings.qb_item_name}
                  onChange={(e) => setSettings({ ...settings, qb_item_name: e.target.value })}
                  className="bg-white/50"
                  placeholder="Property Tax Protest"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.48 }}
                className="space-y-2"
              >
                <Label htmlFor="qb_desc_prefix" className="text-slate-700">QuickBooks description prefix</Label>
                <Input
                  id="qb_desc_prefix"
                  value={settings.qb_desc_prefix}
                  onChange={(e) => setSettings({ ...settings, qb_desc_prefix: e.target.value })}
                  className="bg-white/50"
                  placeholder="Tax savings"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.49 }}
                className="space-y-2"
              >
                <Label htmlFor="next_invoice_no" className="text-slate-700">Next invoice number</Label>
                <Input
                  id="next_invoice_no"
                  type="number"
                  min="1"
                  value={settings.next_invoice_no}
                  onChange={(e) => setSettings({ ...settings, next_invoice_no: e.target.value })}
                  className="bg-white/50"
                />
              </motion.div>
            </>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex gap-3 pt-4 border-t border-slate-200"
          >
            <MotionButton
              variant="outline"
              onClick={handleReset}
              data-testid="reset-settings-btn"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Reset
            </MotionButton>
            <MotionButton
              onClick={handleSave}
              disabled={saving}
              data-testid="save-settings-btn"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </MotionButton>
          </motion.div>
        </div>
      </GlassCard>

        {/* Right sidebar: Quick reference + Quick actions + Help */}
        <div className="mt-8 lg:mt-0 lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Quick reference */}
          <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your fee at a glance</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Contingency</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{settings.contingency_pct ?? settings.contingency_fee_pct}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Flat fee</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">${settings.flat_fee ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Tax rate</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{settings.tax_rate_pct}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Savings threshold</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">${settings.review_min_tax_saved ?? settings.min_savings_threshold ?? 0}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick actions</h3>
              <div className="mt-3 space-y-2">
                <Link
                  to="/upload"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowUpTrayIcon className="size-5 text-[#1e40af]" />
                  Upload & Calculate
                </Link>
                <Link
                  to="/customers"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                >
                  <UserGroupIcon className="size-5 text-[#1e40af]" />
                  Customers
                </Link>
                <Link
                  to="/batches"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                >
                  <RectangleStackIcon className="size-5 text-[#1e40af]" />
                  Saved Uploads
                </Link>
              </div>
            </div>
          </div>

          {/* Help & support */}
          <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <QuestionMarkCircleIcon className="size-5 text-[#1e40af]" />
                Help & support
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Read the docs or get in touch if you need assistance.
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  to="/documentation"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1e40af] hover:bg-[#1e40af]/10 dark:hover:bg-[#1e40af]/20 transition-colors"
                >
                  <BookOpenIcon className="size-5" />
                  Documentation
                </Link>
                <Link
                  to="/support"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1e40af] hover:bg-[#1e40af]/10 dark:hover:bg-[#1e40af]/20 transition-colors"
                >
                  <QuestionMarkCircleIcon className="size-5" />
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setDeleteConfirmText('');
                setDeletePassword('');
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:ring-inset dark:ring-1 dark:ring-white/5"
              >
                Request account deletion
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-lg">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
                  <ExclamationTriangleIcon className="size-6 text-red-600 dark:text-red-400" aria-hidden />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <AlertDialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                    Delete account
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete your account? All of your data will be permanently removed from our servers forever. This action cannot be undone.
                  </AlertDialogDescription>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="delete-confirm" className="text-sm text-gray-700 dark:text-gray-300">
                    Type <span className="font-semibold">delete</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete"
                    className="mt-1 bg-white dark:bg-gray-800"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="delete-password" className="text-sm text-gray-700 dark:text-gray-300">
                    Enter your password
                  </Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="mt-1 bg-white dark:bg-gray-800"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <AlertDialogFooter className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <AlertDialogAction
                  asChild
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <button
                    type="button"
                    disabled={
                      deleteConfirmText.toLowerCase().trim() !== 'delete' ||
                      !deletePassword.trim() ||
                      deleteVerifying
                    }
                    onClick={async () => {
                      if (deleteConfirmText.toLowerCase().trim() !== 'delete' || !deletePassword.trim()) return;
                      setDeleteVerifying(true);
                      try {
                        const isDemo = user?.id === 'demo-user-id';
                        const isOrgUser = !!apiToken && !!apiUser;
                        if (isDemo) {
                          // Demo: no password verification
                        } else if (isOrgUser) {
                          await apiLogin(apiBaseUrl, apiUser.org_name, user?.email, deletePassword);
                        } else {
                          const { error } = await supabase.auth.signInWithPassword({
                            email: user?.email,
                            password: deletePassword,
                          });
                          if (error) throw error;
                        }
                        const a = document.createElement('a');
                        a.href = getDeleteAccountMailto(user?.email);
                        a.rel = 'noopener noreferrer';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setDeleteDialogOpen(false);
                        setDeleteConfirmText('');
                        setDeletePassword('');
                      } catch (err) {
                        toast.error(err?.message?.includes('Invalid') ? 'Incorrect password.' : 'Could not verify password. Please try again.');
                      } finally {
                        setDeleteVerifying(false);
                      }
                    }}
                  >
                    {deleteVerifying ? 'Verifying...' : 'Request deletion'}
                  </button>
                </AlertDialogAction>
                <AlertDialogCancel className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-white/10 dark:text-white dark:ring-white/5 dark:hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
