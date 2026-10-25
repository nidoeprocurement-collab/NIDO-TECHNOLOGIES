export const CART_STORAGE_KEY = "nido_cart_v1";

export function getCartStorageKey(userId?: string | null): string {
  return `${CART_STORAGE_KEY}:${encodeURIComponent(userId || "guest")}`;
}
