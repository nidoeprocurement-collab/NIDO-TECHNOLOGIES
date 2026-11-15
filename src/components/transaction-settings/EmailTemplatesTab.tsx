import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Code2,
  Eye,
  Mail,
  Monitor,
  Palette,
  Plus,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DYNAMIC_VARIABLES } from '@/lib/transactionSettings/mockData';
import {
  appendSimulatedEmailLog,
  readImageAsDataUrl,
  resolveDynamicVariablesWithSamples,
  stripHtmlToPlainText,
  validateImageUpload,
} from '@/lib/transactionSettings/service';
import type {
  EmailActivityLogItem,
  EmailBrandingSetting,
  EmailRecipientCategory,
  EmailTemplateSetting,
} from '@/lib/transactionSettings/types';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';

interface EmailTemplatesTabProps {
  templates: EmailTemplateSetting[];
  branding: EmailBrandingSetting;
  emailLogs: EmailActivityLogItem[];
  onSaveTemplates: (next: EmailTemplateSetting[]) => void;
  onSaveBranding: (next: EmailBrandingSetting) => void;
  onSaveLogs: (next: EmailActivityLogItem[]) => void;
}

const RECIPIENT_CATEGORIES: Array<{ id: EmailRecipientCategory; label: string }> = [
  { id: 'client', label: 'Clients' },
  { id: 'vendor', label: 'Vendors' },
  { id: 'internal', label: 'NIDO Platform Users' },
];

export function EmailTemplatesTab({
  templates,
  branding,
  emailLogs,
  onSaveTemplates,
  onSaveBranding,
  onSaveLogs,
}: EmailTemplatesTabProps) {
  const [subView, setSubView] = useState<'templates' | 'branding' | 'logs'>('templates');
  const [recipientFilter, setRecipientFilter] = useState<EmailRecipientCategory>('client');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesCat = t.recipientCategory === recipientFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? t.isActive : !t.isActive);
      const matchesQuery =
        !q ||
        t.templateName.toLowerCase().includes(q) ||
        t.templateCode.toLowerCase().includes(q) ||
        t.triggerEvent.toLowerCase().includes(q);
      return matchesCat && matchesStatus && matchesQuery;
    });
  }, [recipientFilter, search, statusFilter, templates]);

  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || '');
  const selectedTemplate = useMemo(
    () =>
      filteredTemplates.find((t) => t.id === selectedId) ||
      filteredTemplates[0] ||
      templates.find((t) => t.id === selectedId) ||
      templates[0],
    [filteredTemplates, selectedId, templates],
  );

  const [draft, setDraft] = useState<EmailTemplateSetting | null>(selectedTemplate || null);
  const [editorMode, setEditorMode] = useState<'html' | 'text'>('html');
  const [insertTarget, setInsertTarget] = useState<'body' | 'subject'>('body');
  const [varSearch, setVarSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmailAddress, setTestEmailAddress] = useState('test.recipient@nidotech.in');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplateSetting | null>(null);

  // Branding state
  const [brandingDraft, setBrandingDraft] = useState<EmailBrandingSetting>(branding);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Logs filter state
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');

  const bodyEditorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => {
    if (selectedTemplate) {
      setDraft({ ...selectedTemplate });
    }
  }, [selectedTemplate?.id, selectedTemplate?.updatedAt]);

  useEffect(() => {
    setBrandingDraft(branding);
  }, [branding]);

  const filteredVariables = useMemo(() => {
    const q = varSearch.trim().toLowerCase();
    return DYNAMIC_VARIABLES.filter(
      (v) =>
        !q ||
        v.token.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q),
    );
  }, [varSearch]);

  const handleInsertVariable = (token: string) => {
    if (!draft) return;
    if (insertTarget === 'subject') {
      setDraft((prev) => (prev ? { ...prev, subject: `${prev.subject} ${token}`.trimStart() } : prev));
      return;
    }
    if (editorMode === 'html') {
      bodyEditorRef.current?.insertText(token);
    } else {
      setDraft((prev) => (prev ? { ...prev, bodyText: `${prev.bodyText}${token}` } : prev));
    }
  };

  const handleSaveTemplate = (activateOverride?: boolean) => {
    if (!draft) return;
    if (!draft.templateName.trim() || !draft.templateCode.trim() || !draft.subject.trim()) {
      toast.error('Template Name, Template Code, and Email Subject are required.');
      return;
    }
    const nextTemplate: EmailTemplateSetting = {
      ...draft,
      isActive: activateOverride !== undefined ? activateOverride : draft.isActive,
      bodyText: draft.bodyText || stripHtmlToPlainText(draft.bodyHtml),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Current Admin (Frontend Session)',
    };
    const nextList = templates.map((t) => (t.id === nextTemplate.id ? nextTemplate : t));
    onSaveTemplates(nextList);
    setDraft(nextTemplate);
    toast.success(`Saved template "${nextTemplate.templateName}".`);
  };

  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      toast.error('Template Name and Unique Code are required.');
      return;
    }
    const now = new Date().toISOString();
    const created: EmailTemplateSetting = {
      id: `tpl-custom-${Date.now()}`,
      templateName: newName.trim(),
      templateCode: newCode.trim().toUpperCase().replace(/\s+/g, '_'),
      recipientCategory: recipientFilter,
      subject: `${newName.trim()} — {{company_name}}`,
      bodyHtml: `<p>Dear {{recipient_name}},</p><p>Custom notification for ${newName.trim()}.</p><p>Regards,<br/>{{company_name}}</p>`,
      bodyText: `Dear {{recipient_name}},\n\nCustom notification for ${newName.trim()}.\n\nRegards,\n{{company_name}}`,
      description: 'Custom administrator-defined email template.',
      triggerEvent: newTrigger.trim() || newName.trim(),
      ccEmail: '',
      bccEmail: '',
      attachPdf: false,
      isActive: true,
      isCustom: true,
      priority: templates.length + 1,
      updatedAt: now,
      updatedBy: 'Current Admin (Frontend Session)',
    };
    onSaveTemplates([created, ...templates]);
    setSelectedId(created.id);
    setNewModalOpen(false);
    setNewName('');
    setNewCode('');
    setNewTrigger('');
    toast.success(`Created custom template "${created.templateName}".`);
  };

  const handleDeleteTemplate = () => {
    if (!deleteTarget) return;
    const next = templates.filter((t) => t.id !== deleteTarget.id);
    onSaveTemplates(next);
    toast.success(`Deleted template "${deleteTarget.templateName}".`);
    setDeleteTarget(null);
  };

  const handleSendTestEmail = () => {
    if (!draft) return;
    const email = testEmailAddress.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid test recipient email address.');
      return;
    }
    const resolvedSubject = resolveDynamicVariablesWithSamples(draft.subject).resolved;
    const nextLogs = appendSimulatedEmailLog(emailLogs, {
      subject: `[TEST PREVIEW] ${resolvedSubject}`,
      recipientName: 'Test Preview Recipient',
      recipientEmail: email,
      recipientCategory: draft.recipientCategory,
      templateName: draft.templateName,
      triggerEvent: 'Manual Test Preview',
      deliveryStatus: 'Draft',
      relatedTransactionId: 'TEST-PREVIEW',
    });
    onSaveLogs(nextLogs);
    toast.success(
      'Test email preview generated successfully. Actual email sending will be enabled during backend integration.',
    );
  };

  const handleBrandingLogoUpload = async (file?: File) => {
    if (!file) return;
    const check = validateImageUpload(file, 2 * 1024 * 1024);
    if (!check.valid) {
      toast.error(check.error || 'Invalid logo file.');
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setBrandingDraft((prev) => ({ ...prev, logoDataUrl: dataUrl }));
      toast.success('Brand logo loaded for local preview.');
    } catch {
      toast.error('Could not load brand logo.');
    }
  };

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return emailLogs.filter((log) => {
      const matchesStatus = logStatusFilter === 'all' || log.deliveryStatus === logStatusFilter;
      const matchesQuery =
        !q ||
        log.subject.toLowerCase().includes(q) ||
        log.recipientEmail.toLowerCase().includes(q) ||
        log.templateName.toLowerCase().includes(q) ||
        log.relatedTransactionId.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [emailLogs, logSearch, logStatusFilter]);

  const previewSubjectResult = draft
    ? resolveDynamicVariablesWithSamples(draft.subject)
    : { resolved: '', unresolvedTokens: [] };
  const previewBodyResult = draft
    ? resolveDynamicVariablesWithSamples(draft.bodyHtml)
    : { resolved: '', unresolvedTokens: [] };
  const unresolvedAll = Array.from(
    new Set([...previewSubjectResult.unresolvedTokens, ...previewBodyResult.unresolvedTokens]),
  );

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('templates')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg ${
              subView === 'templates'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mail size={14} /> Email Templates ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('branding')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg ${
              subView === 'branding'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Palette size={14} /> Email Branding
          </button>
          <button
            type="button"
            onClick={() => setSubView('logs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg ${
              subView === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Send size={14} /> Simulated Activity Logs ({emailLogs.length})
          </button>
        </div>

        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          Frontend Preview Mode — No live emails sent
        </span>
      </div>

      {/* VIEW 1: TEMPLATES */}
      {subView === 'templates' && (
        <div className="space-y-4">
          {/* Recipient Category & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap gap-1.5">
              {RECIPIENT_CATEGORIES.map((cat) => {
                const count = templates.filter((t) => t.recipientCategory === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setRecipientFilter(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                      recipientFilter === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() => setNewModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={13} /> New Custom Template
              </button>
            </div>
          </div>

          {/* 3-Column Workspace: Template List | Editor | Dynamic Variables */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Template List */}
            <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[760px]">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                Templates ({filteredTemplates.length})
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {filteredTemplates.map((tpl) => {
                  const active = tpl.id === selectedTemplate?.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedId(tpl.id)}
                      className={`w-full px-3.5 py-2.5 text-left transition-colors ${
                        active ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${active ? 'text-blue-900' : 'text-slate-800'}`}>
                          {tpl.templateName}
                        </p>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            tpl.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tpl.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tpl.templateCode}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor */}
            {draft && (
              <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{draft.templateName}</h4>
                    <p className="text-[11px] font-mono text-slate-500">{draft.templateCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                        className="accent-blue-600"
                      />
                      Active
                    </label>
                    {draft.isCustom && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(draft)}
                        className="p-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                        title="Delete Custom Template"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Template Name *</label>
                    <input
                      value={draft.templateName}
                      onChange={(e) => setDraft({ ...draft, templateName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Trigger Event</label>
                    <input
                      value={draft.triggerEvent}
                      onChange={(e) => setDraft({ ...draft, triggerEvent: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">CC Email (Optional)</label>
                    <input
                      value={draft.ccEmail}
                      onChange={(e) => setDraft({ ...draft, ccEmail: e.target.value })}
                      placeholder="finance@nidotech.in"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">BCC Email (Optional)</label>
                    <input
                      value={draft.bccEmail}
                      onChange={(e) => setDraft({ ...draft, bccEmail: e.target.value })}
                      placeholder="audit@nidotech.in"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-600">Email Subject *</label>
                    <button
                      type="button"
                      onClick={() => setInsertTarget('subject')}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        insertTarget === 'subject'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {insertTarget === 'subject' ? 'Inserting variables into Subject' : 'Target Subject'}
                    </button>
                  </div>
                  <input
                    value={draft.subject}
                    onFocus={() => setInsertTarget('subject')}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                {/* Body HTML / Plain-text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditorMode('html')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded ${
                          editorMode === 'html' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Rich HTML Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('text')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded ${
                          editorMode === 'text' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Code2 size={12} /> Plain-Text Version
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInsertTarget('body')}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        insertTarget === 'body' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {insertTarget === 'body' ? 'Inserting variables into Body' : 'Target Body'}
                    </button>
                  </div>

                  {editorMode === 'html' ? (
                    <div onFocus={() => setInsertTarget('body')}>
                      <RichTextEditor
                        ref={bodyEditorRef}
                        value={draft.bodyHtml}
                        onChange={(html) => setDraft({ ...draft, bodyHtml: html })}
                        allowTable
                        minHeightClass="min-h-[240px]"
                      />
                    </div>
                  ) : (
                    <textarea
                      rows={11}
                      value={draft.bodyText}
                      onFocus={() => setInsertTarget('body')}
                      onChange={(e) => setDraft({ ...draft, bodyText: e.target.value })}
                      className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  )}
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.attachPdf}
                    onChange={(e) => setDraft({ ...draft, attachPdf: e.target.checked })}
                    className="accent-blue-600"
                  />
                  Attach Transaction PDF Document automatically (when applicable)
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={14} /> Preview &amp; Test Email
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveTemplate(false)}
                      className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveTemplate(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save size={14} /> Save &amp; Activate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Variables Panel */}
            <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[760px]">
              <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
                <p className="text-xs font-bold text-slate-800">Dynamic Variables</p>
                <p className="text-[11px] text-slate-500">
                  Click any token to insert into the active {insertTarget === 'subject' ? 'Subject' : 'Body'}.
                </p>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={varSearch}
                    onChange={(e) => setVarSearch(e.target.value)}
                    placeholder="Filter variables..."
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div className="p-2.5 overflow-y-auto space-y-1.5">
                {filteredVariables.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsertVariable(v.token)}
                    className="w-full text-left px-2.5 py-2 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] font-semibold text-blue-700">{v.token}</span>
                      <span className="text-[10px] text-slate-400">{v.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EMAIL BRANDING */}
      {subView === 'branding' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">NIDO Email Branding Configuration</h3>
              <p className="text-xs text-slate-500">
                Configure header, footer, colors, and support details used in email previews.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={brandingDraft.useDefaultDesign}
                onChange={(e) =>
                  setBrandingDraft({ ...brandingDraft, useDefaultDesign: e.target.checked })
                }
                className="accent-blue-600"
              />
              Use Default NIDO Email Design
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Email Header Text</label>
              <input
                value={brandingDraft.headerText}
                onChange={(e) => setBrandingDraft({ ...brandingDraft, headerText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Email Footer Text</label>
              <input
                value={brandingDraft.footerText}
                onChange={(e) => setBrandingDraft({ ...brandingDraft, footerText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Primary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingDraft.primaryColor}
                  onChange={(e) =>
                    setBrandingDraft({ ...brandingDraft, primaryColor: e.target.value })
                  }
                  className="h-9 w-12 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  value={brandingDraft.primaryColor}
                  onChange={(e) =>
                    setBrandingDraft({ ...brandingDraft, primaryColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Secondary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingDraft.secondaryColor}
                  onChange={(e) =>
                    setBrandingDraft({ ...brandingDraft, secondaryColor: e.target.value })
                  }
                  className="h-9 w-12 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  value={brandingDraft.secondaryColor}
                  onChange={(e) =>
                    setBrandingDraft({ ...brandingDraft, secondaryColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Email</label>
              <input
                value={brandingDraft.supportEmail}
                onChange={(e) => setBrandingDraft({ ...brandingDraft, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Phone</label>
              <input
                value={brandingDraft.supportPhone}
                onChange={(e) => setBrandingDraft({ ...brandingDraft, supportPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Website Link</label>
              <input
                value={brandingDraft.websiteUrl}
                onChange={(e) => setBrandingDraft({ ...brandingDraft, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Copyright Text</label>
              <input
                value={brandingDraft.copyrightText}
                onChange={(e) =>
                  setBrandingDraft({ ...brandingDraft, copyrightText: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700">Email Header Logo</p>
              <p className="text-[11px] text-slate-500">PNG/JPG/JPEG, max 2 MB (browser preview)</p>
            </div>
            <div className="flex items-center gap-2">
              {brandingDraft.logoDataUrl && (
                <>
                  <img
                    src={brandingDraft.logoDataUrl}
                    alt="Brand Logo"
                    className="h-9 object-contain border border-slate-200 rounded bg-white px-2"
                  />
                  <button
                    type="button"
                    onClick={() => setBrandingDraft({ ...brandingDraft, logoDataUrl: undefined })}
                    className="px-2 py-1 text-[11px] text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleBrandingLogoUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Upload size={13} /> Upload Logo
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onSaveBranding(brandingDraft);
                toast.success('Email branding configuration saved.');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Check size={14} /> Save Email Branding
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: SIMULATED ACTIVITY LOGS */}
      {subView === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search subject, recipient, transaction..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft / Test Preview</option>
              <option value="Queued">Queued</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Subject</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Template</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Transaction ID</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.subject}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.recipientName} <span className="text-slate-400">({log.recipientEmail})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.templateName}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{log.relatedTransactionId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(log.sentAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desktop & Mobile Email Preview + Test Email Modal */}
      {previewOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">Email Preview &amp; Test Simulation</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded ${
                    previewViewport === 'desktop' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <Monitor size={13} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded ${
                    previewViewport === 'mobile' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <Smartphone size={13} /> Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 rounded hover:bg-slate-200 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {unresolvedAll.length > 0 && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} />
                Unrecognized placeholders detected: {unresolvedAll.join(', ')}
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center">
              <div
                className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all ${
                  previewViewport === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'
                }`}
              >
                {/* Branded Header */}
                <div
                  className="px-6 py-4 text-white flex items-center justify-between"
                  style={{ backgroundColor: brandingDraft.primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {brandingDraft.logoDataUrl && (
                      <img
                        src={brandingDraft.logoDataUrl}
                        alt="Logo"
                        className="h-8 object-contain bg-white rounded px-1.5 py-0.5"
                      />
                    )}
                    <span className="text-sm font-bold">{brandingDraft.headerText}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3 text-xs">
                    <p className="text-slate-400">Subject:</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{previewSubjectResult.resolved}</p>
                  </div>

                  <div
                    className="text-sm text-slate-700 space-y-2 [&_a]:text-blue-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: previewBodyResult.resolved }}
                  />
                </div>

                {/* Branded Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">{brandingDraft.footerText}</p>
                  <p>
                    {brandingDraft.companyAddress} • {brandingDraft.supportEmail} • {brandingDraft.supportPhone}
                  </p>
                  <p>{brandingDraft.copyrightText}</p>
                </div>
              </div>
            </div>

            {/* Test Email Bar */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter test recipient email..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send size={13} /> Send Test Email
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Simulated test preview only — no external email service called.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Custom Template Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Create Custom Email Template</h4>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Template Name *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Quarterly Account Review"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unique Template Code *</label>
                <input
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CLI_QUARTERLY_REVIEW"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Trigger Event</label>
                <input
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="e.g. Manual Send / Scheduled"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Delete Custom Template?</h4>
            <p className="text-xs text-slate-600">
              Remove <strong>{deleteTarget.templateName}</strong>?
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
                onClick={handleDeleteTemplate}
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

