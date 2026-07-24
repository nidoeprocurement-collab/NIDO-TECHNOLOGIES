// ── Quotation PDF Generator ───────────────────────────────────────────────────
// Generates an "ESTIMATE" PDF matching the reference format.
// Logo is read from configService so it updates automatically when changed.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadConfig } from './configService';
import type { StoredQuote } from './quoteStore';

// ── Number to Words (Indian format) ──────────────────────────────────────────
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')).trim();
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
}

export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let words = '';
  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const rest = rupees % 1000;

    if (crore) words += threeDigits(crore) + ' Crore ';
    if (lakh) words += twoDigits(lakh) + ' Lakh ';
    if (thousand) words += twoDigits(thousand) + ' Thousand ';
    if (rest) words += threeDigits(rest) + ' ';

    words = 'Indian Rupee ' + words.trim();
  }
  if (paise > 0) {
    words += (rupees > 0 ? ' and ' : '') + twoDigits(paise) + ' Paise';
  }
  return (words + ' Only').trim();
}

// ── Load image as base64 ──────────────────────────────────────────────────────
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Format date DD/MM/YYYY ────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmt2(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Main generator ────────────────────────────────────────────────────────────
export async function generateQuotePdfBase64(quote: StoredQuote): Promise<string> {
  const config = loadConfig();
  const org = config.organization;

  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();   // 595
  const margin = 40;
  const contentW = W - margin * 2;
  let y = margin;

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Logo symbol + company name beside it (left side)
  const logoUrl = org.logoUrl;
  const logoSize = 42;           // symbol-only square
  const logoTextGap = 10;        // gap between symbol and text
  let logoLoaded = false;

  if (logoUrl) {
    try {
      let imgData = logoUrl;
      if (logoUrl.startsWith('http')) {
        const b64 = await loadImageAsBase64(logoUrl);
        if (b64) imgData = b64;
        else imgData = '';
      }
      if (imgData) {
        doc.addImage(imgData, undefined as any, margin, y, logoSize, logoSize);
        logoLoaded = true;
      }
    } catch {
      logoLoaded = false;
    }
  }

  // Display name + industry beside the logo (or alone if no logo)
  const nameX = logoLoaded ? margin + logoSize + logoTextGap : margin;
  const nameY = y + (logoLoaded ? 16 : 14);
  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(20, 20, 20);
  doc.text(org.displayName || org.companyName || 'Company', nameX, nameY);
  if (org.industry) {
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(110, 110, 110);
    doc.text(org.industry, nameX, nameY + 14);
  }

  // Company info (right side)
  const rightX = W - margin;
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 30, 30);
  doc.text(org.companyName || org.displayName || '', rightX, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
  const addrLines = (org.registeredAddress || org.billingAddress || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  let addrY = y + 24;
  for (const line of addrLines.slice(0, 4)) {
    doc.text(line, rightX, addrY, { align: 'right' });
    addrY += 11;
  }
  if (org.gstNumber) {
    doc.text(`GSTIN ${org.gstNumber}`, rightX, addrY, { align: 'right' });
    addrY += 11;
  }

  y = Math.max(y + 65, addrY + 8);

  // Separator line
  doc.setDrawColor(180, 180, 180).setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);
  y += 14;

  // ESTIMATE title
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(30, 30, 30);
  doc.text('ESTIMATE', W / 2, y, { align: 'center' });
  y += 24;

  // ── BILL TO / ESTIMATE INFO ────────────────────────────────────────────────
  const colMid = margin + contentW * 0.52;

  // Bill To label
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(80, 80, 80);
  doc.text('Bill To', margin, y);
  y += 13;

  // Client name bold
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(20, 20, 20);
  doc.text(quote.clientName || '', margin, y);
  y += 13;

  // Billing address lines
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60);
  const billLines = (quote.billingAddress || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  for (const line of billLines.slice(0, 4)) {
    doc.text(line, margin, y);
    y += 11;
  }
  if (quote.clientGstin) {
    doc.text(`GSTIN ${quote.clientGstin}`, margin, y);
    y += 11;
  }

  // Estimate # and Date table (right side) — aligned at top with Bill To
  const estTableTop = y - (13 + 13 + billLines.slice(0, 4).length * 11 + (quote.clientGstin ? 11 : 0));
  const estBoxW = contentW * 0.42;
  const estBoxX = colMid;
  const estRowH = 20;

  // Draw estimate info box
  doc.setDrawColor(180, 180, 180).setLineWidth(0.5);
  doc.rect(estBoxX, estTableTop, estBoxW, estRowH * 2);
  doc.line(estBoxX, estTableTop + estRowH, estBoxX + estBoxW, estTableTop + estRowH);
  // Vertical divider
  const midX = estBoxX + estBoxW * 0.45;
  doc.line(midX, estTableTop, midX, estTableTop + estRowH * 2);

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60);
  doc.text('Estimate#', estBoxX + 6, estTableTop + 13);
  doc.setFont('helvetica', 'bold').setTextColor(20, 20, 20);
  doc.text(quote.quoteNumber, estBoxX + estBoxW - 6, estTableTop + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal').setTextColor(60, 60, 60);
  doc.text('Estimate Date', estBoxX + 6, estTableTop + estRowH + 13);
  doc.setFont('helvetica', 'bold').setTextColor(20, 20, 20);
  doc.text(fmtDate(quote.quoteDate), estBoxX + estBoxW - 6, estTableTop + estRowH + 13, { align: 'right' });

  y += 12;

  // Ship To
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(80, 80, 80);
  doc.text('Ship To', margin, y);
  y += 13;

  const shipLines = (quote.shippingAddress || quote.billingAddress || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60);
  for (const line of shipLines.slice(0, 4)) {
    doc.text(line, margin, y);
    y += 11;
  }
  if (quote.clientGstin) {
    doc.text(`GSTIN ${quote.clientGstin}`, margin, y);
    y += 11;
  }

  y += 8;

  // Place of Supply
  if (quote.placeOfSupply) {
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(40, 40, 40);
    doc.text(`Place Of Supply: ${quote.placeOfSupply}`, margin, y);
    y += 16;
  }

  // ── LINE ITEMS TABLE ────────────────────────────────────────────────────────
  const tableBody: any[][] = quote.lineItems.map((item, i) => {
    const amt = item.qty * item.rate * (1 - item.discount / 100);
    return [
      i + 1,
      { content: item.name, desc: item.description },
      item.hsnSac || '',
      `${item.qty}`,
      fmt2(item.rate),
      fmt2(amt),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Item & Description', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
    body: tableBody.map(row => {
      const r = [...row];
      // Flatten the description cell for display
      if (typeof r[1] === 'object' && r[1] !== null && 'content' in r[1]) {
        const cell = r[1] as { content: string; desc: string };
        r[1] = cell.desc ? `${cell.content}\n${cell.desc}` : cell.content;
      }
      return r;
    }),
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 60, halign: 'right' },
      5: { cellWidth: 65, halign: 'right' },
    },
    didParseCell(data) {
      // Bold item name, gray description for body column 1
      if (data.section === 'body' && data.column.index === 1) {
        const raw = String(data.cell.raw || '');
        const lines = raw.split('\n');
        if (lines.length > 1) {
          data.cell.text = [lines[0]];
        }
      }
    },
    didDrawCell(data) {
      // Draw description line below item name in column 1
      if (data.section === 'body' && data.column.index === 1) {
        const raw = String(data.cell.raw || '');
        const lines = raw.split('\n');
        if (lines.length > 1) {
          doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 100, 100);
          doc.text(lines[1], data.cell.x + 6, data.cell.y + data.cell.height / 2 + 6);
        }
      }
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── TOTALS SECTION ─────────────────────────────────────────────────────────
  const summaryX = W - margin - 190;
  const summaryW = 190;

  const summaryRows: [string, string][] = [
    ['Sub Total', fmt2(quote.subtotal)],
    ...quote.gstSlabs.flatMap(slab => [
      [`CGST (${slab.rate / 2}%)`, fmt2(slab.cgst)],
      [`SGST (${slab.rate / 2}%)`, fmt2(slab.sgst)],
    ]),
  ];

  if (summaryRows.length === 1) {
    // No tax slabs — show default 0
    summaryRows.push(['CGST (9%)', '0.00'], ['SGST (9%)', '0.00']);
  }

  let sy = y;
  doc.setDrawColor(200, 200, 200).setLineWidth(0.3);
  doc.rect(summaryX, sy, summaryW, (summaryRows.length + 1) * 20);

  summaryRows.forEach((row, i) => {
    const rowY = sy + i * 20;
    if (i < summaryRows.length - 1) {
      doc.line(summaryX, rowY + 20, summaryX + summaryW, rowY + 20);
    }
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(80, 80, 80);
    doc.text(row[0], summaryX + 8, rowY + 13);
    doc.setFont('helvetica', 'normal').setTextColor(30, 30, 30);
    doc.text(row[1], summaryX + summaryW - 8, rowY + 13, { align: 'right' });
  });

  // Total row
  const totalRowY = sy + summaryRows.length * 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(summaryX, totalRowY, summaryW, 22, 'F');
  doc.line(summaryX, totalRowY, summaryX + summaryW, totalRowY);
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(20, 20, 20);
  doc.text('Total', summaryX + 8, totalRowY + 15);
  doc.text(`\u20B9${fmt2(quote.grandTotal)}`, summaryX + summaryW - 8, totalRowY + 15, { align: 'right' });

  y = Math.max(y + summaryRows.length * 20 + 30, totalRowY + 30);

  // Total in words
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(50, 50, 50);
  doc.text('Total In Words:', margin, y);
  doc.setFont('helvetica', 'bolditalic').setFontSize(9).setTextColor(30, 30, 30);
  const wordsText = numberToWords(quote.grandTotal);
  const wordLines = doc.splitTextToSize(wordsText, contentW - 90);
  doc.text(wordLines, margin + 85, y);
  y += wordLines.length * 13 + 16;

  // ── TERMS & CONDITIONS ─────────────────────────────────────────────────────
  if (quote.termsConditions) {
    doc.setDrawColor(200, 200, 200).setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);
    y += 14;

    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(30, 30, 30);
    doc.text('Terms & Conditions', margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60);
    const termLines = quote.termsConditions.split('\n').filter(Boolean);
    termLines.forEach((line, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${line}`, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12;
    });
    y += 8;
  }

  // Customer notes
  if (quote.customerNotes) {
    doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(quote.customerNotes, contentW);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12 + 12;
  }

  // Authorized Signature
  y += 20;
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(40, 40, 40);
  doc.text('Authorized Signature', margin, y);
  doc.setDrawColor(80, 80, 80).setLineWidth(0.6);
  doc.line(margin + 105, y, margin + 260, y);

  // Page number
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(150, 150, 150);
  doc.text('1', W - margin, pageH - 20, { align: 'right' });

  return doc.output('datauristring');
}

export async function downloadQuotePdf(quote: StoredQuote): Promise<void> {
  const dataUri = await generateQuotePdfBase64(quote);
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `${quote.quoteNumber}.pdf`;
  link.click();
}
