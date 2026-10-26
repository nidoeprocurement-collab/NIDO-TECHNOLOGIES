type PurchaseOrderStatus = {
  status?: string | null;
};

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
