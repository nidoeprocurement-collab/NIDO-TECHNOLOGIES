export const ORDER_REQUESTER_KEY = "nido_order_requester";

export const ORDER_REQUESTER_OPTIONS = [
  { value: "self", label: "Ordered by self" },
  { value: "manesh", label: "Manesh" },
  { value: "rajesh", label: "Rajesh" },
] as const;

export type OrderRequesterValue = typeof ORDER_REQUESTER_OPTIONS[number]["value"];

export function normalizeOrderRequester(value: string | null | undefined): OrderRequesterValue {
  return ORDER_REQUESTER_OPTIONS.some(option => option.value === value)
    ? value as OrderRequesterValue
    : "self";
}

export function resolveOrderRequester(value: string | null | undefined, currentUserName?: string | null): string {
  const normalized = normalizeOrderRequester(value);
  if (normalized === "self") return currentUserName?.trim() || "Owner";
  return ORDER_REQUESTER_OPTIONS.find(option => option.value === normalized)?.label || "Owner";
}