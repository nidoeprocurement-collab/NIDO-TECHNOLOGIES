import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, AlertTriangle, FileDown, MoreVertical, Plus, Edit, Eye, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/contexts/ConfigContext';
import {
  archiveInvoice,
  getArchivedInvoices,
  getInvoices,
  type InvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoiceStore';
import { downloadInvoicePdf } from '@/lib/invoicePdf';

const statusStyles: Record<InvoiceStatus, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
};

function fmt(value: number) {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayNumber(invoiceNumber: string, prefix: string) {
  return invoiceNumber.replace(/^INV-/, prefix);
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface RowMenuPos { top: number; right: number; invoiceId: string }

/* ─────────────────────────────────────────────────────────────────
   Archive Confirmation Dialog
───────────────────────────────────────────────────────────────── */
function ArchiveConfirmDialog({
  invoice,
  prefix,
  onConfirm,
  onCancel,
}: {
  invoice: StoredInvoice;
  prefix: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const canSubmit = reason.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-xl mt-0.5 shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Archive Invoice</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-semibold text-gray-700">{displayNumber(invoice.invoiceNumber, prefix)}</span>
                {' '}— {invoice.clientName}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors -mr-1 -mt-1">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          <p className="text-sm text-gray-600">
            Archived invoices are <strong>read-only</strong> and will no longer appear in the active list.
            This action cannot be undone.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for archiving <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Invoice cancelled by client, duplicate entry, project ended…"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {!canSubmit && reason.length > 0 && (
              <p className="text-xs text-red-500 mt-1">Please enter a reason before archiving.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(reason)}
            disabled={!canSubmit}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              canSubmit
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-amber-100 text-amber-400 cursor-not-allowed'
            }`}
          >
            <Archive size={15} /> Archive Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Archived Invoices Modal  (view-only)
───────────────────────────────────────────────────────────────── */
function ArchivedModal({
  prefix,
  onClose,
}: {
  prefix: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [archived, setArchived] = useState<StoredInvoice[]>([]);

  useEffect(() => {
    const refresh = () => setArchived(getArchivedInvoices());
    refresh();
    window.addEventListener('nidoInvoicesUpdated', refresh);
    return () => window.removeEventListener('nidoInvoicesUpdated', refresh);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Archive size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Archived Invoices</h2>
              <p className="text-xs text-gray-500">
                {archived.length} invoice{archived.length !== 1 ? 's' : ''} archived · read-only
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {archived.length === 0 ? (
            <div className="py-20 text-center">
              <Archive size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No archived invoices</p>
              <p className="text-sm text-gray-400 mt-1">Invoices you archive will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['DATE', 'INVOICE #', 'CUSTOMER', 'STATUS', 'TOTAL', 'ARCHIVED ON', 'REASON', 'ACTIONS'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archived.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-amber-50/30">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{inv.invoiceDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-semibold text-gray-700">
                          {displayNumber(inv.invoiceNumber, prefix)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">{inv.clientName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{fmt(inv.grandTotal)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(inv.archivedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                        <span
                          className="block truncate"
                          title={inv.archiveReason || '—'}
                        >
                          {inv.archiveReason || <span className="text-gray-300 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="View details"
                            onClick={() => { onClose(); navigate(`/sales/invoices/${inv.id}`); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="Download PDF"
                            onClick={() => downloadInvoicePdf(inv)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-amber-50/40 rounded-b-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <Archive size={13} />
            Archived invoices are permanently read-only and cannot be restored, edited, or deleted.
          </div>
          <button
            onClick={onClose}
            className="shrink-0 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────── */
export default function InvoicePage() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const prefix = config.prefixes.find((item) => item.key === 'invoice')?.value || 'INV-';
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<RowMenuPos | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<StoredInvoice | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  const refresh = () => setInvoices(getInvoices());

  useEffect(() => {
    refresh();
    window.addEventListener('nidoInvoicesUpdated', refresh);
    return () => window.removeEventListener('nidoInvoicesUpdated', refresh);
  }, []);

  useEffect(() => {
    if (!rowMenu) return;
    const close = () => setRowMenu(null);
    window.addEventListener('click', close, true);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [rowMenu]);

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const query = search.toLowerCase();
    const matchesSearch =
      displayNumber(invoice.invoiceNumber, prefix).toLowerCase().includes(query) ||
      invoice.clientName.toLowerCase().includes(query);
    return matchesSearch && (statusFilter === 'all' || invoice.status === statusFilter);
  }), [invoices, prefix, search, statusFilter]);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Invoice #', 'Customer', 'Status', 'Due Date', 'Total'],
      ...filteredInvoices.map((invoice) => [
        invoice.invoiceDate,
        displayNumber(invoice.invoiceNumber, prefix),
        invoice.clientName,
        invoice.status,
        invoice.dueDate,
        invoice.grandTotal.toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'invoices.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const confirmArchive = (reason: string) => {
    if (!archiveTarget) return;
    archiveInvoice(archiveTarget.id, reason);
    setArchiveTarget(null);
    setRowMenu(null);
  };

  const openRowMenu = (e: React.MouseEvent<HTMLButtonElement>, invoiceId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu({ top: rect.bottom + 4, right: window.innerWidth - rect.right, invoiceId });
  };

  const activeInvoice = rowMenu ? invoices.find((inv) => inv.id === rowMenu.invoiceId) ?? null : null;

  return (
    <div className="space-y-6" onClick={() => { setHeaderMenuOpen(false); setRowMenu(null); }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Create and manage client invoices</p>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="relative" onClick={(event) => event.stopPropagation()}>
          <button onClick={() => setHeaderMenuOpen((v) => !v)} className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
          {headerMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
              <button
                onClick={() => { navigate('/sales/invoices/new'); setHeaderMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={16} /> New Invoice
              </button>
              <button
                onClick={() => { exportCsv(); setHeaderMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FileDown size={16} /> Export CSV
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setShowArchived(true); setHeaderMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Archive size={16} className="text-amber-600" /> Archived Invoices
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search invoices..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | InvoiceStatus)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 mb-4">No invoices found</p>
            <button
              onClick={() => navigate('/sales/invoices/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
            >
              <Plus size={16} /> Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['DATE', 'INVOICE #', 'CUSTOMER', 'STATUS', 'DUE DATE', 'TOTAL', 'ACTIONS'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{invoice.invoiceDate}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        {displayNumber(invoice.invoiceNumber, prefix)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.clientName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{invoice.dueDate}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{fmt(invoice.grandTotal)}</td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => openRowMenu(e, invoice.id)} className="p-1.5 hover:bg-gray-100 rounded">
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fixed-position row action menu */}
      {rowMenu && activeInvoice && (
        <div
          ref={rowMenuRef}
          className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-[9999]"
          style={{ top: rowMenu.top, right: rowMenu.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { navigate(`/sales/invoices/${activeInvoice.id}`); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye size={15} /> View Details
          </button>
          <button
            onClick={() => { navigate(`/sales/invoices/${activeInvoice.id}/edit`); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={15} /> Edit
          </button>
          <button
            onClick={() => { downloadInvoicePdf(activeInvoice); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText size={15} /> Download PDF
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { setArchiveTarget(activeInvoice); setRowMenu(null); }}
            className="w-full px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
          >
            <Archive size={15} /> Archive
          </button>
        </div>
      )}

      {/* Archive confirmation dialog */}
      {archiveTarget && (
        <ArchiveConfirmDialog
          invoice={archiveTarget}
          prefix={prefix}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* Archived Invoices Modal */}
      {showArchived && (
        <ArchivedModal
          prefix={prefix}
          onClose={() => setShowArchived(false)}
        />
      )}
    </div>
  );
}
