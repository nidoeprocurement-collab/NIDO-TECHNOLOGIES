import type { StoredInvoice } from './invoiceStore';
import { generateInvoicePdfBase64 } from './invoicePdf';
import { sendEmail } from './emailApi';

export type InvoiceEmailKind = 'invoice' | 'reminder';

export interface InvoiceEmailResult {
  recipients: string[];
  sentCount: number;
  success: boolean;
  error?: string;
}

export function getInvoiceRecipients(invoice: StoredInvoice): string[] {
  return Array.from(new Set(
    (invoice.clientContacts?.length
      ? invoice.clientContacts
      : (invoice.clientContact || '').split(','))
      .map((email) => email.trim())
      .filter(Boolean),
  ));
}

/**
 * Sends the same invoice PDF and invoice details for both initial delivery
 * and reminders. The template changes only for the reminder subject/body.
 */
export async function sendInvoiceEmail(
  invoice: StoredInvoice,
  kind: InvoiceEmailKind,
): Promise<InvoiceEmailResult> {
  const recipients = getInvoiceRecipients(invoice);
  if (recipients.length === 0) {
    return {
      recipients,
      sentCount: 0,
      success: false,
      error: 'No recipient email is configured for this invoice.',
    };
  }

  try {
    const pdfDataUri = await generateInvoicePdfBase64(invoice);
    const pdfBase64 = pdfDataUri.includes(',')
      ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1)
      : pdfDataUri;
    const templateKey = kind === 'reminder' ? 'payment_reminder' : 'invoice_generated';

    const results = await Promise.allSettled(recipients.map((to) => sendEmail({
      templateKey,
      to,
      variables: {
        client_name: invoice.clientName,
        invoice_number: invoice.invoiceNumber,
        amount: invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        due_date: invoice.dueDate,
        portal_url: `${window.location.origin}/sales/invoices/${invoice.id}`,
      },
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBase64 }],
      triggerModule: kind === 'reminder' ? 'invoice_reminder' : 'invoice_details',
    })));

    const sentCount = results.filter((result) =>
      result.status === 'fulfilled' &&
      result.value.success &&
      result.value.data?.success !== false,
    ).length;

    return {
      recipients,
      sentCount,
      success: sentCount === recipients.length,
      error: sentCount === 0 ? 'The email service did not accept the message.' : undefined,
    };
  } catch {
    return {
      recipients,
      sentCount: 0,
      success: false,
      error: 'The email service could not process the message.',
    };
  }
}