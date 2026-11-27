import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClientCatalogPage from "@/pages/ClientCatalogPage";
import ShopPage from "@/pages/ShopPage";
import { CartProvider } from "@/contexts/CartContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import * as clientCatalogApi from "@/lib/clientCatalogApi";
import * as masterCatalogueApi from "@/lib/masterCatalogueApi";
import * as vendorProductsApi from "@/lib/vendorProductsApi";
import * as clientPriceEngineApi from "@/lib/clientPriceEngineApi";
import * as vendorsApi from "@/lib/vendorsApi";

const clientUuid1 = "11111111-1111-4111-8111-111111111111";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    currentAuthenticatedUser: {
      id: "user-1",
      email: "admin@nido.example.com",
      name: "Admin User",
      role: "Super Admin",
      userType: "nido_internal",
    },
    effectiveUser: {
      id: "user-1",
      email: "admin@nido.example.com",
      name: "Admin User",
      role: "Super Admin",
      userType: "nido_internal",
    },
    isImpersonating: false,
  }),
}));

describe("ClientCatalogPage & ShopPage Supabase integration", () => {
  const sampleEntry: clientCatalogApi.HydratedClientCatalogEntry = {
    clientCatalogItemId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    masterCatalogueItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    productCode: "MPC-2026-000001",
    sku: "SKU-LAP-01",
    name: "Enterprise Laptop Pro",
    category: "IT Hardware",
    physicalType: "Physical Product",
    roles: ["Procurement"],
    preference: "Primary",
    cpc: "CPC-00001",
    price: "₹64,900.00",
    priceNum: 64900,
    availability: "In Stock",
    img: "",
    publishStatus: "published",
    visibility: "visible",
    status: "Active",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem(
      "nido_clients_v1",
      JSON.stringify([{ id: clientUuid1, name: "Beta Corp", status: "Active" }]),
    );
    localStorage.setItem("nido_shop_selected_client", clientUuid1);
  });

  it("loads ClientCatalogPage from Supabase and recovers via Retry on error", async () => {
    vi.spyOn(masterCatalogueApi, "loadMasterCatalogueFromSupabase").mockResolvedValue([]);
    vi.spyOn(clientCatalogApi, "migrateLocalClientCatalogToSupabaseIfNeeded").mockResolvedValue({
      migrated: 0,
      skipped: 0,
      invalid: 0,
    });
    vi.spyOn(vendorProductsApi, "loadVendorProductsFromSupabase").mockResolvedValue([]);
    vi.spyOn(clientPriceEngineApi, "loadClientPricingSettingsFromSupabase").mockResolvedValue({
      settings: {
        perUnitCharges: [],
        overheadPct: 0,
        profitPct: 0,
        discountPct: 0,
        shippingDeliveryFee: 0,
        platformFee: 0,
        roundOff: "none",
      },
      profitSettings: {
        minProfitPct: 0,
        minProfitAmount: 0,
        maxDiscountAllowed: 0,
        enableManualOverride: false,
        enableMarketPriceValidation: false,
        enableSmartPricing: false,
      },
      slabs: [],
      globalCategoryRules: [],
      productProfitRules: [],
      retailMarketPrices: {},
    });
    const loadCatalogSpy = vi
      .spyOn(clientCatalogApi, "loadClientCatalogFromSupabase")
      .mockRejectedValueOnce(new Error("Catalogue timeout"))
      .mockResolvedValueOnce([sampleEntry]);

    render(
      <MemoryRouter>
        <ClientCatalogPage clientId={clientUuid1} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to sync client catalogue: Catalogue timeout/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText("Enterprise Laptop Pro")).toBeTruthy();
    });
    expect(loadCatalogSpy).toHaveBeenCalledTimes(2);
  });

  it("hydrates ShopPage from Supabase for the selected client", async () => {
    vi.spyOn(masterCatalogueApi, "loadMasterCatalogueFromSupabase").mockResolvedValue([]);
    vi.spyOn(vendorsApi, "loadVendorsFromSupabase").mockResolvedValue([]);
    vi.spyOn(vendorProductsApi, "loadVendorProductsFromSupabase").mockResolvedValue([]);
    vi.spyOn(clientPriceEngineApi, "loadClientPricingSettingsFromSupabase").mockResolvedValue({
      settings: {
        perUnitCharges: [],
        overheadPct: 0,
        profitPct: 0,
        discountPct: 0,
        shippingDeliveryFee: 0,
        platformFee: 0,
        roundOff: "none",
      },
      profitSettings: {
        minProfitPct: 0,
        minProfitAmount: 0,
        maxDiscountAllowed: 0,
        enableManualOverride: false,
        enableMarketPriceValidation: false,
        enableSmartPricing: false,
      },
      slabs: [],
      globalCategoryRules: [],
      productProfitRules: [],
      retailMarketPrices: {},
    });
    vi.spyOn(clientCatalogApi, "loadClientCatalogFromSupabase").mockImplementation(async (cid) => {
      localStorage.setItem("nido_client_catalogs", JSON.stringify({ [cid]: [sampleEntry] }));
      return [sampleEntry];
    });

    render(
      <I18nProvider>
        <MemoryRouter>
          <CartProvider>
            <ShopPage />
          </CartProvider>
        </MemoryRouter>
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Enterprise Laptop Pro")).toBeTruthy();
    });
  });
});
