export const CHECKOUT_NOTE_MAX_LENGTH = 100;
export const DELIVERY_INSTRUCTIONS_KEY = "nido_delivery_instructions";
export const ORDER_NOTES_KEY = "nido_order_notes";

export function sanitizeCheckoutNote(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, CHECKOUT_NOTE_MAX_LENGTH);
}