import { useRef, useState } from 'react';
import {
  Check,
  Edit,
  Eye,
  PenTool,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { readImageAsDataUrl, validateImageUpload } from '@/lib/transactionSettings/service';
import type {
  DigitalSignatureSetting,
  DocumentSignatureAssignment,
  SignaturePosition,
} from '@/lib/transactionSettings/types';

interface DigitalSignaturesTabProps {
  signatures: DigitalSignatureSetting[];
  assignments: DocumentSignatureAssignment[];
  onSaveSignatures: (next: DigitalSignatureSetting[]) => void;
  onSaveAssignments: (next: DocumentSignatureAssignment[]) => void;
  onPreviewDocument: (documentType: string) => void;
}

interface SignatureFormState {
  signatureName: string;
  authorizedPerson: string;
  designation: string;
  description: string;
  signatureImageDataUrl?: string;
  isActive: boolean;
  isDefault: boolean;
}

function emptySignatureForm(): SignatureFormState {
  return {
    signatureName: '',
    authorizedPerson: '',
    designation: 'Authorized Signatory',
    description: '',
    signatureImageDataUrl: undefined,
    isActive: true,
    isDefault: false,
  };
}

export function DigitalSignaturesTab({
  signatures,
  assignments,
  onSaveSignatures,
  onSaveAssignments,
  onPreviewDocument,
}: DigitalSignaturesTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SignatureFormState>(emptySignatureForm);
  const [previewSig, setPreviewSig] = useState<DigitalSignatureSetting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DigitalSignatureSetting | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptySignatureForm(), isDefault: signatures.length === 0 });
    setFormOpen(true);
  };

  const openEdit = (sig: DigitalSignatureSetting) => {
    setEditingId(sig.id);
    setForm({
      signatureName: sig.signatureName,
      authorizedPerson: sig.authorizedPerson,
      designation: sig.designation,
      description: sig.description,
      signatureImageDataUrl: sig.signatureImageDataUrl,
      isActive: sig.isActive,
      isDefault: sig.isDefault,
    });
    setFormOpen(true);
  };

  const handleImageSelect = async (file?: File) => {
    if (!file) return;
    const check = validateImageUpload(file, 2 * 1024 * 1024);
    if (!check.valid) {
      toast.error(check.error || 'Unsupported signature image.');
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm((p) => ({ ...p, signatureImageDataUrl: dataUrl }));
      toast.success('Signature image loaded for preview.');
    } catch {
      toast.error('Failed to load signature image.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.signatureName.trim() || !form.authorizedPerson.trim() || !form.designation.trim()) {
      toast.error('Please enter Signature Name, Authorized Person Name, and Designation.');
      return;
    }

    const now = new Date().toISOString();
    const record: DigitalSignatureSetting = {
      id: editingId || `sig-${Date.now()}`,
      signatureName: form.signatureName.trim(),
      authorizedPerson: form.authorizedPerson.trim(),
      designation: form.designation.trim(),
      description: form.description.trim(),
      signatureImageDataUrl: form.signatureImageDataUrl,
      isActive: form.isActive,
      isDefault: form.isDefault,
      createdAt: editingId
        ? signatures.find((s) => s.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    let next = editingId
      ? signatures.map((s) => (s.id === editingId ? record : s))
      : [record, ...signatures];

    if (record.isDefault) {
      next = next.map((s) => ({ ...s, isDefault: s.id === record.id }));
    }

    onSaveSignatures(next);
    setFormOpen(false);
    toast.success(editingId ? 'Digital signature updated.' : 'Digital signature added.');
  };

  const handleSetDefault = (sig: DigitalSignatureSetting) => {
    const next = signatures.map((s) => ({
      ...s,
      isDefault: s.id === sig.id,
      isActive: s.id === sig.id ? true : s.isActive,
    }));
    onSaveSignatures(next);
    toast.success(`${sig.signatureName} set as default signature.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const remaining = signatures.filter((s) => s.id !== deleteTarget.id);
    if (deleteTarget.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    onSaveSignatures(remaining);
    toast.success(`Deleted ${deleteTarget.signatureName}.`);
    setDeleteTarget(null);
  };

  const updateAssignment = (
    id: string,
    patch: Partial<DocumentSignatureAssignment>,
  ) => {
    const next = assignments.map((a) => (a.id === id ? { ...a, ...patch } : a));
    onSaveAssignments(next);
    toast.success('Document signature assignment updated.');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Authorized Digital Signatures</h3>
          <p className="text-xs text-slate-500">
            Upload PNG/JPG/JPEG signatures (transparent PNG recommended) and assign them to transaction PDFs.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} /> Upload Signature
        </button>
      </div>

      {/* Signatures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signatures.map((sig) => (
          <div
            key={sig.id}
            className={`bg-white rounded-xl border p-4 space-y-3 ${
              sig.isDefault ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900">{sig.signatureName}</h4>
                  {sig.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Star size={10} className="fill-blue-600" /> Default
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700 mt-0.5">{sig.authorizedPerson}</p>
                <p className="text-[11px] text-slate-500">{sig.designation}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  sig.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {sig.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Signature Visual Box */}
            <div className="h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              {sig.signatureImageDataUrl ? (
                <img
                  src={sig.signatureImageDataUrl}
                  alt={sig.signatureName}
                  className="max-h-16 object-contain"
                />
              ) : (
                <div className="text-center text-[11px] text-slate-400 flex items-center gap-1.5">
                  <PenTool size={13} /> No image uploaded yet
                </div>
              )}
            </div>

            {sig.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{sig.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewSig(sig)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <Eye size={12} /> Preview
              </button>
              <div className="flex items-center gap-1.5">
                {!sig.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(sig)}
                    className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(sig)}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Edit Signature"
                >
                  <Edit size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(sig)}
                  className="p-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                  title="Delete Signature"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document-wise Signature Assignment */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm font-bold text-slate-900">Document-wise Signature Assignment</h4>
          <p className="text-xs text-slate-500">
            Choose which authorized signature appears on each transaction document and where it is positioned.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">Document Type</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">Assigned Signature</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">Position</th>
                <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wide">Enabled</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((assign) => (
                <tr key={assign.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-800">{assign.documentType}</td>
                  <td className="px-4 py-3">
                    <select
                      value={assign.signatureId}
                      onChange={(e) => updateAssignment(assign.id, { signatureId: e.target.value })}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
                    >
                      {signatures.map((sig) => (
                        <option key={sig.id} value={sig.id}>
                          {sig.signatureName} ({sig.authorizedPerson})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={assign.position}
                      onChange={(e) =>
                        updateAssignment(assign.id, { position: e.target.value as SignaturePosition })
                      }
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
                    >
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={assign.isEnabled}
                      onChange={(e) => updateAssignment(assign.id, { isEnabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onPreviewDocument(assign.documentType)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                    >
                      <Eye size={12} /> Preview PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Signature Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit Digital Signature' : 'Upload Digital Signature'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded hover:bg-slate-200 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Signature Name *</label>
                <input
                  required
                  value={form.signatureName}
                  onChange={(e) => setForm((p) => ({ ...p, signatureName: e.target.value }))}
                  placeholder="e.g. Primary Authorized Signatory"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Authorized Person Name *</label>
                  <input
                    required
                    value={form.authorizedPerson}
                    onChange={(e) => setForm((p) => ({ ...p, authorizedPerson: e.target.value }))}
                    placeholder="e.g. Dr. Praveen Gojanur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Designation *</label>
                  <input
                    required
                    value={form.designation}
                    onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. Authorized Signatory"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Signature Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-700">Signature Image (PNG / JPG / JPEG)</p>
                    <p className="text-[11px] text-slate-500">Transparent PNG recommended • Max 2 MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.signatureImageDataUrl && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, signatureImageDataUrl: undefined }))}
                        className="px-2 py-1 text-[11px] text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Upload size={13} /> {form.signatureImageDataUrl ? 'Replace' : 'Select Image'}
                    </button>
                  </div>
                </div>
                {form.signatureImageDataUrl && (
                  <div className="p-2 bg-white border border-slate-200 rounded flex justify-center">
                    <img
                      src={form.signatureImageDataUrl}
                      alt="Signature preview"
                      className="max-h-20 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Active</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Default Signature</span>
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
                  <Check size={14} /> {editingId ? 'Update Signature' : 'Save Signature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Format Preview Modal */}
      {previewSig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900">PDF Signature Block Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewSig(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Authorized Signatory:
              </p>
              <p className="text-sm font-bold text-slate-900">{previewSig.authorizedPerson}</p>
              {previewSig.signatureImageDataUrl ? (
                <img
                  src={previewSig.signatureImageDataUrl}
                  alt={previewSig.signatureName}
                  className="h-16 mx-auto object-contain"
                />
              ) : (
                <div className="h-12 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-xs italic text-slate-400">
                  [Uploaded Signature Image]
                </div>
              )}
              <p className="text-xs text-slate-600">{previewSig.designation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Delete Digital Signature?</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{deleteTarget.signatureName}</strong>?
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

