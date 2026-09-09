export type FulfillmentStatus =
  | "Processing"
  | "Partially Shipped"
  | "Shipped"
  | "Partially Delivered"
  | "Delivered"
  | "Cancelled";

const ORDERS_KEY = "nido_my_orders";
const PO_KEY = "nido_all_purchase_orders";

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

function isDelivered(status: unknown): boolean {
  return normalize(status) === "delivered";
}

function isShipped(status: unknown): boolean {
  const value = normalize(status);
  return value === "shipped" || value === "partially shipped" || value === "dispatched";
}

function isCancelled(status: unknown): boolean {
  return normalize(status) === "cancelled" || normalize(status) === "canceled";
}

/**
 * Converts item/line statuses into the status shown for their containing order.
 *
 * Cancelled lines do not participate in shipment progress. A cancelled-only
 * collection remains Cancelled so cancellation keeps its terminal meaning.
 */
export function deriveFulfillmentStatus(
  statuses: unknown[],
  fallback: FulfillmentStatus = "Processing",
): FulfillmentStatus {
  const values = statuses.filter(status => status !== undefined && status !== null);
  const active = values.filter(status => !isCancelled(status));

  if (values.length > 0 && active.length === 0) return "Cancelled";
  if (active.length === 0) return fallback;

  if (active.every(isDelivered)) return "Delivered";
  if (active.some(isDelivered)) return "Partially Delivered";
  if (active.every(isShipped)) return "Shipped";
  if (active.some(isShipped)) return "Partially Shipped";
  return "Processing";
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "");
    return parsed && typeof parsed === "object" ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

function lineStatus(line: any, po: any): string {
  if (isCancelled(po?.status)) return "Cancelled";
  if (line?.status) return line.status;
  if (po?.status && !["draft", "confirmed", "accepted", "vendor notified"].includes(normalize(po.status))) {
    return po.status;
  }
  return "Processing";
}

function lineForSubOrder(pos: any[], subOrderId: string): { line: any; po: any } | null {
  let selected: { line: any; po: any } | null = null;
  let selectedRank = -1;
  const rank = (status: unknown) => {
    const value = normalize(status);
    if (value === "delivered") return 5;
    if (value === "shipped" || value === "dispatched") return 4;
    if (value === "partially shipped") return 3;
    if (value === "cancelled" || value === "canceled") return 0;
    return 1;
  };

  for (const po of pos) {
    if (isCancelled(po?.status)) continue;
    const lines = Array.isArray(po?.items) ? po.items : [];
    for (const line of lines) {
      if (line?.subOrderId !== subOrderId) continue;
      const candidateRank = rank(lineStatus(line, po));
      if (candidateRank > selectedRank) {
        selected = { line, po };
        selectedRank = candidateRank;
      }
    }
  }
  return selected;
}

/**
 * Recalculates and persists the master order status from sub-order state and
 * PO line state. This is deliberately localStorage-based because the current
 * application uses localStorage as its shared cross-page store.
 */
export function syncMasterOrderFulfillmentStatus(orderId: string): FulfillmentStatus | null {
  if (!orderId || typeof window === "undefined") return null;

  const orders = readJson<any[]>(ORDERS_KEY, []);
  const order = orders.find(candidate => candidate?.id === orderId);
  if (!order) return null;
  if (isCancelled(order.status) || normalize(order.status) === "draft") {
    return order.status as FulfillmentStatus;
  }

  const saved = readJson<Record<string, any>>(`nido_subitems_${orderId}`, {});
  const pos = readJson<any[]>(PO_KEY, []).filter(po => po?.orderId === orderId);
  const items = Array.isArray(order.cartItems) ? order.cartItems : [];

  const statuses = items.map((item: any, index: number) => {
    const subOrderId = item?.subOrderId || `SO-${orderId}-${String(index + 1).padStart(3, "0")}`;
    const poLine = lineForSubOrder(pos, subOrderId);
    const storedStatus = saved[subOrderId]?.itemStatus;
    if (poLine) return lineStatus(poLine.line, poLine.po);
    return storedStatus || "Processing";
  });

  const nextStatus = deriveFulfillmentStatus(
    statuses,
    (order.status as FulfillmentStatus) || "Processing",
  );
  if (order.status !== nextStatus) {
    const updatedOrders = orders.map(candidate =>
      candidate?.id === orderId ? { ...candidate, status: nextStatus } : candidate,
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new CustomEvent("orderFulfillmentStatusUpdated", {
      detail: { orderId, status: nextStatus },
    }));
  }
  return nextStatus;
}

/**
 * Mirrors vendor line operations into the sub-order projection used by the
 * master-order and client-portal views.
 */
export function syncSubOrderStatesFromPO(po: any): void {
  if (!po?.orderId || typeof window === "undefined") return;
  const saved = readJson<Record<string, any>>(`nido_subitems_${po.orderId}`, {});
  const lines = Array.isArray(po.items) ? po.items : [];
  const poState = normalize(po.status);

  for (const line of lines) {
    if (!line?.subOrderId) continue;
    const status = isCancelled(po.status)
      ? "Cancelled"
      : line.status ||
        (poState === "draft" ? "Pending" : poState === "confirmed" ? "Processing" : po.status || "Processing");
    saved[line.subOrderId] = {
      ...(saved[line.subOrderId] || {}),
      itemStatus: status,
      tracking: line.tracking ?? saved[line.subOrderId]?.tracking ?? null,
      updatedOn: new Date().toLocaleDateString("en-IN"),
    };
  }
  localStorage.setItem(`nido_subitems_${po.orderId}`, JSON.stringify(saved));
  window.dispatchEvent(new CustomEvent("orderSubItemsUpdated", { detail: { orderId: po.orderId } }));
}

/**
 * Derives the fulfillment status displayed on a vendor PO detail page without
 * replacing the PO's separate Draft/Confirmed procurement lifecycle.
 */
export function derivePOFulfillmentStatus(po: any): FulfillmentStatus {
  if (isCancelled(po?.status)) return "Cancelled";
  const lines = Array.isArray(po?.items) ? po.items : [];
  if (!lines.length) {
    return normalize(po?.status) === "draft" || normalize(po?.status) === "confirmed"
      ? "Processing"
      : (po?.status || "Processing") as FulfillmentStatus;
  }
  return deriveFulfillmentStatus(
    lines.map(line => lineStatus(line, po)),
    "Processing",
  );
}