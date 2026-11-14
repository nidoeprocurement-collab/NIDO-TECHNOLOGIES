type PurchaseOrderStatus = {
  status?: string | null;
};

type OrderTimestampFields = {
  createdAt?: string | null;
  orderDate?: string | null;
  orderTime?: string | null;
};

export const CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * An order can be cancelled from Order Details before procurement starts, or
 * after every generated PO has been cancelled. Any active PO blocks it.
 */
export function canCancelOrderByPurchaseOrders(
  purchaseOrders: readonly PurchaseOrderStatus[],
): boolean {
  return purchaseOrders.length === 0 || purchaseOrders.every(
    po => String(po.status || "").trim().toLowerCase() === "cancelled",
  );
}

/**
 * Resolves the order creation timestamp in milliseconds from `createdAt` or
 * falls back to parsing `orderDate` + `orderTime`.
 */
export function getOrderCreatedTimestampMs(
  order?: OrderTimestampFields | null,
): number | null {
  if (!order) return null;
  if (order.createdAt) {
    const parsed = Date.parse(order.createdAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  const combined = `${order.orderDate || ""} ${order.orderTime || ""}`.trim();
  if (combined) {
    const parsed = Date.parse(combined);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Clients can cancel physical-product orders only within 24 hours of order
 * placement.
 */
export function isWithinClientCancellationWindow(
  order?: OrderTimestampFields | null,
  nowMs = Date.now(),
): boolean {
  const createdMs = getOrderCreatedTimestampMs(order);
  if (createdMs === null) return false;
  return nowMs - createdMs <= CLIENT_PHYSICAL_ORDER_CANCEL_WINDOW_MS;
}
