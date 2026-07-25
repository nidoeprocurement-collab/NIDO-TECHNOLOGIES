import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadConfig } from './configService';
import type { StoredInvoice } from './invoiceStore';

function fmt(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function downloadInvoicePdf(invoice: StoredInvoice): void {
  const org = loadConfig().organization;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const right = pageWidth - margin;
  const lineItems = invoice.lineItems.map((item, index) => {
    const taxable = item.quantity * item.rate;
    const tax = taxable * item.taxPercent / 100;
    return [
      String(index + 1),
      item.description,
      String(item.quantity),
      fmt(item.rate),
      fmt(taxable),
      `${item.taxPercent}%`,
      fmt(tax),
      fmt(taxable + tax),
    ];
  });

  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(28, 39, 56);
  doc.text(org.displayName || org.companyName || 'Nido Tech', margin, 52);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(105, 112, 123);
  doc.text(org.companyName || '', margin, 66);
  doc.text(org.registeredAddress || org.billingAddress || '', margin, 78);

  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(28, 39, 56);
  doc.text('INVOICE', right, 52, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(55, 62, 72);
  doc.text(invoice.invoiceNumber, right, 70, { align: 'right' });
  doc.text(`Invoice Date: ${invoice.invoiceDate}`, right, 84, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate}`, right, 98, { align: 'right' });

  doc.setDrawColor(218, 222, 228).line(margin, 116, right, 116);
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(31, 95, 190);
  doc.text('BILL TO', margin, 140);
  doc.text('SHIP TO', pageWidth / 2, 140);
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(28, 39, 56);
  doc.text(invoice.clientName, margin, 157);
  doc.text(invoice.clientName, pageWidth / 2, 157);
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(55, 62, 72);
  doc.text(invoice.billingAddress || '—', margin, 172);
  doc.text(invoice.shippingAddress || invoice.billingAddress || '—', pageWidth / 2, 172);

  autoTable(doc, {
    startY: 205,
    margin: { left: margin, right: margin },
    head: [['SL.NO', 'ITEM / DESCRIPTION', 'QTY', 'RATE', 'TAXABLE', 'GST', 'TAX', 'AMOUNT']],
    body: lineItems,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, textColor: [55, 62, 72], lineColor: [218, 222, 228], lineWidth: 0.35, cellPadding: 6 },
    headStyles: { fillColor: [248, 250, 252], textColor: [28, 39, 56], fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },
      1: { cellWidth: 170 },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 65, halign: 'right' },
      4: { cellWidth: 70, halign: 'right' },
      5: { cellWidth: 45, halign: 'center' },
      6: { cellWidth: 60, halign: 'right' },
      7: { cellWidth: 75, halign: 'right' },
    },
  });

  const finalY = ((doc as any).lastAutoTable?.finalY ?? 205) + 18;
  const summaryX = right - 230;
  const rows = [
    ['Sub Total', fmt(invoice.subtotal)],
    ['Total GST', fmt(invoice.totalTax)],
    ['Total Payable', fmt(invoice.grandTotal)],
  ];
  doc.setDrawColor(218, 222, 228).setFillColor(255, 255, 255);
  doc.roundedRect(summaryX, finalY, 230, rows.length * 24, 4, 4, 'FD');
  rows.forEach(([label, value], index) => {
    if (index === rows.length - 1) {
      doc.setFillColor(239, 246, 255).rect(summaryX + 0.5, finalY + index * 24, 229, 23.5, 'F');
    }
    doc.setFont('helvetica', index === rows.length - 1 ? 'bold' : 'normal').setFontSize(9).setTextColor(28, 39, 56);
    doc.text(label, summaryX + 10, finalY + index * 24 + 16);
    doc.text(value, right - 10, finalY + index * 24 + 16, { align: 'right' });
    if (index < rows.length - 1) doc.setDrawColor(218, 222, 228).line(summaryX, finalY + (index + 1) * 24, right, finalY + (index + 1) * 24);
  });

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(31, 95, 190);
    doc.text('NOTES', margin, finalY + 18);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(55, 62, 72);
    doc.text(doc.splitTextToSize(invoice.notes, 220), margin, finalY + 34);
  }

  doc.setDrawColor(218, 222, 228).line(margin, 790, right, 790);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(105, 112, 123);
  doc.text('Thank you for your business.', pageWidth / 2, 808, { align: 'center' });
  doc.save(`${invoice.invoiceNumber}.pdf`);
}