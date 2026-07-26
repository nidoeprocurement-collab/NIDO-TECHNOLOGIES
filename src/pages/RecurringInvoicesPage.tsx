import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, MoreVertical, X, RefreshCw, PauseCircle, PlayCircle,
  Trash2, Edit2, ChevronRight, Calendar, FileText, TrendingUp, Clock,
  CheckCircle2, AlertCircle, User, IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllRecurring, saveRecurring, deleteRecurring, toggleStatus, seedIfEmpty, buildNewId,
  type RecurringInvoice, type RecurringFrequency, type RecurringStatus, type GeneratedStatus,
} from '@/lib/recurringInvoiceStore';

// ── formatting ─────────────────────────────────────────────────────────────────
function fmt(v: number) {
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── badge colours ──────────────────────────────────────────────────────────────
const statusStyles: Record<RecurringStatus, string> = {
  active:    'bg-green-100 text-green-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  expired:   'bg-gray-100 text-gray-500',
};
const genStatusStyles: Record<GeneratedStatus, string> = {
  Draft:   'bg-gray-100 text-gray-600',
  Sent:    'bg-blue-100 text-blue-700',
  Paid:    'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
};
const freqLabel: Record<RecurringFrequency, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', yearly: 'Yearly',
};

// ── empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
        <RefreshCw size={24} className="text-blue-500" />
      </div>
      <div>
        <p className="text-gray-900 font-semibold text-base">No recurring invoices yet</p>
        <p className="text-gray-500 text-sm mt-1">Set up a profile to auto-generate invoices on a schedule.</p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} /> New Recurring Invoice
      </button>
    </div>
  );
}

// ── create / edit drawer ────────────────────────────────────────────────────────
interface DrawerProps {
  editing: RecurringInvoice | null;
  onSave: (rec: RecurringInvoice) => void;
  onClose: () => void;
}

const FREQ_OPTIONS: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

function RecurringDrawer({ editing, onSave, onClose }: DrawerProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    profileName: editing?.profileName ?? '',
    clientName:  editing?.clientName  ?? '',
    clientGstin: editing?.clientGstin ?? '',
    billingAddress: editing?.billingAddress ?? '',
    grandTotal:  editing ? String(editing.grandTotal) : '',
    taxAmount:   editing ? String(editing.taxAmount)  : '',
    frequency:   editing?.frequency   ?? 'monthly' as RecurringFrequency,
    startDate:   editing?.startDate   ?? today,
    endDate:     editing?.endDate     ?? '',
    paymentTerms: editing?.paymentTerms ?? 'Net 30',
    notes:       editing?.notes ?? '',
  });

  function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave() {
    if (!form.profileName.trim()) { toast.error('Profile name is required'); return; }
    if (!form.clientName.trim())  { toast.error('Client name is required');  return; }
    const grand = parseFloat(form.grandTotal) || 0;
    const tax   = parseFloat(form.taxAmount)  || 0;
    if (grand <= 0) { toast.error('Amount must be greater than zero'); return; }

    const now = new Date().toISOString();
    const rec: RecurringInvoice = {
      id:              editing?.id ?? buildNewId(),
      profileName:     form.profileName.trim(),
      clientName:      form.clientName.trim(),
      clientGstin:     form.clientGstin.trim() || undefined,
      billingAddress:  form.billingAddress.trim() || undefined,
      subtotal:        grand - tax,
      taxAmount:       tax,
      grandTotal:      grand,
      frequency:       form.frequency,
      status:          editing?.status ?? 'active',
      startDate:       form.startDate,
      endDate:         form.endDate || undefined,
      nextInvoiceDate: editing?.nextInvoiceDate ?? form.startDate,
      lastInvoiceDate: editing?.lastInvoiceDate,
      paymentTerms:    form.paymentTerms,
      notes:           form.notes.trim() || undefined,
      invoicesSent:    editing?.invoicesSent ?? 0,
      generatedInvoices: editing?.generatedInvoices ?? [],
      createdAt:       editing?.createdAt ?? now,
      updatedAt:       now,
    };
    onSave(rec);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Set up a profile to auto-generate invoices.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 px-6 py-5 space-y-5">
          {/* profile */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Monthly Retainer – Acme Corp"
                  value={form.profileName}
                  onChange={e => set('profileName', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* client */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client Details</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client or company name"
                  value={form.clientName}
                  onChange={e => set('clientName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15-digit GSTIN (optional)"
                  value={form.clientGstin}
                  onChange={e => set('clientGstin', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Street, City, State – PIN"
                  value={form.billingAddress}
                  onChange={e => set('billingAddress', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* amounts */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Amount</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number" min="0" step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  value={form.grandTotal}
                  onChange={e => set('grandTotal', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  value={form.taxAmount}
                  onChange={e => set('taxAmount', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* schedule */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Schedule</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeats</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.frequency}
                  onChange={e => set('frequency', e.target.value as RecurringFrequency)}
                >
                  {FREQ_OPTIONS.map(f => <option key={f} value={f}>{freqLabel[f]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.endDate}
                    onChange={e => set('endDate', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.paymentTerms}
                  onChange={e => set('paymentTerms', e.target.value)}
                >
                  {['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* notes */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Internal notes about this recurring profile…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </section>
        </div>

        {/* footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editing ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({
  rec,
  onEdit,
  onToggle,
  onDelete,
  onClose,
}: {
  rec: RecurringInvoice;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [moreOpen]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <RefreshCw size={16} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{rec.profileName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[rec.status]}`}>
                  {capitalize(rec.status)}
                </span>
                <span className="text-xs text-gray-500">{freqLabel[rec.frequency]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              title="Edit"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onToggle}
              title={rec.status === 'active' ? 'Pause' : 'Resume'}
              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              {rec.status === 'active' ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
            </button>
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={() => { onDelete(); setMoreOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 mt-3">
          {(['overview', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t === 'overview' ? 'Overview' : 'Invoice History'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="p-5 space-y-5">
          {/* summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <IndianRupee size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500">Invoice Amount</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{fmt(rec.grandTotal)}</p>
              <p className="text-xs text-gray-400 mt-1.5">Tax</p>
              <p className="text-xs text-gray-600">{fmt(rec.taxAmount)}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500">Repeats</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{freqLabel[rec.frequency]}</p>
              <p className="text-xs text-gray-400 mt-1.5">Payment Terms</p>
              <p className="text-xs text-gray-600">{rec.paymentTerms}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500">Next Invoice</p>
              </div>
              <p className="text-base font-bold text-gray-900">{fmtDate(rec.nextInvoiceDate)}</p>
              <p className="text-xs text-gray-400 mt-1.5">Started On</p>
              <p className="text-xs text-gray-600">{fmtDate(rec.startDate)}</p>
              {rec.endDate && (
                <>
                  <p className="text-xs text-gray-400 mt-1">Ends On</p>
                  <p className="text-xs text-gray-600">{fmtDate(rec.endDate)}</p>
                </>
              )}
            </div>
          </div>

          {/* other details */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Other Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Client</p>
                <p className="font-medium text-blue-600">{rec.clientName}</p>
              </div>
              {rec.clientGstin && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">GSTIN</p>
                  <p className="font-mono text-gray-700 text-xs">{rec.clientGstin}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Invoices Sent</p>
                <p className="font-semibold text-gray-800">{rec.invoicesSent}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Last Invoice</p>
                <p className="text-gray-700">{rec.lastInvoiceDate ? fmtDate(rec.lastInvoiceDate) : '—'}</p>
              </div>
              {rec.billingAddress && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Billing Address</p>
                  <p className="text-gray-700">{rec.billingAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* notes */}
          {rec.notes && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-gray-700">
                {rec.notes}
              </div>
            </div>
          )}

          {/* history log */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">History</p>
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 text-xs text-gray-500">
              <div className="px-3 py-2">
                {fmtDate(rec.createdAt)} — Recurring profile created for {fmt(rec.grandTotal)}
              </div>
              {rec.lastInvoiceDate && (
                <div className="px-3 py-2">
                  {fmtDate(rec.lastInvoiceDate)} — Invoice generated for {fmt(rec.grandTotal)}
                </div>
              )}
              {rec.status === 'paused' && (
                <div className="px-3 py-2">
                  {fmtDate(rec.updatedAt)} — Profile paused
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* invoice history tab */
        <div className="p-5">
          {rec.generatedInvoices.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No invoices generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['DATE', 'INVOICE #', 'DUE DATE', 'AMOUNT', 'STATUS'].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rec.generatedInvoices.map(gi => (
                    <tr key={gi.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{fmtDate(gi.date)}</td>
                      <td className="py-2.5 pr-4 font-semibold text-blue-600">{gi.invoiceNumber}</td>
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{fmtDate(gi.dueDate)}</td>
                      <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">{fmt(gi.grandTotal)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${genStatusStyles[gi.status]}`}>
                          {gi.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
export default function RecurringInvoicesPage() {
  const [items, setItems] = useState<RecurringInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecurringStatus | 'all'>('all');
  const [freqFilter, setFreqFilter] = useState<RecurringFrequency | 'all'>('all');
  const [selected, setSelected] = useState<RecurringInvoice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringInvoice | null>(null);
  const [rowMenu, setRowMenu] = useState<{ top: number; right: number; rec: RecurringInvoice } | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    const all = getAllRecurring();
    setItems(all);
    // keep selected in sync
    setSelected(prev => prev ? (all.find(r => r.id === prev.id) ?? null) : null);
  };

  useEffect(() => {
    seedIfEmpty();
    refresh();
    window.addEventListener('recurringInvoicesUpdated', refresh);
    return () => window.removeEventListener('recurringInvoicesUpdated', refresh);
  }, []);

  // close row menu on outside click
  useEffect(() => {
    if (!rowMenu) return;
    const handler = (e: MouseEvent) => {
      if (!rowMenuRef.current?.contains(e.target as Node)) setRowMenu(null);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [rowMenu]);

  const filtered = useMemo(() => items.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.profileName.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchFreq = freqFilter === 'all' || r.frequency === freqFilter;
    return matchSearch && matchStatus && matchFreq;
  }), [items, search, statusFilter, freqFilter]);

  // stats
  const stats = useMemo(() => ({
    active:    items.filter(r => r.status === 'active').length,
    paused:    items.filter(r => r.status === 'paused').length,
    monthlyValue: items
      .filter(r => r.status === 'active')
      .reduce((sum, r) => {
        const monthly: Record<RecurringFrequency, number> = {
          daily: 30, weekly: 4.33, monthly: 1, quarterly: 1/3, yearly: 1/12,
        };
        return sum + r.grandTotal * monthly[r.frequency];
      }, 0),
    totalSent: items.reduce((s, r) => s + r.invoicesSent, 0),
  }), [items]);

  const openRowMenu = (e: React.MouseEvent, rec: RecurringInvoice) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRowMenu({ top: rect.bottom + 4, right: window.innerWidth - rect.right, rec });
  };

  const handleSave = (rec: RecurringInvoice) => {
    saveRecurring(rec);
    setDrawerOpen(false);
    setEditing(null);
    toast.success(editing ? 'Profile updated' : 'Recurring invoice created');
    refresh();
  };

  const handleToggle = (rec: RecurringInvoice) => {
    toggleStatus(rec.id);
    toast.success(rec.status === 'active' ? 'Profile paused' : 'Profile resumed');
    refresh();
  };

  const handleDelete = (rec: RecurringInvoice) => {
    if (!window.confirm(`Delete "${rec.profileName}"? This cannot be undone.`)) return;
    deleteRecurring(rec.id);
    if (selected?.id === rec.id) setSelected(null);
    toast.success('Profile deleted');
    refresh();
  };

  return (
    <div className="space-y-5" onClick={() => setRowMenu(null)}>
      {/* ── page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Auto-generate invoices on a fixed schedule</p>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setDrawerOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus size={16} /> New Recurring
        </button>
      </div>

      {/* ── stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Profiles', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Paused',          value: stats.paused,  icon: PauseCircle,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Invoices Sent',   value: stats.totalSent, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          {
            label: 'Est. Monthly Revenue',
            value: `₹${Math.round(stats.monthlyValue).toLocaleString('en-IN')}`,
            icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={17} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by profile name or client…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as RecurringStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={freqFilter}
          onChange={e => setFreqFilter(e.target.value as RecurringFrequency | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All frequencies</option>
          {FREQ_OPTIONS.map(f => <option key={f} value={f}>{freqLabel[f]}</option>)}
        </select>
      </div>

      {/* ── table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          items.length === 0
            ? <EmptyState onNew={() => { setEditing(null); setDrawerOpen(true); }} />
            : <div className="py-16 text-center text-gray-400 text-sm">No profiles match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['PROFILE NAME', 'CLIENT', 'AMOUNT', 'FREQUENCY', 'NEXT INVOICE', 'LAST SENT', 'SENT', 'STATUS', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rec => (
                  <tr
                    key={rec.id}
                    onClick={() => setSelected(s => s?.id === rec.id ? null : rec)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      selected?.id === rec.id ? 'bg-blue-50' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {selected?.id === rec.id && <ChevronRight size={14} className="text-blue-500 shrink-0" />}
                        <span className="font-semibold text-blue-600 text-sm">{rec.profileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[140px] truncate">{rec.clientName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{fmt(rec.grandTotal)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-400" />
                        {freqLabel[rec.frequency]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(rec.nextInvoiceDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(rec.lastInvoiceDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center font-medium">{rec.invoicesSent}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[rec.status]}`}>
                        {capitalize(rec.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => openRowMenu(e, rec)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── detail panel ── */}
      {selected && (
        <DetailPanel
          rec={selected}
          onEdit={() => { setEditing(selected); setDrawerOpen(true); }}
          onToggle={() => handleToggle(selected)}
          onDelete={() => handleDelete(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── row context menu ── */}
      {rowMenu && (
        <div
          ref={rowMenuRef}
          className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[9999]"
          style={{ top: rowMenu.top, right: rowMenu.right }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setSelected(rowMenu.rec); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <User size={14} /> View Details
          </button>
          <button
            onClick={() => { setEditing(rowMenu.rec); setDrawerOpen(true); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit2 size={14} /> Edit Profile
          </button>
          <button
            onClick={() => { handleToggle(rowMenu.rec); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            {rowMenu.rec.status === 'active'
              ? <><PauseCircle size={14} /> Pause</>
              : <><PlayCircle size={14} /> Resume</>
            }
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { handleDelete(rowMenu.rec); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* ── create / edit drawer ── */}
      {drawerOpen && (
        <RecurringDrawer
          editing={editing}
          onSave={handleSave}
          onClose={() => { setDrawerOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
