const STORE_KEY = "nido_payment_receipts_v3";
const COUNTER_KEY = "nido_payment_receipt_counter";
import { getPrefix } from "./configService";
import { supabase } from "./supabase";
import { recordFinancialPaymentInSupabase } from "./financeApi";

/** Returns the next configured payment number and increments the counter. */
export function getNextReceiptNumber(): string {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return `${getPrefix("payment") || "PMT-"}${String(next).padStart(6, "0")}`;
}

export interface PaymentReceipt {
  id: string;
  paymentNumber: string;
  customerName: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentMode: string;
  amountReceived: number;
  taxDeducted: "no" | "tds";
  status: "draft" | "paid";
  archived?: boolean;
  // optional extra fields stored by the form
  bankCharges?: string;
  depositTo?: string;
  reference?: string;
  note?: string;
  placeOfSupply?: string;
  descriptionOfSupply?: string;
  taxCode?: string;
  productType?: string;
  usersLicenses?: number;
  tenureBilling?: string;
  provisioningTime?: string;
  productDetails?: {
    description: string;
    digital: boolean;
    quantity: number;
    unitPrice: number;
    invoiceValue: number;
    tenureBilling?: string;
    provisioningTime?: string;
  }[];
  attachments?: PaymentReceiptAttachment[];
}

export interface PaymentReceiptAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadReceiptAttachment(attachment: PaymentReceiptAttachment): void {
  const link = document.createElement("a");
  link.href = attachment.dataUrl;
  link.download = attachment.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function getReceipts(): PaymentReceipt[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as PaymentReceipt[];
  } catch { /* ignore */ }
  return [];
}

export function getActiveReceipts(): PaymentReceipt[] {
  return getReceipts().filter((r) => !r.archived);
}

export function getArchivedReceipts(): PaymentReceipt[] {
  return getReceipts().filter((r) => !!r.archived);
}

export function saveReceipt(receipt: PaymentReceipt): void {
  const all = getReceipts();
  const idx = all.findIndex((r) => r.id === receipt.id);
  if (idx >= 0) all[idx] = receipt;
  else all.unshift(receipt);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
  try {
    if (typeof (supabase as { auth?: { getSession?: unknown } })?.auth?.getSession === "function") {
      void supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.id && receipt.amountReceived > 0) {
          void recordFinancialPaymentInSupabase({
            ledgerType: "receivable",
            paymentMethod: receipt.paymentMode || "Bank Transfer",
            amount: receipt.amountReceived,
            partyName: receipt.customerName,
            status: receipt.status === "paid" ? "paid" : "draft",
            idempotencyKey: `rcpt_${receipt.id}_${receipt.status}`,
            utrReference: receipt.reference,
            paymentDate: receipt.paymentDate,
            notes: receipt.note,
          }).catch(() => { });
        }
      });
    }
  } catch {
    // ignore in offline/test mode
  }
  window.dispatchEvent(new Event("nidoPaymentReceiptsUpdated"));
}

export function archiveReceipt(id: string): void {
  const all = getReceipts().map((r) =>
    r.id === id ? { ...r, archived: true } : r,
  );
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function getReceiptById(id: string): PaymentReceipt | undefined {
  return getReceipts().find((r) => r.id === id);
}

const THANK_YOU_OUTBOX_KEY = "nido_payment_receipt_email_outbox";

export interface PaymentReceiptEmailOutboxItem {
  id: string;
  receiptId: string;
  paymentNumber: string;
  recipients: string[];
  subject: string;
  amount: number;
  createdAt: string;
}

export function sendThankYouNoteEmail(
  receipt: PaymentReceipt,
  recipients: string[],
): { recipients: string[]; sentCount: number; success: boolean } {
  const uniqueRecipients = Array.from(
    new Set(recipients.map((email) => email.trim()).filter(Boolean)),
  );
  if (uniqueRecipients.length === 0) {
    return { recipients: [], sentCount: 0, success: false };
  }

  let outbox: PaymentReceiptEmailOutboxItem[] = [];
  try {
    outbox = JSON.parse(localStorage.getItem(THANK_YOU_OUTBOX_KEY) || "[]") as PaymentReceiptEmailOutboxItem[];
  } catch {
    outbox = [];
  }

  const item: PaymentReceiptEmailOutboxItem = {
    id: `${receipt.id}-thank-you-${Date.now()}`,
    receiptId: receipt.id,
    paymentNumber: receipt.paymentNumber,
    recipients: uniqueRecipients,
    subject: `Thank you for your payment — ${receipt.paymentNumber}`,
    amount: receipt.amountReceived,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(THANK_YOU_OUTBOX_KEY, JSON.stringify([item, ...outbox].slice(0, 100)));
  return { recipients: uniqueRecipients, sentCount: uniqueRecipients.length, success: true };
}
