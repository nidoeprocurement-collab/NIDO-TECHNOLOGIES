import { describe, expect, it, vi } from "vitest";
import { createDigitalFulfillments } from "@/lib/digitalFulfillmentApi";
import type { OrderCartItem } from "@/contexts/MyOrdersContext";

const digitalItem = {
  id: 1,
  name: "License",
  image: "",
  priceNum: 100,
  quantity: 1,
  category: "Software",
  specs: [],
  moq: 1,
  clientId: "client-1",
  fulfillmentType: "digital",
} as OrderCartItem;

const physicalItem = {
  ...digitalItem,
  fulfillmentType: "physical",
} as OrderCartItem;

describe("digital fulfillment API", () => {
  it("does not call the backend for physical-only orders", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await createDigitalFulfillments("ORD-1", "client-1", [physicalItem], null);

    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("surfaces a backend failure so checkout can remain uncommitted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "Database is unavailable." }),
    } as Response);

    await expect(
      createDigitalFulfillments("ORD-2", "client-1", [digitalItem], null),
    ).rejects.toThrow("Database is unavailable.");

    fetchMock.mockRestore();
  });

  it("accepts a successful idempotent fulfillment response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    await expect(
      createDigitalFulfillments("ORD-3", "client-1", [digitalItem], null),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });
});