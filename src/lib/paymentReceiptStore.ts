const STORE_KEY = "nido_payment_receipts_v3";
const COUNTER_KEY = "nido_payment_receipt_counter";

/** Returns the next serial payment number like PR-000001 and increments the counter. */
export function getNextReceiptNumber(): string {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return `PR-${String(next).padStart(6, "0")}`;
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
