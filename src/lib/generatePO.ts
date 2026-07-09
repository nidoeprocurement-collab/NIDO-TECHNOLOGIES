// ── Purchase Order PDF Generator ──────────────────────────────────────────────
// Generates a PDF that matches the sample PO format exactly.
// Uses jsPDF + jspdf-autotable (both already installed).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StoredPO } from "./purchaseOrderStore";

// ── Company constants (buyer) ─────────────────────────────────────────────────
const CO = {
  name: "Nido Technologies",
  addr1: "No. 41/1, 2nd Floor, 10th Cross,",
  addr2: "11th Main, Wilsongarden",
  city:  "Bangalore Karnataka 560027",
  country: "India",
  gstin: "29BPAPP1867G1ZN",
};

// ── Standard Terms & Conditions ───────────────────────────────────────────────
const TERMS = [
  "Payment of 30% will released post approval of the PO, once PO signed copy release, and 40% to be released against approval of trail Component, rest 30% to be released on trail of 1000 components within 30 days from the Tool Submission date.",
  "The tool design shall be reviewed, optimum strip utilization to be ensured and the tool should be robust in construction.",
  "Fool proofing of assembly.",
  "The tool should be using inserts, including pillar bush sets that can be changed after it is worn out or damaged.",
  "Samples to be submitted by 28-06-21, along with the CMM and manual reports of quality.",
  "Please plan RM in advance to meet EDT.",
  "Post approval from the client any thing will be cleared",
  "PO should be accepted within 2 days, pending will be considered as cancelled.",
];

const NOTE_TEXT =
  "Delivery Time for this project is 17 Days from the PO date; delay in submission\n" +
  "will impact to penalty of 1% from Grand total amount per day. Daily Progress\n" +
  "update is mandatory.\n" +
  "Consider all verbal changes as per the conversation's.";

// Indian number formatting without ₹ symbol (font may not have the glyph)
function fmt(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Main generator ────────────────────────────────────────────────────────────
export function generatePOPdf(po: StoredPO): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210;
  const L = 14; // left margin
  const R = W - L; // right edge

  let y = 14;

  // ── 1. Company header — right-aligned ──────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(CO.name, R, y, { align: "right" });
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (const line of [CO.addr1, CO.addr2, CO.city, CO.country, `GSTIN ${CO.gstin}`]) {
    doc.text(line, R, y, { align: "right" });
    y += 4.5;
  }
  y += 6;

  // ── 2. "PURCHASE ORDER" title — centered ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PURCHASE ORDER", W / 2, y, { align: "center" });
  y += 9;

  // ── 3. Vendor Address (left) | PO meta (right) ────────────────────────────
  const metaLabelX = 128;
  const metaValX   = R;

  // "Vendor Address" heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Vendor Address", L, y);

  // PO # label + value
  doc.text("Purchase Order#", metaLabelX, y);
  doc.setFont("helvetica", "normal");
  doc.text(po.poNumber, metaValX, y, { align: "right" });
  y += 5;

  // Vendor name (bold) + Date (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Date", metaLabelX, y);
  doc.setFont("helvetica", "normal");
  doc.text(po.createdOnDisplay, metaValX, y, { align: "right" });

  // Vendor name on left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(po.vendorName, L, y);
  y += 5;

  // Vendor address lines
  const addrLines = [
    po.vendorAddressLine1,
    po.vendorAddressLine2,
    po.vendorCity,
    po.vendorPincode ? `${po.vendorPincode} ${po.vendorState}` : po.vendorState,
    "India",
    po.vendorGstin ? `GSTIN ${po.vendorGstin}` : "",
  ].filter(Boolean);

  for (const line of addrLines) {
    doc.text(line, L, y);
    y += 4.5;
  }
  y += 6;

  // ── 4. Deliver To ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Deliver To", L, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  for (const line of [CO.name, CO.addr1, CO.addr2, CO.city, CO.country, `GSTIN ${CO.gstin}`]) {
    doc.text(line, L, y);
    y += 4.5;
  }
  y += 6;

  // ── 5. Items table ─────────────────────────────────────────────────────────
  // Support both multi-item POs (po.items[]) and legacy single-item POs
  const tableBody =
    po.items && po.items.length > 0
      ? po.items.map((li, i) => [
          String(i + 1),
          li.referenceNumber ? `${li.item}\nRef/Model No: ${li.referenceNumber}` : li.item,
          li.hsnCode || "",
          `${li.qty.toFixed(2)}\nNos`,
          fmt(li.unitPrice),
          fmt(li.lineSubtotal),
        ])
      : [["1", po.referenceNumber ? `${po.item}\nRef/Model No: ${po.referenceNumber}` : po.item, po.hsnCode || "", `${po.qty.toFixed(2)}\nNos`, fmt(po.unitPrice), fmt(po.subtotal)]];

  autoTable(doc, {
    startY: y,
    head: [["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "Amount"]],
    body: tableBody,
    margin: { left: L, right: L },
    theme: "grid",
    headStyles: {
      fontSize: 8.5,
      fontStyle: "bold",
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [180, 180, 180],
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      lineColor: [200, 200, 200],
      cellPadding: 3,
      minCellHeight: 12,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── 6. Note (left) + Sub-totals (right) ───────────────────────────────────
  const noteLines = doc.splitTextToSize(NOTE_TEXT, 95);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(noteLines, L, y);

  // Totals block — right side
  const totLabelX = 130;
  const totValX   = R;
  let ty = y;

  const rows: [string, string][] = [
    ["Sub Total",                    fmt(po.subtotal)],
    [`SGST${po.sgstPct} (${po.sgstPct}%)`, fmt(po.sgstAmt)],
    [`CGST${po.cgstPct} (${po.cgstPct}%)`, fmt(po.cgstAmt)],
  ];

  doc.setFontSize(8.5);
  for (const [label, val] of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(label, totLabelX, ty);
    doc.text(val, totValX, ty, { align: "right" });
    ty += 6;
  }

  // Grand Total (bold)
  doc.setFont("helvetica", "bold");
  doc.text("Total", totLabelX, ty);
  doc.text(`Rs.${fmt(po.grandTotal)}`, totValX, ty, { align: "right" });
  ty += 4;

  // Move y past whichever block is taller
  y = Math.max(y + noteLines.length * 4, ty) + 8;

  // ── 7. Terms & Conditions ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Terms & Conditions", L, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (let i = 0; i < TERMS.length; i++) {
    const lines = doc.splitTextToSize(`${i + 1}. ${TERMS[i]}`, W - L * 2);
    // Start a new page if we're running out of space
    if (y + lines.length * 4.2 > 282) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, L, y);
    y += lines.length * 4.2 + 1;
  }

  y += 8;

  // ── 8. Authorized Signature ────────────────────────────────────────────────
  if (y > 270) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Authorized Signature", L, y);

  // Page number bottom-right
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(p), R, 290, { align: "right" });
  }

  return doc;
}

/** Trigger a browser download of the PO PDF. */
export function downloadPOPdf(po: StoredPO): void {
  const doc = generatePOPdf(po);
  doc.save(`${po.poNumber}.pdf`);
}

/** Return the PDF as a base64 data-URI string (for storing in the document list). */
export function getPODataUri(po: StoredPO): string {
  const doc = generatePOPdf(po);
  return doc.output("datauristring");
}
