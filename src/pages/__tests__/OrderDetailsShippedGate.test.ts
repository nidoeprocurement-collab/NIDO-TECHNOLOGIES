import { describe, expect, it } from "vitest";
import { isVendorOrderItemDelivered } from "@/pages/OrderDetailsPage";

describe("isVendorOrderItemDelivered", () => {
  const laptopSub = {
    id: "SUB-1",
    itemName: "MacBook Pro 14",
    productCode: "MBP-14",
    sku: "MBP-14",
  };

  const monitorSub = {
    id: "SUB-2",
    itemName: "Dell UltraSharp 27",
    productCode: "DELL-27",
    sku: "DELL-27",
  };

  it("returns false when the covering PO line item is not Delivered", () => {
    const pos = [
      {
        poNumber: "PO-101",
        status: "Processing",
        subOrderIds: ["SUB-1", "SUB-2"],
        items: [
          { subOrderId: "SUB-1", item: "MacBook Pro 14", productCode: "MBP-14", status: "Shipped" },
          { subOrderId: "SUB-2", item: "Dell UltraSharp 27", productCode: "DELL-27", status: "Delivered" },
        ],
      },
    ];

    expect(isVendorOrderItemDelivered(pos, laptopSub)).toBe(false);
    expect(isVendorOrderItemDelivered(pos, monitorSub)).toBe(true);
  });

  it("returns true only when the specific item is Delivered in the vendor PO", () => {
    const pos = [
      {
        poNumber: "PO-101",
        status: "Partially Delivered",
        subOrderIds: ["SUB-1", "SUB-2"],
        items: [
          { subOrderId: "SUB-1", item: "MacBook Pro 14", productCode: "MBP-14", status: "Delivered" },
          { subOrderId: "SUB-2", item: "Dell UltraSharp 27", productCode: "DELL-27", status: "Processing" },
        ],
      },
    ];

    expect(isVendorOrderItemDelivered(pos, laptopSub)).toBe(true);
    expect(isVendorOrderItemDelivered(pos, monitorSub)).toBe(false);
  });

  it("requires all non-cancelled covering POs to have Delivered status for split items", () => {
    const pos = [
      {
        poNumber: "PO-201",
        status: "Delivered",
        subOrderId: "SUB-1",
        items: [{ subOrderId: "SUB-1", item: "MacBook Pro 14", status: "Delivered" }],
      },
      {
        poNumber: "PO-202",
        status: "Shipped",
        subOrderId: "SUB-1",
        items: [{ subOrderId: "SUB-1", item: "MacBook Pro 14", status: "Shipped" }],
      },
    ];

    expect(isVendorOrderItemDelivered(pos, laptopSub)).toBe(false);
  });

  it("returns false when no active PO covers the sub-order", () => {
    expect(isVendorOrderItemDelivered([], laptopSub)).toBe(false);
  });
});

