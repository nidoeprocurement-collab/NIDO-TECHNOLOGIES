import type { OrderCartItem } from "@/contexts/MyOrdersContext";
import type { User } from "@/contexts/AuthContext";
import { isDigitalProduct } from "@/lib/productType";

type DigitalFulfillmentActor = Pick<User, "id" | "name" | "role" | "userType" | "clientId">;

function requestHeaders(actor: DigitalFulfillmentActor | null, clientId: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // The localStorage auth model has no server-verifiable credential. These
  // headers are only a development bridge; production relies on the
  // server-authenticated session/cookie and never sends browser-controlled
  // identity claims.
  if (import.meta.env.DEV) {
    if (actor?.id) headers["x-nido-user-id"] = actor.id;
    if (actor?.name) headers["x-nido-user-name"] = actor.name;
    if (actor?.role) headers["x-nido-role"] = actor.role;
    if (actor?.userType) headers["x-nido-user-type"] = actor.userType;
    if (clientId) headers["x-nido-client-id"] = clientId;
  }
  return headers;
}

/**
 * Creates one server-side fulfillment per digital order item.
 * The endpoint is idempotent, so retrying an order sync is safe.
 */
export async function createDigitalFulfillments(
  orderId: string,
  clientId: string,
  cartItems: OrderCartItem[],
  actor: DigitalFulfillmentActor | null,
): Promise<void> {
  if (!cartItems.some(isDigitalProduct)) {
    return;
  }

  const response = await fetch("/api/digital-fulfillments/order", {
    method: "POST",
    headers: requestHeaders(actor, clientId),
    body: JSON.stringify({ orderId, clientId, cartItems }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Digital fulfillment records could not be created.");
  }
}