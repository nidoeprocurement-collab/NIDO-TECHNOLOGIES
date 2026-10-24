import { beforeEach, describe, expect, it } from "vitest";
import { calculateCartPricing } from "@/lib/cartPricing";
import { getClientCommonSettings } from "@/lib/priceEngineStore";

describe("cart pricing discount breakdown", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("combines quantity and client discounts while keeping checkout price unchanged", () => {
    localStorage.setItem("nido_price_engine_client_settings", JSON.stringify({
      "client-1": { discountPct: 5, platformFee: 25 },
    }));
    localStorage.setItem("nido_price_engine_client_slabs", JSON.stringify({
      "client-1": [{
        id: "volume-1",
        name: "Volume discount",
        minQty: 2,
        maxQty: 20,
        discountPct: 10,
        applyTo: "All Products",
        status: "Active",
      }],
    }));

    const pricing = calculateCartPricing([{
      id: 1,
      name: "Test product",
      image: "",
      specs: [],
      moq: 1,
      totalStock: 10,
      priceNum: 118,
      quantity: 2,
      clientId: "client-1",
      category: "Hardware",
      selectedVendorId: "vendor-1",
      vendorPrice: 100,
      clientSellingPriceExclGst: 100,
      gstSnapshot: 18,
      vendorAllocations: [],
    }]);

    expect(pricing.lines[0]).toMatchObject({
      slabDiscountPct: 10,
      clientDiscountPct: 5,
      checkoutUnitPriceInclusive: 100.89,
      slabDiscountPerUnitExclGst: 10,
      clientDiscountPerUnitExclGst: 4.5,
    });
    expect(pricing.lines[0].combinedDiscountPct).toBeCloseTo(14.5, 10);
    expect(pricing.preSlabDiscountSubtotal).toBe(200);
    expect(pricing.slabDiscountAmount).toBe(20);
    expect(pricing.totalDiscountAmount).toBe(29);
    expect(pricing.totalDiscountPct).toBeCloseTo(14.5, 10);
    expect(pricing.preClientDiscountSubtotal).toBe(180);
    expect(pricing.clientDiscountAmount).toBe(9);
    expect(pricing.preTaxSubtotal).toBe(171);
    expect(pricing.platformFee).toBe(25);
    expect(pricing.grandTotal).toBe(pricing.preTaxSubtotal + pricing.totalGst + 25);
  });

  it("migrates a saved legacy platform fee value to a fixed rupee amount", () => {
    localStorage.setItem("nido_price_engine_client_settings", JSON.stringify({
      "client-legacy": { platformFeePct: 7 },
    }));

    expect(getClientCommonSettings("client-legacy").platformFee).toBe(7);
  });
});
