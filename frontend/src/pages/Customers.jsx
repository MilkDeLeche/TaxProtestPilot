import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon, PencilSquareIcon, CalendarDaysIcon, ChevronDownIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { apiGetCustomers, apiCreateCustomer, apiUpdateCustomer } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerCalendar } from '../components/CustomerCalendar';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

function toDateKey(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value ?? 0);
}

export default function Customers() {
  const { user, apiToken, apiBaseUrl, canUseFeature } = useAuth();
  const canManageClients = canUseFeature('client_management');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [chargeSummary, setChargeSummary] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const DEMO_CUSTOMER_OVERRIDES_KEY = 'taxpilot_demo_customer_overrides';
  const DEMO_BATCHES_KEY = 'taxpilot_demo_batches';

  const isDemo = user?.id === 'demo-user-id';

  const customerKey = (c) => `${(c?.name || '').trim()}|${(c?.property_id || '').trim()}`;

  const daysWithCustomers = useMemo(() => {
    const set = new Set();
    customers.forEach((c) => {
      const at = c.created_at || c.addedAt;
      if (at) set.add(toDateKey(at));
    });
    return set;
  }, [customers]);

  const datesWithCustomersForCalendar = useMemo(() => {
    return Array.from(daysWithCustomers)
      .map((s) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
      })
      .filter((d) => !isNaN(d.getTime()));
  }, [daysWithCustomers]);

  const fetchChargeSummary = useCallback(async () => {
    const now = new Date();
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    const map = {};
    const addRow = (name, propertyId, invoiceDate, finalInvoice) => {
      const k = `${(name || '').trim()}|${(propertyId || '').trim()}`;
      if (!map[k]) map[k] = { lastChargedDate: null, lastYearTotal: 0 };
      const d = invoiceDate ? new Date(invoiceDate) : null;
      if (d && !isNaN(d.getTime())) {
        if (!map[k].lastChargedDate || d > map[k].lastChargedDate) map[k].lastChargedDate = d;
        if (d >= lastYearStart && d <= lastYearEnd) map[k].lastYearTotal += parseFloat(finalInvoice) || 0;
      }
    };
    try {
      if (isDemo) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_BATCHES_KEY) : null;
        const list = raw ? JSON.parse(raw) : [];
        list.forEach((batch) => {
          const rows = batch.rows || [];
          const invDate = batch.invoice_date || batch.created_at;
          rows.forEach((r) => addRow(r.raw_client_name || r.owner_name, r.property_id, invDate, r.final_invoice));
        });
        setChargeSummary(map);
        return;
      }
      if (!user?.id || apiToken) return;
      const { data: batches } = await supabase.from('batches').select('id, invoice_date').eq('user_id', user.id);
      if (!batches?.length) {
        setChargeSummary({});
        return;
      }
      const batchIds = batches.map((b) => b.id);
      const batchDateById = Object.fromEntries(batches.map((b) => [b.id, b.invoice_date]));
      const { data: rows } = await supabase.from('batch_rows').select('batch_id, raw_client_name, property_id, final_invoice').in('batch_id', batchIds);
      (rows || []).forEach((r) => addRow(r.raw_client_name, r.property_id, batchDateById[r.batch_id], r.final_invoice));
      setChargeSummary(map);
    } catch (_) {
      setChargeSummary({});
    }
  }, [user?.id, isDemo, apiToken]);

  useEffect(() => {
    fetchChargeSummary();
  }, [fetchChargeSummary]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      if (apiToken && apiBaseUrl) {
        const data = await apiGetCustomers(apiBaseUrl, apiToken, { show_inactive: showInactive });
        setCustomers(data || []);
      } else if (isDemo) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('taxpilot_demo_batches') : null;
        const overridesRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_CUSTOMER_OVERRIDES_KEY) : null;
        let overrides = {};
        if (overridesRaw) try { overrides = JSON.parse(overridesRaw); } catch (_) {}
        let list = [];
        if (raw) try { list = JSON.parse(raw); } catch (_) {}
        const seen = new Set();
        const out = [];
        for (const batch of list) {
          const rows = batch.rows || [];
          for (const r of rows) {
            const name = (r.raw_client_name || r.owner_name || '').trim() || 'Unknown';
            const property_id = (r.property_id || '').trim();
            const key = `${name}|${property_id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const o = overrides[key] || {};
            out.push({
              id: key,
              name,
              property_id,
              email: o.email ?? null,
              phone: o.phone ?? null,
              status: 'active',
              created_at: o.addedAt || batch.created_at || null,
            });
          }
        }
        setCustomers(out);
      } else {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToken, apiBaseUrl, showInactive, isDemo, user?.id]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const dateFilteredCustomers = useMemo(
    () =>
      selectedDate
        ? customers.filter((c) => toDateKey(c.created_at || c.addedAt) === toDateKey(selectedDate))
        : customers,
    [customers, selectedDate]
  );

  const filteredCustomers = useMemo(
    () =>
      !searchTerm.trim()
        ? dateFilteredCustomers
        : dateFilteredCustomers.filter(
            (customer) =>
              customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customer.property_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
          ),
    [dateFilteredCustomers, searchTerm]
  );

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      1: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      inactive: 'bg-slate-100 text-slate-600 border-slate-200',
      0: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return statusStyles[status] ?? statusStyles.inactive;
  };

  const handleCreateCustomer = apiToken && apiBaseUrl
    ? async (data) => apiCreateCustomer(apiBaseUrl, apiToken, data)
    : null;

  const handleUpdateCustomer = useCallback(
    async (customerId, payload) => {
      if (apiToken && apiBaseUrl) {
        await apiUpdateCustomer(apiBaseUrl, apiToken, customerId, payload);
      } else if (!isDemo && user?.id) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', customerId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else if (isDemo) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_CUSTOMER_OVERRIDES_KEY) : null;
        const overrides = raw ? JSON.parse(raw) : {};
        const existing = overrides[customerId] || {};
        overrides[customerId] = {
          ...existing,
          email: payload.email ?? existing.email,
          phone: payload.phone ?? existing.phone,
          addedAt: existing.addedAt || new Date().toISOString(),
        };
        localStorage.setItem(DEMO_CUSTOMER_OVERRIDES_KEY, JSON.stringify(overrides));
      }
    },
    [apiToken, apiBaseUrl, isDemo, user?.id]
  );

  const formatDateAdded = (c) => {
    const at = c.created_at || c.addedAt;
    if (!at) return '—';
    const d = typeof at === 'string' ? new Date(at) : at;
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateAddedWithTime = (c) => {
    const at = c.created_at || c.addedAt;
    if (!at) return '—';
    const d = typeof at === 'string' ? new Date(at) : at;
    if (isNaN(d.getTime())) return '—';
    const ord = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    return `${d.toLocaleDateString(undefined, { month: 'long' })} ${ord(d.getDate())}, ${d.getFullYear()} at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  };

  const formatLastCharged = (c) => {
    const s = chargeSummary[customerKey(c)];
    if (!s?.lastChargedDate) return '—';
    const d = s.lastChargedDate instanceof Date ? s.lastChargedDate : new Date(s.lastChargedDate);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getLastYearTotal = (c) => chargeSummary[customerKey(c)]?.lastYearTotal ?? null;

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-4.5rem)] md:h-[calc(100vh-1rem)] overflow-hidden flex flex-col">
      {!canManageClients && (
        <div className="mb-4 shrink-0 rounded-lg bg-[#1e40af]/10 border border-[#1e40af]/20 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-700">
            <strong>Client management</strong> is available on the Professional plan. Upgrade to manage clients and sync with appeal workflows.
          </p>
          <Link to="/#pricing" className="shrink-0 text-sm font-semibold text-[#1e40af] hover:underline">
            View plans
          </Link>
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 shrink-0"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Customers
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Your clients — used when exporting to QuickBooks
          </p>
        </div>
        <div className="flex gap-3">
          <MotionButton
            variant="outline"
            onClick={fetchCustomers}
            data-testid="refresh-customers-btn"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </MotionButton>
          <MotionButton
            onClick={() => setIsModalOpen(true)}
            disabled={!canManageClients}
            data-testid="add-customer-btn"
            title={!canManageClients ? 'Upgrade to Professional to add customers' : undefined}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Customer
          </MotionButton>
        </div>
      </motion.div>

      {/* Two-column: Customers list (left) + Calendar (right) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white shrink-0 mb-3">Customers</h2>
        <div className="flex-1 min-h-0 lg:grid lg:grid-cols-12 lg:gap-x-16">
        {/* Left: Customer list */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0">
          <GlassCard className="p-5 flex flex-col flex-1 min-h-0 h-full">
            {/* Search Bar */}
            <div className="relative mb-4 shrink-0">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50"
                data-testid="search-customers-input"
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-slate-600 mb-4 shrink-0">
                Showing customers added on <strong>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
              </p>
            )}

            {/* Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {customers.length === 0 ? 'No customers yet' : selectedDate ? 'No customers added on this date' : 'No results found'}
            </h3>
            <p className="text-slate-500">
              {customers.length === 0 
                ? 'Add your first customer to get started' 
                : selectedDate 
                  ? 'Pick another date or show all customers.' 
                  : 'Try adjusting your search terms'
              }
            </p>
          </div>
        ) : (
          <ol
            data-lenis-prevent
            className="divide-y divide-slate-100 dark:divide-white/10 text-sm/6 flex-1 min-h-0 overflow-y-auto scrollbar-hide overscroll-contain"
          >
            {filteredCustomers.map((customer, index) => {
              const isExpanded = expandedId === customer.id;
              return (
                <li
                  key={customer.id}
                  data-testid={`customer-row-${index}`}
                  className="relative flex flex-col gap-x-6 py-5 xl:static"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                      className="flex-auto text-left group focus:outline-none"
                    >
                      <h3 className="pr-10 font-semibold text-slate-900 xl:pr-0 group-hover:text-[#1e40af] transition-colors">
                        {customer.name}
                      </h3>
                      <dl className="mt-2 flex flex-col text-slate-500 gap-1 sm:flex-row sm:gap-x-4 md:gap-x-6">
                        <div className="flex items-start gap-x-3">
                          <dt className="mt-0.5 shrink-0">
                            <span className="sr-only">Date added</span>
                            <CalendarDaysIcon className="size-5 text-slate-400" />
                          </dt>
                          <dd>
                            <time dateTime={customer.created_at || customer.addedAt || ''}>
                              {formatDateAddedWithTime(customer)}
                            </time>
                          </dd>
                        </div>
                        <div className="flex items-start gap-x-3 sm:mt-0">
                          <dt className="mt-0.5 shrink-0">
                            <span className="sr-only">Email</span>
                            <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                          </dt>
                          <dd>{customer.email || '—'}</dd>
                        </div>
                      </dl>
                      <div className="mt-2 flex items-center gap-1 text-slate-400">
                        <ChevronDownIcon className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <span className="text-xs">{isExpanded ? 'Less' : 'More'} details</span>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="absolute top-6 right-0 flex items-center rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 xl:relative xl:top-auto xl:right-auto xl:self-center"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Open options"
                        >
                          <EllipsisVerticalIcon className="size-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {canManageClients && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                            Edit
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {isExpanded && (
                    <div
                      className="mt-4 pt-4 border-t border-slate-100 pl-8 space-y-2 text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!apiToken && customer.property_id && (
                        <p><span className="font-medium text-slate-700">Property ID:</span> <span className="font-mono">{customer.property_id}</span></p>
                      )}
                      {customer.phone && (
                        <p><span className="font-medium text-slate-700">Phone:</span> {customer.phone}</p>
                      )}
                      <p><span className="font-medium text-slate-700">Last charged:</span> {formatLastCharged(customer)}</p>
                      <p>
                        <span className="font-medium text-slate-700">Last year total:</span>{' '}
                        {getLastYearTotal(customer) != null ? formatCurrency(getLastYearTotal(customer)) : '—'}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Status:</span>{' '}
                        <Badge className={getStatusBadge(customer.status ?? customer.is_active)}>
                          {apiToken ? (customer.is_active ? 'active' : 'inactive') : (customer.status || 'active')}
                        </Badge>
                      </p>
                      {canManageClients && (
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(customer)}
                          className="mt-2 text-sm font-semibold text-[#1e40af] hover:underline"
                        >
                          Edit email & phone
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
            </div>
          </GlassCard>
        </div>

        {/* Right: Calendar - matches example lg:col-start-8 layout */}
        <div className="mt-6 lg:mt-0 lg:col-start-8 lg:col-end-13 xl:col-start-9 xl:col-end-13 lg:row-start-1 lg:flex lg:flex-col lg:items-stretch lg:justify-start">
          <GlassCard className="p-5 w-full flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDaysIcon className="w-5 h-5 text-[#1e40af]" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">By date added</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Click a day to see customers added that day.</p>
            <CustomerCalendar
              selected={selectedDate ?? undefined}
              onSelect={(d) => setSelectedDate(d ?? null)}
              modifiers={{ hasCustomers: datesWithCustomersForCalendar }}
              modifiersClassNames={{ hasCustomers: 'bg-[#1e3a8a]/10 font-medium text-[#1e3a8a]' }}
              className="rounded-lg bg-slate-100/50 dark:bg-white/10 border border-slate-200 dark:border-slate-600 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 p-3"
            />
            {selectedDate && (
              <MotionButton className="mt-6 w-full rounded-md bg-[#1e40af] hover:bg-[#1e3a8a] px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e40af]" onClick={() => setSelectedDate(null)}>
                Show all customers
              </MotionButton>
            )}
          </GlassCard>
        </div>
        </div>
      </div>

      {/* Add modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        createCustomer={handleCreateCustomer}
        useApiSchema={!!apiToken}
        userId={user?.id && user.id !== 'demo-user-id' ? user.id : null}
      />
      {/* Edit modal */}
      <CustomerModal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSuccess={() => { setEditingCustomer(null); fetchCustomers(); }}
        editCustomer={handleUpdateCustomer}
        customer={editingCustomer}
        useApiSchema={!!apiToken}
        userId={user?.id && user.id !== 'demo-user-id' ? user.id : null}
      />
    </div>
  );
}
