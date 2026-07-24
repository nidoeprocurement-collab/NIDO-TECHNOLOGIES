// ── Quotation PDF Generator ───────────────────────────────────────────────────
// Produces an ESTIMATE PDF that exactly matches the Nido Tech design template.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadConfig } from './configService';
import type { StoredQuote } from './quoteStore';

// ─── Palette ──────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const BLU: RGB  = [37,  99,  235]; // blue-600  – accents, table header, total
const BLU_D: RGB= [29,  78,  216]; // blue-700  – section labels
const BLU_L: RGB= [239, 246, 255]; // blue-50   – card header fill
const INK: RGB  = [15,  23,  42];  // slate-950 – primary text
const GRY: RGB  = [100, 116, 139]; // slate-500 – secondary text
const BDR: RGB  = [203, 213, 225]; // slate-300 – borders
const WHT: RGB  = [255, 255, 255];
const BLK_L: RGB= [248, 250, 252]; // slate-50  – alt row

// ─── Number → Indian words ────────────────────────────────────────────────────
const _ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
  'Seventeen','Eighteen','Nineteen'];
const _tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function _two(n: number): string {
  return n < 20 ? _ones[n] : (_tens[Math.floor(n/10)] + (n%10 ? ' '+_ones[n%10] : '')).trim();
}
function _three(n: number): string {
  return n < 100 ? _two(n) : _ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+_two(n%100) : '');
}
export function numberToWords(amount: number): string {
  const r = Math.floor(amount), p = Math.round((amount - r) * 100);
  if (!r && !p) return 'Zero Rupees Only';
  let w = '';
  if (r) {
    const cr = Math.floor(r/1e7), lk = Math.floor((r%1e7)/1e5),
          th = Math.floor((r%1e5)/1e3), re = r%1e3;
    if (cr) w += _three(cr) + ' Crore ';
    if (lk) w += _two(lk)   + ' Lakh ';
    if (th) w += _two(th)   + ' Thousand ';
    if (re) w += _three(re) + ' ';
    w = 'Indian Rupee ' + w.trim();
  }
  if (p) w += (r ? ' and ' : '') + _two(p) + ' Paise';
  return (w + ' Only').trim();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dd(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function inr(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function ensureY(doc: jsPDF, y: number, need: number, m: number) {
  if (y + need > doc.internal.pageSize.getHeight() - m) { doc.addPage(); return m; }
  return y;
}

// Detect image format from data URL
function imgFmt(d: string) {
  if (d.includes('image/png'))  return 'PNG';
  if (d.includes('image/jpeg') || d.includes('image/jpg')) return 'JPEG';
  if (d.includes('image/webp')) return 'WEBP';
  return 'PNG';
}

// Fetch remote URL → base64 data-URL
async function fetchB64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(ok => {
      const fr = new FileReader();
      fr.onload  = () => ok(fr.result as string);
      fr.onerror = () => ok(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

// Render an SVG URL to a PNG data-URL via an off-screen <canvas>
async function svgToPng(svgUrl: string, px = 160): Promise<string | null> {
  try {
    const res = await fetch(svgUrl);
    if (!res.ok) return null;
    const text = await res.text();
    return new Promise(resolve => {
      const img = new Image();
      const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
      const objUrl = URL.createObjectURL(blob);
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = px;
        const ctx = c.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objUrl); resolve(null); return; }
        ctx.drawImage(img, 0, 0, px, px);
        URL.revokeObjectURL(objUrl);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(null); };
      img.src = objUrl;
    });
  } catch { return null; }
}

// ─── Draw a filled blue circle (used as icon placeholder) ────────────────────
function dot(doc: jsPDF, cx: number, cy: number, r = 4) {
  doc.setFillColor(...BLU);
  doc.circle(cx, cy, r, 'F');
}

// Draw a small filled blue rounded-square icon
function sq(doc: jsPDF, x: number, midY: number, sz = 7) {
  doc.setFillColor(...BLU);
  doc.roundedRect(x, midY - sz * 0.75, sz, sz, 1.5, 1.5, 'F');
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateQuotePdfBase64(quote: StoredQuote): Promise<string> {
  const cfg = loadConfig();
  const org = cfg.organization;

  const doc  = new jsPDF({ unit: 'pt', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();   // 595
  const PH   = doc.internal.pageSize.getHeight();  // 842
  const M    = 30;
  const CW   = W - 2 * M;                          // 535

  // ── Resolve logo ────────────────────────────────────────────────────────────
  let logoB64: string | null = null;
  if (org.logoUrl) {
    logoB64 = org.logoUrl.startsWith('http') ? await fetchB64(org.logoUrl) : org.logoUrl;
  }
  // Fall back to the app's own favicon (the Nido "N" logo)
  if (!logoB64) {
    logoB64 = await svgToPng('/favicon.svg', 160);
  }

  let y = M;

  // ════════════════════════════════════════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════════════════════════════════════════
  const LEFT_W  = Math.round(CW * 0.55); // 294
  const RIGHT_X = M + LEFT_W + 10;       // 334
  const RIGHT_W = W - M - RIGHT_X;       // 231

  // ── Logo ─────────────────────────────────────────────────────────────────
  const LOGO = 50;
  let nameX = M;
  if (logoB64) {
    doc.addImage(logoB64, imgFmt(logoB64), M, y, LOGO, LOGO);
    nameX = M + LOGO + 9;
  }

  // ── Company name + tagline ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold').setFontSize(17).setTextColor(...INK);
  doc.text((org.displayName || org.companyName || 'NIDO TECH').toUpperCase(), nameX, y + 18);

  const tagline = org.industry || 'Corporate Essentials';
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRY);
  doc.text(tagline, nameX, y + 31);

  // ── Contact info rows ────────────────────────────────────────────────────
  let iy = y + LOGO + 14;           // below the logo block

  function contactLine(text: string) {
    dot(doc, M + 5, iy - 2, 4);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...INK);
    const wrapped = doc.splitTextToSize(text, LEFT_W - 18);
    doc.text(wrapped, M + 13, iy);
    iy += wrapped.length * 12 + 1;
  }

  const addr = (org.registeredAddress || org.billingAddress || '').replace(/\n/g, ', ').trim();
  if (addr)      contactLine(addr);
  if (org.phone) contactLine(org.phone);

  const ew = [org.email, org.website].filter(Boolean).join('    ');
  if (ew) contactLine(ew);

  if (org.gstNumber) {
    doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...INK);
    doc.text(`GSTIN: ${org.gstNumber}`, M, iy + 2);
    iy += 14;
  }

  // ── Right: "ESTIMATE" ────────────────────────────────────────────────────
  let ry = y;
  doc.setFont('helvetica', 'bold').setFontSize(32).setTextColor(...INK);
  doc.text('ESTIMATE', W - M, ry + 30, { align: 'right' });
  ry += 44;

  // EST number box
  const EBH = 28;
  doc.setDrawColor(...BDR).setLineWidth(0.8);
  doc.roundedRect(RIGHT_X, ry, RIGHT_W, EBH, 5, 5);
  // small file icon
  sq(doc, RIGHT_X + 9, ry + EBH / 2 + 1, 8);
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK);
  doc.text(quote.quoteNumber || 'EST-000001', RIGHT_X + RIGHT_W / 2 + 5, ry + 18, { align: 'center' });
  ry += EBH + 8;

  // Info rows
  const INFO: [string, string][] = [
    ['Estimate Date',  dd(quote.quoteDate)],
    ...(quote.validTill     ? [['Valid Till',       dd(quote.validTill)]      as [string, string]] : []),
    ...(quote.placeOfSupply ? [['Place of Supply',  quote.placeOfSupply]      as [string, string]] : []),
  ];
  for (const [lbl, val] of INFO) {
    sq(doc, RIGHT_X, ry, 7);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRY);
    doc.text(lbl, RIGHT_X + 11, ry);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...INK);
    doc.text(`:   ${val}`, RIGHT_X + 90, ry);
    ry += 16;
  }

  y = Math.max(iy, ry) + 10;

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(...BDR).setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 12;

  // ════════════════════════════════════════════════════════════════════════════
  // BILL TO / SHIP TO
  // ════════════════════════════════════════════════════════════════════════════
  const CARD_W = (CW - 10) / 2;
  const BILL_X = M;
  const SHIP_X = M + CARD_W + 10;
  const HDR_H  = 24;

  const billContent: string[] = [
    ...(quote.clientName ? [quote.clientName] : []),
    ...(quote.billingAddress || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean),
    ...(quote.clientGstin ? [`GSTIN: ${quote.clientGstin}`] : []),
  ];
  const shipContent: string[] = (quote.shippingAddress || quote.billingAddress || '')
    .split(/[,\n]/).map(s => s.trim()).filter(Boolean);

  const maxLines  = Math.max(billContent.length, shipContent.length, 4);
  const CARD_H    = HDR_H + 8 + maxLines * 13 + 12;

  function drawCard(cx: number, title: string, lines: string[]) {
    // Outer rounded border
    doc.setFillColor(...WHT);
    doc.setDrawColor(...BDR).setLineWidth(0.6);
    doc.roundedRect(cx, y, CARD_W, CARD_H, 5, 5, 'FD');

    // Header fill — draw as a clipped region using two ops:
    // 1) filled roundedRect for the full card (light blue) then
    // 2) white rect to clear bottom portion
    doc.setFillColor(...BLU_L);
    doc.roundedRect(cx, y, CARD_W, CARD_H, 5, 5, 'F');
    doc.setFillColor(...WHT);
    doc.rect(cx, y + HDR_H, CARD_W, CARD_H - HDR_H, 'F');
    // Redraw border on top
    doc.setDrawColor(...BDR).setLineWidth(0.6);
    doc.roundedRect(cx, y, CARD_W, CARD_H, 5, 5);
    // Separator under header
    doc.setDrawColor(...BDR).setLineWidth(0.4);
    doc.line(cx, y + HDR_H, cx + CARD_W, y + HDR_H);

    // Icon + label
    sq(doc, cx + 8, y + HDR_H / 2 + 1, 8);
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...BLU_D);
    doc.text(title, cx + 20, y + HDR_H / 2 + 4);

    // Content
    let cy = y + HDR_H + 13;
    lines.forEach((ln, i) => {
      const bold = i === 0;
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
         .setFontSize(bold ? 9 : 8.5)
         .setTextColor(...(bold ? INK : [60, 60, 60] as RGB));
      const wrapped = doc.splitTextToSize(ln, CARD_W - 18);
      doc.text(wrapped, cx + 10, cy);
      cy += wrapped.length * 13;
    });
  }

  drawCard(BILL_X, 'BILL TO', billContent);
  drawCard(SHIP_X, 'SHIP TO', shipContent);
  y += CARD_H + 14;

  // ════════════════════════════════════════════════════════════════════════════
  // LINE ITEMS TABLE
  // Cols: SL.NO | ITEM NAME | DESCRIPTION | HSN CODE | QTY | RATE(₹) | DISCOUNT | TAX % | AMOUNT(₹)
  // ════════════════════════════════════════════════════════════════════════════
  const body = quote.lineItems.map((it, idx) => {
    const amt = it.qty * it.rate * (1 - (it.discount || 0) / 100);
    return [
      String(idx + 1),
      it.name        || '',
      it.description || '',
      it.hsnSac      || '',
      String(it.qty),
      inr(it.rate),
      `${it.discount  || 0}%`,
      `${it.taxPercent || 0}%`,
      inr(amt),
    ];
  });

  autoTable(doc, {
    startY:  y,
    margin:  { left: M, right: M },
    head:    [['SL.NO', 'ITEM NAME', 'DESCRIPTION', 'HSN CODE', 'QTY', 'RATE (\u20B9)', 'DISCOUNT', 'TAX %', 'AMOUNT (\u20B9)']],
    body,
    headStyles: {
      fillColor:   BLU,
      textColor:   WHT,
      fontStyle:   'bold',
      fontSize:    7.5,
      halign:      'center',
      cellPadding: { top: 7, bottom: 7, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize:    8.5,
      textColor:   INK,
      cellPadding: { top: 9, bottom: 9, left: 4, right: 4 },
      valign:      'top',
      lineColor:   BDR,
      lineWidth:   0.4,
    },
    columnStyles: {
      0: { cellWidth: 30,     halign: 'center' },
      1: { cellWidth: 78 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 52,     halign: 'center' },
      4: { cellWidth: 26,     halign: 'center' },
      5: { cellWidth: 58,     halign: 'right'  },
      6: { cellWidth: 50,     halign: 'center' },
      7: { cellWidth: 36,     halign: 'center' },
      8: { cellWidth: 60,     halign: 'right'  },
    },
    // Item name bold; description normal-gray inside the same column's cells
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize  = 9;
      }
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = GRY;
        data.cell.styles.fontSize  = 8;
      }
    },
    alternateRowStyles: { fillColor: BLK_L },
    tableLineColor:     BDR,
    tableLineWidth:     0.4,
    showHead:           'everyPage',
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // ════════════════════════════════════════════════════════════════════════════
  // NOTES (left) + TOTALS (right)
  // ════════════════════════════════════════════════════════════════════════════
  const HALF   = (CW - 10) / 2;
  const R_COL  = M + HALF + 10;
  const secTop = y;

  // ── TOTALS (right) ───────────────────────────────────────────────────────
  const taxRows: [string, string][] = quote.gstSlabs.map(s => [
    `Tax (${s.rate}%)`, `\u20B9${inr(s.cgst + s.sgst)}`
  ]);
  const sumRows: [string, string][] = [
    ['Subtotal', `\u20B9${inr(quote.subtotal)}`],
    ...taxRows,
    ...(quote.adjustment && quote.adjustment !== 0
      ? [['Adjustment', `\u20B9${inr(quote.adjustment)}`] as [string, string]] : []),
  ];

  const ROW_H = 22;
  let   ty2   = secTop;

  sumRows.forEach((row, i) => {
    const ry2 = ty2 + i * ROW_H;
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRY);
    doc.text(row[0], R_COL, ry2 + ROW_H - 7);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...INK);
    doc.text(row[1], W - M, ry2 + ROW_H - 7, { align: 'right' });
    doc.setDrawColor(...BDR).setLineWidth(0.3);
    doc.line(R_COL, ry2 + ROW_H, W - M, ry2 + ROW_H);
  });

  const TOTAL_Y = ty2 + sumRows.length * ROW_H + 6;
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK);
  doc.text('Total', R_COL, TOTAL_Y + 18);
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...BLU);
  doc.text(`\u20B9${inr(quote.grandTotal)}`, W - M, TOTAL_Y + 18, { align: 'right' });

  const totBottom = TOTAL_Y + 30;

  // ── NOTES (left) ─────────────────────────────────────────────────────────
  let notBottom = secTop;
  if (quote.customerNotes) {
    let ny = secTop;
    sq(doc, M, ny, 9);
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BLU_D);
    doc.text('NOTES', M + 13, ny);
    // dotted rule
    doc.setDrawColor(...BDR).setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(M + 50, ny - 3, M + HALF, ny - 3);
    doc.setLineDashPattern([], 0);
    ny += 13;

    quote.customerNotes.split('\n').filter(Boolean).forEach((ln, i) => {
      const w2 = doc.splitTextToSize(`${i + 1}. ${ln}`, HALF - 4);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
      doc.text(w2, M, ny);
      ny += w2.length * 12 + 2;
    });
    notBottom = ny + 6;
  }

  y = Math.max(notBottom, totBottom) + 14;

  // ════════════════════════════════════════════════════════════════════════════
  // TERMS & CONDITIONS
  // ════════════════════════════════════════════════════════════════════════════
  if (quote.termsConditions) {
    y = ensureY(doc, y, 50, M);
    sq(doc, M, y, 9);
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...BLU_D);
    doc.text('TERMS & CONDITIONS', M + 13, y);
    doc.setDrawColor(...BDR).setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(M + 120, y - 3, W - M, y - 3);
    doc.setLineDashPattern([], 0);
    y += 13;

    quote.termsConditions.split('\n').filter(Boolean).forEach((ln, i) => {
      const w2 = doc.splitTextToSize(`${i + 1}. ${ln}`, CW);
      y = ensureY(doc, y, w2.length * 12 + 4, M);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(60, 60, 60);
      doc.text(w2, M, y);
      y += w2.length * 12 + 2;
    });
    y += 10;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TOTAL IN WORDS (left) + AUTHORIZED SIGNATURE (right)
  // ════════════════════════════════════════════════════════════════════════════
  y = ensureY(doc, y, 70, M);

  doc.setDrawColor(...BDR).setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 14;

  // Label
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...BLU_D);
  doc.text('Total In Words', M, y);
  y += 11;

  // Words text
  const wordsStr  = numberToWords(quote.grandTotal);
  const wordLines = doc.splitTextToSize(wordsStr, CW * 0.55);
  doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...INK);
  doc.text(wordLines, M, y);

  // Signature block (right side, vertically centred on the words block)
  const SIG_W   = 140;
  const SIG_X   = W - M - SIG_W;
  const SIG_LINE_Y = y + 22;
  doc.setDrawColor(80, 80, 80).setLineWidth(0.8);
  doc.line(SIG_X, SIG_LINE_Y, W - M, SIG_LINE_Y);
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRY);
  doc.text('Authorized Signature', SIG_X + SIG_W / 2, SIG_LINE_Y + 13, { align: 'center' });

  // ════════════════════════════════════════════════════════════════════════════
  // FOOTER  — last page only
  // ════════════════════════════════════════════════════════════════════════════
  const FTR_Y = PH - M - 8;
  doc.setDrawColor(...BDR).setLineWidth(0.5);
  doc.line(M, FTR_Y - 14, W - M, FTR_Y - 14);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...BLU);
  doc.text('\u2665  Thank you for your business!  \u2665', W / 2, FTR_Y, { align: 'center' });

  // Page numbers on every page
  const totalPg = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPg; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(180, 180, 180);
    doc.text(`Page ${p} of ${totalPg}`, W - M, PH - 6, { align: 'right' });
  }

  return doc.output('datauristring');
}

// ─── Download helper ──────────────────────────────────────────────────────────
export async function downloadQuotePdf(quote: StoredQuote): Promise<void> {
  const uri  = await generateQuotePdfBase64(quote);
  const link = document.createElement('a');
  link.href     = uri;
  link.download = `${quote.quoteNumber}.pdf`;
  link.click();
}
