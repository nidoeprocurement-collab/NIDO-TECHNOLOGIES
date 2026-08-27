import type { OrderCartItem } from "@/contexts/MyOrdersContext";
import type { User } from "@/contexts/AuthContext";
import { isDigitalProduct } from "@/lib/productType";

type DigitalFulfillmentActor = Pick<User, "id" | "name" | "role" | "userType" | "clientId">;

function getDevelopmentActor(): DigitalFulfillmentActor | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem("nido_user") || "null");
    return stored?.id
      ? {
          id: String(stored.id),
          name: String(stored.name || stored.email || stored.id),
          role: stored.role ? String(stored.role) : undefined,
          userType: stored.userType || "nido_admin",
          clientId: stored.clientId ? String(stored.clientId) : undefined,
        }
      : null;
  } catch {
    return null;
  }
}

function requestHeaders(actor: DigitalFulfillmentActor | null, clientId: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // The localStorage auth model has no server-verifiable credential. These
  // headers are only a development bridge; production relies on the
  // server-authenticated session/cookie and never sends browser-controlled
  // identity claims.
  if (import.meta.env.DEV) {
    // AuthContext can briefly be empty while restoring a local session. Read
    // the same development-only session as a fallback so checkout does not
    // send an anonymous fulfillment request during that transition.
    const developmentActor = actor || getDevelopmentActor();
    if (developmentActor?.id) headers["x-nido-user-id"] = developmentActor.id;
    if (developmentActor?.name) headers["x-nido-user-name"] = developmentActor.name;
    if (developmentActor?.role) headers["x-nido-role"] = developmentActor.role;
    if (developmentActor?.userType) headers["x-nido-user-type"] = developmentActor.userType;
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
    throw new Error(
      payload.error
      || `Digital fulfillment records could not be created (HTTP ${response.status}).`,
    );
  }
}