import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apiListBatches, apiGetBatch, apiUpdateBatch, apiUpdateBatchRows, apiBatchExport, apiDeleteBatch } from '../lib/api';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value ?? 0);
}

const DEMO_BATCHES_KEY = 'taxpilot_demo_batches';

export default function Batches() {
  const { user, apiToken, apiBaseUrl } = useAuth();
  const isSupabaseUser = user?.id && user.id !== 'demo-user-id' && !apiToken;
  const isDemo = user?.id === 'demo-user-id';
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [message, setMessage] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const SAVED_UPLOADS_HINT_KEY = 'taxpilot_saved_uploads_hint_dismissed';
  const [hintDismissed, setHintDismissed] = useState(() => typeof localStorage !== 'undefined' && localStorage.getItem(SAVED_UPLOADS_HINT_KEY) === '1');

  const fetchBatches = useCallback(async () => {
    if (apiToken && apiBaseUrl) {
      setLoading(true);
      try {
        const data = await apiListBatches(apiBaseUrl, apiToken);
        setBatches(data || []);
        if (!data?.length) setSelectedBatch(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (isSupabaseUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBatches(data || []);
        if (!data?.length) setSelectedBatch(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (isDemo) {
      setLoading(true);
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_BATCHES_KEY) : null;
        let list = [];
        if (raw) try { list = JSON.parse(raw); } catch (_) {}
        setBatches(list);
        if (!list.length) setSelectedBatch(null);
      } catch (_) {}
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [apiToken, apiBaseUrl, isSupabaseUser, isDemo, user?.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (!selectedBatch) {
      setRows([]);
      return;
    }
    if (apiToken && apiBaseUrl) {
      let cancelled = false;
      apiGetBatch(apiBaseUrl, apiToken, selectedBatch.id)
        .then((data) => {
          if (!cancelled) setRows(data.rows || []);
        })
        .catch(() => {
          if (!cancelled) setRows([]);
        });
      return () => { cancelled = true; };
    }
    if (isSupabaseUser) {
      let cancelled = false;
      supabase
        .from('batch_rows')
        .select('*')
        .eq('batch_id', selectedBatch.id)
        .order('row_index', { ascending: true })
        .then(({ data, error }) => {
          if (!cancelled && !error) setRows(data || []);
          if (!cancelled && error) setRows([]);
        });
      return () => { cancelled = true; };
    }
    if (isDemo && selectedBatch.rows) {
      setRows(selectedBatch.rows);
      return;
    }
    setRows([]);
  }, [selectedBatch, apiToken, apiBaseUrl, isSupabaseUser, isDemo]);

  const handleSaveDiscounts = async () => {
    if (!selectedBatch) return;
    if (apiToken && apiBaseUrl) {
      setSaving(true);
      setMessage(null);
      try {
        const payload = rows.map((r) => ({ id: r.id, manual_discount: parseFloat(r.manual_discount) || 0 }));
        await apiUpdateBatchRows(apiBaseUrl, apiToken, selectedBatch.id, payload);
        const data = await apiGetBatch(apiBaseUrl, apiToken, selectedBatch.id);
        setRows(data.rows || []);
        setMessage('Discounts saved.');
      } catch (err) {
        const msg = String(err.message || '');
        setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Something went wrong. Try again.' : (msg || 'Failed to save.'));
      } finally {
        setSaving(false);
      }
    } else if (isSupabaseUser) {
      setSaving(true);
      setMessage(null);
      try {
        for (const r of rows) {
          await supabase
            .from('batch_rows')
            .update({
              manual_discount: parseFloat(r.manual_discount) || 0,
              final_invoice: Math.max(0, (parseFloat(r.base_fee) || 0) - (parseFloat(r.manual_discount) || 0)),
            })
            .eq('id', r.id);
        }
        const { data } = await supabase.from('batch_rows').select('*').eq('batch_id', selectedBatch.id).order('row_index', { ascending: true });
        setRows(data || []);
        setMessage('Discounts saved.');
      } catch (err) {
        const msg = String(err.message || '');
        setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Something went wrong. Try again.' : (msg || 'Failed to save.'));
      } finally {
        setSaving(false);
      }
    } else if (isDemo) {
      setSaving(true);
      setMessage(null);
      try {
        const updatedRows = rows.map((r) => ({
          ...r,
          manual_discount: parseFloat(r.manual_discount) || 0,
          final_invoice: Math.max(0, (parseFloat(r.base_fee) || 0) - (parseFloat(r.manual_discount) || 0)),
        }));
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_BATCHES_KEY) : null;
        let list = raw ? JSON.parse(raw) : [];
        list = list.map((b) =>
          b.id === selectedBatch.id ? { ...b, rows: updatedRows } : b
        );
        localStorage.setItem(DEMO_BATCHES_KEY, JSON.stringify(list));
        setRows(updatedRows);
        setMessage('Discounts saved.');
      } catch (err) {
        setMessage('Failed to save.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDownloadQB = async (store = false) => {
    if (!selectedBatch) return;
    if (apiToken && apiBaseUrl) {
      setExporting(true);
      setMessage(null);
      try {
        const data = await apiBatchExport(apiBaseUrl, apiToken, selectedBatch.id, store);
        const bytes = Uint8Array.from(atob(data.csv_base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(store ? 'Export stored and invoice numbers updated.' : 'File downloaded. Import it in QuickBooks (File → Import).');
        if (store) fetchBatches();
      } catch (err) {
        const msg = String(err.message || '');
        setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Export failed. Check your connection and try again.' : (msg || 'Export failed.'));
      } finally {
        setExporting(false);
      }
      return;
    }
    const doExportQB = (batch, rowList) => {
      const invoiceDate = batch.invoice_date || new Date().toISOString().slice(0, 10);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + (batch.days_due || 30));
      const qbItem = batch.qb_item_name || 'Property Tax Protest';
      const qbPrefix = batch.qb_desc_prefix || 'Tax savings';
      const billable = rowList.filter((r) => (parseFloat(r.final_invoice) || 0) > 0);
      const csvRows = [
        ['InvoiceNo', 'Customer', 'InvoiceDate', 'DueDate', 'Item(Product/Service)', 'ItemDescription', 'ItemQuantity', 'ItemRate', 'ItemAmount'],
        ...billable.map((r, i) => [
          (batch.next_invoice_no || 1001) + i,
          r.matched_customer_name || r.raw_client_name,
          invoiceDate,
          dueDate.toISOString().slice(0, 10),
          qbItem,
          `${qbPrefix}: $${(parseFloat(r.tax_saved) || 0).toFixed(2)} | Prop: ${r.property_id || ''}`,
          1,
          (parseFloat(r.final_invoice) || 0).toFixed(2),
          (parseFloat(r.final_invoice) || 0).toFixed(2),
        ]),
      ];
      const csv = csvRows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QB_Import_Batch_${batch.id}_${invoiceDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('File downloaded. Import it in QuickBooks (File → Import).');
    };

    if (isSupabaseUser && rows.length > 0) {
      setExporting(true);
      setMessage(null);
      try {
        doExportQB(selectedBatch, rows);
      } catch (err) {
        const msg = String(err.message || '');
        setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Export failed. Check your connection and try again.' : (msg || 'Export failed.'));
      } finally {
        setExporting(false);
      }
    }
  };

  const updateRowDiscount = (rowId, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              manual_discount: value,
              final_invoice: Math.max(0, (parseFloat(r.base_fee) || 0) - (parseFloat(value) || 0)),
            }
          : r
      )
    );
  };

  const handleDeleteBatch = (batch, e) => {
    if (e) e.stopPropagation();
    if (!batch?.id) return;
    setBatchToDelete(batch);
  };

  const confirmDeleteBatch = async () => {
    const batch = batchToDelete;
    if (!batch?.id) return;
    setBatchToDelete(null);
    setDeleting(true);
    setMessage(null);
    try {
      if (apiToken && apiBaseUrl) {
        await apiDeleteBatch(apiBaseUrl, apiToken, batch.id);
      } else if (isSupabaseUser) {
        const { error } = await supabase.from('batches').delete().eq('id', batch.id).eq('user_id', user.id);
        if (error) throw error;
      } else if (isDemo) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_BATCHES_KEY) : null;
        let list = raw ? JSON.parse(raw) : [];
        list = list.filter((b) => b.id !== batch.id);
        localStorage.setItem(DEMO_BATCHES_KEY, JSON.stringify(list));
      } else {
        return;
      }
      if (selectedBatch?.id === batch.id) setSelectedBatch(null);
      setMessage('Upload deleted.');
      fetchBatches();
    } catch (err) {
      const msg = String(err.message || '');
      setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Could not delete. Try again.' : (msg || 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  };

  const startRename = (batch) => {
    setSelectedBatch(batch);
    setEditingBatchId(batch?.id ?? null);
    setRenameValue((batch?.source_filename || '').trim());
    setMessage(null);
  };

  const cancelRename = () => {
    setEditingBatchId(null);
    setRenameValue('');
    setMessage(null);
  };

  const handleSaveRename = async () => {
    const name = (renameValue || '').trim();
    if (!name) {
      setMessage('Enter a name.');
      return;
    }
    if (!editingBatchId) return;
    const batch = batches.find((b) => b.id === editingBatchId) || selectedBatch;
    if (!batch) return;
    setRenaming(true);
    setMessage(null);
    try {
      if (apiToken && apiBaseUrl) {
        await apiUpdateBatch(apiBaseUrl, apiToken, batch.id, { source_filename: name });
      } else if (isSupabaseUser) {
        const { error } = await supabase.from('batches').update({ source_filename: name }).eq('id', batch.id).eq('user_id', user.id);
        if (error) throw error;
      } else if (isDemo) {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_BATCHES_KEY) : null;
        let list = raw ? JSON.parse(raw) : [];
        list = list.map((b) => (b.id === batch.id ? { ...b, source_filename: name } : b));
        localStorage.setItem(DEMO_BATCHES_KEY, JSON.stringify(list));
      } else {
        return;
      }
      setSelectedBatch((prev) => (prev?.id === batch.id ? { ...prev, source_filename: name } : prev));
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, source_filename: name } : b)));
      setMessage('Renamed.');
      setEditingBatchId(null);
      setRenameValue('');
    } catch (err) {
      const msg = String(err.message || '');
      setMessage(/PGRST|postgres|network|failed to fetch/i.test(msg) ? 'Could not rename. Try again.' : (msg || 'Rename failed.'));
    } finally {
      setRenaming(false);
    }
  };

  const canViewBatches = (apiToken && apiBaseUrl) || isSupabaseUser || isDemo;
  if (!canViewBatches) {
    return (
      <div className="p-8 md:p-12">
        <p className="text-slate-500">Sign in to view your saved uploads and export to QuickBooks.</p>
      </div>
    );
  }

  const billableTotal = rows.filter((r) => (parseFloat(r.final_invoice) || 0) > 0).reduce((s, r) => s + (parseFloat(r.final_invoice) || 0), 0);
  const billableCount = rows.filter((r) => (parseFloat(r.final_invoice) || 0) > 0).length;

  return (
    <div className="p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Saved Uploads
        </h1>
        <p className="text-slate-500 mt-1">Open a saved upload to edit discounts or export to QuickBooks.</p>
      </motion.div>

      {/* First-time hint */}
      <AnimatePresence>
        {!hintDismissed && batches.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3"
          >
            <p className="text-sm text-blue-900 flex-1">
              <strong>No saved uploads yet.</strong> Go to <strong>Upload & Calculate</strong>, upload a CSV, map your columns, then click Calculate and Save. Your file will appear here so you can export to QuickBooks.
            </p>
            <button
              type="button"
              onClick={() => {
                setHintDismissed(true);
                try { localStorage.setItem(SAVED_UPLOADS_HINT_KEY, '1'); } catch (_) {}
              }}
              className="p-1 text-blue-600 hover:text-blue-800 rounded"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard className="p-6 mb-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No saved uploads yet.</p>
            <p className="text-sm mt-1">Upload a file and click “Save” on Upload & Calculate to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow
                    key={b.id}
                    className={selectedBatch?.id === b.id ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {b.source_filename}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startRename(b); }}
                          className="p-1 text-slate-400 hover:text-[#1e40af] rounded transition-colors"
                          title="Rename saved upload"
                          aria-label="Rename"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{b.created_at?.slice(0, 10)}</TableCell>
                    <TableCell>{b.row_count}</TableCell>
                    <TableCell>{b.billable_count}</TableCell>
                    <TableCell>{formatCurrency(b.total_invoice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBatch(b)}
                          className="text-[#1e40af] hover:underline flex items-center gap-1"
                        >
                          Open & export <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteBatch(b, e)}
                          disabled={deleting}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete saved upload"
                          aria-label="Delete saved upload"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {selectedBatch && (
        <GlassCard className="p-6">
          {editingBatchId === selectedBatch.id ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rename upload</label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') cancelRename(); }}
                  placeholder="e.g. 2024 protest batch"
                  className="max-w-sm bg-white"
                  data-testid="rename-batch-input"
                />
                <MotionButton size="sm" onClick={handleSaveRename} disabled={renaming}>
                  {renaming ? 'Saving…' : 'Save'}
                </MotionButton>
                <MotionButton size="sm" variant="outline" onClick={cancelRename} disabled={renaming}>
                  Cancel
                </MotionButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedBatch.source_filename}
              </h2>
              <button
                type="button"
                onClick={() => startRename(selectedBatch)}
                className="p-1.5 text-slate-400 hover:text-[#1e40af] rounded transition-colors"
                title="Rename saved upload"
                aria-label="Rename"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          <p className="text-sm text-slate-500 mb-4">
            Saved {selectedBatch.created_at?.slice(0, 10)} · Invoice date: {selectedBatch.invoice_date}
          </p>
          {message && (
            <p className="mb-4 text-sm text-green-600">{message}</p>
          )}
          <p className="text-sm text-slate-600 mb-4">
            Billable: {billableCount} rows · Total: {formatCurrency(billableTotal)}
          </p>
          <div className="flex flex-wrap gap-3 mb-2">
            <MotionButton
              variant="outline"
              onClick={handleSaveDiscounts}
              disabled={saving}
            >
              {saving ? 'Saving…' : <><DocumentArrowDownIcon className="w-4 h-4 mr-2" /> Save changes</>}
            </MotionButton>
            {!isDemo && (
              <>
                <MotionButton
                  variant="gradient"
                  onClick={() => handleDownloadQB(false)}
                  disabled={exporting}
                  className="min-w-[200px]"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  {exporting ? 'Preparing…' : 'Export to QuickBooks'}
                </MotionButton>
                <MotionButton
                  variant="outline"
                  onClick={() => handleDownloadQB(true)}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting…' : 'Export & update invoice number'}
                </MotionButton>
              </>
            )}
            <MotionButton
              variant="outline"
              onClick={() => handleDeleteBatch(selectedBatch)}
              disabled={deleting}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting…' : 'Delete upload'}
            </MotionButton>
          </div>
          {!isDemo && (
            <p className="text-xs text-slate-500 mb-6">
              In QuickBooks: File → Import → select the downloaded CSV.
            </p>
          )}
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Property ID</TableHead>
                  <TableHead>Tax Saved</TableHead>
                  <TableHead>Base Fee</TableHead>
                  <TableHead>Manual Discount</TableHead>
                  <TableHead>Final Invoice</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.raw_client_name}</TableCell>
                    <TableCell className="font-mono text-sm">{r.property_id}</TableCell>
                    <TableCell>{formatCurrency(r.tax_saved)}</TableCell>
                    <TableCell>{formatCurrency(r.base_fee)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={r.manual_discount ?? ''}
                        onChange={(e) => updateRowDiscount(r.id, e.target.value)}
                        className="w-24 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(r.final_invoice)}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!batchToDelete} onOpenChange={(open) => !open && setBatchToDelete(null)}>
        <AlertDialogContent className="sm:max-w-lg">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
              <ExclamationTriangleIcon className="size-6 text-red-600 dark:text-red-400" aria-hidden />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <AlertDialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Remove saved upload?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to remove &quot;{batchToDelete?.source_filename}&quot;? This cannot be undone. All rows and data in this upload will be permanently deleted.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <AlertDialogAction
              onClick={confirmDeleteBatch}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 disabled:opacity-50 disabled:pointer-events-none"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => setBatchToDelete(null)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-white/10 dark:text-white dark:ring-white/5 dark:hover:bg-white/20"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
