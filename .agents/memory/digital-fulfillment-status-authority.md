---
name: Independent digital fulfillment statuses
description: Digital fulfillment progress is recorded separately in PO Details and Order Details.
---

Digital status in PO Details belongs to the PO line; customer-facing digital status in Order Details belongs to the order item. Normal fulfillment updates must not project between the two or gate progress on the other page. Partial provisioning quantities are entered independently on each page. A single-unit order cannot be partially provisioned.

**Why:** The user requested independent PO Details and Order Details statuses while keeping existing cancellation safeguards.

**How to apply:** Validate each page's own status sequence and persist it to its own record. Do not copy PO fulfillment status into Order Details or block Order Details progress based on PO status. Keep cancellation-specific safeguards as the documented exception.

Digital item cancellation remains available through Pending, Processing, and Provisioning. Once any license is actually provisioned (partial or complete), use the same cutoff as physical shipment progress on both Order Details and Vendor Order Details. Keep digital status names and forward-only updates unchanged.

**Why:** The user asked for digital products to follow the physical order cancellation and status-update process; the first provisioned license is the digital equivalent of shipment progress.

**How to apply:** Use the shared digital provisioning cutoff in customer-side item/order cancellation and vendor PO-line cancellation. Continue keeping PO and customer-facing fulfillment statuses independently owned.
