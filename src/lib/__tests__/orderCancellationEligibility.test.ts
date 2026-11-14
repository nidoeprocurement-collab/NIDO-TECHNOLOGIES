import { describe, expect, it } from "vitest";
import {
  CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS,
  canCancelOrderByPurchaseOrders,
  getOrderCreatedTimestampMs,
  isWithinClientCancellationWindow,
} from "../orderCancellationEligibility";

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

  it("allows client cancellation within 24 hours of order creation and blocks after 24 hours", () => {
    const createdAt = "2026-11-14T10:00:00.000Z";
    const createdMs = Date.parse(createdAt);

    expect(getOrderCreatedTimestampMs({ createdAt })).toBe(createdMs);
    expect(isWithinClientCancellationWindow({ createdAt }, createdMs + 60 * 60 * 1000)).toBe(true);
    expect(
      isWithinClientCancellationWindow({ createdAt }, createdMs + CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS),
    ).toBe(true);
    expect(
      isWithinClientCancellationWindow(
        { createdAt },
        createdMs + CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS + 1,
      ),
    ).toBe(false);
  });

  it("falls back to orderDate and orderTime when createdAt is absent", () => {
    const order = { orderDate: "Nov 14, 2026", orderTime: "10:00 AM" };
    const createdMs = getOrderCreatedTimestampMs(order);
    expect(createdMs).not.toBeNull();
    expect(isWithinClientCancellationWindow(order, (createdMs || 0) + 2 * 60 * 60 * 1000)).toBe(true);
    expect(
      isWithinClientCancellationWindow(
        order,
        (createdMs || 0) + CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS + 1000,
      ),
    ).toBe(false);
    expect(isWithinClientCancellationWindow(null)).toBe(false);
  });
});
