import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import VendorsPage from "@/pages/VendorsPage";
import VendorProductsPage from "@/pages/VendorProductsPage";
import * as vendorsApi from "@/lib/vendorsApi";
import * as vendorProductsApi from "@/lib/vendorProductsApi";
import * as masterCatalogueApi from "@/lib/masterCatalogueApi";
import type { StoredVendor } from "@/lib/vendorDataStore";
import type { VendorProduct } from "@/lib/vendorStore";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    currentAuthenticatedUser: {
      id: "user-1",
      email: "admin@nido.example.com",
      name: "Admin User",
      role: "Super Admin",
    },
  }),
}));

vi.mock("@/lib/purchaseOrderStore", () => ({
  getAllPOs: () => [],
  getPODisplayStatus: (s: string) => s,
}));

describe("VendorsPage & VendorProductsPage Supabase integration", () => {
  const sampleVendor: StoredVendor = {
    id: "11111111-1111-4111-8111-111111111111",
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
    address: "Bengaluru",
  };

  const sampleProduct: VendorProduct = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    vendorId: "11111111-1111-4111-8111-111111111111",
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

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads vendors from Supabase on VendorsPage and recovers via Retry on error", async () => {
    const migrateSpy = vi
      .spyOn(vendorsApi, "migrateLocalVendorsToSupabaseIfNeeded")
      .mockResolvedValue({ migrated: 0, skipped: 0, invalid: 0, idMap: {} });
    const loadSpy = vi
      .spyOn(vendorsApi, "loadVendorsFromSupabase")
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce([sampleVendor]);

    render(
      <MemoryRouter>
        <VendorsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to sync vendors from database: Network timeout/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText("Apex Industrial Supplies")).toBeTruthy();
    });
    expect(migrateSpy).toHaveBeenCalledTimes(2);
    expect(loadSpy).toHaveBeenCalledTimes(2);
  });

  it("loads vendor products from Supabase on VendorProductsPage and recovers via Retry", async () => {
    vi.spyOn(masterCatalogueApi, "loadMasterCatalogueFromSupabase").mockResolvedValue([]);
    const loadProductsSpy = vi
      .spyOn(vendorProductsApi, "loadVendorProductsFromSupabase")
      .mockRejectedValueOnce(new Error("Database offline"))
      .mockResolvedValueOnce([sampleProduct]);

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/vendors/11111111-1111-4111-8111-111111111111"]}>
          <Routes>
            <Route
              path="/vendors/:vendorId"
              element={<VendorProductsPage vendorId="11111111-1111-4111-8111-111111111111" />}
            />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to sync vendor products from database: Database offline/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText("Enterprise Laptop Pro")).toBeTruthy();
    });
    expect(loadProductsSpy).toHaveBeenCalledTimes(2);
  });
});
