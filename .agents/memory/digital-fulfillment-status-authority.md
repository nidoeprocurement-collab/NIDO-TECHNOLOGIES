---
name: Independent digital fulfillment statuses
description: Digital fulfillment progress is recorded separately in PO Details and Order Details.
---

Digital status in PO Details belongs to the PO line; customer-facing digital status in Order Details belongs to the order item. Normal fulfillment updates must not project between the two or gate progress on the other page. Partial provisioning quantities are entered independently on each page. A single-unit order cannot be partially provisioned.

**Why:** The user requested independent PO Details and Order Details statuses while keeping existing cancellation safeguards.

**How to apply:** Validate each page's own status sequence and persist it to its own record. Do not copy PO fulfillment status into Order Details or block Order Details progress based on PO status. Keep cancellation-specific safeguards as the documented exception.
