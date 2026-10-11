import { beforeEach, describe, expect, it } from "vitest";
import { getClientOrders } from "@/lib/clientDataStore";

describe("client order source mapping", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("preserves saved checkout notes and delivery snapshots from master orders", () => {
    localStorage.setItem("nido_my_orders", JSON.stringify([{
      id: "order-1",
      clientId: "client-1",
      client: "Acme",
      orderDate: "2026-10-01",
      orderNotes: "Call before delivery",
      deliveryAddress: "12 Market Road, Pune",
      deliveryDetails: {
        label: "Office",
        attentionName: "Asha",
        line1: "12 Market Road",
        line2: "Suite 4",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        zip: "411001",
        phone: "9876543210",
        instructions: "Use the rear entrance",
      },
      cartItems: [{ id: 1, name: "Router", quantity: 2, clientId: "client-1" }],
    }]));

    const [order] = getClientOrders("client-1", "Acme");

    expect(order).toMatchObject({
      id: "order-1",
      orderNotes: "Call before delivery",
      deliveryAddress: "12 Market Road, Pune",
      deliveryDetails: {
        label: "Office",
        attentionName: "Asha",
        line1: "12 Market Road",
        instructions: "Use the rear entrance",
      },
      cartItems: [{ id: 1, name: "Router", quantity: 2 }],
    });
  });
});
