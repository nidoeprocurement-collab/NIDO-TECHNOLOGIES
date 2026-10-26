---
name: Order Details line pricing
description: Order detail rows use saved discounts, GST-exclusive line totals, and a checkout-style summary above the sub-order tabs.
---

In Order Details, show product category, code, specifications, and configuration beside the product name. The unit price is the saved checkout price after discount and before GST; when a saved discount applies, show that price first, the original price struck through beneath it, and the saved discount percentage in parentheses. The item total is also before GST.

Place a checkout-style Order Summary card at the top-left of the information cards. It lists the order items and shows pre-discount subtotal, saved discount, after-discount subtotal, GST slabs, shipping/platform fees when present, and final total. Remove the calculation block beneath the Sub Orders / Items grid.

**Why:** The user asked Order Details to show checkout pricing and item detail consistently, while keeping taxes and fees out of the sub-order table footer.

**How to apply:** Use saved checkout snapshots only; never infer a discount from current settings or apply it twice. Keep checkout GST and fees in the top summary, and keep the sub-order line total tax-exclusive.
