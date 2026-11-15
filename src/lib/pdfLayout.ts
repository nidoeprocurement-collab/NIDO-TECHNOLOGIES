import type jsPDF from 'jspdf';

/**
 * Ensures at least `neededHeight` points remain on the current PDF page.
 * If not, adds a new page and returns `margin` so subsequent blocks start
 * cleanly at the top of the new page with no empty gap or bottom-edge overlap.
 */
export function ensurePdfSpace(
  doc: jsPDF,
  currentY: number,
  neededHeight: number,
  margin: number,
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return currentY;
}

