import { useMemo, useRef, useState } from 'react';
import {
  Building2,
  Check,
  Edit,
  Eye,
  Plus,
  QrCode,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  readImageAsDataUrl,
  validateAccountNumber,
  validateIfscCode,
  validateImageUpload,
  validateSwiftCode,
} from '@/lib/transactionSettings/service';
import type { BankAccountSetting } from '@/lib/transactionSettings/types';

interface BankDetailsTabProps {
  bankAccounts: BankAccountSetting[];
  onSaveAccounts: (next: BankAccountSetting[]) => void;
  onPreviewPdfWithBank: (bankId: string) => void;
}

interface BankFormState {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  swiftCode: string;
  accountType: 'Current' | 'Savings';
  bankAddress: string;
  upiId: string;
  paymentInstructions: string;
  qrCodeDataUrl?: string;
  isDefault: boolean;
  isActive: boolean;
}

function emptyBankForm(): BankFormState {
  return {
    accountHolderName: 'Nido Technologies Pvt. Ltd.',
    bankName: '',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    swiftCode: '',
    accountType: 'Current',
    bankAddress: '',
    upiId: '',
    paymentInstructions: '',
    qrCodeDataUrl: undefined,
    isDefault: false,
    isActive: true,
  };
}

export function BankDetailsTab({
  bankAccounts,
  onSaveAccounts,
  onPreviewPdfWithBank,
}: BankDetailsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankFormState>(emptyBankForm);
  const [previewAccount, setPreviewAccount] = useState<BankAccountSetting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccountSetting | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bankAccounts.filter((acc) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? acc.isActive : !acc.isActive);
      const matchesQuery =
        !q ||
        acc.bankName.toLowerCase().includes(q) ||
        acc.accountHolderName.toLowerCase().includes(q) ||
        acc.branchName.toLowerCase().includes(q) ||
        acc.ifscCode.toLowerCase().includes(q) ||
        acc.accountNumber.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [bankAccounts, search, statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...emptyBankForm(),
      isDefault: bankAccounts.length === 0,
    });
    setFormOpen(true);
  };

  const openEditModal = (account: BankAccountSetting) => {
    setEditingId(account.id);
    setForm({
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
      branchName: account.branchName,
      accountNumber: account.accountNumber,
      confirmAccountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      swiftCode: account.swiftCode,
      accountType: account.accountType,
      bankAddress: account.bankAddress,
      upiId: account.upiId,
      paymentInstructions: account.paymentInstructions,
      qrCodeDataUrl: account.qrCodeDataUrl,
      isDefault: account.isDefault,
      isActive: account.isActive,
    });
    setFormOpen(true);
  };

  const handleQrUpload = async (file?: File) => {
    if (!file) return;
    const validation = validateImageUpload(file, 2 * 1024 * 1024);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid QR image.');
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm((prev) => ({ ...prev, qrCodeDataUrl: dataUrl }));
      toast.success('QR code image loaded for local preview.');
    } catch {
      toast.error('Could not read QR code image.');
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountHolderName.trim() || !form.bankName.trim() || !form.branchName.trim()) {
      toast.error('Please enter Account Holder Name, Bank Name, and Branch Name.');
      return;
    }
    if (!validateAccountNumber(form.accountNumber)) {
      toast.error('Account Number must be 6–22 digits.');
      return;
    }
    if (form.accountNumber.trim() !== form.confirmAccountNumber.trim()) {
      toast.error('Account Number and Confirm Account Number do not match.');
      return;
    }
    if (!validateIfscCode(form.ifscCode)) {
      toast.error('Invalid IFSC Code format (expected e.g. HDFC0000142).');
      return;
    }
    if (!validateSwiftCode(form.swiftCode)) {
      toast.error('Invalid SWIFT / BIC Code format (expected 8 or 11 characters).');
      return;
    }

    const now = new Date().toISOString();
    const record: BankAccountSetting = {
      id: editingId || `bank-${Date.now()}`,
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      branchName: form.branchName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      swiftCode: form.swiftCode.trim().toUpperCase(),
      accountType: form.accountType,
      bankAddress: form.bankAddress.trim(),
      upiId: form.upiId.trim(),
      paymentInstructions: form.paymentInstructions.trim(),
      qrCodeDataUrl: form.qrCodeDataUrl,
      isDefault: form.isDefault,
      isActive: form.isActive,
      createdAt: editingId
        ? bankAccounts.find((a) => a.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    let next = editingId
      ? bankAccounts.map((a) => (a.id === editingId ? record : a))
      : [record, ...bankAccounts];

    if (record.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: a.id === record.id }));
    }

    onSaveAccounts(next);
    setFormOpen(false);
    toast.success(editingId ? 'Bank account updated.' : 'Bank account added.');
  };

  const handleSetDefault = (account: BankAccountSetting) => {
    const next = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === account.id,
      isActive: a.id === account.id ? true : a.isActive,
    }));
    onSaveAccounts(next);
    toast.success(`${account.bankName} set as Default NIDO Bank Account.`);
  };

  const handleToggleActive = (account: BankAccountSetting) => {
    if (account.isDefault && account.isActive) {
      toast.error('Cannot disable the default bank account. Set another account as default first.');
      return;
    }
    const next = bankAccounts.map((a) =>
      a.id === account.id ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() } : a,
    );
    onSaveAccounts(next);
    toast.info(`${account.bankName} ${account.isActive ? 'disabled' : 'enabled'}.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const remaining = bankAccounts.filter((a) => a.id !== deleteTarget.id);
    if (deleteTarget.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    onSaveAccounts(remaining);
    toast.success(`Deleted bank account ${deleteTarget.bankName}.`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank, IFSC, account..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="inactive">Disabled Only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} /> Add Bank Account
        </button>
      </div>

      {/* Bank Cards Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No NIDO bank accounts found</p>
          <p className="text-xs text-slate-500 mt-1">
            Add an official NIDO bank account to display on Proforma Invoices, Tax Invoices, and Quotations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((acc) => (
            <div
              key={acc.id}
              className={`bg-white rounded-xl border p-5 space-y-4 transition-shadow hover:shadow-sm ${
                acc.isDefault ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{acc.bankName}</h3>
                    {acc.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Star size={10} className="fill-blue-600" /> Default
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        acc.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {acc.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{acc.branchName}</p>
                </div>

                {acc.qrCodeDataUrl && (
                  <img
                    src={acc.qrCodeDataUrl}
                    alt="UPI QR"
                    className="h-12 w-12 object-contain border border-slate-200 rounded p-0.5 bg-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Account Holder</span>
                  <span className="font-semibold text-slate-800">{acc.accountHolderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Type</span>
                  <span className="font-semibold text-slate-800">{acc.accountType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Number</span>
                  <span className="font-mono font-semibold text-slate-900">{acc.accountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-900">{acc.ifscCode}</span>
                </div>
                {acc.swiftCode && (
                  <div>
                    <span className="text-slate-400 block">SWIFT / BIC</span>
                    <span className="font-mono font-semibold text-slate-800">{acc.swiftCode}</span>
                  </div>
                )}
                {acc.upiId && (
                  <div>
                    <span className="text-slate-400 block">UPI ID</span>
                    <span className="font-semibold text-slate-800">{acc.upiId}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewAccount(acc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewPdfWithBank(acc.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-blue-200 bg-blue-50/70 rounded-lg text-blue-700 hover:bg-blue-100"
                  >
                    <QrCode size={13} /> PDF Preview
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!acc.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(acc)}
                      className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(acc)}
                    className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    {acc.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(acc)}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                    title="Edit Bank Account"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(acc)}
                    className="p-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete Bank Account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit NIDO Bank Account' : 'Add NIDO Bank Account'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded hover:bg-slate-200 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Account Holder Name *</label>
                  <input
                    required
                    value={form.accountHolderName}
                    onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Bank Name *</label>
                  <input
                    required
                    value={form.bankName}
                    onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder="e.g. HDFC Bank Ltd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Branch Name *</label>
                  <input
                    required
                    value={form.branchName}
                    onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
                    placeholder="e.g. Koramangala 4th Block"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Account Type *</label>
                  <select
                    value={form.accountType}
                    onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value as 'Current' | 'Savings' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Current">Current</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Account Number *</label>
                  <input
                    required
                    value={form.accountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="6 to 22 digits"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Confirm Account Number *</label>
                  <input
                    required
                    value={form.confirmAccountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, confirmAccountNumber: e.target.value }))}
                    placeholder="Re-enter account number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">IFSC Code *</label>
                  <input
                    required
                    value={form.ifscCode}
                    onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. HDFC0000142"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SWIFT / BIC Code</label>
                  <input
                    value={form.swiftCode}
                    onChange={(e) => setForm((p) => ({ ...p, swiftCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. HDFCINBBXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">UPI ID</label>
                  <input
                    value={form.upiId}
                    onChange={(e) => setForm((p) => ({ ...p, upiId: e.target.value }))}
                    placeholder="e.g. nidotech@hdfcbank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Bank Address</label>
                  <input
                    value={form.bankAddress}
                    onChange={(e) => setForm((p) => ({ ...p, bankAddress: e.target.value }))}
                    placeholder="Branch street address"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={form.paymentInstructions}
                  onChange={(e) => setForm((p) => ({ ...p, paymentInstructions: e.target.value }))}
                  placeholder="Instructions displayed on Invoices and Payment Requests"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* QR Code Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-700">Payment QR Code (Optional)</p>
                  <p className="text-[11px] text-slate-500">PNG/JPG/JPEG, max 2 MB (browser-side preview only)</p>
                </div>
                <div className="flex items-center gap-2">
                  {form.qrCodeDataUrl && (
                    <>
                      <img
                        src={form.qrCodeDataUrl}
                        alt="QR Preview"
                        className="h-10 w-10 object-contain border border-slate-300 rounded bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, qrCodeDataUrl: undefined }))}
                        className="px-2 py-1 text-[11px] text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => handleQrUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Upload size={13} /> {form.qrCodeDataUrl ? 'Replace QR' : 'Upload QR'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Set as Default Bank Account</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Account Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  <Check size={14} /> {editingId ? 'Update Bank Account' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Bank Details Modal */}
      {previewAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Bank Remittance Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewAccount(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">NIDO BANK DETAILS</p>
              <p className="font-semibold text-slate-900">{previewAccount.accountHolderName}</p>
              <p className="text-slate-700">{previewAccount.bankName} — {previewAccount.branchName}</p>
              <p className="text-slate-700">A/C No: <span className="font-mono font-semibold">{previewAccount.accountNumber}</span> ({previewAccount.accountType})</p>
              <p className="text-slate-700">IFSC: <span className="font-mono font-semibold">{previewAccount.ifscCode}</span></p>
              {previewAccount.swiftCode && <p className="text-slate-700">SWIFT: {previewAccount.swiftCode}</p>}
              {previewAccount.upiId && <p className="text-slate-700">UPI ID: {previewAccount.upiId}</p>}
              {previewAccount.paymentInstructions && (
                <p className="text-slate-600 pt-1 border-t border-blue-100">{previewAccount.paymentInstructions}</p>
              )}
              {previewAccount.qrCodeDataUrl && (
                <img
                  src={previewAccount.qrCodeDataUrl}
                  alt="QR"
                  className="mt-2 h-24 w-24 object-contain bg-white border border-slate-200 rounded p-1"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Delete Bank Account?</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{deleteTarget.bankName}</strong> ({deleteTarget.accountNumber})?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

