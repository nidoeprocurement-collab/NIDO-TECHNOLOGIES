import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  assignClientCatalogItemsInSupabase,
  loadClientCatalogFromSupabase,
  migrateLocalClientCatalogToSupabaseIfNeeded,
  removeClientCatalogItemInSupabase,
  updateClientCatalogItemInSupabase,
} from "@/lib/clientCatalogApi";
import {
  loadClientPricingSettingsFromSupabase,
  saveClientPriceSlabsInSupabase,
  saveClientPricingSettingsInSupabase,
} from "@/lib/clientPriceEngineApi";
import {
  clearCartInSupabase,
  loadShopVendorOptionsFromSupabase,
  removeCartItemInSupabase,
  reserveAndAddToCartInSupabase,
  updateCartItemQuantityInSupabase,
} from "@/lib/cartAndStockApi";
import {
  computeClientFinalPrice,
  resolveClientProfitPct,
  saveClientCommonSettings,
  saveClientPriceSlabs,
  saveClientProductProfitRules,
  saveGlobalCategoryRules,
} from "@/lib/priceEngineStore";
import { calculateCartPricing } from "@/lib/cartPricing";

describe("Client Catalogue, Client Price Engine, Shop & Cart Supabase Integration", () => {
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const clientUuid2 = "22222222-2222-4222-8222-222222222222";
  const masterUuid1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const vendorUuid1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const cartItemUuid1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const userUuid1 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

  const sampleCatalogRow = {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    client_id: clientUuid1,
    master_catalogue_item_id: masterUuid1,
    client_product_code: "CPC-00001",
    client_sku: "CLI-LAP-01",
    display_name: "Enterprise Laptop Pro",
    description_override: null,
    default_vendor_id: vendorUuid1,
    assigned_vendor_ids: [vendorUuid1],
    allowed_roles: ["Procurement", "Admin"],
    preference: "Primary",
    visibility: "visible" as const,
    publish_status: "published" as const,
    status: "Active" as const,
    client_moq: 2,
    cached_selling_price: 64900,
    cached_selling_price_display: "₹64,900.00",
    product_notes: "Approved standard laptop",
    metadata: { availability: "In Stock" },
    master_catalogue_items: {
      id: masterUuid1,
      master_product_code: "MPC-2026-000001",
      sku_code: "SKU-LAP-01",
      product_name: "Enterprise Laptop Pro",
      product_type: "Product",
      physical_type: "Physical Product",
      category: "IT Hardware",
      subcategory: "Laptops",
      brand: "Dell",
      tags: ["CoreEssentials"],
      description: "16GB RAM",
      specifications: [],
      general_specs: [],
      variations: [],
      product_notes: "",
      video_url: "",
      images: [],
      lead_time: "5 Days",
      moq: 2,
      warranty: "3 Years",
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    localStorage.setItem(
      "nido_catalog_products",
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
  });

  it("loads, assigns, updates, and removes client catalogue items with duplicate & RLS protection", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [sampleCatalogRow], error: null });
    const insertSelectMock = vi.fn().mockResolvedValue({ data: [sampleCatalogRow], error: null });
    const singleUpdateMock = vi.fn().mockResolvedValue({
      data: { ...sampleCatalogRow, preference: "Preferred", allowed_roles: ["Procurement"] },
      error: null,
    });
    const eqUpdateChain = vi.fn(() => ({
      eq: vi.fn(() => ({ select: vi.fn(() => ({ single: singleUpdateMock })) })),
    }));
    const eqDeleteChain = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: orderMock })) })),
      insert: vi.fn(() => ({ select: insertSelectMock })),
      update: vi.fn(() => ({ eq: eqUpdateChain })),
      delete: vi.fn(() => ({ eq: eqDeleteChain })),
    }));

    const loaded = await loadClientCatalogFromSupabase(clientUuid1);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].cpc).toBe("CPC-00001");
    expect(loaded[0].roles).toEqual(["Procurement", "Admin"]);

    const assigned = await assignClientCatalogItemsInSupabase(clientUuid1, [loaded[0]]);
    expect(assigned[0].masterCatalogueItemId).toBe(masterUuid1);

    const updated = await updateClientCatalogItemInSupabase(clientUuid1, loaded[0], {
      preference: "Preferred",
      roles: ["Procurement"],
    });
    expect(updated.preference).toBe("Preferred");

    await expect(removeClientCatalogItemInSupabase(clientUuid1, loaded[0])).resolves.toBeUndefined();

    // Duplicate assignment (23505) & cross-client RLS denial (42501)
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "duplicate key value violates unique constraint" },
        }),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "42501", message: "row-level security policy violation" },
          }),
        })),
      })),
    }));

    await expect(assignClientCatalogItemsInSupabase(clientUuid1, [loaded[0]])).rejects.toThrow(/already assigned/i);
    await expect(loadClientCatalogFromSupabase(clientUuid2)).rejects.toThrow(/row-level security/i);
  });

  it("preserves the 2-level Client Price Engine hierarchy, slabs, GST, and market price validation", async () => {
    saveClientCommonSettings(clientUuid1, {
      perUnitCharges: [{ id: "1", name: "Packaging", value: 2 }],
      overheadPct: 3,
      profitPct: 10,
      discountPct: 5,
      shippingDeliveryFee: 250,
      platformFee: 100,
      roundOff: "nearest",
    });
    saveGlobalCategoryRules([
      { id: "r1", category: "IT Hardware", marginPct: 4, bufferPct: 1 },
    ]);

    // Level 2: client default (10) + category margin (4) + buffer (1) = 15%
    expect(resolveClientProfitPct(clientUuid1, "MPC-2026-000001", "IT Hardware")).toBe(15);

    // Level 1 override: product-specific profit % = 18%
    saveClientProductProfitRules(clientUuid1, [
      { masterProductCode: "MPC-2026-000001", productName: "Enterprise Laptop Pro", profitPct: 18 },
    ]);
    expect(resolveClientProfitPct(clientUuid1, "MPC-2026-000001", "IT Hardware")).toBe(18);

    const calc = computeClientFinalPrice(
      10000,
      {
        perUnitCharges: [{ id: "1", name: "Packaging", value: 2 }],
        overheadPct: 3,
        profitPct: 10,
        discountPct: 5,
        shippingDeliveryFee: 250,
        platformFee: 100,
        roundOff: "none",
      },
      18,
      "IT Hardware",
    );
    expect(calc.perUnitTotal).toBe(500); // 5% of 10000
    expect(calc.subtotal).toBe(10500);
    expect(calc.profit).toBe(1890); // 18% of 10500
    expect(calc.preTaxFinalPrice).toBe(12390);

    // Slabs + Cart pricing
    saveClientPriceSlabs(clientUuid1, [
      { id: "s1", name: "Bulk 5+", minQty: 5, maxQty: 50, discountPct: 4, applyTo: "All Products", status: "Active" },
    ]);
    const cartSummary = calculateCartPricing([
      {
        priceNum: 11800,
        quantity: 5,
        clientId: clientUuid1,
        category: "IT Hardware",
        selectedVendorId: vendorUuid1,
        vendorPrice: 8000,
        clientSellingPriceExclGst: 10000,
        gstSnapshot: 18,
        physicalType: "Physical Product",
      },
    ]);
    expect(cartSummary.slabDiscountAmount).toBeGreaterThan(0);
    expect(cartSummary.clientDiscountAmount).toBeGreaterThan(0);
    expect(cartSummary.shippingDeliveryFee).toBe(250);
    expect(cartSummary.platformFee).toBe(100);
    expect(cartSummary.grandTotal).toBeGreaterThan(0);

    // Supabase load & save for pricing settings + slabs
    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "client_pricing_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  client_id: clientUuid1,
                  per_unit_charges: [],
                  overhead_pct: 2,
                  profit_pct: 12,
                  discount_pct: 3,
                  shipping_delivery_fee: 150,
                  platform_fee: 50,
                  round_off: "none",
                  min_profit_pct: 5,
                  min_profit_amount: 100,
                  max_discount_allowed: 15,
                  enable_manual_override: false,
                  enable_market_price_validation: true,
                  enable_smart_pricing: false,
                },
                error: null,
              }),
            })),
          })),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "client_price_slabs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
          })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });

    const loadedPricing = await loadClientPricingSettingsFromSupabase(clientUuid1);
    expect(loadedPricing.settings.profitPct).toBe(12);
    expect(loadedPricing.profitSettings.enableMarketPriceValidation).toBe(true);

    await expect(
      saveClientPricingSettingsInSupabase(clientUuid1, loadedPricing.settings, loadedPricing.profitSettings),
    ).resolves.toBeUndefined();
    await expect(saveClientPriceSlabsInSupabase(clientUuid1, [])).resolves.toBeUndefined();
  });

  it("reserves stock atomically on cart add/update, releases on remove/clear, and blocks overselling", async () => {
    const dbCartRow = {
      id: cartItemUuid1,
      user_id: userUuid1,
      client_id: clientUuid1,
      master_catalogue_item_id: masterUuid1,
      vendor_id: vendorUuid1,
      vendor_product_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      quantity: 3,
      configuration: {},
      configuration_key: "",
      configuration_price_adjustment: 0,
      unit_price_inclusive: 64900,
      client_selling_price_excl_gst: 55000,
      vendor_price: 50000,
      landed_cost: 52000,
      gst_snapshot: 18,
      hsn_snapshot: "8471",
      vendor_rating: 4.5,
      lead_time: "5 Days",
      moq: 2,
      fulfillment_type: "physical" as const,
      metadata: { legacyId: 101, name: "Enterprise Laptop Pro", selectedVendorName: "Apex Supplies" },
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            vendor_id: vendorUuid1,
            vendor_name: "Apex Supplies",
            vendor_rating: 4.5,
            payment_terms: "NET 30",
            vendor_product_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            vendor_product_code: "VPC-000101",
            base_price: 50000,
            moq: 2,
            lead_time: "5 Days",
            physical_stock: 10,
            reserved_stock: 0,
            available_stock: 10,
            incoming_stock: 0,
            digital_availability: null,
            variations: [],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: dbCartRow, error: null })
      .mockResolvedValueOnce({ data: { ...dbCartRow, quantity: 5 }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "22023", message: "Insufficient stock available (5 available, 10 additional requested)" },
      })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const vendorOptions = await loadShopVendorOptionsFromSupabase(clientUuid1, masterUuid1);
    expect(vendorOptions).toHaveLength(1);
    expect(vendorOptions[0].available_stock).toBe(10);

    const added = await reserveAndAddToCartInSupabase(
      clientUuid1,
      masterUuid1,
      {
        id: 101,
        name: "Enterprise Laptop Pro",
        image: "",
        specs: [],
        moq: 2,
        totalStock: 10,
        priceNum: 64900,
        selectedVendorId: vendorUuid1,
        selectedVendorName: "Apex Supplies",
        fulfillmentType: "physical",
      },
      3,
    );
    expect(added.dbCartItemId).toBe(cartItemUuid1);
    expect(added.quantity).toBe(3);

    const updated = await updateCartItemQuantityInSupabase(cartItemUuid1, 5);
    expect(updated?.quantity).toBe(5);

    await expect(updateCartItemQuantityInSupabase(cartItemUuid1, 15)).rejects.toThrow(/Insufficient stock/i);
    await expect(removeCartItemInSupabase(cartItemUuid1)).resolves.toBeUndefined();
    await expect(clearCartInSupabase(clientUuid1, false)).resolves.toBeUndefined();
  });

  it("migrates local client catalogue idempotently without overwriting remote rows", async () => {
    localStorage.setItem(
      `nido_client_catalogs`,
      JSON.stringify({
        [clientUuid1]: [
          {
            productCode: "MPC-2026-000001",
            sku: "SKU-LAP-01",
            name: "Enterprise Laptop Pro",
            category: "IT Hardware",
            roles: ["Procurement"],
            price: "₹64,900.00",
            availability: "In Stock",
            img: "",
          },
        ],
      }),
    );

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: [sampleCatalogRow], error: null }),
      })),
    }));

    const first = await migrateLocalClientCatalogToSupabaseIfNeeded(clientUuid1);
    expect(first.migrated).toBe(1);

    const second = await migrateLocalClientCatalogToSupabaseIfNeeded(clientUuid1);
    expect(second.migrated).toBe(0);
  });

  it("enforces RLS, client isolation, and atomic locking in Wave 1.3 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000014_phase3_client_catalogue_price_cart.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_catalogue_items");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_pricing_settings");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_price_slabs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.global_category_pricing_rules");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_product_profit_rules");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.retail_market_prices");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.cart_items");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.stock_reservations");
    expect(sql).toContain("app.current_client_id()");
    expect(sql).toContain("app.is_nido_internal()");
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain("CONSTRAINT uq_client_catalogue_client_master UNIQUE (client_id, master_catalogue_item_id)");
    expect(sql).toContain("REVOKE ALL ON TABLE public.client_catalogue_items FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.cart_items FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.stock_reservations FROM PUBLIC, anon");
  });
});
