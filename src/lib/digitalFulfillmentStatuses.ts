/**
 * Digital fulfillment uses license provisioning stages instead of shipment
 * stages. Counts are derived from the line quantity; 10 licenses displays
 * the requested 6/10 and 10/10 milestones.
 */
export function getDigitalFulfillmentStatusSequence(quantity?: number | string): string[] {
  const parsedQuantity = Number(quantity);
  const total = Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? Math.max(1, Math.round(parsedQuantity))
    : 10;
  const partial = total > 1
    ? Math.min(total - 1, Math.max(1, Math.floor(total * 0.6)))
    : 0;

  return [
    "Pending",
    "Processing",
    "Provisioning",
    `Partially Provisioned (${partial}/${total})`,
    `Provisioned (${total}/${total})`,
    `Activated (${total}/${total})`,
    "Completed",
  ];
}

/** Finds a digital stage even if its saved count label predates a quantity edit. */
export function getDigitalFulfillmentStatusIndex(
  status: string,
  quantity?: number | string,
): number {
  const sequence = getDigitalFulfillmentStatusSequence(quantity);
  const normalizedStatus = String(status || "").trim();
  if (normalizedStatus.toLowerCase() === "confirmed") {
    return sequence.indexOf("Processing");
  }

  const stage = normalizedStatus.replace(/\s+\([^)]*\)$/, "");
  return sequence.findIndex((option) => option === normalizedStatus || option.replace(/\s+\([^)]*\)$/, "") === stage);
}