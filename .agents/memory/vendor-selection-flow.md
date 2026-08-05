---
name: Vendor Selection at Shop (Pre-Cart) Flow
description: Architecture of the refactored procurement workflow — client selects vendor on Shop page before adding to cart; Draft POs auto-created at order placement.
---

## Rule
Vendor selection is locked at add-to-cart time. The client must choose a vendor on the Shop page (ProductCard or ProductDetailPage) before the Add to Cart button is enabled. The chosen vendor is snapshotted onto the CartItem and propagated all the way through to Draft PO creation.

**Why:** Spec (attached_assets/Pasted--Modify-Procurement-Workflow…txt) requires vendor choice to happen pre-cart so pricing, stock, and lead time are deterministic at order time — no post-order sourcing negotiation.

## Key Data Flow

1. **CartItem** (`CartContext.tsx`) now carries:
   - `selectedVendorId`, `selectedVendorName`, `vendorPrice`, `landedCost`, `gstSnapshot`, `hsnSnapshot`
   - Cart lines are keyed by `productCode + vendorId` so the same product from different vendors is a separate line.
   - `vendorAllocations` is now a single-entry record kept only for stock-release on cancellation.

2. **OrderCartItem** (`MyOrdersContext.tsx`) mirrors CartItem's vendor snapshot fields.

3. **autoCreateDraftPOs()** in `MyOrdersContext.tsx`:
   - Called immediately inside `addOrder()` after saving the master order.
   - Groups cart items by `selectedVendorId` → one Draft PO per vendor.
   - Uses `savePO()` from purchaseOrderStore; PO status = `"Draft"`.

4. **ShopPage ProductCard** — inline vendor selection:
   - Loads `computeVendorComparisons()` on mount.
   - Shows recommended vendor (index 0) as a quick-pick chip.
   - Expandable panel for all vendors with Recommended / Fastest / Top Rated badges.
   - Add to Cart disabled until a vendor is selected.

5. **ProductDetailPage** — full vendor selection panel in price column:
   - Same logic as ProductCard but more spacious.
   - Related Products "Cart" button replaced with "View & Select Vendor →" navigation.

6. **CartPage**:
   - Cart item rows show `selectedVendorName` + landed cost in the Product Details column.
   - SuggestedCard button changed to "View & Select Vendor →" (navigates to product detail page).

7. **OrderDetailsPage**:
   - "Vendor Selected Summary" tab renamed to "Draft Purchase Orders".
   - `cartItemsToSubOrders()` now passes `selectedVendorId` / `selectedVendorName` from cart items.
   - Vendor column in Sub Orders table shows vendor name locked at cart time (read-only).
   - "Draft Purchase Orders" tab: lists auto-created Draft POs per vendor with Confirm → `/vendor-orders/:po` and Reject buttons.
   - VendorSelectionModal JSX removed from this page.

## How to Apply
- Never auto-assign a vendor after order placement — vendor must come from CartItem snapshot.
- Confirm button in Draft POs tab calls `updatePO(po.poNumber, { status: "Confirmed" })` then navigates to the PO detail page for PDF/email.
- The old `handleCreatePurchaseOrders` and `VendorSelectionModal`/`VendorSelectionTab`/`VendorSelectedSummaryTab` components remain in OrderDetailsPage but are unreachable UI (no tab or button references them) — safe to fully remove in a later cleanup.
