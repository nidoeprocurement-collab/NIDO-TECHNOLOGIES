import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  archiveMasterCatalogueItemInSupabase,
  createMasterCatalogueItemInSupabase,
  loadMasterCatalogueFromSupabase,
  migrateLocalCatalogToSupabaseIfNeeded,
  updateMasterCatalogueItemInSupabase,
} from "@/lib/masterCatalogueApi";
import type { CatalogProduct } from "@/lib/catalogStore";

describe("masterCatalogueApi & Phase 3 RLS migration", () => {
  const sampleRow = {
    id: "11111111-1111-4111-8111-111111111111",
    master_product_code: "MPC-2026-000001",
    sku_code: "SKU-LAP-01",
    product_name: "Enterprise Laptop Pro",
    product_type: "Product",
    physical_type: "Physical Product",
    category: "IT Hardware",
    subcategory: "Laptops",
    brand: "Dell",
    tags: ["CoreEssentials"],
    description: "16GB RAM business laptop",
    specifications: [],
    general_specs: [],
    variations: [],
    product_notes: "",
    video_url: "",
    images: [],
    publish_status: "published",
    hsn_code: "8471",
    gst_percentage: 18,
    initial_stock: 10,
    min_stock_threshold: 2,
    price: 0,
    moq: 1,
    lead_time: "10 Days",
    warranty: "3 Years",
    metadata: {},
    created_at: "2026-11-26T06:00:00Z",
    updated_at: "2026-11-26T06:00:00Z",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads products from master_catalogue_items and updates local cache", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [sampleRow], error: null });
    const selectMock = vi.fn(() => ({ order: orderMock }));
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: selectMock,
    }));

    const items = await loadMasterCatalogueFromSupabase();
    expect(items).toHaveLength(1);
    expect(items[0].productName).toBe("Enterprise Laptop Pro");
    expect(items[0].hsnCode).toBe("8471");
    expect(items[0].gstPercentage).toBe(18);
    expect(items[0].minStockThreshold).toBe(2);
  });

  it("creates, updates, and archives products in Supabase", async () => {
    const singleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleRow, error: null })
      .mockResolvedValueOnce({
        data: { ...sampleRow, product_name: "Enterprise Laptop Pro v2" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ...sampleRow, publish_status: "archived" },
        error: null,
      });

    const selectAfterMutation = vi.fn(() => ({ single: singleMock }));
    const eqMock = vi.fn(() => ({ select: selectAfterMutation }));
    const insertMock = vi.fn(() => ({ select: selectAfterMutation }));
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: insertMock,
      update: updateMock,
    }));

    const baseProduct: CatalogProduct = {
      id: "temp-1",
      masterProductCode: "MPC-2026-000001",
      skuCode: "SKU-LAP-01",
      productName: "Enterprise Laptop Pro",
      productType: "Product",
      physicalType: "Physical Product",
      category: "IT Hardware",
      subcategory: "Laptops",
      brand: "Dell",
      tags: ["CoreEssentials"],
      description: "16GB RAM business laptop",
      specifications: [],
      generalSpecs: [],
      variations: [],
      productNotes: "",
      videoUrl: "",
      images: [],
      publishStatus: "published",
      hsnCode: "8471",
      gstPercentage: 18,
      initialStock: 10,
      minStockThreshold: 2,
      price: 0,
      moq: 1,
      leadTime: "10 Days",
      warranty: "3 Years",
    };

    const created = await createMasterCatalogueItemInSupabase(baseProduct);
    expect(created.id).toBe(sampleRow.id);

    const updated = await updateMasterCatalogueItemInSupabase({
      ...created,
      productName: "Enterprise Laptop Pro v2",
    });
    expect(updated.productName).toBe("Enterprise Laptop Pro v2");

    const archived = await archiveMasterCatalogueItemInSupabase(created.id);
    expect(archived.publishStatus).toBe("archived");
  });

  it("rejects invalid/blank product names and surfaces duplicate 23505 errors", async () => {
    await expect(
      createMasterCatalogueItemInSupabase({
        id: "1",
        masterProductCode: "",
        skuCode: "",
        productName: "   ",
        productType: "Product",
        physicalType: "Physical Product",
        category: "",
        subcategory: "",
        brand: "",
        tags: [],
        description: "",
        specifications: [],
        generalSpecs: [],
        productNotes: "",
        videoUrl: "",
        images: [],
        publishStatus: "draft",
        price: 0,
        moq: 0,
        leadTime: "",
        warranty: "",
      }),
    ).rejects.toThrow("Product name is required.");

    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: singleMock })) })),
    }));

    await expect(
      createMasterCatalogueItemInSupabase({
        id: "2",
        masterProductCode: "",
        skuCode: "",
        productName: "Enterprise Laptop Pro",
        productType: "Product",
        physicalType: "Physical Product",
        category: "",
        subcategory: "",
        brand: "",
        tags: [],
        description: "",
        specifications: [],
        generalSpecs: [],
        productNotes: "",
        videoUrl: "",
        images: [],
        publishStatus: "draft",
        price: 0,
        moq: 0,
        leadTime: "",
        warranty: "",
      }),
    ).rejects.toThrow(/Product duplication found/);
  });

  it("propagates RLS / unauthorized access errors cleanly", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "new row violates row-level security policy" },
    });
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
    }));

    await expect(loadMasterCatalogueFromSupabase()).rejects.toThrow(/row-level security/);
  });

  it("idempotently migrates valid non-seed localStorage products and skips duplicates", async () => {
    localStorage.setItem(
      "nido_catalog_products",
      JSON.stringify([
        { id: "seed-1", productName: "Seeded Demo", masterProductCode: "MPC-2026-000099" },
        { id: "local-1", productName: "Enterprise Laptop Pro", masterProductCode: "MPC-2026-000001" },
        { id: "local-2", productName: "Wireless Dock", masterProductCode: "MPC-2026-000002" },
      ]),
    );

    const insertSingleMock = vi.fn().mockResolvedValue({
      data: { ...sampleRow, id: "22222222-2222-4222-8222-222222222222", product_name: "Wireless Dock", master_product_code: "MPC-2026-000002" },
      error: null,
    });
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [sampleRow], error: null }) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingleMock })) })),
    }));

    const first = await migrateLocalCatalogToSupabaseIfNeeded();
    expect(first).toEqual({ migrated: 1, skipped: 1 });

    // Second run is idempotent
    const second = await migrateLocalCatalogToSupabaseIfNeeded();
    expect(second).toEqual({ migrated: 0, skipped: 0 });
  });

  it("enforces internal-only NIDO RBAC RLS and default-deny grants in the migration SQL", () => {
    const sqlPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000012_phase3_master_catalogue.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON TABLE public.master_catalogue_items FROM PUBLIC, anon");
    expect(sql).toContain("app.is_nido_internal()");
    expect(sql).toContain("app.has_nido_permission('master_catalogue', 'view')");
    expect(sql).toContain("app.has_nido_permission('master_catalogue', 'create')");
    expect(sql).toContain("app.has_nido_permission('master_catalogue', 'edit')");
    expect(sql).toContain("app.has_nido_permission('master_catalogue', 'delete')");
    expect(sql).not.toContain("app.current_client_id()");
  });
});
