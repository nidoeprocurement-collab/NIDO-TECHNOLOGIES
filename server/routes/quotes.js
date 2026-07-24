// ── Quotes Email Route ────────────────────────────────────────────────────────
// Sends a quotation email directly via Resend (bypasses DB-template system).
// Falls back gracefully if RESEND_API_KEY is not set.

import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const referenceQuotePdfPath = path.join(
  projectRoot,
  'attached_assets',
  'Nido_Tech_Estimate_EST-000011.pdf_(1)_1784916349699.pdf',
);

router.get('/reference-pdf', (_req, res) => {
  res.download(referenceQuotePdfPath, 'Nido_Tech_Estimate_EST-000011.pdf', (err) => {
    if (!err || res.headersSent) return;

    console.error('[quotes/reference-pdf] Failed to send reference PDF:', err);
    res.status(err.statusCode === 404 ? 404 : 500).json({
      error: 'The reference estimate PDF is unavailable.',
    });
  });
});

router.post('/send-email', async (req, res) => {
  const { to, quoteNumber, clientName, grandTotal, pdfBase64, companyName, senderEmail } = req.body;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'Email service not configured. Set RESEND_API_KEY to enable email sending.' });
  }

  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ success: false, error: 'No recipients specified.' });
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
  .company { font-size: 20px; font-weight: bold; color: #111; }
  h2 { color: #1d4ed8; }
  .info { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .info table { width: 100%; border-collapse: collapse; }
  .info td { padding: 6px 0; font-size: 14px; }
  .info td:first-child { color: #6b7280; width: 140px; }
  .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="company">${companyName || 'Nido Tech'}</div>
  </div>
  <h2>Quotation / Estimate</h2>
  <p>Dear ${clientName},</p>
  <p>Please find attached our estimate for your reference. We look forward to your valuable response.</p>
  <div class="info">
    <table>
      <tr><td>Estimate #</td><td><strong>${quoteNumber}</strong></td></tr>
      <tr><td>Total Amount</td><td><strong>₹${grandTotal}</strong></td></tr>
    </table>
  </div>
  <p>The estimate document is attached to this email as a PDF. Please review the details and feel free to reach out if you have any questions.</p>
  <p>Thank you for your business.</p>
  <div class="footer">
    <p>This is an automated email from ${companyName || 'Nido Tech'}.</p>
  </div>
</div>
</body>
</html>
`;

  const attachments = pdfBase64
    ? [{ filename: `${quoteNumber}.pdf`, content: pdfBase64.split(',').pop() || pdfBase64 }]
    : [];

  try {
    const payload = {
      from: senderEmail ? `${companyName} <${senderEmail}>` : 'onboarding@resend.dev',
      to: to,
      subject: `Estimate ${quoteNumber} from ${companyName || 'Nido Tech'}`,
      html: htmlBody,
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content })),
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[quotes/send-email] Resend error:', data);
      return res.status(502).json({ success: false, error: data.message || 'Failed to send email.' });
    }

    return res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[quotes/send-email] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while sending email.' });
  }
});

export default router;
