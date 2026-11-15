import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Eye,
  History,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';
import type {
  DocumentCategoryKey,
  DocumentTermsSetting,
  TermsVersion,
} from '@/lib/transactionSettings/types';

interface TermsConditionsTabProps {
  defaultTermsHtml: string;
  documentTerms: DocumentTermsSetting[];
  onSaveDocumentTerms: (updated: DocumentTermsSetting) => void;
  onSaveDefaultTerms: (html: string) => void;
  onPreviewDocument: (
    documentType: string,
    draftHtml?: string,
    draftEnabled?: boolean,
  ) => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | DocumentCategoryKey; label: string }> = [
  { id: 'all', label: 'All Documents (23)' },
  { id: 'sales_client', label: 'Sales & Client (9)' },
  { id: 'procurement_vendor', label: 'Procurement & Vendor (7)' },
  { id: 'service_other', label: 'Service & Other (7)' },
];

export function TermsConditionsTab({
  defaultTermsHtml,
  documentTerms,
  onSaveDocumentTerms,
  onSaveDefaultTerms,
  onPreviewDocument,
}: TermsConditionsTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategoryKey>('all');
  const [selectedId, setSelectedId] = useState<string>(documentTerms[0]?.id || '');

  const selectedDoc = useMemo(
    () => documentTerms.find((d) => d.id === selectedId) || documentTerms[0],
    [documentTerms, selectedId],
  );

  const [draftHtml, setDraftHtml] = useState(selectedDoc?.termsHtml || '');
  const [draftEnabled, setDraftEnabled] = useState(selectedDoc?.isEnabled ?? true);
  const [draftUseDefault, setDraftUseDefault] = useState(selectedDoc?.useDefault ?? false);
  const [copySourceId, setCopySourceId] = useState('');
  const [viewingVersion, setViewingVersion] = useState<TermsVersion | null>(null);
  const [editingDefaultOpen, setEditingDefaultOpen] = useState(false);
  const [defaultDraft, setDefaultDraft] = useState(defaultTermsHtml);

  useEffect(() => {
    if (!selectedDoc) return;
    setDraftHtml(selectedDoc.termsHtml);
    setDraftEnabled(selectedDoc.isEnabled);
    setDraftUseDefault(selectedDoc.useDefault);
    setViewingVersion(null);
  }, [selectedDoc?.id, selectedDoc?.updatedAt]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documentTerms.filter((doc) => {
      const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesQuery =
        !q ||
        doc.documentType.toLowerCase().includes(q) ||
        doc.categoryLabel.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [categoryFilter, documentTerms, search]);

  const isDirty = Boolean(
    selectedDoc &&
      (draftHtml !== selectedDoc.termsHtml ||
        draftEnabled !== selectedDoc.isEnabled ||
        draftUseDefault !== selectedDoc.useDefault),
  );

  const handleUseDefault = () => {
    setDraftHtml(defaultTermsHtml);
    setDraftUseDefault(true);
    toast.info('Loaded Default Terms & Conditions into the editor. Click Save Changes to apply.');
  };

  const handleCopyFromDocument = () => {
    const source = documentTerms.find((d) => d.id === copySourceId);
    if (!source) {
      toast.error('Select a source document to copy from.');
      return;
    }
    setDraftHtml(source.termsHtml);
    setDraftUseDefault(false);
    toast.success(`Copied terms from ${source.documentType}. Click Save Changes to apply.`);
  };

  const handleSave = () => {
    if (!selectedDoc) return;
    const now = new Date().toISOString();
    const nextVersion = selectedDoc.currentVersion + 1;
    const updated: DocumentTermsSetting = {
      ...selectedDoc,
      termsHtml: draftHtml,
      isEnabled: draftEnabled,
      useDefault: draftUseDefault,
      currentVersion: nextVersion,
      updatedAt: now,
      updatedBy: 'Current Admin (Frontend Session)',
      versions: [
        {
          version: nextVersion,
          contentHtml: draftHtml,
          updatedAt: now,
          updatedBy: 'Current Admin (Frontend Session)',
          note: draftUseDefault ? 'Applied Default Terms' : 'Updated document terms',
        },
        ...selectedDoc.versions,
      ],
    };
    onSaveDocumentTerms(updated);
    toast.success(`Saved ${selectedDoc.documentType} Terms & Conditions (v${nextVersion}).`);
  };

  const handleCancel = () => {
    if (!selectedDoc) return;
    setDraftHtml(selectedDoc.termsHtml);
    setDraftEnabled(selectedDoc.isEnabled);
    setDraftUseDefault(selectedDoc.useDefault);
    toast.info('Reverted unsaved changes.');
  };

  const handleRestoreVersion = (version: TermsVersion) => {
    if (!selectedDoc) return;
    const now = new Date().toISOString();
    const nextVersion = selectedDoc.currentVersion + 1;
    const updated: DocumentTermsSetting = {
      ...selectedDoc,
      termsHtml: version.contentHtml,
      useDefault: false,
      currentVersion: nextVersion,
      updatedAt: now,
      updatedBy: 'Current Admin (Frontend Session)',
      versions: [
        {
          version: nextVersion,
          contentHtml: version.contentHtml,
          updatedAt: now,
          updatedBy: 'Current Admin (Frontend Session)',
          note: `Restored from v${version.version}`,
        },
        ...selectedDoc.versions,
      ],
    };
    onSaveDocumentTerms(updated);
    setViewingVersion(null);
    toast.success(`Restored v${version.version} as new v${nextVersion} for ${selectedDoc.documentType}.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document types..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setDefaultDraft(defaultTermsHtml);
              setEditingDefaultOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            <Sparkles size={13} className="text-blue-600" /> Edit Default Terms
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Document List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[720px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Document Types ({filteredDocs.length})
            </span>
            <span className="text-[11px] text-slate-400">Select to configure</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto">
            {filteredDocs.map((doc) => {
              const active = doc.id === selectedDoc?.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-start justify-between gap-2 ${
                    active ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-blue-900' : 'text-slate-800'}`}>
                      {doc.documentType}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.categoryLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        doc.isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {doc.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-[10px] text-slate-400">v{doc.currentVersion}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Editor & Version History */}
        {selectedDoc && (
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDoc.documentType}</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                      v{selectedDoc.currentVersion}
                    </span>
                    {draftUseDefault && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                        Default Terms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Category: {selectedDoc.categoryLabel} • Last Updated:{' '}
                    {new Date(selectedDoc.updatedAt).toLocaleString('en-IN')} by {selectedDoc.updatedBy}
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-700">
                    {draftEnabled ? 'Terms Enabled' : 'Terms Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={draftEnabled}
                    onChange={(e) => setDraftEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>

              {/* Copy / Default Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <button
                  type="button"
                  onClick={handleUseDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  <CheckCircle2 size={13} className="text-blue-600" /> Use Default Terms &amp; Conditions
                </button>

                <div className="flex items-center gap-2">
                  <select
                    value={copySourceId}
                    onChange={(e) => setCopySourceId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
                  >
                    <option value="">Copy from another document...</option>
                    {documentTerms
                      .filter((d) => d.id !== selectedDoc.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.documentType}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCopyFromDocument}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>

              {/* Rich Text Editor */}
              <RichTextEditor
                value={draftHtml}
                onChange={(html) => {
                  setDraftHtml(html);
                  setDraftUseDefault(false);
                }}
                placeholder={`Enter Terms & Conditions for ${selectedDoc.documentType}...`}
                disabled={!draftEnabled}
              />

              {/* Footer Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onPreviewDocument(selectedDoc.documentType, draftHtml, draftEnabled)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={14} /> Preview Document PDF
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!isDirty}
                    onClick={handleCancel}
                    className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Cancel Changes
                  </button>
                  <button
                    type="button"
                    disabled={!isDirty}
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
                  >
                    <Save size={14} /> Save &amp; Publish v{selectedDoc.currentVersion + 1}
                  </button>
                </div>
              </div>
            </div>

            {/* Version History */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Version History ({selectedDoc.versions.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  Existing generated PDFs preserve their original terms snapshot
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedDoc.versions.map((ver) => (
                  <div
                    key={ver.version}
                    className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs bg-white hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">Version {ver.version}</span>
                      {ver.version === selectedDoc.currentVersion && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          Current
                        </span>
                      )}
                      {ver.note && <span className="ml-2 text-slate-500">— {ver.note}</span>}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(ver.updatedAt).toLocaleString('en-IN')} by {ver.updatedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingVersion(ver)}
                        className="px-2.5 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-medium"
                      >
                        View
                      </button>
                      {ver.version !== selectedDoc.currentVersion && (
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(ver)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                        >
                          <RotateCcw size={11} /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Previous Version Modal */}
      {viewingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedDoc?.documentType} — Version {viewingVersion.version}
                </h4>
                <p className="text-xs text-slate-500">
                  {new Date(viewingVersion.updatedAt).toLocaleString('en-IN')} by {viewingVersion.updatedBy}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingVersion(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 max-h-80 overflow-y-auto [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: viewingVersion.contentHtml }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingVersion(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700"
              >
                Close
              </button>
              {viewingVersion.version !== selectedDoc?.currentVersion && (
                <button
                  type="button"
                  onClick={() => handleRestoreVersion(viewingVersion)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RotateCcw size={13} /> Restore This Version
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Default Terms Modal */}
      {editingDefaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Edit Global Default Terms &amp; Conditions</h4>
                <p className="text-xs text-slate-500">
                  Used when clicking &ldquo;Use Default Terms &amp; Conditions&rdquo; on any document type.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDefaultOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <RichTextEditor value={defaultDraft} onChange={setDefaultDraft} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDefaultOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveDefaultTerms(defaultDraft);
                  setEditingDefaultOpen(false);
                  toast.success('Updated global Default Terms & Conditions.');
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Default Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

