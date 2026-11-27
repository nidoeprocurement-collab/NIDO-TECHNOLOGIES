import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import type { InvoiceLineItem, StoredInvoice } from '@/lib/invoiceStore';

export interface DbVendorBillRow {
  id: string;
  bill_number: string;
  internal_reference: string | null;
  vendor_id: string | null;
  vendor_name: string;
  vendor_invoice_number: string | null;
  bill_date: string;
  due_date: string | null;
  purchase_order_id: string | null;
  po_number: string | null;
  goods_receipt_id: string | null;
  grn_number: string | null;
  subtotal: number | string;
  total_discount: number | string;
  taxable_amount: number | string;
  cgst_amount: number | string;
  sgst_amount: number | string;
  igst_amount: number | string;
  total_tax: number | string;
  additional_charges: number | string;
  tds_amount: number | string;
  grand_total: number | string;
  amount_paid: number | string;
  outstanding_balance: number | string;
  payment_terms: string | null;
  notes: string | null;
  attachments: unknown[];
  status: string;
  metadata: Record<string, unknown> | null;
  vendor_bill_items?: Array<Record<string, unknown>> | null;
}

export interface DbClientInvoiceRow {
  id: string;
  invoice_number: string;
  source_proforma_id: string | null;
  client_id: string | null;
  client_name: string;
  contact_person: string | null;
  client_gstin: string | null;
  client_contact: string | null;
  client_contacts: string[] | null;
  billing_address: string | null;
  shipping_address: string | null;
  place_of_supply: string | null;
  invoice_date: string;
  due_date: string | null;
  originating_order_number: string | null;
  po_reference: string | null;
  gross_subtotal: number | string;
  total_discount: number | string;
  subtotal: number | string;
  cgst_amount: number | string;
  sgst_amount: number | string;
  igst_amount: number | string;
  total_tax: number | string;
  shipping_charges: number | string;
  platform_fee: number | string;
  adjustment: number | string;
  grand_total: number | string;
  amount_received: number | string;
  outstanding_amount: number | string;
  payment_terms: string | null;
  terms_conditions: string | null;
  bank_snapshot: Record<string, string> | null;
  signature_snapshot: Record<string, string> | null;
  notes: string | null;
  status: StoredInvoice['status'];
  archived: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  client_invoice_items?: Array<Record<string, unknown>> | null;
}

export interface DbNoteRow {
  id: string;
  debit_note_number?: string;
  credit_note_number?: string;
  party_type: 'client' | 'vendor';
  client_id: string | null;
  vendor_id: string | null;
  party_name: string;
  invoice_id: string | null;
  bill_id: string | null;
  source_document_number: string | null;
  note_date: string;
  reason: string;
  taxable_value: number | string;
  gst_amount: number | string;
  total_amount: number | string;
  status: string;
  remarks: string | null;
}

export interface DbFinancialTransactionRow {
  id: string;
  transaction_reference: string;
  ledger_type: 'receivable' | 'payable';
  payment_type: string;
  payment_method: string;
  bank_account: string | null;
  utr_reference: string | null;
  payment_date: string;
  amount: number | string;
  currency: string;
  client_id: string | null;
  vendor_id: string | null;
  party_name: string;
  status: 'draft' | 'completed' | 'paid' | 'cancelled';
  notes: string | null;
  recorded_by: string;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export function mapDbInvoiceToStoredInvoice(row: DbClientInvoiceRow): StoredInvoice {
  const bank = row.bank_snapshot || {};
  const lineItems: InvoiceLineItem[] = (row.client_invoice_items || []).map((li, idx) => ({
    id: String(li.id || `item_${idx}`),
    description: String(li.description || ''),
    itemDetails: li.item_details ? String(li.item_details) : undefined,
    subOrderId: li.sub_order_id ? String(li.sub_order_id) : undefined,
    hsnSac: li.hsn_sac ? String(li.hsn_sac) : undefined,
    quantity: Number(li.quantity) || 1,
    rate: Number(li.rate) || 0,
    discount: Number(li.discount) || 0,
    discountPct: Number(li.discount_pct) || 0,
    taxPercent: Number(li.tax_percent) || 0,
    taxType: li.tax_type ? String(li.tax_type) : undefined,
  }));

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    sourceProformaId: row.source_proforma_id ?? undefined,
    archived: Boolean(row.archived),
    clientId: row.client_id ?? undefined,
    clientName: row.client_name,
    contactPerson: row.contact_person || '',
    clientGstin: row.client_gstin ?? undefined,
    clientContact: row.client_contact ?? undefined,
    clientContacts: Array.isArray(row.client_contacts) ? row.client_contacts : undefined,
    billingAddress: row.billing_address || '',
    shippingAddress: row.shipping_address || '',
    placeOfSupply: row.place_of_supply ?? undefined,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date || row.invoice_date,
    poReference: row.po_reference ?? undefined,
    originatingOrderId: row.originating_order_number ?? undefined,
    status: row.status,
    sentAt: row.sent_at ?? undefined,
    lineItems,
    grossSubtotal: Number(row.gross_subtotal) || 0,
    totalDiscount: Number(row.total_discount) || 0,
    subtotal: Number(row.subtotal) || 0,
    totalTax: Number(row.total_tax) || 0,
    shippingCharges: Number(row.shipping_charges) || 0,
    platformFee: Number(row.platform_fee) || 0,
    adjustment: Number(row.adjustment) || 0,
    grandTotal: Number(row.grand_total) || 0,
    notes: row.notes || '',
    termsConditions: row.terms_conditions ?? undefined,
    bankName: bank.bankName,
    bankAccountName: bank.bankAccountName,
    bankAccountNo: bank.bankAccountNo,
    bankIfsc: bank.bankIfsc,
    bankBranch: bank.bankBranch,
    payments: [],
    activity: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadVendorBillsFromSupabase(): Promise<DbVendorBillRow[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('vendor_bills')
    .select('*,vendor_bill_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Unable to load vendor bills.');
  return Array.isArray(data) ? (data as DbVendorBillRow[]) : [];
}

export async function saveVendorBillInSupabase(
  bill: Partial<DbVendorBillRow> & { bill_number: string; vendor_name: string },
  items: Array<Record<string, unknown>> = [],
): Promise<DbVendorBillRow> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('vendor_bills')
    .upsert(
      {
        bill_number: bill.bill_number,
        internal_reference: bill.internal_reference ?? null,
        vendor_id: bill.vendor_id && isSupabaseUuid(bill.vendor_id) ? bill.vendor_id : null,
        vendor_name: bill.vendor_name,
        vendor_invoice_number: bill.vendor_invoice_number ?? null,
        bill_date: bill.bill_date || new Date().toISOString().slice(0, 10),
        due_date: bill.due_date ?? null,
        po_number: bill.po_number ?? null,
        grn_number: bill.grn_number ?? null,
        subtotal: Number(bill.subtotal) || 0,
        total_discount: Number(bill.total_discount) || 0,
        taxable_amount: Number(bill.taxable_amount) || 0,
        cgst_amount: Number(bill.cgst_amount) || 0,
        sgst_amount: Number(bill.sgst_amount) || 0,
        igst_amount: Number(bill.igst_amount) || 0,
        total_tax: Number(bill.total_tax) || 0,
        additional_charges: Number(bill.additional_charges) || 0,
        tds_amount: Number(bill.tds_amount) || 0,
        grand_total: Number(bill.grand_total) || 0,
        payment_terms: bill.payment_terms ?? null,
        notes: bill.notes ?? null,
        status: bill.status || 'Draft',
        metadata: bill.metadata ?? {},
      },
      { onConflict: 'bill_number' },
    )
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Duplicate vendor invoice number for this vendor.');
    }
    throw new Error(error.message || 'Unable to save vendor bill.');
  }

  const saved = data as DbVendorBillRow;
  if (items.length > 0) {
    await supabase.from('vendor_bill_items').delete().eq('bill_id', saved.id);
    await supabase.from('vendor_bill_items').insert(
      items.map((it) => ({ ...it, bill_id: saved.id })),
    );
  }
  return saved;
}

export async function loadClientInvoicesFromSupabase(): Promise<StoredInvoice[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('client_invoices')
    .select('*,client_invoice_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Unable to load client invoices.');
  return (Array.isArray(data) ? (data as DbClientInvoiceRow[]) : []).map(mapDbInvoiceToStoredInvoice);
}

export async function saveClientInvoiceInSupabase(invoice: StoredInvoice): Promise<DbClientInvoiceRow> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('client_invoices')
    .upsert(
      {
        invoice_number: invoice.invoiceNumber,
        source_proforma_id: invoice.sourceProformaId && isSupabaseUuid(invoice.sourceProformaId) ? invoice.sourceProformaId : null,
        client_id: invoice.clientId && isSupabaseUuid(invoice.clientId) ? invoice.clientId : null,
        client_name: invoice.clientName,
        contact_person: invoice.contactPerson || null,
        client_gstin: invoice.clientGstin || null,
        client_contact: invoice.clientContact || null,
        client_contacts: invoice.clientContacts || [],
        billing_address: invoice.billingAddress || null,
        shipping_address: invoice.shippingAddress || null,
        place_of_supply: invoice.placeOfSupply || null,
        invoice_date: invoice.invoiceDate || new Date().toISOString().slice(0, 10),
        due_date: invoice.dueDate || null,
        originating_order_number: invoice.originatingOrderId || null,
        po_reference: invoice.poReference || null,
        gross_subtotal: invoice.grossSubtotal || 0,
        total_discount: invoice.totalDiscount || 0,
        subtotal: invoice.subtotal || 0,
        total_tax: invoice.totalTax || 0,
        shipping_charges: invoice.shippingCharges || 0,
        platform_fee: invoice.platformFee || 0,
        adjustment: invoice.adjustment || 0,
        grand_total: invoice.grandTotal || 0,
        terms_conditions: invoice.termsConditions || null,
        bank_snapshot: {
          bankName: invoice.bankName || '',
          bankAccountName: invoice.bankAccountName || '',
          bankAccountNo: invoice.bankAccountNo || '',
          bankIfsc: invoice.bankIfsc || '',
          bankBranch: invoice.bankBranch || '',
        },
        notes: invoice.notes || null,
        status: invoice.status,
        archived: Boolean(invoice.archived),
        sent_at: invoice.sentAt || null,
      },
      { onConflict: 'invoice_number' },
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message || 'Unable to save client invoice.');
  const saved = data as DbClientInvoiceRow;

  if (invoice.lineItems?.length) {
    await supabase.from('client_invoice_items').delete().eq('invoice_id', saved.id);
    await supabase.from('client_invoice_items').insert(
      invoice.lineItems.map((li) => ({
        invoice_id: saved.id,
        sub_order_id: li.subOrderId || null,
        description: li.description,
        item_details: li.itemDetails || null,
        hsn_sac: li.hsnSac || null,
        quantity: li.quantity,
        rate: li.rate,
        discount: li.discount || 0,
        discount_pct: li.discountPct || 0,
        tax_percent: li.taxPercent || 0,
        tax_type: li.taxType || null,
        line_total: (li.quantity * li.rate - (li.discount || 0)) * (1 + (li.taxPercent || 0) / 100),
      })),
    );
  }
  return saved;
}

export async function loadDebitNotesFromSupabase(): Promise<DbNoteRow[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('debit_notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Unable to load debit notes.');
  return Array.isArray(data) ? (data as DbNoteRow[]) : [];
}

export async function loadCreditNotesFromSupabase(): Promise<DbNoteRow[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('credit_notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Unable to load credit notes.');
  return Array.isArray(data) ? (data as DbNoteRow[]) : [];
}

export async function loadFinancialTransactionsFromSupabase(
  ledgerType?: 'receivable' | 'payable',
): Promise<DbFinancialTransactionRow[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('payment_date', { ascending: false });
  if (ledgerType) {
    query = query.eq('ledger_type', ledgerType);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Unable to load financial transactions.');
  return Array.isArray(data) ? (data as DbFinancialTransactionRow[]) : [];
}

export async function recordFinancialPaymentInSupabase(params: {
  ledgerType: 'receivable' | 'payable';
  paymentMethod: string;
  amount: number;
  partyName: string;
  status?: 'draft' | 'completed' | 'paid' | 'cancelled';
  idempotencyKey?: string;
  clientId?: string;
  vendorId?: string;
  billId?: string;
  invoiceId?: string;
  bankAccount?: string;
  utrReference?: string;
  paymentDate?: string;
  notes?: string;
  recordedBy?: string;
}): Promise<DbFinancialTransactionRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('record_financial_payment_atomic', {
    p_ledger_type: params.ledgerType,
    p_payment_method: params.paymentMethod,
    p_amount: params.amount,
    p_party_name: params.partyName,
    p_status: params.status ?? 'paid',
    p_idempotency_key: params.idempotencyKey ?? null,
    p_client_id: params.clientId && isSupabaseUuid(params.clientId) ? params.clientId : null,
    p_vendor_id: params.vendorId && isSupabaseUuid(params.vendorId) ? params.vendorId : null,
    p_bill_id: params.billId && isSupabaseUuid(params.billId) ? params.billId : null,
    p_invoice_id: params.invoiceId && isSupabaseUuid(params.invoiceId) ? params.invoiceId : null,
    p_bank_account: params.bankAccount ?? null,
    p_utr_reference: params.utrReference ?? null,
    p_payment_date: params.paymentDate ?? null,
    p_notes: params.notes ?? null,
    p_recorded_by: params.recordedBy ?? 'Finance Team',
  });
  if (error) {
    throw new Error(error.message || 'Unable to record financial payment.');
  }
  return data as DbFinancialTransactionRow;
}
