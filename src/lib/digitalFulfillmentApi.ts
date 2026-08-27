import type { OrderCartItem } from "@/contexts/MyOrdersContext";
import type { User } from "@/contexts/AuthContext";
import { isDigitalProduct } from "@/lib/productType";

type DigitalFulfillmentActor = Pick<User, "id" | "name" | "role" | "userType" | "clientId">;

function requestHeaders(actor: DigitalFulfillmentActor | null, clientId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(actor?.id ? { "x-nido-user-id": actor.id } : {}),
    ...(actor?.name ? { "x-nido-user-name": actor.name } : {}),
    ...(actor?.role ? { "x-nido-role": actor.role } : {}),
    ...(actor?.userType ? { "x-nido-user-type": actor.userType } : {}),
    ...(clientId ? { "x-nido-client-id": clientId } : {}),
  };
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