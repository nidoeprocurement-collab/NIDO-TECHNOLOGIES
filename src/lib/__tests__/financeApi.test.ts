import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  loadClientInvoicesFromSupabase,
  loadCreditNotesFromSupabase,
  loadDebitNotesFromSupabase,
  loadFinancialTransactionsFromSupabase,
  loadVendorBillsFromSupabase,
  recordFinancialPaymentInSupabase,
  saveClientInvoiceInSupabase,
  saveVendorBillInSupabase,
} from "@/lib/financeApi";
import type { StoredInvoice } from "@/lib/invoiceStore";

describe("financeApi & Wave 2.4 Finance/Accounts RLS", () => {
  const vendorUuid1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const billUuid1 = "10101010-1010-4010-8010-101010101010";
  const invUuid1 = "20202020-2020-4020-8020-202020202020";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("saves and loads vendor bills and prevents duplicate vendor invoice numbers (23505)", async () => {
    const sampleBill = {
      id: billUuid1,
      bill_number: "BILL-1001",
      internal_reference: null,
      vendor_id: vendorUuid1,
      vendor_name: "Apex Supplies",
      vendor_invoice_number: "APX-INV-01",
      bill_date: "2026-11-26",
      due_date: "2026-12-26",
      purchase_order_id: null,
      po_number: "PO-1001",
      goods_receipt_id: null,
      grn_number: "GRN-00001",
      subtotal: 52000,
      total_discount: 0,
      taxable_amount: 52000,
      cgst_amount: 4680,
      sgst_amount: 4680,
      igst_amount: 0,
      total_tax: 9360,
      additional_charges: 0,
      tds_amount: 0,
      grand_total: 61360,
      amount_paid: 0,
      outstanding_balance: 61360,
      payment_terms: "NET 30",
      notes: null,
      attachments: [],
      status: "Approved",
      metadata: {},
      vendor_bill_items: [],
    };

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [sampleBill], error: null }) })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: sampleBill, error: null }) })),
      })),
    }));

    const loaded = await loadVendorBillsFromSupabase();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].grand_total).toBe(61360);

    const saved = await saveVendorBillInSupabase({
      bill_number: "BILL-1001",
      vendor_id: vendorUuid1,
      vendor_name: "Apex Supplies",
      vendor_invoice_number: "APX-INV-01",
      grand_total: 61360,
    });
    expect(saved.bill_number).toBe("BILL-1001");

    // Duplicate vendor invoice number
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          }),
        })),
      })),
    }));
    await expect(
      saveVendorBillInSupabase({
        bill_number: "BILL-1002",
        vendor_id: vendorUuid1,
        vendor_name: "Apex Supplies",
        vendor_invoice_number: "APX-INV-01",
      }),
    ).rejects.toThrow(/Duplicate vendor invoice/i);
  });

  it("saves and loads client invoices with GST, bank snapshot, and credit/debit notes", async () => {
    const sampleInvRow = {
      id: invUuid1,
      invoice_number: "INV-1001",
      source_proforma_id: null,
      client_id: clientUuid1,
      client_name: "Beta Corp",
      contact_person: "Pavan",
      client_gstin: "29ABCDE1234F1Z5",
      client_contact: "pavan@betacorp.example.com",
      client_contacts: ["pavan@betacorp.example.com"],
      billing_address: "Bengaluru",
      shipping_address: "Bengaluru",
      place_of_supply: "Karnataka (29)",
      invoice_date: "2026-11-26",
      due_date: "2026-12-26",
      originating_order_number: "ORD-000001",
      po_reference: "PO-1001",
      gross_subtotal: 55000,
      total_discount: 0,
      subtotal: 55000,
      cgst_amount: 4950,
      sgst_amount: 4950,
      igst_amount: 0,
      total_tax: 9900,
      shipping_charges: 0,
      platform_fee: 0,
      adjustment: 0,
      grand_total: 64900,
      amount_received: 0,
      outstanding_amount: 64900,
      payment_terms: "NET 30",
      terms_conditions: "Standard Terms",
      bank_snapshot: { bankName: "HDFC Bank", bankAccountNo: "50200012345678", bankIfsc: "HDFC0001234" },
      signature_snapshot: {},
      notes: "",
      status: "Sent" as const,
      archived: false,
      sent_at: null,
      created_at: "2026-11-26T10:00:00Z",
      updated_at: "2026-11-26T10:00:00Z",
      client_invoice_items: [
        {
          id: "li-1",
          description: "Enterprise Laptop Pro",
          quantity: 1,
          rate: 55000,
          discount: 0,
          tax_percent: 18,
          tax_type: "CGST+SGST",
        },
      ],
    };

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "client_invoice_items") {
        return {
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "credit_notes" || table === "debit_notes") {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "note-1",
                  credit_note_number: "CN-1001",
                  debit_note_number: "DN-1001",
                  party_type: "client",
                  client_id: clientUuid1,
                  vendor_id: null,
                  party_name: "Beta Corp",
                  invoice_id: invUuid1,
                  bill_id: null,
                  source_document_number: "INV-1001",
                  note_date: "2026-11-26",
                  reason: "Price adjustment",
                  taxable_value: 1000,
                  gst_amount: 180,
                  total_amount: 1180,
                  status: "Issued",
                  remarks: null,
                },
              ],
              error: null,
            }),
          })),
        };
      }
      return {
        select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [sampleInvRow], error: null }) })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: sampleInvRow, error: null }) })),
        })),
      };
    });

    const loaded = await loadClientInvoicesFromSupabase();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].grandTotal).toBe(64900);
    expect(loaded[0].bankName).toBe("HDFC Bank");

    const inv: StoredInvoice = {
      ...loaded[0],
    };
    const saved = await saveClientInvoiceInSupabase(inv);
    expect(saved.invoice_number).toBe("INV-1001");

    const cns = await loadCreditNotesFromSupabase();
    const dns = await loadDebitNotesFromSupabase();
    expect(cns).toHaveLength(1);
    expect(dns).toHaveLength(1);
  });

  it("records atomic AR/AP payments, blocks overpayment, and enforces internal finance RLS", async () => {
    const sampleTxn = {
      id: "txn-uuid-1",
      transaction_reference: "TXN-01001",
      ledger_type: "payable" as const,
      payment_type: "Payment",
      payment_method: "NEFT",
      bank_account: "HDFC",
      utr_reference: "UTR123456",
      payment_date: "2026-11-26",
      amount: 30000,
      currency: "INR",
      client_id: null,
      vendor_id: vendorUuid1,
      party_name: "Apex Supplies",
      status: "paid" as const,
      notes: "Partial payment",
      recorded_by: "Finance Team",
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleTxn, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "22023", message: "Payment (90000) exceeds outstanding bill balance" },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42501", message: "Forbidden: internal NIDO finance authorization required" },
      });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [sampleTxn], error: null }),
        })),
      })),
    }));

    const txn = await recordFinancialPaymentInSupabase({
      ledgerType: "payable",
      paymentMethod: "NEFT",
      amount: 30000,
      partyName: "Apex Supplies",
      billId: billUuid1,
      vendorId: vendorUuid1,
      idempotencyKey: "pmt-idem-1",
    });
    expect(txn.transaction_reference).toBe("TXN-01001");

    await expect(
      recordFinancialPaymentInSupabase({
        ledgerType: "payable",
        paymentMethod: "NEFT",
        amount: 90000,
        partyName: "Apex Supplies",
        billId: billUuid1,
      }),
    ).rejects.toThrow(/exceeds outstanding bill balance/i);

    await expect(
      recordFinancialPaymentInSupabase({
        ledgerType: "receivable",
        paymentMethod: "UPI",
        amount: 1000,
        partyName: "Unauthorized",
      }),
    ).rejects.toThrow(/internal NIDO finance authorization required/i);

    const list = await loadFinancialTransactionsFromSupabase("payable");
    expect(list).toHaveLength(1);
  });

  it("enforces RLS, document sequences, and atomic payment RPC in Wave 2.4 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000018_phase3_finance_accounts.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.vendor_bills");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_invoices");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.debit_notes");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.credit_notes");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.financial_transactions");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.payment_allocations");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.financial_document_status_history");
    expect(sql).toContain("record_financial_payment_atomic");
    expect(sql).toContain("REVOKE ALL ON TABLE public.vendor_bills FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.client_invoices FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.financial_transactions FROM PUBLIC, anon");
    expect(sql).toContain("app.current_client_id()");
  });
});
