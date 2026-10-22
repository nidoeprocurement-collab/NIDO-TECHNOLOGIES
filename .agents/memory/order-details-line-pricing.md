---
name: Order Details line pricing
description: The sub-order line discount and tax display is scoped to Order Details.
---

Order Details displays unit price before GST and supports per-line percentage or fixed-amount discounts. Calculate tax after the discount. Keep these overrides and the resulting line/summary calculations local to Order Details; do not change shared checkout prices, order records, purchase orders, invoices, or global pricing.

**Why:** The user explicitly requested the Order Details display and discount behavior while requiring the rest of the platform to remain unchanged.

**How to apply:** Keep Order Details-only pricing state separate from shared commerce data. Reuse the order's saved GST rate and active currency formatter; expand scope only if the user explicitly asks.
