import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  ArrowUpTrayIcon,
  RectangleStackIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { apiDashboardStats, apiListBatches } from '../lib/api';
import { supabase } from '../lib/supabase';

const statKeys = [
  { key: 'total_customers', label: 'Total Customers', icon: UserGroupIcon, color: 'bg-blue-500', to: '/customers' },
  { key: 'files_processed', label: 'Files Processed', icon: DocumentTextIcon, color: 'bg-green-500', to: '/batches' },
  { key: 'avg_savings', label: 'Avg. Savings', icon: ArrowTrendingUpIcon, color: 'bg-purple-500', to: '/batches' },
  { key: 'active_reviews', label: 'Active Reviews', icon: Cog6ToothIcon, color: 'bg-orange-500', to: '/batches' },
];

function formatStatValue(key, value) {
  if (value == null) return '—';
  if (key === 'avg_savings') return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  return String(value);
}

export default function Dashboard() {
  const { user, apiToken, apiBaseUrl } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [savedUploadsCount, setSavedUploadsCount] = useState(null);
  const [supabaseStats, setSupabaseStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isSupabaseUser = user?.id && user.id !== 'demo-user-id' && !apiToken;

  const displayStats = (apiToken && stats) ? stats : (isSupabaseUser ? supabaseStats : null);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    setStatsError(null);
    try {
      if (apiToken && apiBaseUrl) {
        const [data, batchData] = await Promise.all([
          apiDashboardStats(apiBaseUrl, apiToken),
          apiListBatches(apiBaseUrl, apiToken),
        ]);
        setStats(data);
        setSavedUploadsCount(Array.isArray(batchData) ? batchData.length : 0);
      } else if (isSupabaseUser && user?.id) {
        const [batchesRes, customersRes] = await Promise.all([
          supabase.from('batches').select('id').eq('user_id', user.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        const batchIds = (batchesRes.data ?? []).map((b) => b.id);
        setSavedUploadsCount(batchIds.length);
        let avg_savings = 0, active_reviews = 0;
        if (batchIds.length > 0) {
          const { data: rows } = await supabase.from('batch_rows').select('tax_saved, status').in('batch_id', batchIds);
          if (rows?.length) {
            avg_savings = Math.round((rows.reduce((s, r) => s + (parseFloat(r.tax_saved) || 0), 0) / rows.length) * 100) / 100;
            active_reviews = rows.filter((r) => r.status === 'REVIEW').length;
          }
        }
        setSupabaseStats({
          total_customers: customersRes.error ? 0 : (customersRes.count ?? 0),
          files_processed: batchIds.length,
          avg_savings,
          active_reviews,
        });
      }
    } catch (err) {
      if (apiToken) setStatsError(err.message || 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [apiToken, apiBaseUrl, isSupabaseUser, user?.id]);

  useEffect(() => {
    if (!apiToken || !apiBaseUrl) {
      setStats(null);
      return;
    }
    let cancelled = false;
    apiDashboardStats(apiBaseUrl, apiToken)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setStatsError(err.message); });
    return () => { cancelled = true; };
  }, [apiToken, apiBaseUrl]);

  useEffect(() => {
    if (!user?.id) {
      setSavedUploadsCount(null);
      return;
    }
    if (user.id === 'demo-user-id') {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('taxpilot_demo_batches') : null;
        const list = raw ? JSON.parse(raw) : [];
        setSavedUploadsCount(Array.isArray(list) ? list.length : 0);
      } catch (_) {
        setSavedUploadsCount(0);
      }
      return;
    }
    let cancelled = false;
    if (apiToken && apiBaseUrl) {
      apiListBatches(apiBaseUrl, apiToken)
        .then((data) => { if (!cancelled) setSavedUploadsCount(Array.isArray(data) ? data.length : 0); })
        .catch(() => { if (!cancelled) setSavedUploadsCount(0); });
    } else if (isSupabaseUser) {
      supabase.from('batches').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .then(({ count, error }) => { if (!cancelled) setSavedUploadsCount(error ? 0 : (count ?? 0)); });
    }
    return () => { cancelled = true; };
  }, [user?.id, apiToken, apiBaseUrl, isSupabaseUser]);

  useEffect(() => {
    if (!isSupabaseUser || !user?.id) {
      setSupabaseStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [custRes, batchesRes] = await Promise.all([
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('batches').select('id').eq('user_id', user.id),
        ]);
        if (cancelled) return;
        const total_customers = custRes.error ? 0 : (custRes.count ?? 0);
        const batchIds = (batchesRes.data || []).map((b) => b.id);
        let avg_savings = 0;
        let active_reviews = 0;
        let files_processed = batchIds.length;
        if (batchIds.length > 0) {
          const { data: rows, error } = await supabase
            .from('batch_rows')
            .select('tax_saved, status')
            .in('batch_id', batchIds);
          if (!cancelled && !error && rows?.length) {
            const totalSaved = rows.reduce((s, r) => s + (parseFloat(r.tax_saved) || 0), 0);
            avg_savings = Math.round((totalSaved / rows.length) * 100) / 100;
            active_reviews = rows.filter((r) => r.status === 'REVIEW').length;
          }
        }
        if (!cancelled) {
          setSupabaseStats({
            total_customers,
            files_processed,
            avg_savings,
            active_reviews,
          });
        }
      } catch {
        if (!cancelled) setSupabaseStats(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isSupabaseUser, user?.id]);

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-slate-500 mt-2">
          Here's an overview of your tax analysis dashboard
        </p>
        {statsError && (
          <p className="text-amber-600 mt-2 text-sm">Could not load stats: {statsError}</p>
        )}
        <button
          type="button"
          onClick={refreshDashboard}
          disabled={refreshing}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1e40af] hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      {/* Next step card */}
      {(savedUploadsCount !== null || (apiToken && stats) || displayStats) && (
        <div className="mb-10">
          <GlassCard animate={false} className="p-6 border-[#1e40af]/20 bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1e40af] flex items-center justify-center flex-shrink-0">
                  {(savedUploadsCount ?? 0) === 0 ? (
                    <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                  ) : (
                    <RectangleStackIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  {(savedUploadsCount ?? 0) === 0 ? (
                    <>
                      <h2 className="font-semibold text-slate-900">No saved uploads yet</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Upload a file to calculate savings and export to QuickBooks.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold text-slate-900">You have {savedUploadsCount} saved upload{savedUploadsCount === 1 ? '' : 's'}</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Open one to export to QuickBooks or edit discounts.</p>
                    </>
                  )}
                </div>
              </div>
              <Link
                to={(savedUploadsCount ?? 0) === 0 ? '/upload' : '/batches'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e40af] text-white font-medium hover:bg-[#1e40af]/90 transition-colors"
              >
                {(savedUploadsCount ?? 0) === 0 ? 'Upload a file' : 'Open saved uploads'}
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statKeys.map((s) => (
          <div key={s.label}>
            <Link to={s.to}>
              <GlassCard animate={false} className="p-6 hover:border-[#1e40af]/30 transition-colors group cursor-pointer h-full block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {formatStatValue(s.key, displayStats?.[s.key])}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <GlassCard animate={false} className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/customers"
              className="block p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#1e40af]/40 hover:bg-slate-100/80 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#1e40af] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1e3a8a] transition-colors">
                <UserGroupIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Add Customers</h3>
              <p className="text-sm text-slate-500">
                Start by adding your property tax clients to the system.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[#1e40af] opacity-0 group-hover:opacity-100 transition-opacity">
                Go to Customers <ChevronRightIcon className="w-4 h-4" />
              </span>
            </Link>
            <Link
              to="/upload"
              className="block p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-green-500/40 hover:bg-slate-100/80 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Upload Data</h3>
              <p className="text-sm text-slate-500">
                Upload CSV files to calculate potential savings for your clients.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Go to Upload <ChevronRightIcon className="w-4 h-4" />
              </span>
            </Link>
            <Link
              to="/settings"
              className="block p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-500/40 hover:bg-slate-100/80 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                <Cog6ToothIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Configure Settings</h3>
              <p className="text-sm text-slate-500">
                Set your fee structure and calculation parameters.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Go to Settings <ChevronRightIcon className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
