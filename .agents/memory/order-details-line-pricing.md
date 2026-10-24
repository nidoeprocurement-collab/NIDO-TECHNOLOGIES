---
name: Order Details line pricing
description: Sub Orders / Items shows pre-tax unit price and tax-inclusive total without separate discount or tax columns.
---

The Sub Orders / Items grid displays unit price before GST and a tax-inclusive line total, with no separate Discount or Tax columns. The order-level summary below that grid is separate: show pre-discount subtotal, a discount row only when the saved checkout discount is positive, separate CGST and SGST with half-rates derived from the saved GST slabs, shipping/delivery, platform fee, and total. Use saved checkout snapshots and never apply discounts twice.

**Why:** The user requested no discount/tax columns in item rows, but later requested a separate order-level pricing breakdown including conditional discounts and GST percentages.

**How to apply:** Keep the item rows concise while using saved checkout unit price, tax rate, and cart discount percentage to calculate the order summary; for mixed GST slabs, label CGST/SGST with all applicable half-rates.
