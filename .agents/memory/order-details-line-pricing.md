---
name: Order Details line pricing
description: The sub-order line discount and tax display is scoped to Order Details.
---

Order Details displays unit price before GST and shows the same combined discount percentage displayed on each Cart line. New orders capture the percentage with the checkout item so later pricing-setting changes do not rewrite it; legacy orders without a snapshot use the current Cart discount rules. Checkout pricing already includes the discount; Order Details must not apply it a second time or offer a separate discount editor.

**Why:** The user asked to remove the Order Details percentage/currency selector and show only the discount shown in Cart.

**How to apply:** Carry the cart-displayed percentage into the order-item snapshot, then display it read-only in Order Details. Reuse the saved checkout unit prices and GST rate for the row; do not alter PO, invoice, or global pricing behavior.
