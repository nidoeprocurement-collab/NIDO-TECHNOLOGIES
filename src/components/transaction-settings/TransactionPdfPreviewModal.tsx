import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, X } from 'lucide-react';
import { loadConfig } from '@/lib/configService';
import { ensurePdfSpace } from '@/lib/pdfLayout';
import { numberToWords } from '@/lib/quotePdfGenerator';
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
  'Quotes',
  'Invoices',
  'Recurring Invoices',
  'Payment Receipts',
  'Service Invoice',
  'Service Quotation',
  'Subscription Invoice',
  'Payment Receipt',
]);

// ── Colour palette (identical to invoicePdf.ts) ───────────────────────────────
const BLUE: [number, number, number] = [31, 95, 190];
const DARK: [number, number, number] = [28, 39, 56];
const TEXT: [number, number, number] = [55, 62, 72];
const MUTED: [number, number, number] = [105, 112, 123];
const BORDER: [number, number, number] = [218, 222, 228];
const LIGHT_BLUE: [number, number, number] = [239, 246, 255];

const SAMPLE_ITEMS = [
  {
    name: 'Enterprise Workstation Pro 16"',
    itemDetails: '16GB RAM / 512GB NVMe SSD',
    hsn: '8471',
    qty: 5,
    rate: 25000,
    taxPct: 18,
    taxType: 'CGST + SGST',
  },
  {
    name: 'Annual Cloud Security & MDM Suite',
    itemDetails: '12-month enterprise seat licence',
    hsn: '998314',
    qty: 10,
    rate: 4500,
    taxPct: 18,
    taxType: 'CGST + SGST',
  },
];

function fmt2(value: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function splitLines(value: string | undefined): string[] {
  return (value || '')
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getBrandHeader(displayName: string, industry: string): { name: string; subtitle: string } {
  const value = displayName.trim();
  const match = value.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  return {
    name: (match?.[1] || value || 'Nido Tech').trim(),
    subtitle: (match?.[2] || industry || 'Corporate Essentials & Integrated Services').trim(),
  };
}

function drawText(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  options: {
    size?: number;
    color?: [number, number, number];
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
  } = {},
) {
  doc
    .setFont('helvetica', options.bold ? 'bold' : 'normal')
    .setFontSize(options.size ?? 8)
    .setTextColor(...(options.color ?? TEXT));
  doc.text(value, x, y, { align: options.align ?? 'left' });
}

function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  name: string,
  address: string,
  extraLines: string[] = [],
): number {
  const addressLines = splitLines(address);
  const totalLines = addressLines.length + extraLines.length;
  const cardHeight = Math.max(92, 54 + totalLines * 12);

  doc.setDrawColor(...BORDER).setLineWidth(0.7);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, cardHeight, 5, 5, 'FD');

  drawText(doc, title.toUpperCase(), x + 13, y + 19, { size: 8, color: BLUE, bold: true });
  doc.setDrawColor(...BORDER).setLineWidth(0.5);
  doc.line(x + 13, y + 27, x + width - 13, y + 27);

  let cursor = y + 48;
  drawText(doc, name, x + 13, cursor, { size: 9, color: DARK, bold: true });
  cursor += 13;
  addressLines.forEach((line) => {
    drawText(doc, line, x + 13, cursor, { size: 8.5 });
    cursor += 12;
  });
  extraLines.forEach((line) => {
    drawText(doc, line, x + 13, cursor, { size: 8.5 });
    cursor += 12;
  });
  return cardHeight;
}

async function loadImage(url: string): Promise<{ data: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return {
      data,
      format: blob.type.includes('jpeg') || blob.type.includes('jpg') ? 'JPEG' : 'PNG',
    };
  } catch {
    return null;
  }
}

export function TransactionPdfPreviewModal({
  open,
  onClose,
  initialDocumentType = 'Invoices',
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

  const org = useMemo(() => loadConfig().organization, []);
  const brandHeader = useMemo(
    () => getBrandHeader(org.displayName || org.companyName || 'Nido Tech', org.industry || ''),
    [org.companyName, org.displayName, org.industry],
  );

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

  const grossSubtotal = SAMPLE_ITEMS.reduce((s, item) => s + item.qty * item.rate, 0);
  const taxableSubtotal = grossSubtotal;
  const totalTax = SAMPLE_ITEMS.reduce((s, item) => s + item.qty * item.rate * (item.taxPct / 100), 0);
  const shippingCharges = 0;
  const roundOff = 0;
  const grandTotal = taxableSubtotal + totalTax + shippingCharges + roundOff;

  const docTitle = selectedDocType === 'Invoices' ? 'INVOICE' : selectedDocType.toUpperCase();
  const visibleDocNumber =
    selectedDocType === 'Invoices' ? '#INV - 2026000001' : '#SAMPLE - 2026000001';
  const companyLines = [
    org.companyName || org.displayName || 'Nido Technologies Pvt. Ltd.',
    ...splitLines(org.registeredAddress || org.billingAddress || 'Koramangala 4th Block, Bengaluru - 560034'),
    [
      org.phone ? `Phone: ${org.phone}` : 'Phone: +91 80 4123 7890',
      org.email ? `Email: ${org.email}` : 'Email: billing@nidotech.in',
    ].join(' | '),
    `GSTIN: ${org.gstNumber || '29AABCN1234D1Z5'}`,
  ].filter(Boolean);

  const plainTermsLines =
    effectiveTermsEnabled && effectiveTermsHtml
      ? stripHtmlToPlainText(effectiveTermsHtml)
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  const handleDownloadSamplePdf = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;

    // ── Logo + brand name (left) ──────────────────────────────────────────────
    let logoLoaded = false;
    if (org.logoUrl) {
      const logo = org.logoUrl.startsWith('http')
        ? await loadImage(org.logoUrl)
        : { data: org.logoUrl, format: org.logoUrl.includes('jpeg') ? ('JPEG' as const) : ('PNG' as const) };
      if (logo) {
        try {
          doc.addImage(logo.data, logo.format, margin + 8, 26, 45, 45);
          logoLoaded = true;
        } catch {
          logoLoaded = false;
        }
      }
    }
    if (!logoLoaded) {
      doc.setFillColor(...BLUE);
      doc.roundedRect(margin + 8, 27, 38, 38, 9, 9, 'F');
      drawText(doc, 'N', margin + 27, 53, { size: 22, color: [255, 255, 255], bold: true, align: 'center' });
    }

    drawText(doc, brandHeader.name || org.companyName || 'Nido Tech', margin + 60, 50, {
      size: 18,
      color: DARK,
      bold: true,
    });
    drawText(doc, brandHeader.subtitle, margin + 60, 64, { size: 7, color: MUTED });

    // ── Document label + number box (right) ───────────────────────────────────
    const titleSize = docTitle.length > 14 ? 15 : 22;
    drawText(doc, docTitle, pageWidth - margin, 48, {
      size: titleSize,
      color: DARK,
      bold: true,
      align: 'right',
    });

    doc.setFont('helvetica', 'bold').setFontSize(10);
    const numberWidth = doc.getTextWidth(visibleDocNumber);
    const numberBoxWidth = Math.max(102, numberWidth + 20);
    const numberBoxRight = pageWidth - margin;
    doc.setDrawColor(...BORDER).setLineWidth(0.6);
    doc.roundedRect(numberBoxRight - numberBoxWidth, 61, numberBoxWidth, 28, 4, 4, 'S');
    drawText(doc, visibleDocNumber, numberBoxRight - 10, 79, {
      size: 10,
      color: DARK,
      bold: true,
      align: 'right',
    });

    // ── Company address block (left, below logo) ──────────────────────────────
    let companyY = 102;
    companyLines.forEach((line, index) => {
      drawText(doc, line, margin + 8, companyY, {
        size: index === 0 ? 8.5 : 7.5,
        color: index === 0 ? DARK : TEXT,
        bold: index === 0,
      });
      companyY += 11;
    });

    // ── Dates + Order Reference + Place of Supply (right) ─────────────────────
    let dateY = 112;
    drawText(doc, 'Invoice Date: 15/11/2026', pageWidth - margin, dateY, { size: 8, color: TEXT, align: 'right' });
    dateY += 14;
    drawText(doc, 'Due Date: 15/12/2026', pageWidth - margin, dateY, { size: 8, color: TEXT, align: 'right' });
    dateY += 14;
    drawText(doc, 'Order Reference: PO-2026-0118', pageWidth - margin, dateY, { size: 8, color: TEXT, align: 'right' });
    dateY += 14;
    drawText(doc, 'Place of Supply: Karnataka (29)', pageWidth - margin, dateY, { size: 8, color: TEXT, align: 'right' });

    // ── Billed To / Shipped To cards ──────────────────────────────────────────
    let y = Math.max(companyY + 12, 164);
    const cardGap = 12;
    const cardWidth = (contentWidth - cardGap) / 2;

    const cardHeight = Math.max(
      drawCard(
        doc,
        margin,
        y,
        cardWidth,
        'Billed To',
        'Apex Enterprise Solutions Pvt. Ltd.',
        'MG Road, Bengaluru - 560001, Karnataka',
        ['GSTIN: 29AADCA4589K1Z2', 'Contact: +91 98450 11223'],
      ),
      drawCard(
        doc,
        margin + cardWidth + cardGap,
        y,
        cardWidth,
        'Shipped To',
        'Apex Enterprise Solutions Pvt. Ltd.',
        'MG Road, Bengaluru - 560001, Karnataka',
        ['State Code: 29', 'Attn: Procurement Desk'],
      ),
    );
    y += cardHeight + 16;

    // ── Line items table (exact invoicePdf.ts columns & styling) ──────────────
    const body = SAMPLE_ITEMS.map((item, index) => {
      const taxable = item.qty * item.rate;
      const gstAmt = taxable * (item.taxPct / 100);
      return [
        String(index + 1),
        `${item.name}\n${item.itemDetails}`,
        item.hsn,
        String(item.qty),
        fmt2(item.rate),
        fmt2(taxable),
        `${item.taxPct}%\n${item.taxType}`,
        fmt2(gstAmt),
        fmt2(taxable + gstAmt),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'ITEM / DESCRIPTION', 'HSN/SAC', 'QTY', 'UNIT PRICE', 'TAXABLE', 'GST RATE', 'GST', 'AMOUNT']],
      body,
      theme: 'grid',
      tableWidth: contentWidth,
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        textColor: TEXT,
        lineColor: BORDER,
        lineWidth: 0.35,
        cellPadding: { top: 7, bottom: 7, left: 4, right: 4 },
        valign: 'middle',
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: DARK,
        fontStyle: 'bold',
        fontSize: 6.3,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 132 },
        2: { cellWidth: 42, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 75, halign: 'right' },
        5: { cellWidth: 58, halign: 'right' },
        6: { cellWidth: 40, halign: 'center' },
        7: { cellWidth: 52, halign: 'right' },
        8: { cellWidth: 68, halign: 'right' },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = DARK;
        }
        if (data.section === 'body' && data.column.index === 8) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const lastTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y;

    // ── Summary box (right) + Left text blocks ────────────────────────────────
    y = ensurePdfSpace(doc, lastTableY + 15, 220, margin);
    const summaryWidth = 255;
    const summaryX = pageWidth - margin - summaryWidth;

    const summaryBody = [
      ['Gross Subtotal', fmt2(grossSubtotal), false],
      ['Total Taxable Value', fmt2(taxableSubtotal), true],
      ['Total GST (18%)', fmt2(totalTax), true],
      ['Shipping & Handling Charges', fmt2(shippingCharges), false],
      ['Round Off Adjustment', fmt2(roundOff), false],
      ['Total Payable', fmt2(grandTotal), true],
    ] as const;

    autoTable(doc, {
      startY: y,
      margin: {
        left: summaryX,
        right: pageWidth - summaryX - summaryWidth,
      },
      tableWidth: summaryWidth,
      body: summaryBody.map(([label, value]) => [label, value]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        textColor: TEXT,
        lineColor: BORDER,
        lineWidth: 0.35,
        cellPadding: { top: 5, bottom: 5, left: 10, right: 10 },
        minCellHeight: 20,
        valign: 'middle',
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 155, halign: 'left' },
        1: { cellWidth: 100, halign: 'right' },
      },
      didParseCell(data) {
        if (data.section !== 'body') return;
        const isTotal = data.row.index === summaryBody.length - 1;
        const isEmphasized = isTotal || data.row.index === 1 || data.row.index === 2;
        if (isEmphasized) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = DARK;
        }
        if (isTotal) {
          data.cell.styles.fillColor = LIGHT_BLUE;
        }
      },
    });

    const summaryHeight =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) - y;

    // Left side: Terms & Conditions then Bank Remittance
    let leftY = y + 2;
    const leftWidth = summaryX - margin - 14;

    if (plainTermsLines.length > 0) {
      drawText(doc, 'TERMS & CONDITIONS', margin, leftY + 9, { size: 8, color: BLUE, bold: true });
      leftY += 23;
      plainTermsLines.forEach((term, index) => {
        const prefix = /^\d+[\).\s]/.test(term) ? term : `${index + 1}. ${term}`;
        const wrapped = doc.splitTextToSize(prefix, leftWidth);
        drawText(doc, wrapped.join('\n'), margin, leftY, { size: 7.5, color: TEXT });
        leftY += wrapped.length * 11 + 4;
      });
      leftY += 6;
    }

    if (chosenBank) {
      if (plainTermsLines.length > 0) {
        doc.setDrawColor(...BORDER).setLineWidth(0.4);
        doc.line(margin, leftY, summaryX - 14, leftY);
        leftY += 14;
      }
      drawText(doc, 'BANK REMITTANCE DETAILS', margin, leftY, { size: 8, color: BLUE, bold: true });
      leftY += 14;
      drawText(doc, `Bank Name: ${chosenBank.bankName}`, margin, leftY, { size: 7.5, color: TEXT });
      leftY += 12;
      drawText(doc, `Account Name: ${chosenBank.accountHolderName}`, margin, leftY, { size: 7.5, color: TEXT });
      leftY += 12;
      drawText(
        doc,
        `Account No: ${chosenBank.accountNumber} | IFSC Code: ${chosenBank.ifscCode}`,
        margin,
        leftY,
        { size: 7.5, color: TEXT },
      );
      leftY += 12;
      if (chosenBank.branchName) {
        drawText(doc, `Branch: ${chosenBank.branchName}`, margin, leftY, { size: 7.5, color: TEXT });
        leftY += 12;
      }
      if (chosenBank.upiId) {
        drawText(doc, `UPI ID: ${chosenBank.upiId}`, margin, leftY, { size: 7.5, color: TEXT });
        leftY += 12;
      }
    }

    // ── Total in Words + Authorized Signature ────────────────────────────────
    y = ensurePdfSpace(doc, Math.max(leftY + 8, y + summaryHeight) + 20, 95, margin);
    drawText(doc, 'TOTAL IN WORDS', margin, y, { size: 8, color: BLUE, bold: true });
    drawText(doc, numberToWords(grandTotal), margin, y + 15, { size: 8.5, color: DARK, bold: true });

    if (showSignature && signature) {
      const sigBlockWidth = 145;
      const sigLeft =
        position === 'bottom-left'
          ? margin
          : position === 'bottom-center'
            ? (pageWidth - sigBlockWidth) / 2
            : pageWidth - margin - sigBlockWidth;
      const sigCenter = sigLeft + sigBlockWidth / 2;

      if (signature.signatureImageDataUrl) {
        try {
          const fmt = signature.signatureImageDataUrl.includes('jpeg') ? 'JPEG' : 'PNG';
          doc.addImage(signature.signatureImageDataUrl, fmt, sigCenter - 40, y - 24, 80, 28);
        } catch {
          // Ignore invalid image data in prototype mode
        }
      }
      doc.setDrawColor(...MUTED).setLineWidth(0.6);
      doc.line(sigLeft, y + 10, sigLeft + sigBlockWidth, y + 10);
      drawText(doc, signature.authorizedPerson, sigCenter, y + 22, {
        size: 8,
        color: DARK,
        bold: true,
        align: 'center',
      });
      drawText(doc, `${signature.designation} · Authorized Signatory`, sigCenter, y + 33, {
        size: 7,
        color: MUTED,
        align: 'center',
      });
    } else {
      const signatureX = pageWidth - margin - 135;
      doc.setDrawColor(...MUTED).setLineWidth(0.6);
      doc.line(signatureX, y + 10, pageWidth - margin, y + 10);
      drawText(doc, 'Authorized Signatory', (signatureX + pageWidth - margin) / 2, y + 25, {
        size: 7.5,
        color: MUTED,
        align: 'center',
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = Math.min(pageHeight - 22, y + 72);
    doc.setDrawColor(...BORDER).setLineWidth(0.5);
    doc.line(margin, footerY - 18, pageWidth - margin, footerY - 18);
    drawText(
      doc,
      `Thank you for choosing ${org.displayName || org.companyName || 'Nido Tech'} as your corporate essentials partner!`,
      pageWidth / 2,
      footerY,
      { size: 8, color: BLUE, bold: true, align: 'center' },
    );

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
                Transaction PDF Preview (Invoice Format · Sample Data)
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

        {/* Simulated A4 Paper matching exact Invoice PDF format */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="mx-auto max-w-[780px] bg-white border border-slate-200 rounded-lg shadow-sm p-8 sm:p-10 space-y-5 text-[#373e48]">
            {/* Top Brand Header + Document Title & Number Box */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={brandHeader.name}
                      className="h-11 w-11 rounded-lg object-contain border border-slate-200 bg-white p-0.5"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-[9px] bg-[#1f5fbe] text-white flex items-center justify-center font-bold text-xl shrink-0">
                      N
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-[#1c2738] leading-tight">
                      {brandHeader.name}
                    </h2>
                    <p className="text-[10px] text-[#69707b] mt-0.5">{brandHeader.subtitle}</p>
                  </div>
                </div>
                <div className="text-[11px] leading-relaxed text-[#373e48] space-y-0.5">
                  {companyLines.map((line, i) => (
                    <p key={i} className={i === 0 ? 'font-bold text-[#1c2738] text-xs' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="text-right space-y-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1c2738] tracking-tight uppercase">
                  {docTitle}
                </h1>
                <div className="inline-block border border-[#dadee4] rounded px-3 py-1.5 text-xs font-bold text-[#1c2738]">
                  {visibleDocNumber}
                </div>
                <div className="text-[11px] text-[#373e48] space-y-1 pt-1">
                  <p>Invoice Date: 15/11/2026</p>
                  <p>Due Date: 15/12/2026</p>
                  <p>Order Reference: PO-2026-0118</p>
                  <p>Place of Supply: Karnataka (29)</p>
                </div>
              </div>
            </div>

            {/* Billed To / Shipped To Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-[5px] border border-[#dadee4] bg-white p-3.5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1f5fbe] pb-1.5 border-b border-[#dadee4]">
                  BILLED TO
                </p>
                <div className="text-[11px] space-y-0.5 pt-0.5">
                  <p className="font-bold text-[#1c2738]">Apex Enterprise Solutions Pvt. Ltd.</p>
                  <p>MG Road, Bengaluru - 560001</p>
                  <p>Karnataka</p>
                  <p>GSTIN: 29AADCA4589K1Z2</p>
                  <p>Contact: +91 98450 11223</p>
                </div>
              </div>
              <div className="rounded-[5px] border border-[#dadee4] bg-white p-3.5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1f5fbe] pb-1.5 border-b border-[#dadee4]">
                  SHIPPED TO
                </p>
                <div className="text-[11px] space-y-0.5 pt-0.5">
                  <p className="font-bold text-[#1c2738]">Apex Enterprise Solutions Pvt. Ltd.</p>
                  <p>MG Road, Bengaluru - 560001</p>
                  <p>Karnataka</p>
                  <p>State Code: 29</p>
                  <p>Attn: Procurement Desk</p>
                </div>
              </div>
            </div>

            {/* Line Items Table (exact 9 columns from invoicePdf.ts) */}
            <div className="border border-[#dadee4] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#f8fafc] text-[#1c2738] text-[9.5px] font-bold uppercase">
                  <tr className="border-b border-[#dadee4]">
                    <th className="px-2 py-2 text-center border-r border-[#dadee4]">#</th>
                    <th className="px-2.5 py-2 text-left border-r border-[#dadee4]">ITEM / DESCRIPTION</th>
                    <th className="px-2 py-2 text-center border-r border-[#dadee4]">HSN/SAC</th>
                    <th className="px-2 py-2 text-center border-r border-[#dadee4]">QTY</th>
                    <th className="px-2 py-2 text-right border-r border-[#dadee4]">UNIT PRICE</th>
                    <th className="px-2 py-2 text-right border-r border-[#dadee4]">TAXABLE</th>
                    <th className="px-2 py-2 text-center border-r border-[#dadee4]">GST RATE</th>
                    <th className="px-2 py-2 text-right border-r border-[#dadee4]">GST</th>
                    <th className="px-2 py-2 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dadee4]">
                  {SAMPLE_ITEMS.map((item, idx) => {
                    const taxable = item.qty * item.rate;
                    const gstAmt = taxable * (item.taxPct / 100);
                    return (
                      <tr key={item.name}>
                        <td className="px-2 py-2 text-center border-r border-[#dadee4]">{idx + 1}</td>
                        <td className="px-2.5 py-2 border-r border-[#dadee4]">
                          <p className="font-bold text-[#1c2738]">{item.name}</p>
                          <p className="text-[10px] text-[#69707b]">{item.itemDetails}</p>
                        </td>
                        <td className="px-2 py-2 text-center border-r border-[#dadee4]">{item.hsn}</td>
                        <td className="px-2 py-2 text-center border-r border-[#dadee4]">{item.qty}</td>
                        <td className="px-2 py-2 text-right border-r border-[#dadee4]">{fmt2(item.rate)}</td>
                        <td className="px-2 py-2 text-right border-r border-[#dadee4]">{fmt2(taxable)}</td>
                        <td className="px-2 py-2 text-center border-r border-[#dadee4]">
                          <span>{item.taxPct}%</span>
                          <br />
                          <span className="text-[9px] text-[#69707b]">{item.taxType}</span>
                        </td>
                        <td className="px-2 py-2 text-right border-r border-[#dadee4]">{fmt2(gstAmt)}</td>
                        <td className="px-2 py-2 text-right font-bold text-[#1c2738]">
                          {fmt2(taxable + gstAmt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Split: Left (Terms + Bank Remittance) & Right (Summary Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left: Terms & Conditions + Bank Remittance Details */}
              <div className="md:col-span-7 space-y-4">
                {effectiveTermsEnabled ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1f5fbe] mb-1.5">
                      TERMS &amp; CONDITIONS {termsEntry ? `(v${termsEntry.currentVersion})` : ''}
                    </p>
                    <div
                      className="text-[11px] text-[#373e48] space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4"
                      dangerouslySetInnerHTML={{ __html: effectiveTermsHtml || '<p>No terms configured.</p>' }}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Terms &amp; Conditions disabled for {selectedDocType}.
                  </p>
                )}

                {DOCUMENTS_WITH_BANK_DETAILS.has(selectedDocType) ? (
                  chosenBank ? (
                    <div className="pt-3 border-t border-[#dadee4] text-[11px] space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#1f5fbe] mb-1">
                        BANK REMITTANCE DETAILS
                      </p>
                      <p>Bank Name: {chosenBank.bankName}</p>
                      <p>Account Name: {chosenBank.accountHolderName}</p>
                      <p>
                        Account No: <span className="font-mono font-semibold">{chosenBank.accountNumber}</span> | IFSC Code:{' '}
                        <span className="font-mono font-semibold">{chosenBank.ifscCode}</span>
                      </p>
                      {chosenBank.branchName && <p>Branch: {chosenBank.branchName}</p>}
                      {chosenBank.upiId && <p>UPI ID: {chosenBank.upiId}</p>}
                      {chosenBank.qrCodeDataUrl && (
                        <img
                          src={chosenBank.qrCodeDataUrl}
                          alt="Payment QR"
                          className="mt-2 h-16 w-16 object-contain border border-[#dadee4] rounded bg-white p-1"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="pt-3 border-t border-[#dadee4] text-[11px] text-slate-400 italic">
                      No active NIDO bank account configured.
                    </p>
                  )
                ) : (
                  <p className="pt-3 border-t border-[#dadee4] text-[11px] text-slate-400 italic">
                    Bank Remittance Details are hidden on {selectedDocType} documents.
                  </p>
                )}
              </div>

              {/* Right: Summary Table */}
              <div className="md:col-span-5 border border-[#dadee4] text-[11px]">
                <div className="flex justify-between px-3 py-1.5 border-b border-[#dadee4]">
                  <span>Gross Subtotal</span>
                  <span>{fmt2(grossSubtotal)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5 border-b border-[#dadee4] font-bold text-[#1c2738]">
                  <span>Total Taxable Value</span>
                  <span>{fmt2(taxableSubtotal)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5 border-b border-[#dadee4] font-bold text-[#1c2738]">
                  <span>Total GST (18%)</span>
                  <span>{fmt2(totalTax)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5 border-b border-[#dadee4]">
                  <span>Shipping &amp; Handling Charges</span>
                  <span>{fmt2(shippingCharges)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5 border-b border-[#dadee4]">
                  <span>Round Off Adjustment</span>
                  <span>{fmt2(roundOff)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-[#eff6ff] font-bold text-[#1c2738]">
                  <span>Total Payable</span>
                  <span>{fmt2(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Total in Words + Authorized Signatory */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1f5fbe]">
                  TOTAL IN WORDS
                </p>
                <p className="text-xs font-bold text-[#1c2738] mt-1">
                  {numberToWords(grandTotal)}
                </p>
              </div>

              <div
                className={`flex ${
                  position === 'bottom-left'
                    ? 'justify-start text-left'
                    : position === 'bottom-center'
                      ? 'justify-center text-center'
                      : 'justify-end text-right'
                }`}
              >
                {showSignature && signature ? (
                  <div className="inline-flex flex-col items-center min-w-[160px]">
                    {signature.signatureImageDataUrl ? (
                      <img
                        src={signature.signatureImageDataUrl}
                        alt={signature.signatureName}
                        className="h-11 object-contain mb-1"
                      />
                    ) : (
                      <div className="h-8 flex items-end text-[10px] italic text-slate-400 mb-1">
                        [Signature]
                      </div>
                    )}
                    <div className="w-full border-t border-[#69707b] pt-1.5 text-center">
                      <p className="text-xs font-bold text-[#1c2738]">{signature.authorizedPerson}</p>
                      <p className="text-[10px] text-[#69707b]">
                        {signature.designation} · Authorized Signatory
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex flex-col items-center min-w-[150px] border-t border-[#69707b] pt-1.5">
                    <p className="text-[11px] text-[#69707b]">Authorized Signatory</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#dadee4] text-center">
              <p className="text-[11px] font-bold text-[#1f5fbe]">
                Thank you for choosing {org.displayName || org.companyName || 'Nido Tech'} as your corporate essentials partner!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
