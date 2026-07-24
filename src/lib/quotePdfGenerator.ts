// ── Quotation PDF Generator ───────────────────────────────────────────────────
// Generates an "ESTIMATE" PDF matching the Nido Tech design template.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadConfig } from './configService';
import type { StoredQuote } from './quoteStore';

// ── Brand Colors ─────────────────────────────────────────────────────────────
const BLUE: [number, number, number]       = [37, 99, 235];
const BLUE_DARK: [number, number, number]  = [29, 78, 216];
const BLUE_LIGHT: [number, number, number] = [235, 242, 255];
const DARK: [number, number, number]       = [17, 24, 39];
const GRAY: [number, number, number]       = [107, 114, 128];
const BORDER: [number, number, number]     = [209, 213, 219];
const WHITE: [number, number, number]      = [255, 255, 255];

// ── Number-to-Words (Indian format) ──────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
  'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim();
}
function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
}
export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';
  let words = '';
  if (rupees > 0) {
    const crore    = Math.floor(rupees / 10_000_000);
    const lakh     = Math.floor((rupees % 10_000_000) / 100_000);
    const thousand = Math.floor((rupees % 100_000) / 1_000);
    const rest     = rupees % 1_000;
    if (crore)    words += threeDigits(crore)    + ' Crore ';
    if (lakh)     words += twoDigits(lakh)        + ' Lakh ';
    if (thousand) words += twoDigits(thousand)    + ' Thousand ';
    if (rest)     words += threeDigits(rest)       + ' ';
    words = 'Indian Rupee ' + words.trim();
  }
  if (paise > 0) words += (rupees > 0 ? ' and ' : '') + twoDigits(paise) + ' Paise';
  return (words + ' Only').trim();
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmt2(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function detectFmt(dataUrl: string): string {
  if (dataUrl.includes('image/png'))  return 'PNG';
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  if (dataUrl.includes('image/gif'))  return 'GIF';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'PNG';
}
async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}
function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

// Draw a small filled blue icon square (used as bullet/section icon)
function blueIcon(doc: jsPDF, x: number, cy: number, size = 8) {
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, cy - size * 0.78, size, size, 1.5, 1.5, 'F');
}

// ── Main PDF generator ───────────────────────────────────────────────────────
export async function generateQuotePdfBase64(quote: StoredQuote): Promise<string> {
  const config = loadConfig();
  const org    = config.organization;

  const doc     = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const W       = doc.internal.pageSize.getWidth();   // 595
  const H       = doc.internal.pageSize.getHeight();  // 842
  const margin  = 32;
  const cW      = W - margin * 2;                     // 531

  let y = margin;

  // ══════════════════════════════════════════════════════════════
  // HEADER — Left: logo + company + contacts | Right: ESTIMATE + EST# + dates
  // ══════════════════════════════════════════════════════════════
  const leftW  = cW * 0.54;   // ≈287
  const rightX = margin + leftW + 14;
  const rightW = cW - leftW - 14;  // ≈230

  // ── Logo ──────────────────────────────────────────────────────
  const LOGO_SIZE = 44;
  let logoEndX = margin;
  if (org.logoUrl) {
    try {
      let imgData = org.logoUrl;
      if (org.logoUrl.startsWith('http')) imgData = (await toBase64(org.logoUrl)) || '';
      if (imgData) {
        doc.addImage(imgData, detectFmt(imgData), margin, y, LOGO_SIZE, LOGO_SIZE);
        logoEndX = margin + LOGO_SIZE + 8;
      }
    } catch { /* skip */ }
  }

  // ── Company name + tagline ─────────────────────────────────────
  const nameX = logoEndX;
  doc.setFont('helvetica', 'bold').setFontSize(17).setTextColor(...BLUE_DARK);
  doc.text((org.displayName || org.companyName || 'NIDO TECH').toUpperCase(), nameX, y + 16);
  if (org.industry) {
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRAY);
    doc.text(org.industry, nameX, y + 29);
  }

  // ── Contact rows ───────────────────────────────────────────────
  let infoY = y + LOGO_SIZE + 14;
  const iconCol = margin;
  const textCol = margin + 12;
  const textMaxW = leftW - 14;

  function contactRow(text: string) {
    blueIcon(doc, iconCol, infoY, 7);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...DARK);
    doc.text(text, textCol, infoY);
    infoY += 13;
  }

  const addr = (org.registeredAddress || org.billingAddress || '').replace(/\n/g, ', ').trim();
  if (addr) contactRow(addr);
  if (org.phone) contactRow(org.phone);

  const emailWeb = [org.email, org.website].filter(Boolean).join('    ');
  if (emailWeb) contactRow(emailWeb);

  if (org.gstNumber) {
    doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...DARK);
    doc.text(`GSTIN: ${org.gstNumber}`, margin, infoY);
    infoY += 12;
  }

  // ── Right: ESTIMATE (large) ────────────────────────────────────
  let rY = y;
  doc.setFont('helvetica', 'bold').setFontSize(30).setTextColor(...DARK);
  doc.text('ESTIMATE', W - margin, rY + 28, { align: 'right' });
  rY += 42;

  // EST number box
  const estBH = 26;
  doc.setDrawColor(...BORDER).setLineWidth(0.8);
  doc.roundedRect(rightX, rY, rightW, estBH, 4, 4);
  blueIcon(doc, rightX + 9, rY + estBH / 2 + 1, 8);
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...DARK);
  doc.text(quote.quoteNumber || 'EST-000001', rightX + rightW / 2 + 6, rY + 17, { align: 'center' });
  rY += estBH + 10;

  // Info rows (Estimate Date / Valid Till / Place of Supply)
  const infoRows: [string, string][] = [
    ['Estimate Date',   fmtDate(quote.quoteDate)],
    ...(quote.validTill     ? [['Valid Till',       fmtDate(quote.validTill)] as [string, string]]  : []),
    ...(quote.placeOfSupply ? [['Place of Supply',  quote.placeOfSupply]      as [string, string]]  : []),
  ];
  for (const [lbl, val] of infoRows) {
    blueIcon(doc, rightX, rY, 7);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRAY);
    doc.text(lbl, rightX + 11, rY);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...DARK);
    doc.text(`:  ${val}`, rightX + 88, rY);
    rY += 15;
  }

  y = Math.max(infoY, rY) + 12;

  // ── Horizontal divider ─────────────────────────────────────────
  doc.setDrawColor(...BORDER).setLineWidth(0.7);
  doc.line(margin, y, W - margin, y);
  y += 14;

  // ══════════════════════════════════════════════════════════════
  // BILL TO / SHIP TO — side-by-side rounded boxes
  // ══════════════════════════════════════════════════════════════
  const cardW  = (cW - 12) / 2;
  const billX  = margin;
  const shipX  = margin + cardW + 12;
  const HDR_H  = 22;

  const billLines: string[] = [
    ...(quote.clientName ? [quote.clientName] : []),
    ...(quote.billingAddress || '').split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean),
    ...(quote.clientGstin ? [`GSTIN: ${quote.clientGstin}`] : []),
  ];
  const shipLines: string[] = (quote.shippingAddress || quote.billingAddress || '')
    .split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);

  const maxL   = Math.max(billLines.length, shipLines.length, 4);
  const cardH  = HDR_H + 8 + maxL * 13 + 10;

  // Helper: draw one address card
  function drawCard(cx: number, title: string, lines: string[]) {
    // Box border
    doc.setDrawColor(...BORDER).setLineWidth(0.5);
    doc.roundedRect(cx, y, cardW, cardH, 4, 4);
    // Header fill (clip via filled rect inside the rounded border)
    doc.setFillColor(...BLUE_LIGHT);
    doc.rect(cx, y, cardW, HDR_H, 'F');
    // Redraw top portion of rounded border to restore corners
    doc.setDrawColor(...BORDER).setLineWidth(0.5);
    doc.roundedRect(cx, y, cardW, cardH, 4, 4);
    // Icon + label
    blueIcon(doc, cx + 8, y + HDR_H / 2 + 1, 8);
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...BLUE_DARK);
    doc.text(title, cx + 20, y + HDR_H / 2 + 3.5);
    // Separator
    doc.setDrawColor(...BORDER).setLineWidth(0.4);
    doc.line(cx, y + HDR_H, cx + cardW, y + HDR_H);
    // Content
    let cy2 = y + HDR_H + 13;
    lines.forEach((line, i) => {
      if (i === 0) {
        doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...DARK);
      } else {
        doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
      }
      const wrapped = doc.splitTextToSize(line, cardW - 16);
      doc.text(wrapped, cx + 10, cy2);
      cy2 += wrapped.length * 13;
    });
  }

  drawCard(billX, 'BILL TO', billLines);
  drawCard(shipX, 'SHIP TO', shipLines);
  y += cardH + 16;

  // ══════════════════════════════════════════════════════════════
  // LINE ITEMS TABLE
  // Cols: SL.NO | ITEM NAME | DESCRIPTION | HSN CODE | QTY | RATE(₹) | DISCOUNT | TAX % | AMOUNT(₹)
  // ══════════════════════════════════════════════════════════════
  const tableBody = quote.lineItems.map((item, idx) => {
    const amt = item.qty * item.rate * (1 - (item.discount || 0) / 100);
    return [
      String(idx + 1),
      item.name || '',
      item.description || '',
      item.hsnSac || '',
      String(item.qty),
      fmt2(item.rate),
      `${item.discount || 0}%`,
      `${item.taxPercent || 0}%`,
      fmt2(amt),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['SL.NO', 'ITEM NAME', 'DESCRIPTION', 'HSN CODE', 'QTY', 'RATE (\u20B9)', 'DISCOUNT', 'TAX %', 'AMOUNT (\u20B9)']],
    body: tableBody,
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 7, bottom: 7, left: 5, right: 5 },
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 9, bottom: 9, left: 5, right: 5 },
      textColor: DARK,
      valign: 'top',
      lineColor: BORDER,
      lineWidth: 0.4,
    },
    columnStyles: {
      0: { cellWidth: 30,   halign: 'center' },
      1: { cellWidth: 82 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 52,   halign: 'center' },
      4: { cellWidth: 28,   halign: 'center' },
      5: { cellWidth: 58,   halign: 'right' },
      6: { cellWidth: 50,   halign: 'center' },
      7: { cellWidth: 38,   halign: 'center' },
      8: { cellWidth: 62,   halign: 'right' },
    },
    alternateRowStyles: { fillColor: WHITE },
    tableLineColor: BORDER,
    tableLineWidth: 0.4,
    showHead: 'everyPage',
  });

  y = (doc as any).lastAutoTable.finalY + 16;

  // ══════════════════════════════════════════════════════════════
  // NOTES (left) — rendered above Terms
  // TOTALS (right) — subtotal, tax rows, total
  // ══════════════════════════════════════════════════════════════
  const leftHalfW  = cW * 0.50 - 8;
  const rightHalfX = margin + leftHalfW + 16;

  const sectionTop = y;

  // ── Totals (right side) ────────────────────────────────────────
  const summaryRows: [string, string][] = [
    ['Subtotal', `\u20B9${fmt2(quote.subtotal)}`],
    ...quote.gstSlabs.map(slab => ([
      `Tax (${slab.rate}%)`, `\u20B9${fmt2(slab.cgst + slab.sgst)}`
    ] as [string, string])),
  ];
  if (quote.adjustment && quote.adjustment !== 0) {
    summaryRows.push(['Adjustment', `\u20B9${fmt2(quote.adjustment)}`]);
  }

  const ROW_H   = 22;
  const TOTAL_H = 30;
  let   ty      = sectionTop;

  summaryRows.forEach((row, i) => {
    const ry = ty + i * ROW_H;
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRAY);
    doc.text(row[0], rightHalfX, ry + ROW_H - 7);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...DARK);
    doc.text(row[1], W - margin, ry + ROW_H - 7, { align: 'right' });
    doc.setDrawColor(...BORDER).setLineWidth(0.3);
    doc.line(rightHalfX, ry + ROW_H, W - margin, ry + ROW_H);
  });

  // Total row
  const totalY = ty + summaryRows.length * ROW_H + 6;
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...DARK);
  doc.text('Total', rightHalfX, totalY + 18);
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...BLUE);
  doc.text(`\u20B9${fmt2(quote.grandTotal)}`, W - margin, totalY + 18, { align: 'right' });

  const totalsBottom = totalY + TOTAL_H + 6;

  // ── Notes (left side) ─────────────────────────────────────────
  let notesBottom = sectionTop;
  if (quote.customerNotes) {
    let ny = sectionTop;
    // Header
    blueIcon(doc, margin, ny, 9);
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BLUE_DARK);
    doc.text('NOTES', margin + 13, ny);
    // Dotted line
    doc.setDrawColor(...BORDER).setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin + 48, ny - 4, margin + leftHalfW, ny - 4);
    doc.setLineDashPattern([], 0);
    ny += 14;

    const noteLines = quote.customerNotes.split('\n').filter(Boolean);
    noteLines.forEach((line, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${line}`, leftHalfW - 4);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
      doc.text(wrapped, margin, ny);
      ny += wrapped.length * 12 + 2;
    });
    notesBottom = ny + 10;
  }

  y = Math.max(notesBottom, totalsBottom) + 14;

  // ══════════════════════════════════════════════════════════════
  // TERMS & CONDITIONS (left, full width)
  // ══════════════════════════════════════════════════════════════
  if (quote.termsConditions) {
    y = ensureSpace(doc, y, 50, margin);
    blueIcon(doc, margin, y, 9);
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BLUE_DARK);
    doc.text('TERMS & CONDITIONS', margin + 13, y);
    doc.setDrawColor(...BORDER).setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin + 116, y - 4, W - margin, y - 4);
    doc.setLineDashPattern([], 0);
    y += 14;

    const termLines = quote.termsConditions.split('\n').filter(Boolean);
    termLines.forEach((line, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${line}`, cW);
      y = ensureSpace(doc, y, wrapped.length * 12 + 4, margin);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 2;
    });
    y += 14;
  }

  // ══════════════════════════════════════════════════════════════
  // TOTAL IN WORDS (left) + AUTHORIZED SIGNATURE (right)
  // ══════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 70, margin);
  doc.setDrawColor(...BORDER).setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 14;

  // Total in Words label + value
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...BLUE_DARK);
  doc.text('Total In Words', margin, y);
  y += 12;
  const wordsText  = numberToWords(quote.grandTotal);
  const wordLines  = doc.splitTextToSize(wordsText, cW * 0.55);
  doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...DARK);
  doc.text(wordLines, margin, y);

  // Authorized Signature (right)
  const sigLineW = 130;
  const sigLineX = W - margin - sigLineW;
  const sigLineY = y + 22;
  doc.setDrawColor(80, 80, 80).setLineWidth(0.8);
  doc.line(sigLineX, sigLineY, W - margin, sigLineY);
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRAY);
  doc.text('Authorized Signature', sigLineX + sigLineW / 2, sigLineY + 13, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // FOOTER — Thank you message (last page)
  // ══════════════════════════════════════════════════════════════
  const footerY = H - margin - 8;
  doc.setDrawColor(...BORDER).setLineWidth(0.5);
  doc.line(margin, footerY - 14, W - margin, footerY - 14);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLUE);
  doc.text('\u2665  Thank you for your business!  \u2665', W / 2, footerY, { align: 'center' });

  // Page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(180, 180, 180);
    doc.text(`Page ${p} of ${totalPages}`, W - margin, H - 6, { align: 'right' });
  }

  return doc.output('datauristring');
}

export async function downloadQuotePdf(quote: StoredQuote): Promise<void> {
  const dataUri = await generateQuotePdfBase64(quote);
  const link    = document.createElement('a');
  link.href     = dataUri;
  link.download = `${quote.quoteNumber}.pdf`;
  link.click();
}
