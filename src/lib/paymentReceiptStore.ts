const STORE_KEY = "nido_payment_receipts";

export type PaymentMode = "Cash" | "Bank Transfer" | "Cheque" | "UPI" | "Credit Card" | "Debit Card" | "NEFT" | "RTGS" | "IMPS" | "Other";
export type PaymentStatus = "Received" | "Pending" | "Failed" | "Refunded";

export interface PaymentReceipt {
  id: string;
  paymentNo: string;
  date: string;
  customer: string;
  invoiceRef: string;
  mode: PaymentMode;
  status: PaymentStatus;
  amount: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export function getPaymentReceipts(): PaymentReceipt[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function savePaymentReceipt(receipt: PaymentReceipt): void {
  const all = getPaymentReceipts();
  const idx = all.findIndex((r) => r.id === receipt.id);
  if (idx >= 0) all[idx] = receipt;
  else all.unshift(receipt);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function generatePaymentNo(): string {
  const receipts = getPaymentReceipts();
  const next = receipts.length + 1;
  return `PR-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
}
