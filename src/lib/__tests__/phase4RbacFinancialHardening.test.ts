import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { getModuleKeyForPath } from "@/lib/routePermissions";

describe("Phase 4.2 RBAC & Financial RLS Hardening", () => {
  it("maps credit note and debit note routes to credit_notes and debit_notes before generic sales routes", () => {
    expect(getModuleKeyForPath("/sales/credit-notes")).toBe("credit_notes");
    expect(getModuleKeyForPath("/sales/credit-notes/create")).toBe("credit_notes");
    expect(getModuleKeyForPath("/sales/credit-notes/cn-123/edit")).toBe("credit_notes");
    expect(getModuleKeyForPath("/credit-notes")).toBe("credit_notes");

    expect(getModuleKeyForPath("/sales/debit-notes")).toBe("debit_notes");
    expect(getModuleKeyForPath("/sales/debit-notes/dn-123")).toBe("debit_notes");
    expect(getModuleKeyForPath("/client-debit-notes")).toBe("debit_notes");

    expect(getModuleKeyForPath("/sales/payment-receipts")).toBe("sales");
    expect(getModuleKeyForPath("/payment-receipts")).toBe("sales");
    expect(getModuleKeyForPath("/sales/invoices")).toBe("invoices");
    expect(getModuleKeyForPath("/invoices")).toBe("invoices");
    expect(getModuleKeyForPath("/bills")).toBe("bills");
    expect(getModuleKeyForPath("/payments-made")).toBe("purchases");
    expect(getModuleKeyForPath("/vendor-credits")).toBe("purchases");
  });

  it("enforces System Administrator IT-only alignment and granular financial RLS/RPC policies in migration 23", () => {
    const sqlPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000023_phase4_rbac_financial_rls_hardening.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("WHERE name = 'System Administrator'");
    expect(sql).toContain("AND module_key IN ('sales', 'credit_notes', 'debit_notes', 'finance')");
    expect(sql).toContain("'vendors'");
    expect(sql).toContain("'bills'");
    expect(sql).toContain("'invoices'");
    expect(sql).toContain("'purchase_orders'");

    // Granular policies on all 11 financial tables without nonexistent 'finance' module
    for (const tbl of [
      "vendor_bills",
      "vendor_bill_items",
      "client_invoices",
      "client_invoice_items",
      "credit_notes",
      "credit_note_items",
      "debit_notes",
      "debit_note_items",
      "financial_transactions",
      "payment_allocations",
      "financial_document_status_history",
    ]) {
      expect(sql).toContain(`ON public.${tbl}`);
    }
    expect(sql).not.toContain("app.has_nido_permission('finance'");

    // SECURITY DEFINER payment RPC enforces module-level edit permission
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.record_financial_payment_atomic");
    expect(sql).toContain("SET search_path = pg_catalog, public");
    expect(sql).toContain("app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('purchases', 'edit')");
    expect(sql).toContain("app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('sales', 'edit')");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.record_financial_payment_atomic");
  });
});

