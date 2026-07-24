const referenceQuotePdfUrl = '/api/quotes/reference-pdf';

export function downloadReferenceQuotePdf(): void {
  const link = document.createElement('a');
  link.href = referenceQuotePdfUrl;
  link.download = 'Nido_Tech_Estimate_EST-000011.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
}