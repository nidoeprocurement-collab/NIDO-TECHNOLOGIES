export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
}

export interface InvoiceActivity {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface StoredInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  contactPerson: string;
  billingAddress: string;
  shippingAddress: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  payments: InvoicePayment[];
  activity: InvoiceActivity[];
  createdAt: string;
  updatedAt: string;
}

const STORE_KEY = 'nido_sales_invoices';

const SEED_INVOICES: StoredInvoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'INV-001',
    clientName: 'Tech Solutions Inc',
    contactPerson: 'Aarav Mehta',
    billingAddress: '14 Business Park, Bengaluru, Karnataka',
    shippingAddress: '14 Business Park, Bengaluru, Karnataka',
    invoiceDate: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'Paid',
    lineItems: [
      { id: 'inv-001-1', description: 'Managed IT support services', quantity: 1, rate: 12000, taxPercent: 18 },
      { id: 'inv-001-2', description: 'Network monitoring setup', quantity: 1, rate: 3000, taxPercent: 18 },
    ],
    subtotal: 15000,
    totalTax: 2700,
    grandTotal: 17700,
    notes: 'Thank you for your business.',
    payments: [{ id: 'pay-001', date: '2024-01-28', amount: 17700, method: 'Bank Transfer', reference: 'TXN-84721' }],
    activity: [
      { id: 'act-001-1', date: '2024-01-10', title: 'Invoice created', description: 'Invoice was created and issued to the client.' },
      { id: 'act-001-2', date: '2024-01-28', title: 'Payment received', description: 'Full payment received by bank transfer.' },
    ],
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-28T09:00:00.000Z',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'INV-002',
    clientName: 'Marketing Pro Agency',
    contactPerson: 'Maya Shah',
    billingAddress: '22 Linking Road, Mumbai, Maharashtra',
    shippingAddress: '22 Linking Road, Mumbai, Maharashtra',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'Pending',
    lineItems: [
      { id: 'inv-002-1', description: 'Corporate procurement services', quantity: 1, rate: 8500, taxPercent: 18 },
    ],
    subtotal: 8500,
    totalTax: 1530,
    grandTotal: 10030,
    notes: 'Payment is due within 30 days.',
    payments: [],
    activity: [
      { id: 'act-002-1', date: '2024-01-15', title: 'Invoice created', description: 'Invoice was created and issued to the client.' },
      { id: 'act-002-2', date: '2024-01-15', title: 'Invoice sent', description: 'Invoice email was sent to the client.' },
    ],
    createdAt: '2024-01-15T09:00:00.000Z',
    updatedAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'INV-003',
    clientName: 'Finance Corp',
    contactPerson: 'Rohan Kapoor',
    billingAddress: '8 Connaught Place, New Delhi',
    shippingAddress: '8 Connaught Place, New Delhi',
    invoiceDate: '2023-12-20',
    dueDate: '2024-01-20',
    status: 'Overdue',
    lineItems: [
      { id: 'inv-003-1', description: 'Annual procurement support plan', quantity: 1, rate: 22000, taxPercent: 18 },
    ],
    subtotal: 22000,
    totalTax: 3960,
    grandTotal: 25960,
    notes: 'Please contact accounts for payment queries.',
    payments: [],
    activity: [
      { id: 'act-003-1', date: '2023-12-20', title: 'Invoice created', description: 'Invoice was created and issued to the client.' },
      { id: 'act-003-2', date: '2024-01-21', title: 'Payment overdue', description: 'The payment due date has passed.' },
    ],
    createdAt: '2023-12-20T09:00:00.000Z',
    updatedAt: '2024-01-21T09:00:00.000Z',
  },
];

function seedInvoices(): StoredInvoice[] {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) return JSON.parse(stored) as StoredInvoice[];
    localStorage.setItem(STORE_KEY, JSON.stringify(SEED_INVOICES));
  } catch {
    // The app also renders in environments without localStorage.
  }
  return [...SEED_INVOICES];
}

export function getInvoices(): StoredInvoice[] {
  return seedInvoices();
}

export function getInvoiceById(id: string): StoredInvoice | undefined {
  return getInvoices().find((invoice) => invoice.id === id);
}

export function saveInvoice(invoice: StoredInvoice): void {
  const invoices = getInvoices();
  const index = invoices.findIndex((item) => item.id === invoice.id);
  if (index >= 0) invoices[index] = invoice;
  else invoices.unshift(invoice);
  localStorage.setItem(STORE_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event('nidoInvoicesUpdated'));
}

export function deleteInvoice(id: string): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(getInvoices().filter((invoice) => invoice.id !== id)));
  window.dispatchEvent(new Event('nidoInvoicesUpdated'));
}

export function generateInvoiceNumber(): string {
  const numbers = getInvoices()
    .map((invoice) => Number(invoice.invoiceNumber.replace(/\D/g, '')))
    .filter(Number.isFinite);
  const next = Math.max(0, ...numbers) + 1;
  return `INV-${String(next).padStart(3, '0')}`;
}