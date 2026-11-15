import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { Download, FileText, X } from 'lucide-react';
import {
  getAssignedSignatureForDocument,
  getDefaultBankAccount,
  stripHtmlToPlainText,
} from '@/lib/transactionSettings/service';
import type {
  BankAccountSetting,
  DigitalSignatureSetting,
  DocumentSignatureAssignment,
  DocumentTermsSetting,
} from '@/lib/transactionSettings/types';

interface TransactionPdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  initialDocumentType?: string;
  documentTerms: DocumentTermsSetting[];
  bankAccounts: BankAccountSetting[];
  signatures: DigitalSignatureSetting[];
  signatureAssignments: DocumentSignatureAssignment[];
  overrideTermsHtml?: string;
  overrideTermsEnabled?: boolean;
  overrideBankAccountId?: string;
}

const DOCUMENTS_WITH_BANK_DETAILS = new Set([
  'Proforma Invoice',
  'Tax Invoice',
  'Commercial Invoice',
  'Sales Quotation',
  'Service Invoice',
  'Service Quotation',
  'Subscription Invoice',
  'Payment Receipt',
]);

const SAMPLE_ITEMS = [
  { name: 'Enterprise Workstation Pro 16"', hsn: '8471', qty: 5, rate: 25000, taxPct: 18 },
  { name: 'Annual Cloud Security & MDM Suite', hsn: '998314', qty: 10, rate: 4500, taxPct: 18 },
];

export function TransactionPdfPreviewModal({
  open,
  onClose,
  initialDocumentType = 'Tax Invoice',
  documentTerms,
  bankAccounts,
  signatures,
  signatureAssignments,
  overrideTermsHtml,
  overrideTermsEnabled,
  overrideBankAccountId,
}: TransactionPdfPreviewModalProps) {
  const [selectedDocType, setSelectedDocType] = useState(initialDocumentType);
  const [selectedBankId, setSelectedBankId] = useState<string>(overrideBankAccountId || '');

  const activeBanks = useMemo(
    () => bankAccounts.filter((b) => b.isActive),
    [bankAccounts],
  );

  const chosenBank = useMemo(() => {
    if (!DOCUMENTS_WITH_BANK_DETAILS.has(selectedDocType)) return undefined;
    if (selectedBankId) return activeBanks.find((b) => b.id === selectedBankId);
    return getDefaultBankAccount(activeBanks);
  }, [activeBanks, selectedBankId, selectedDocType]);

  const termsEntry = useMemo(
    () => documentTerms.find((t) => t.documentType === selectedDocType),
    [documentTerms, selectedDocType],
  );

  const effectiveTermsHtml =
    selectedDocType === initialDocumentType && overrideTermsHtml !== undefined
      ? overrideTermsHtml
      : termsEntry?.termsHtml || '';

  const effectiveTermsEnabled =
    selectedDocType === initialDocumentType && overrideTermsEnabled !== undefined
      ? overrideTermsEnabled
      : (termsEntry?.isEnabled ?? true);

  const { signature, assignment } = useMemo(
    () => getAssignedSignatureForDocument(selectedDocType, signatures, signatureAssignments),
    [selectedDocType, signatures, signatureAssignments],
  );

  const position = assignment?.position || 'bottom-right';
  const showSignature = (assignment?.isEnabled ?? true) && Boolean(signature);

  if (!open) return null;

  const subtotal = SAMPLE_ITEMS.reduce((s, item) => s + item.qty * item.rate, 0);
  const gst = SAMPLE_ITEMS.reduce((s, item) => s + item.qty * item.rate * (item.taxPct / 100), 0);
  const grandTotal = subtotal + gst;

  const handleDownloadSamplePdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 42;
    let y = 48;

    doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(28, 39, 56);
    doc.text('Nido Technologies Pvt. Ltd.', margin, y);
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(31, 95, 190);
    doc.text(selectedDocType.toUpperCase(), pageW - margin, y, { align: 'right' });

    y += 20;
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 110, 125);
    doc.text('Sample Frontend Preview — Koramangala, Bengaluru | GSTIN: 29AABCN1234D1Z5', margin, y);
    doc.text('Doc #: SAMPLE-2026-001 | Date: 15/11/2026', pageW - margin, y, { align: 'right' });

    y += 26;
    doc.setDrawColor(218, 222, 228).line(margin, y, pageW - margin, y);
    y += 22;

    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(28, 39, 56);
    doc.text('Sample Line Items', margin, y);
    y += 16;

    doc.setFont('helvetica', 'normal').setFontSize(9);
    SAMPLE_ITEMS.forEach((item, i) => {
      const lineTotal = item.qty * item.rate * (1 + item.taxPct / 100);
      doc.text(`${i + 1}. ${item.name} (HSN ${item.hsn}) x ${item.qty}`, margin, y);
      doc.text(`INR ${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageW - margin, y, { align: 'right' });
      y += 16;
    });

    y += 10;
    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.text(`Grand Total: INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageW - margin, y, { align: 'right' });
    y += 28;

    if (effectiveTermsEnabled && effectiveTermsHtml) {
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(31, 95, 190);
      doc.text('TERMS & CONDITIONS', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(55, 62, 72);
      const plainTerms = stripHtmlToPlainText(effectiveTermsHtml);
      const lines = doc.splitTextToSize(plainTerms, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 11 + 16;
    }

    if (chosenBank) {
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(31, 95, 190);
      doc.text('NIDO BANK DETAILS', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(55, 62, 72);
      doc.text(`${chosenBank.accountHolderName} | ${chosenBank.bankName} (${chosenBank.branchName})`, margin, y);
      y += 12;
      doc.text(`A/C: ${chosenBank.accountNumber} | IFSC: ${chosenBank.ifscCode} | UPI: ${chosenBank.upiId || '—'}`, margin, y);
      y += 24;
    }

    if (showSignature && signature) {
      const sigX =
        position === 'bottom-left'
          ? margin
          : position === 'bottom-center'
            ? pageW / 2
            : pageW - margin;
      const align =
        position === 'bottom-left'
          ? 'left'
          : position === 'bottom-center'
            ? 'center'
            : 'right';

      doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(28, 39, 56);
      doc.text('Authorized Signatory:', sigX, y, { align });
      y += 12;
      doc.text(signature.authorizedPerson, sigX, y, { align });
      y += 12;
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 110, 125);
      doc.text(signature.designation, sigX, y, { align });
    }

    doc.save(`${selectedDocType.replace(/\s+/g, '-')}-Sample-Preview.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Transaction PDF Preview (Frontend Sample Data)
              </h3>
              <p className="text-xs text-slate-500">
                Previewing Terms &amp; Conditions, NIDO Bank Details, and Assigned Digital Signature
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              {documentTerms.map((doc) => (
                <option key={doc.id} value={doc.documentType}>
                  {doc.documentType}
                </option>
              ))}
            </select>
            {DOCUMENTS_WITH_BANK_DETAILS.has(selectedDocType) && activeBanks.length > 0 && (
              <select
                value={chosenBank?.id || ''}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                {activeBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} {bank.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleDownloadSamplePdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={13} /> Download Sample PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Simulated A4 Paper */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="mx-auto max-w-[740px] bg-white border border-slate-200 rounded-lg shadow-sm p-8 space-y-6">
            {/* Document Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nido Technologies Pvt. Ltd.</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Koramangala 4th Block, Bengaluru - 560034 | GSTIN: 29AABCN1234D1Z5
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                  {selectedDocType}
                </span>
                <p className="text-xs text-slate-500 mt-1.5">Doc #: SAMPLE-2026-001</p>
                <p className="text-xs text-slate-500">Date: 15 Nov 2026</p>
              </div>
            </div>

            {/* Sample Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-semibold text-blue-700 uppercase mb-1">Bill To / Counterparty (Sample)</p>
                <p className="font-semibold text-slate-900">Apex Enterprise Solutions Pvt. Ltd.</p>
                <p className="text-slate-600 mt-0.5">MG Road, Bengaluru - 560001</p>
                <p className="text-slate-600">GSTIN: 29AADCA4589K1Z2</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-semibold text-blue-700 uppercase mb-1">Transaction Summary</p>
                <p className="text-slate-600">PO Reference: PO-2026-0118</p>
                <p className="text-slate-600">Payment Terms: Net 30 Days</p>
                <p className="text-slate-600">Currency: INR (₹)</p>
              </div>
            </div>

            {/* Sample Line Items */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Item / Service</th>
                    <th className="px-3 py-2 text-center">HSN/SAC</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Total (incl. GST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SAMPLE_ITEMS.map((item, idx) => (
                    <tr key={item.name}>
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{item.hsn}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{item.qty}</td>
                      <td className="px-3 py-2 text-right text-slate-700">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        ₹{(item.qty * item.rate * (1 + item.taxPct / 100)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 bg-slate-50/70">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Bank Details + Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              {effectiveTermsEnabled ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-1.5">
                    Terms &amp; Conditions {termsEntry ? `(v${termsEntry.currentVersion})` : ''}
                  </p>
                  <div
                    className="text-xs text-slate-600 space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: effectiveTermsHtml || '<p>No terms configured.</p>' }}
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Terms &amp; Conditions disabled for {selectedDocType}.
                </div>
              )}

              {DOCUMENTS_WITH_BANK_DETAILS.has(selectedDocType) ? (
                chosenBank ? (
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-1">
                      NIDO Bank Details
                    </p>
                    <p className="font-semibold text-slate-900">{chosenBank.accountHolderName}</p>
                    <p className="text-slate-700">
                      {chosenBank.bankName} — {chosenBank.branchName}
                    </p>
                    <p className="text-slate-700">
                      A/C: <span className="font-mono font-semibold">{chosenBank.accountNumber}</span> ({chosenBank.accountType})
                    </p>
                    <p className="text-slate-700">
                      IFSC: <span className="font-mono font-semibold">{chosenBank.ifscCode}</span>
                      {chosenBank.swiftCode ? ` | SWIFT: ${chosenBank.swiftCode}` : ''}
                    </p>
                    {chosenBank.upiId && <p className="text-slate-700">UPI: {chosenBank.upiId}</p>}
                    {chosenBank.qrCodeDataUrl && (
                      <img
                        src={chosenBank.qrCodeDataUrl}
                        alt="Payment QR"
                        className="mt-2 h-16 w-16 object-contain border border-slate-200 rounded bg-white p-1"
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No active NIDO bank account configured.</div>
                )
              ) : (
                <div className="text-xs text-slate-400 italic">
                  NIDO Bank Details are hidden on {selectedDocType} documents.
                </div>
              )}
            </div>

            {/* Signature Block */}
            <div
              className={`pt-4 border-t border-slate-200 flex ${
                position === 'bottom-left'
                  ? 'justify-start text-left'
                  : position === 'bottom-center'
                    ? 'justify-center text-center'
                    : 'justify-end text-right'
              }`}
            >
              {showSignature && signature ? (
                <div className="inline-flex flex-col gap-1 max-w-[220px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Authorized Signatory:
                  </p>
                  <p className="text-xs font-bold text-slate-900">{signature.authorizedPerson}</p>
                  {signature.signatureImageDataUrl ? (
                    <img
                      src={signature.signatureImageDataUrl}
                      alt={signature.signatureName}
                      className="h-12 object-contain my-1"
                    />
                  ) : (
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end pb-1 text-[11px] italic text-slate-400">
                      [Signature Image Placeholder]
                    </div>
                  )}
                  <p className="text-xs text-slate-600">{signature.designation}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Digital signature disabled for {selectedDocType}.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

