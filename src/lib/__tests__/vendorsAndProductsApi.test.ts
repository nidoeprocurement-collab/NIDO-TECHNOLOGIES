import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  archiveVendorInSupabase,
  createVendorInSupabase,
  deleteVendorInSupabase,
  loadVendorsFromSupabase,
  migrateLocalVendorsToSupabaseIfNeeded,
  updateVendorInSupabase,
} from "@/lib/vendorsApi";
import {
  assignVendorProductsInSupabase,
  loadVendorProductsFromSupabase,
  migrateLocalVendorProductsToSupabaseIfNeeded,
  removeVendorProductInSupabase,
  updateVendorProductInSupabase,
} from "@/lib/vendorProductsApi";
import type { StoredVendor } from "@/lib/vendorDataStore";
import type { VendorProduct } from "@/lib/vendorStore";

describe("vendorsApi, vendorProductsApi & Phase 3 Wave 1.2 RLS migration", () => {
  const vendorUuid1 = "11111111-1111-4111-8111-111111111111";
  const vendorUuid2 = "22222222-2222-4222-8222-222222222222";
  const masterUuid1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  const sampleVendorRow = {
    id: vendorUuid1,
    vendor_code: "VND-1006",
    name: "Apex Industrial Supplies",
    legal_business_name: "Apex Industrial Supplies Pvt Ltd",
    vendor_type: "Manufacturer",
    category: "IT Hardware",
    primary_contact: "Rohan Mehta",
    email: "rohan@apex.example.com",
    phone: "+91 9876543210",
    website: "https://apex.example.com",
    rating: 4.5,
    region: "Karnataka",
    status: "Active",
    onboarding_status: "Active",
    onboarded_date: "26 Nov 2026",
    archived: false,
    archived_on: null,
    month_spend: 0,
    total_spend: 0,
    score: 4.5,
    compliance_issues: 0,
    address: "100 MG Road, Bengaluru",
    address_line1: "100 MG Road",
    address_line2: null,
    city: "Bengaluru",
    state: "Karnataka",
    zip_code: "560001",
    country: "India",
    billing_address_line1: "100 MG Road",
    billing_address_line2: null,
    billing_city: "Bengaluru",
    billing_state: "Karnataka",
    billing_zip: "560001",
    billing_country: "India",
    shipping_address_line1: "100 MG Road",
    shipping_address_line2: null,
    shipping_city: "Bengaluru",
    shipping_state: "Karnataka",
    shipping_zip: "560001",
    shipping_country: "India",
    registration_no: "REG-1006",
    tax_id: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    founded: "2018",
    employees: "50-100",
    annual_revenue: "10 Cr",
    bank_name: "HDFC Bank",
    bank_account: "50200012345678",
    ifsc_code: "HDFC0000123",
    payment_terms: "NET 30",
    currency: "INR - Indian Rupee",
    credit_limit: "2500000",
    compliance_docs: [],
    metadata: {},
    created_at: "2026-11-26T06:00:00Z",
    updated_at: "2026-11-26T06:00:00Z",
  };

  const sampleVendorProductRow = {
    id: "99999999-9999-4999-8999-999999999999",
    vendor_id: vendorUuid1,
    master_catalogue_item_id: masterUuid1,
    vendor_product_code: "VPC-000101",
    vendor_sku: "APX-LAP-01",
    price: 54500,
    currency: "INR",
    moq: 2,
    lead_time: "5 Days",
    physical_stock: 25,
    reserved_stock: 3,
    incoming_stock: 10,
    handling_charge: 150,
    delivery_charge: 250,
    other_charge: 0,
    tax_percentage: 18,
    terms: "NET 30",
    variations: [],
    digital_availability: null,
    status: "Active" as const,
    last_stock_update: "2026-11-26T06:00:00Z",
    added_at: "26 Nov 2026",
    master_catalogue_items: {
      id: masterUuid1,
      master_product_code: "MPC-2026-000001",
      sku_code: "SKU-LAP-01",
      product_name: "Enterprise Laptop Pro",
      category: "IT Hardware",
      brand: "Dell",
      physical_type: "Physical Product",
      images: [],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads vendors from Supabase and updates localStorage cache", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [sampleVendorRow], error: null });
    const selectMock = vi.fn(() => ({ order: orderMock }));
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: selectMock,
    }));

    const vendors = await loadVendorsFromSupabase();
    expect(vendors).toHaveLength(1);
    expect(vendors[0].id).toBe(vendorUuid1);
    expect(vendors[0].vendorCode).toBe("VND-1006");
    expect(vendors[0].name).toBe("Apex Industrial Supplies");
    expect(vendors[0].status).toBe("Active");
  });

  it("creates, updates, archives, and deletes vendors in Supabase", async () => {
    const singleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleVendorRow, error: null })
      .mockResolvedValueOnce({
        data: { ...sampleVendorRow, status: "On Hold" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ...sampleVendorRow, archived: true, archived_on: "26 Nov 2026" },
        error: null,
      });

    const selectAfterMutation = vi.fn(() => ({ single: singleMock }));
    const eqForUpdate = vi.fn(() => ({ select: selectAfterMutation }));
    const eqForDelete = vi.fn().mockResolvedValue({ error: null });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: vi.fn(() => ({ select: selectAfterMutation })),
      update: vi.fn(() => ({ eq: eqForUpdate })),
      delete: vi.fn(() => ({ eq: eqForDelete })),
    }));

    const created = await createVendorInSupabase({
      id: "VND-1006",
      vendorCode: "VND-1006",
      name: "Apex Industrial Supplies",
      category: "IT Hardware",
      primaryContact: "Rohan Mehta",
      email: "rohan@apex.example.com",
      rating: 4.5,
      region: "Karnataka",
      status: "Active",
      onboardedDate: "26 Nov 2026",
      monthSpend: 0,
      score: 4.5,
      address: "100 MG Road, Bengaluru",
    });
    expect(created.id).toBe(vendorUuid1);

    const updated = await updateVendorInSupabase(vendorUuid1, { status: "On Hold" });
    expect(updated?.status).toBe("On Hold");

    const archived = await archiveVendorInSupabase(vendorUuid1, true);
    expect(archived?.archived).toBe(true);

    await expect(deleteVendorInSupabase(vendorUuid1)).resolves.toBeUndefined();
  });

  it("surfaces duplicate vendor code (23505) and FK restriction (23503) errors clearly", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const eqForDelete = vi.fn().mockResolvedValue({
      error: { code: "23503", message: "update or delete on table \"vendors\" violates foreign key constraint" },
    });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: singleMock })) })),
      delete: vi.fn(() => ({ eq: eqForDelete })),
    }));

    await expect(
      createVendorInSupabase({
        id: "VND-1006",
        vendorCode: "VND-1006",
        name: "Duplicate Vendor",
        category: "IT Hardware",
        primaryContact: "Test",
        email: "dup@example.com",
        rating: 4,
        region: "Karnataka",
        status: "Active",
        onboardedDate: "26 Nov 2026",
        monthSpend: 0,
        score: 4,
        address: "Bengaluru",
      }),
    ).rejects.toThrow(/already exists/i);

    await expect(deleteVendorInSupabase(vendorUuid1)).rejects.toThrow(/assigned products or references/i);
  });

  it("assigns one master product to multiple vendors, updates pricing/stock, and removes cleanly", async () => {
    const rowForVendor2 = {
      ...sampleVendorProductRow,
      id: "88888888-8888-4888-8888-888888888888",
      vendor_id: vendorUuid2,
      vendor_product_code: "VPC-000102",
      price: 53900,
    };

    const selectAfterInsert = vi
      .fn()
      .mockResolvedValueOnce({ data: [sampleVendorProductRow], error: null })
      .mockResolvedValueOnce({ data: [rowForVendor2], error: null });

    const singleAfterUpdate = vi.fn().mockResolvedValue({
      data: { ...sampleVendorProductRow, price: 52000, moq: 5, lead_time: "3 Days", physical_stock: 40 },
      error: null,
    });
    const eqSecondUpdate = vi.fn(() => ({ select: vi.fn(() => ({ single: singleAfterUpdate })) }));
    const eqFirstUpdate = vi.fn(() => ({ eq: eqSecondUpdate }));

    const eqSecondDelete = vi.fn().mockResolvedValue({ error: null });
    const eqFirstDelete = vi.fn(() => ({ eq: eqSecondDelete }));

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: vi.fn(() => ({ select: selectAfterInsert })),
      update: vi.fn(() => ({ eq: eqFirstUpdate })),
      delete: vi.fn(() => ({ eq: eqFirstDelete })),
    }));

    const baseProduct: VendorProduct = {
      id: masterUuid1,
      vendorId: vendorUuid1,
      masterProductCode: "MPC-2026-000001",
      skuCode: "SKU-LAP-01",
      productName: "Enterprise Laptop Pro",
      category: "IT Hardware",
      brand: "Dell",
      physicalType: "Physical Product",
      images: [],
      price: "54500",
      moq: "2",
      leadTime: "5 Days",
      stock: "25",
      vendorProductCode: "VPC-000101",
      addedAt: "26 Nov 2026",
      status: "Active",
    };

    const assigned1 = await assignVendorProductsInSupabase(vendorUuid1, [baseProduct]);
    const assigned2 = await assignVendorProductsInSupabase(vendorUuid2, [
      { ...baseProduct, vendorId: vendorUuid2, vendorProductCode: "VPC-000102", price: "53900" },
    ]);

    expect(assigned1[0].id).toBe(masterUuid1);
    expect(assigned1[0].vendorId).toBe(vendorUuid1);
    expect(assigned2[0].id).toBe(masterUuid1);
    expect(assigned2[0].vendorId).toBe(vendorUuid2);
    expect(assigned2[0].price).toBe("53900");

    const updated = await updateVendorProductInSupabase(vendorUuid1, masterUuid1, {
      price: "52000",
      moq: "5",
      leadTime: "3 Days",
      stock: "40",
    });
    expect(updated?.price).toBe("52000");
    expect(updated?.moq).toBe("5");
    expect(updated?.stock).toBe("40");

    await expect(removeVendorProductInSupabase(vendorUuid1, masterUuid1)).resolves.toBeUndefined();
  });

  it("denies unauthorized/client-portal access (RLS 42501)", async () => {
    const rlsError = {
      data: null,
      error: { code: "42501", message: "new row violates row-level security policy" },
    };
    const orderMock = vi.fn(() => {
      const thenable = {
        eq: vi.fn().mockResolvedValue(rlsError),
        then: (resolve: (val: typeof rlsError) => unknown) => Promise.resolve(rlsError).then(resolve),
      };
      return thenable;
    });
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
    }));

    await expect(loadVendorsFromSupabase()).rejects.toThrow(/row-level security|permission denied/i);
    await expect(loadVendorProductsFromSupabase(vendorUuid1)).rejects.toThrow(/permission|row-level security/i);
  });

  it("migrates custom local vendors and vendor products idempotently", async () => {
    const customVendor: StoredVendor = {
      id: "VND-1099",
      vendorCode: "VND-1099",
      name: "Custom Local Vendor",
      category: "Office Supplies",
      primaryContact: "Anita Rao",
      email: "anita@local.example.com",
      rating: 4,
      region: "Maharashtra",
      status: "Active",
      onboardedDate: "26 Nov 2026",
      monthSpend: 0,
      score: 4,
      address: "Mumbai",
    };
    localStorage.setItem(
      "nido_catalog_products_v1",
      JSON.stringify([
        {
          id: masterUuid1,
          masterProductCode: "MPC-2026-000001",
          skuCode: "SKU-LAP-01",
          productName: "Enterprise Laptop Pro",
          category: "IT Hardware",
          brand: "Dell",
          physicalType: "Physical Product",
          publishStatus: "published",
          images: [],
        },
      ]),
    );
    localStorage.setItem("nido_vendors_v2", JSON.stringify([customVendor]));
    localStorage.setItem(
      "nido_vendor_products_v1",
      JSON.stringify([
        {
          id: masterUuid1,
          vendorId: "VND-1099",
          masterProductCode: "MPC-2026-000001",
          skuCode: "SKU-LAP-01",
          productName: "Enterprise Laptop Pro",
          category: "IT Hardware",
          brand: "Dell",
          physicalType: "Physical Product",
          images: [],
          price: "50000",
          moq: "1",
          leadTime: "4 Days",
          stock: "12",
          vendorProductCode: "VPC-000999",
          addedAt: "26 Nov 2026",
          status: "Active",
        },
      ]),
    );

    const orderMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ ...sampleVendorRow, id: vendorUuid1, vendor_code: "VND-1099" }], error: null });
    const singleMock = vi.fn().mockResolvedValue({
      data: { ...sampleVendorRow, id: vendorUuid1, vendor_code: "VND-1099", name: "Custom Local Vendor" },
      error: null,
    });
    const insertSelectMock = vi.fn().mockResolvedValue({
      data: [sampleVendorProductRow],
      error: null,
    });

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "vendor_products") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          insert: vi.fn(() => ({ select: insertSelectMock })),
        };
      }
      return {
        select: vi.fn(() => ({ order: orderMock })),
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: singleMock })) })),
      };
    });

    const migrationResult = await migrateLocalVendorsToSupabaseIfNeeded();
    expect(migrationResult.migrated).toBe(1);
    expect(migrationResult.idMap["VND-1099"]).toBe(vendorUuid1);

    await migrateLocalVendorProductsToSupabaseIfNeeded(migrationResult.idMap);
    expect(localStorage.getItem("nido_vendors_supabase_migrated_v1")).toBe("done");
    expect(localStorage.getItem("nido_vendor_products_supabase_migrated_v1")).toBe("done");

    // Second run is a no-op because migration flags are set
    const secondRun = await migrateLocalVendorsToSupabaseIfNeeded();
    expect(secondRun.migrated).toBe(0);
    expect(Object.keys(secondRun.idMap)).toHaveLength(0);
  });

  it("enforces internal-only RBAC RLS and relational constraints in migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000013_phase3_vendors_and_products.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.vendors");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.vendor_products");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.vendor_price_engine_settings");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("app.is_nido_internal()");
    expect(sql).toContain("app.has_nido_permission('vendors'");
    expect(sql).toContain("REFERENCES public.vendors(id) ON DELETE RESTRICT");
    expect(sql).toContain("REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT");
    expect(sql).toContain("UNIQUE (vendor_id, master_catalogue_item_id)");
    expect(sql).toContain("REVOKE ALL ON TABLE public.vendors FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.vendor_products FROM PUBLIC, anon");
  });
});
