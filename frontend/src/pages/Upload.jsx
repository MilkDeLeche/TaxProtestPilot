import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalculatorIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { apiGetSettings, apiCreateBatch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { DragDropZone } from '../components/DragDropZone';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const SELECT_NONE = '__none__';

// Possible header names (normalized) that map to each target field. First match wins.
const HEADER_ALIASES = {
  owner_name: [
    'owner name', 'owner_name', 'ownername', 'owner', 'client name', 'client_name', 'client',
    'taxpayer', 'taxpayer name', 'name', 'owner(s)', 'owner names', 'property owner',
  ],
  property_id: [
    'property id', 'property_id', 'propertyid', 'prop id', 'prop_id', 'account', 'account number',
    'account_number', 'parcel', 'parcel id', 'parcel_id', 'parcel number', 'account no', 'id',
  ],
  notice_value: [
    'notice value', 'notice_value', 'noticevalue', 'appraised value', 'appraised_value',
    'appraisal value', 'protest value', 'initial value', 'market value', 'taxable value',
    'value before', 'prior value', 'ncv', 'noticed value', 'notice value 2024', 'notice value 2025',
  ],
  final_value: [
    'final value', 'final_value', 'finalvalue', 'assessed value', 'assessed_value',
    'final assessed', 'value after', 'reduced value', 'certified value', 'new value',
    'final value 2024', 'final value 2025', 'appraised value final',
  ],
};

function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[\s_\-]+/g, ' ')
    .trim();
}

/** Guess column mapping from CSV headers. Each header is assigned at most once. */
function guessColumnMapping(headers) {
  if (!headers?.length) return { owner_name: '', property_id: '', notice_value: '', final_value: '' };
  const normalized = headers.map((h) => ({ raw: h, n: normalize(h) }));
  const used = new Set();
  const result = { owner_name: '', property_id: '', notice_value: '', final_value: '' };

  const matches = (n, alias) => {
    if (n === alias) return true;
    if (alias.length >= 4 && (n.includes(alias) || n.startsWith(alias + ' ') || n.startsWith(alias + '_'))) return true;
    return false;
  };

  const pick = (field) => {
    const aliases = HEADER_ALIASES[field];
    for (const alias of aliases) {
      for (const { raw, n } of normalized) {
        if (used.has(raw)) continue;
        if (matches(n, alias)) {
          used.add(raw);
          result[field] = raw;
          return;
        }
      }
    }
  };

  pick('notice_value');
  pick('final_value');
  pick('owner_name');
  pick('property_id');
  return result;
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    owner_name: '',
    property_id: '',
    notice_value: '',
    final_value: '',
  });
  const [results, setResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchNotes, setBatchNotes] = useState('');
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const { user, apiToken, apiBaseUrl } = useAuth();
  const isSupabaseUser = user?.id && user.id !== 'demo-user-id' && !apiToken;
  const UPLOAD_HINT_KEY = 'taxpilot_upload_hint_dismissed';
  const [hintDismissed, setHintDismissed] = useState(() => typeof localStorage !== 'undefined' && localStorage.getItem(UPLOAD_HINT_KEY) === '1');
  const navigate = useNavigate();

  // Fetch settings on mount (demo loads from localStorage)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (apiToken && apiBaseUrl) {
          const data = await apiGetSettings(apiBaseUrl, apiToken);
          setSettings(data);
        } else if (user?.id === 'demo-user-id') {
          try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('taxpilot_demo_settings') : null;
            if (raw) setSettings(JSON.parse(raw));
            else setSettings({});
          } catch (_) {
            setSettings({});
          }
        } else {
          const { data, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          setSettings(data || {});
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, [apiToken, apiBaseUrl, user?.id]);

  const handleFileAccepted = (acceptedFile) => {
    if (!acceptedFile) {
      setFile(null);
      setCsvData([]);
      setHeaders([]);
      setColumnMapping({ owner_name: '', property_id: '', notice_value: '', final_value: '' });
      setResults([]);
      return;
    }

    setFile(acceptedFile);
    setResults([]);
    setError(null);

    // Parse CSV
    Papa.parse(acceptedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError('Error parsing CSV file. Please check the file format.');
          return;
        }
        const fields = result.meta.fields || [];
        setHeaders(fields);
        setCsvData(result.data);
        setColumnMapping(guessColumnMapping(fields));
      },
      error: (err) => {
        setError(`Error reading file: ${err.message}`);
      },
    });
  };

  const handleCalculate = async () => {
    // Validate mapping
    const requiredMappings = ['notice_value', 'final_value'];
    const missingMappings = requiredMappings.filter(key => !columnMapping[key]);
    
    if (missingMappings.length > 0) {
      setError('Please map at least "Notice Value" and "Final Value" columns.');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const taxRate = settings?.tax_rate_pct ?? 2.5;
      const contingencyPct = settings?.contingency_pct ?? settings?.contingency_fee_pct ?? 25;
      const flatFee = settings?.flat_fee ?? 0;
      const reviewMinTaxSaved = parseFloat(settings?.review_min_tax_saved ?? settings?.min_savings_threshold ?? 700) || 700;
      const chargeFlatIfNoWin = !!settings?.charge_flat_if_no_win;

      const calculatedResults = csvData.map((row, index) => {
        const rawClientName = columnMapping.owner_name ? String(row[columnMapping.owner_name] ?? '').trim() : `Property ${index + 1}`;
        const propertyId = columnMapping.property_id ? String(row[columnMapping.property_id] ?? '').trim() : '—';
        const noticeValue = parseFloat(String(row[columnMapping.notice_value] ?? '').replace(/[$,]/g, '')) || 0;
        const finalValue = parseFloat(String(row[columnMapping.final_value] ?? '').replace(/[$,]/g, '')) || 0;

        const reduction = Math.max(0, noticeValue - finalValue);
        const taxSaved = reduction * (taxRate / 100);
        let baseFee = 0;
        if (taxSaved > 0) {
          baseFee = taxSaved * (contingencyPct / 100) + flatFee;
        } else if (chargeFlatIfNoWin) {
          baseFee = flatFee;
        }
        const manualDiscount = 0;
        const finalInvoice = Math.max(0, baseFee - manualDiscount);
        let status = 'NO_CHARGE';
        if (taxSaved > 0) {
          status = taxSaved < reviewMinTaxSaved ? 'REVIEW' : 'STANDARD';
        }

        return {
          id: index + 1,
          row_index: index,
          owner_name: rawClientName,
          property_id: propertyId,
          notice_value: noticeValue,
          final_value: finalValue,
          value_difference: reduction,
          reduction,
          tax_savings: taxSaved,
          tax_saved: taxSaved,
          your_fee: baseFee,
          base_fee: baseFee,
          manual_discount: manualDiscount,
          final_invoice: finalInvoice,
          client_net: taxSaved - baseFee,
          status,
          recommend_review: status === 'REVIEW',
        };
      });

      setResults(calculatedResults);
    } catch (err) {
      setError(`Calculation error: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tax_savings_results.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveBatch = async () => {
    if (results.length === 0) return;
    const useApi = apiToken && apiBaseUrl;
    const isDemo = user?.id === 'demo-user-id';
    if (!useApi && !isSupabaseUser && !isDemo) return;
    setSavingBatch(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const rowsPayload = results.map((r) => ({
        row_index: r.row_index ?? r.id - 1,
        raw_client_name: r.owner_name,
        property_id: r.property_id,
        notice_value: r.notice_value,
        final_value: r.final_value,
        reduction: r.reduction ?? r.value_difference ?? 0,
        tax_saved: r.tax_saved ?? r.tax_savings ?? 0,
        base_fee: r.base_fee ?? r.your_fee ?? 0,
        manual_discount: r.manual_discount ?? 0,
        final_invoice: r.final_invoice ?? Math.max(0, (r.base_fee ?? r.your_fee ?? 0) - (r.manual_discount ?? 0)),
        status: r.status ?? 'STANDARD',
        matched_customer_id: null,
        matched_customer_name: null,
      }));

      if (isDemo) {
        const batchId = `demo-${Date.now()}`;
        const rowCount = rowsPayload.length;
        const totalInvoice = rowsPayload.reduce((sum, r) => sum + (parseFloat(r.final_invoice) || 0), 0);
        const billableCount = rowsPayload.filter((r) => (parseFloat(r.final_invoice) || 0) > 0).length;
        const batch = {
          id: batchId,
          created_at: new Date().toISOString(),
          invoice_date: today,
          source_filename: file?.name || 'upload.csv',
          notes: batchNotes.trim() || null,
          row_count: rowCount,
          billable_count: billableCount,
          total_invoice: totalInvoice,
          days_due: settings?.days_due ?? 30,
          qb_item_name: (settings?.qb_item_name || 'Property Tax Protest').trim(),
          qb_desc_prefix: (settings?.qb_desc_prefix || 'Tax savings').trim(),
          next_invoice_no: parseInt(settings?.next_invoice_no, 10) || 1001,
          rows: rowsPayload.map((r, i) => ({ ...r, id: `${batchId}-${i}` })),
        };
        const key = 'taxpilot_demo_batches';
        const existing = (typeof localStorage !== 'undefined' && localStorage.getItem(key)) || '[]';
        let list = [];
        try {
          list = JSON.parse(existing);
        } catch (_) {}
        list.unshift(batch);
        localStorage.setItem(key, JSON.stringify(list));
        toast.success('Saved. You can open it under Saved Uploads.');
        navigate('/batches');
        setSavingBatch(false);
        return;
      }

      if (useApi) {
        const payload = {
          source_filename: file?.name || 'upload.csv',
          tax_rate_pct: settings?.tax_rate_pct ?? 2.5,
          contingency_pct: settings?.contingency_pct ?? 25,
          flat_fee: settings?.flat_fee ?? 0,
          review_min_tax_saved: settings?.review_min_tax_saved ?? 700,
          charge_flat_if_no_win: !!settings?.charge_flat_if_no_win,
          invoice_date: today,
          days_due: settings?.days_due ?? 30,
          qb_item_name: (settings?.qb_item_name || 'Property Tax Protest').trim(),
          qb_desc_prefix: (settings?.qb_desc_prefix || 'Tax savings').trim(),
          notes: batchNotes.trim() || null,
          rows: rowsPayload,
        };
        const data = await apiCreateBatch(apiBaseUrl, apiToken, payload);
        toast.success(data.message || 'Saved. Open it under Saved Uploads.');
      } else {
        const rowCount = rowsPayload.length;
        const totalInvoice = rowsPayload.reduce((sum, r) => sum + (parseFloat(r.final_invoice) || 0), 0);
        const billableCount = rowsPayload.filter((r) => (parseFloat(r.final_invoice) || 0) > 0).length;
        const { data: batch, error: batchError } = await supabase
          .from('batches')
          .insert({
            user_id: user.id,
            source_filename: file?.name || 'upload.csv',
            tax_rate_pct: settings?.tax_rate_pct ?? 2.5,
            contingency_pct: settings?.contingency_pct ?? 25,
            flat_fee: settings?.flat_fee ?? 0,
            review_min_tax_saved: parseFloat(settings?.review_min_tax_saved ?? settings?.min_savings_threshold ?? 700) || 700,
            charge_flat_if_no_win: !!settings?.charge_flat_if_no_win,
            invoice_date: today,
            days_due: settings?.days_due ?? 30,
            qb_item_name: (settings?.qb_item_name || 'Property Tax Protest').trim(),
            qb_desc_prefix: (settings?.qb_desc_prefix || 'Tax savings').trim(),
            notes: batchNotes.trim() || null,
            row_count: rowCount,
            billable_count: billableCount,
            total_invoice: totalInvoice,
          })
          .select('id')
          .single();
        if (batchError) throw new Error(batchError.message);
        const batchRows = rowsPayload.map((r) => ({
          batch_id: batch.id,
          row_index: r.row_index,
          raw_client_name: r.raw_client_name,
          property_id: r.property_id,
          notice_value: r.notice_value,
          final_value: r.final_value,
          reduction: r.reduction,
          tax_saved: r.tax_saved,
          base_fee: r.base_fee,
          manual_discount: r.manual_discount,
          final_invoice: r.final_invoice,
          status: r.status,
        }));
        const { error: rowsError } = await supabase.from('batch_rows').insert(batchRows);
        if (rowsError) throw new Error(rowsError.message);
        // Sync distinct clients from this batch into customers (for Customers tab / follow-up next year)
        const seen = new Set();
        const clients = [];
        for (const r of rowsPayload) {
          const name = (r.raw_client_name || '').trim() || 'Unknown';
          const propId = (r.property_id || '').trim();
          const key = `${name}|${propId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          clients.push({ user_id: user.id, name, property_id: propId, status: 'active' });
        }
        if (clients.length > 0) {
          try {
            await supabase.from('customers').upsert(clients, { onConflict: 'user_id,name,property_id' });
          } catch (e) {
            console.warn('Could not sync customers from batch:', e?.message);
          }
        }
        toast.success('Saved. You can open it under Saved Uploads.');
      }
      navigate('/batches');
    } catch (err) {
      const msg = err.message || '';
      setError(
        /PGRST|postgres|network|failed to fetch/i.test(msg)
          ? 'Something went wrong saving. Check your connection and try again.'
          : (msg || 'Failed to save.')
      );
    } finally {
      setSavingBatch(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Upload & Calculate
        </h1>
        <p className="text-slate-500 mt-1">
          Upload property data to calculate potential tax savings
        </p>
        <p className="text-sm text-slate-500 mt-2 text-slate-600">
          Upload CSV → map columns → calculate → save. Then export from Saved Uploads.
        </p>
      </motion.div>

      {/* First-time hint */}
      <AnimatePresence>
        {!hintDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3"
          >
            <p className="text-sm text-blue-900 flex-1">
              <strong>New here?</strong> Upload a CSV, map your columns (we’ll guess them), click Calculate and Save. Find your file under <strong>Saved Uploads</strong> to export to QuickBooks.
            </p>
            <button
              type="button"
              onClick={() => {
                setHintDismissed(true);
                try { localStorage.setItem(UPLOAD_HINT_KEY, '1'); } catch (_) {}
              }}
              className="p-1 text-blue-600 hover:text-blue-800 rounded"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone */}
      <GlassCard className="p-6 mb-8">
        <DragDropZone onFileAccepted={handleFileAccepted} acceptedFile={file} />
      </GlassCard>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column Mapping */}
      <AnimatePresence>
        {headers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Map Your Columns
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Columns are auto-matched when possible. Change any dropdown if the guess is wrong.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700">Owner Name</Label>
                  <Select
                    value={columnMapping.owner_name || SELECT_NONE}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, owner_name: value === SELECT_NONE ? '' : value })}
                  >
                    <SelectTrigger data-testid="map-owner-name" className="bg-white/50">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>— None —</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Property ID</Label>
                  <Select
                    value={columnMapping.property_id || SELECT_NONE}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, property_id: value === SELECT_NONE ? '' : value })}
                  >
                    <SelectTrigger data-testid="map-property-id" className="bg-white/50">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>— None —</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Notice Value *</Label>
                  <Select
                    value={columnMapping.notice_value || SELECT_NONE}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, notice_value: value === SELECT_NONE ? '' : value })}
                  >
                    <SelectTrigger data-testid="map-notice-value" className="bg-white/50">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>— None —</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Final Value *</Label>
                  <Select
                    value={columnMapping.final_value || SELECT_NONE}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, final_value: value === SELECT_NONE ? '' : value })}
                  >
                    <SelectTrigger data-testid="map-final-value" className="bg-white/50">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>— None —</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-8 flex justify-center">
                <MotionButton
                  variant="gradient"
                  size="xl"
                  onClick={handleCalculate}
                  disabled={isCalculating || !columnMapping.notice_value || !columnMapping.final_value}
                  data-testid="calculate-savings-btn"
                  className="min-w-[250px]"
                >
                  {isCalculating ? (
                    <>
                      <div className="w-5 h-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="w-5 h-5 mr-3" />
                      Calculate Savings
                    </>
                  )}
                </MotionButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Calculation Results
                </h2>
                <div className="flex flex-wrap gap-2">
                  <MotionButton
                    variant="outline"
                    onClick={handleExportResults}
                    data-testid="export-results-btn"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Export CSV
                  </MotionButton>
                  {(apiToken && apiBaseUrl || isSupabaseUser) && (
                    <>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={batchNotes}
                        onChange={(e) => setBatchNotes(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-48"
                      />
                      <MotionButton
                        onClick={handleSaveBatch}
                        disabled={savingBatch}
                        data-testid="save-batch-btn"
                      >
                        {savingBatch ? 'Saving…' : <><DocumentArrowDownIcon className="w-4 h-4 mr-2" /> Save</>}
                      </MotionButton>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Property ID</TableHead>
                      <TableHead className="text-right">Notice Value</TableHead>
                      <TableHead className="text-right">Final Value</TableHead>
                      <TableHead className="text-right">Tax Savings</TableHead>
                      <TableHead className="text-right">Your Fee</TableHead>
                      <TableHead className="text-right">Client Net</TableHead>
                      <TableHead className="text-center">Recommend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        data-testid={`result-row-${index}`}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {row.owner_name}
                        </TableCell>
                        <TableCell className="text-slate-600 font-mono text-sm">
                          {row.property_id}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(row.notice_value)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(row.final_value)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(row.tax_savings)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(row.your_fee)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-[#1e40af]">
                          {formatCurrency(row.client_net)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            row.recommend_review 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {row.recommend_review ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Records</p>
                  <p className="text-2xl font-bold text-slate-900">{results.length}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Total Tax Savings</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(results.reduce((sum, r) => sum + r.tax_savings, 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Fees</p>
                  <p className="text-2xl font-bold text-[#1e40af]">
                    {formatCurrency(results.reduce((sum, r) => sum + r.your_fee, 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Recommended Reviews</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {results.filter(r => r.recommend_review).length}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!file && (
        <GlassCard className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <CalculatorIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Ready to Calculate Savings
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Upload a CSV file with property values to calculate potential tax savings for your clients.
            Make sure your file includes notice values and final assessed values.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
