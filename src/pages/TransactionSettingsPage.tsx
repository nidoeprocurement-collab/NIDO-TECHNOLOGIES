import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Eye,
  FileText,
  Mail,
  PenTool,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BankDetailsTab } from '@/components/transaction-settings/BankDetailsTab';
import { DigitalSignaturesTab } from '@/components/transaction-settings/DigitalSignaturesTab';
import { EmailTemplatesTab } from '@/components/transaction-settings/EmailTemplatesTab';
import { TermsConditionsTab } from '@/components/transaction-settings/TermsConditionsTab';
import { TransactionPdfPreviewModal } from '@/components/transaction-settings/TransactionPdfPreviewModal';
import { createInitialTransactionSettingsState } from '@/lib/transactionSettings/mockData';
import {
  loadTransactionSettings,
  saveTransactionSettings,
} from '@/lib/transactionSettings/service';
import type { TransactionSettingsStoreState } from '@/lib/transactionSettings/types';

type TabKey = 'terms' | 'bank' | 'signatures' | 'email';

const TABS: Array<{ id: TabKey; label: string; icon: typeof FileText }> = [
  { id: 'terms', label: '1. Terms & Conditions', icon: FileText },
  { id: 'bank', label: '2. NIDO Bank Details', icon: Building2 },
  { id: 'signatures', label: '3. Digital Signatures', icon: PenTool },
  { id: 'email', label: '4. Email Templates', icon: Mail },
];

export default function TransactionSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('terms');
  const [store, setStore] = useState<TransactionSettingsStoreState>(() =>
    loadTransactionSettings(),
  );

  const [pdfPreviewState, setPdfPreviewState] = useState<{
    open: boolean;
    documentType: string;
    overrideTermsHtml?: string;
    overrideTermsEnabled?: boolean;
    overrideBankAccountId?: string;
  }>({
    open: false,
    documentType: 'Tax Invoice',
  });

  const updateStore = (
    updater: (prev: TransactionSettingsStoreState) => TransactionSettingsStoreState,
  ) => {
    setStore((prev) => {
      const next = updater(prev);
      saveTransactionSettings(next);
      return next;
    });
  };

  const handleResetDemo = () => {
    const fresh = createInitialTransactionSettingsState();
    saveTransactionSettings(fresh);
    setStore(fresh);
    toast.info('Reset Transaction Settings to initial frontend sample data.');
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="w-full px-3 sm:px-6 py-5 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
          <div className="space-y-1">
            <Link
              to="/configuration"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={14} /> Back to Configuration Hub
            </Link>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Transaction Settings</h1>
                <p className="text-xs text-slate-500">
                  Manage transaction documents, terms &amp; conditions, NIDO banking details, digital signatures, and email templates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPdfPreviewState({
                  open: true,
                  documentType: 'Tax Invoice',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50"
            >
              <Eye size={14} /> Preview Transaction PDF
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Reset temporary frontend data"
            >
              <RotateCcw size={13} /> Reset Sample Data
            </button>
          </div>
        </div>

        {/* 4 Main Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        {activeTab === 'terms' && (
          <TermsConditionsTab
            defaultTermsHtml={store.defaultTermsHtml}
            documentTerms={store.documentTerms}
            onSaveDocumentTerms={(updated) =>
              updateStore((prev) => ({
                ...prev,
                documentTerms: prev.documentTerms.map((d) =>
                  d.id === updated.id ? updated : d,
                ),
              }))
            }
            onSaveDefaultTerms={(html) =>
              updateStore((prev) => ({
                ...prev,
                defaultTermsHtml: html,
              }))
            }
            onPreviewDocument={(documentType, draftHtml, draftEnabled) =>
              setPdfPreviewState({
                open: true,
                documentType,
                overrideTermsHtml: draftHtml,
                overrideTermsEnabled: draftEnabled,
              })
            }
          />
        )}

        {activeTab === 'bank' && (
          <BankDetailsTab
            bankAccounts={store.bankAccounts}
            onSaveAccounts={(next) =>
              updateStore((prev) => ({
                ...prev,
                bankAccounts: next,
              }))
            }
            onPreviewPdfWithBank={(bankId) =>
              setPdfPreviewState({
                open: true,
                documentType: 'Tax Invoice',
                overrideBankAccountId: bankId,
              })
            }
          />
        )}

        {activeTab === 'signatures' && (
          <DigitalSignaturesTab
            signatures={store.signatures}
            assignments={store.signatureAssignments}
            onSaveSignatures={(next) =>
              updateStore((prev) => ({
                ...prev,
                signatures: next,
              }))
            }
            onSaveAssignments={(next) =>
              updateStore((prev) => ({
                ...prev,
                signatureAssignments: next,
              }))
            }
            onPreviewDocument={(documentType) =>
              setPdfPreviewState({
                open: true,
                documentType,
              })
            }
          />
        )}

        {activeTab === 'email' && (
          <EmailTemplatesTab
            templates={store.emailTemplates}
            branding={store.emailBranding}
            emailLogs={store.emailLogs}
            onSaveTemplates={(next) =>
              updateStore((prev) => ({
                ...prev,
                emailTemplates: next,
              }))
            }
            onSaveBranding={(next) =>
              updateStore((prev) => ({
                ...prev,
                emailBranding: next,
              }))
            }
            onSaveLogs={(next) =>
              updateStore((prev) => ({
                ...prev,
                emailLogs: next,
              }))
            }
          />
        )}
      </div>

      {/* Frontend-only Sample PDF Preview Modal */}
      {pdfPreviewState.open && (
        <TransactionPdfPreviewModal
          open={pdfPreviewState.open}
          onClose={() => setPdfPreviewState((p) => ({ ...p, open: false }))}
          initialDocumentType={pdfPreviewState.documentType}
          documentTerms={store.documentTerms}
          bankAccounts={store.bankAccounts}
          signatures={store.signatures}
          signatureAssignments={store.signatureAssignments}
          overrideTermsHtml={pdfPreviewState.overrideTermsHtml}
          overrideTermsEnabled={pdfPreviewState.overrideTermsEnabled}
          overrideBankAccountId={pdfPreviewState.overrideBankAccountId}
        />
      )}
    </div>
  );
}

