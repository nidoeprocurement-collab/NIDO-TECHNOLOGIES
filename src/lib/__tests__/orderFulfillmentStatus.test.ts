import { beforeEach, describe, expect, it } from "vitest";
import {
  deriveMasterOrderFulfillmentStatus,
  syncMasterOrderFulfillmentStatus,
} from "@/lib/orderFulfillmentStatus";

describe("master order fulfillment status", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("derives the master status from all sub-order item statuses", () => {
    expect(deriveMasterOrderFulfillmentStatus(["Processing", "Shipped"])).toBe("Partially Shipped");
    expect(deriveMasterOrderFulfillmentStatus(["Delivered", "Processing"])).toBe("Partially Delivered");
    expect(deriveMasterOrderFulfillmentStatus(["Delivered", "Return Request Raised"])).toBe("Delivered");
    expect(deriveMasterOrderFulfillmentStatus(["Pending Shipping", "Processing"])).toBe("Pending Shipping");
    expect(deriveMasterOrderFulfillmentStatus(["Cancelled", "Cancelled"])).toBe("Cancelled");
  });

  it("persists the newly derived status and notifies the shared order context", () => {
    const orderId = "ORD-STATUS-1";
    localStorage.setItem("nido_my_orders", JSON.stringify([{
      id: orderId,
      status: "Processing",
      cartItems: [
        { subOrderId: "SO-STATUS-1" },
        { subOrderId: "SO-STATUS-2" },
      ],
    }]));
    localStorage.setItem(`nido_subitems_${orderId}`, JSON.stringify({
      "SO-STATUS-1": { itemStatus: "Delivered" },
      "SO-STATUS-2": { itemStatus: "Processing" },
    }));

    const events: CustomEvent[] = [];
    const onStatusUpdated = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener("orderFulfillmentStatusUpdated", onStatusUpdated);

    expect(syncMasterOrderFulfillmentStatus(orderId)).toBe("Partially Delivered");
    const savedOrders = JSON.parse(localStorage.getItem("nido_my_orders") || "[]");

    window.removeEventListener("orderFulfillmentStatusUpdated", onStatusUpdated);
    expect(savedOrders[0].status).toBe("Partially Delivered");
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ orderId, status: "Partially Delivered" });
  });
});
