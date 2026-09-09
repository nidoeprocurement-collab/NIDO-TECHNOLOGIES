---
name: Purchase Order Flow Architecture
description: How the full PO creation flow works across the app — vendor selection, PDF generation, shared store, and list/detail pages.
---

## Key design decisions

**Shared PO store** (`src/lib/purchaseOrderStore.ts`)
- localStorage key: `nido_all_purchase_orders` (array of StoredPO)
- Counter key: `nido_po_counter` — monotonic, updated atomically before scan to prevent duplicates across concurrent tabs
- PO numbers start from PO-00009 (sample PO-00008 is the demo fixture)

**Why:** All created POs must be visible in both VendorOrdersPage (list) and VendorOrderDetailPage (detail) without prop-drilling. A shared localStorage store is the only persistent bus in this no-backend app.

**Vendor selection via Price Engine** (`OrderDetailsPage.tsx → VendorSelectionModal`)
- Calls `computeVendorComparisons(sub.productCode)` for top-4 vendors
- `sub.productCode` flows: Product → CartItem.productCode → OrderCartItem.productCode → cartItemsToSubOrders output
- Selected vendor info is stored in `selectedVendorMeta: Record<subId, {...}>` (NOT persisted — ephemeral per session)
- `selectedVendors: Record<subId, vendorId>` IS persisted to `nido_vendors_{orderId}`

**How to apply:** When adding new vendor selection columns or PO fields, update StoredPO type, the builder in handleCreatePurchaseOrders, and storedPOToDetail in VendorOrderDetailPage.

## Grouped PO association

When rendering an order’s sub-orders, a PO must be considered related when the
sub-order appears in any of `subOrderId`, `subOrderIds`, or an item line’s
`subOrderId`; the first field is only the primary-item shortcut for grouped
POs. A Draft PO should display as pending, while PO Created/PO Issued indicate
that confirmation has occurred.

**Why:** Automatically created POs are grouped by vendor, so relying only on
the primary sub-order makes later items lose their PO number and vendor state.

**How to apply:** Reuse the three-shape association check whenever a page
projects PO data into per-item or per-sub-order UI, and derive its label from
the persisted PO status.

## Vendor shipment vs. customer-facing status

Vendor Order Details owns PO-line fulfillment and tracking. It must not write a
customer-facing sub-order `itemStatus` when a vendor marks a line as shipped.
Order Details may expose its own Shipped action only after the matching PO line
is shipped, and the customer-facing status changes only when that action is
selected there.

**Why:** Vendor shipment confirmation is a prerequisite for the customer/order
status transition, not the transition itself. Sharing the vendor status directly
made Order Details appear Shipped before the order owner confirmed it.

**How to apply:** Persist the vendor result on the PO item (`status` and
tracking), use `isPOItemShipped` to unlock Order Details’ Shipped action, and
keep `nido_subitems_<orderId>.itemStatus` owned by Order Details.

**PDF generation** (`src/lib/generatePO.ts`)
- Uses jsPDF v4 + jspdf-autotable v5 (already installed)
- `₹` symbol rendered as `Rs.` in totals (standard jsPDF fonts lack the Rupee glyph U+20B9)
- PDF is both downloaded immediately (browser) AND stored as base64 dataUri in `po.documents[0].dataUrl`
- In VendorOrderDetailPage, Download button reads `.dataUrl` first, falls back to regeneration

**VendorOrdersPage merge strategy**
- On mount: `getAllPOs().map(storedPOToOrder)` prepended to INITIAL_ORDERS
- Dedup: real PO IDs are removed from static list before merge
- Real POs use INR amounts; static demo POs use USD amounts — both coexist

**State reset on route change** (VendorOrderDetailPage)
- `useEffect([poKey])` resets all local state from fresh getPOByNumber() call
- Status sync useEffect depends on `[orderStatus, poKey]` — no lint suppression needed
