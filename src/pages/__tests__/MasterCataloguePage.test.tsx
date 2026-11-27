import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MasterCataloguePage from "@/pages/MasterCataloguePage";
import * as masterCatalogueApi from "@/lib/masterCatalogueApi";

describe("MasterCataloguePage Supabase integration", () => {
  const sampleItem = {
    id: "11111111-1111-4111-8111-111111111111",
    masterProductCode: "MPC-2026-000001",
    skuCode: "SKU-MON-27",
    productName: "UltraSharp 27 Monitor",
    productType: "Product",
    physicalType: "Physical Product",
    category: "IT Hardware",
    subcategory: "Monitors",
    brand: "Dell",
    tags: ["CoreEssentials"],
    description: "4K USB-C monitor",
    specifications: [],
    generalSpecs: [],
    variations: [],
    productNotes: "",
    videoUrl: "",
    images: [],
    publishStatus: "published" as const,
    hsnCode: "8528",
    gstPercentage: 18,
    initialStock: 5,
    minStockThreshold: 1,
    price: 0,
    moq: 1,
    leadTime: "10 Days",
    warranty: "3 Years",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("loads products from Supabase, supports search filtering, and handles error retry", async () => {
    vi.spyOn(masterCatalogueApi, "migrateLocalCatalogToSupabaseIfNeeded").mockResolvedValue({
      migrated: 0,
      skipped: 0,
    });
    const loadSpy = vi
      .spyOn(masterCatalogueApi, "loadMasterCatalogueFromSupabase")
      .mockRejectedValueOnce(new Error("Unauthorized access to master catalogue"))
      .mockResolvedValueOnce([sampleItem]);
    vi.spyOn(masterCatalogueApi, "loadMasterCatalogueAuditLogsFromSupabase").mockResolvedValue([]);

    render(
      <MemoryRouter>
        <MasterCataloguePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Unauthorized access to master catalogue")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText("UltraSharp 27 Monitor")).toBeTruthy();
    });
    expect(loadSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText(/0\s*Drafts/i));
    await waitFor(() => {
      expect(screen.queryByText("UltraSharp 27 Monitor")).toBeNull();
    });

    fireEvent.click(screen.getByText(/1\s*Published/i));
    await waitFor(() => {
      expect(screen.getByText("UltraSharp 27 Monitor")).toBeTruthy();
    });
  });
});
