---
name: Order Details line pricing
description: Order detail rows use saved discounts, GST-exclusive line totals, a compact four-card summary, and a full-width SLA notice below fulfillment status.
---

In Order Details, show product category, code, specifications, and configuration beside the product name. The unit price is the saved checkout price after discount and before GST; when a saved discount applies, show that price first, the original price struck through beneath it, and the saved discount percentage in parentheses. The item total is also before GST.

Keep the four compact information cards in this order: Billing, Shipping, Requester, then Order Summary. The summary card shows sub-order count, active item quantity, pre-discount subtotal excluding GST, GST, shipping/delivery, consolidated discount, and final total; do not put an item list inside it. Place the SLA status and deadline in a full-width, left-aligned notice below the fulfillment note, separated by a horizontal divider.

Keep GST, discount, fee, and total calculations at full precision; round only when formatting currency for display. Show every nonzero fee or adjustment that contributes to the final total so the visible summary rows reconcile.

**Why:** The user wants the fulfillment explanation above the divider, with the SLA notice enlarged and left-aligned below it to use the available space.

**How to apply:** Render the explanatory fulfillment note above the divider and the wider SLA notice below it, not in the header above Cancel Order. Use saved checkout snapshots only; never infer a discount from current settings or apply it twice. Keep calculations unrounded, expose contributing fees/adjustments in the summary, and keep the sub-order line total tax-exclusive.
