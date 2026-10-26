import { describe, expect, it } from "vitest";
import { canCancelOrderByPurchaseOrders } from "../orderCancellationEligibility";

describe("Order Details cancellation eligibility", () => {
  it("allows cancellation before any purchase order has been generated", () => {
    expect(canCancelOrderByPurchaseOrders([])).toBe(true);
  });

  it("hides cancellation while any generated purchase order is active", () => {
    expect(canCancelOrderByPurchaseOrders([
      { status: "Cancelled" },
      { status: "Draft" },
    ])).toBe(false);
    expect(canCancelOrderByPurchaseOrders([{ status: "Confirmed" }])).toBe(false);
  });

  it("allows cancellation again only after every generated PO is cancelled", () => {
    expect(canCancelOrderByPurchaseOrders([
      { status: "Cancelled" },
      { status: "cancelled" },
    ])).toBe(true);
  });
});
