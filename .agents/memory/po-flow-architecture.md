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

## Draft vendor reassignment merge

When a sub-order is reassigned while its PO is still Draft, and the destination vendor already has another Draft PO for the same master order, merge the line into that destination PO and retain its PO number. Remove the source PO only when it has no lines left.

**Why:** A vendor should receive one consolidated Draft PO for all items in the same order. Creating a new PO during reassignment leaves duplicate PO numbers and splits items that belong together.

**How to apply:** Recalculate `items`, `subOrderIds`, primary-line metadata, subtotal, GST amounts, and grand total for both the destination and any remaining source Draft PO. Never merge into a confirmed PO.

New PO numbers are derived from the highest currently stored PO number rather than trusting a stale counter left by a removed Draft PO.

**Why:** Vendor reassignment can create and then remove temporary Draft records; keeping that temporary counter value makes later PO numbers appear to skip serials.

**How to apply:** Resynchronise the counter whenever a new PO is generated, while continuing to avoid reuse of numbers already present in stored PO records.

Persist Draft and Confirmed as lifecycle states, but display them as Pending and Processing respectively on vendor-facing PO screens and activity feeds.

**Why:** Draft/Confirmed are needed internally for editability and confirmation gates, while vendors and procurement users need the operational state.

**How to apply:** Use the shared PO display-status mapping for list/detail/activity views; do not replace the persisted lifecycle values.

When a customer-facing sub-order is `Pending Shipping`, the master order also becomes `Pending Shipping` unless another item has already reached shipment or delivery progress.

**Why:** The master order should reflect the current waiting-for-shipment stage without overriding existing partial shipment or delivery aggregation.

**How to apply:** Keep the special case in the master-order sync path; leave the general fulfillment reducer and all other status precedence unchanged.

The Vendor Order Details header also shows Pending Shipping when any active PO line is waiting for shipment and no line has shipment or delivery progress.

**Why:** Vendor users need the header status to reflect the item-level Pending Shipping selection immediately, without replacing the persisted Draft/Confirmed PO lifecycle.

**How to apply:** Derive the vendor PO display status from line statuses with Pending Shipping precedence only before shipped/delivered progress.

Reference No and Serial No are entered in the shipment-details popup when a vendor marks a physical PO line Shipped. Both are required before saving; the saved values display read-only in the PO item details and remain mirrored into the order’s sub-order state.

**Why:** The user asked to collect both identifiers as part of the Shipped action and show them in item details, rather than maintaining separate inline edit fields.

**How to apply:** Pre-fill existing values in the shipment popup, require both before enabling Save & Mark Shipped, save them with the PO line’s tracking/status, mirror them to `nido_subitems_<orderId>`, and keep the item-details display read-only. Preserve the existing tracking requirement.

For legacy orders whose PO line has a missing or incorrect sub-order ID, use
the item's product code/SKU as a compatibility lookup and repair the line ID
when a Draft vendor change is saved.

**Why:** Older grouped PO records can otherwise lose the PO number in the
sub-order table and silently skip the corresponding Draft PO update.

## PO cancellation and vendor re-selection

Rejecting a Draft PO from Order Details cancels the PO globally and returns its
active sub-orders to Pending with the old vendor allocation cleared. A
confirmed PO cannot be cancelled from Order Details; it can be cancelled from
Vendor Order Details. That cancellation is also global, and active covered
sub-orders return to Pending so Order Details can offer a replacement vendor or
explicit sub-order cancellation. Explicitly cancelled lines and master-order
cancellations remain terminal.

**Why:** Cancelling a supplier commitment must not silently cancel the
customer's order item, but a confirmed commitment must not be bypassed from the
master-order screen.

**How to apply:** Persist every PO cancellation through `updatePO()`. Release
Draft reservations when rejecting from Order Details; restore committed vendor
stock when cancelling a confirmed PO from its detail page. Project the updated
item state and refresh event to Order Details, where active cancelled-PO lines
can be reassigned or cancelled.

## Independent PO and Order fulfillment statuses

Vendor Order Details owns PO-line fulfillment and tracking. Order Details owns
customer-facing sub-order fulfillment and tracking. Before purchase orders are
confirmed, Order Details status-changing actions remain locked until every active
sub-order has a confirmed PO and no Draft PO is pending. After confirmation, the
two pages' fulfillment progress remains independent; physical Order Details
shipping still collects its own tracking, and digital partial quantities are
entered independently.

**Why:** The user requested that PO Details and Order Details statuses be
kept locked until Draft POs are confirmed, while retaining independent
fulfillment progress after procurement confirmation.

**How to apply:** Persist each status in its own record. Do not copy PO status
into `nido_subitems_<orderId>`, recalculate order summaries from PO updates, or
copy later PO fulfillment progress into Order Details. Keep the pre-confirmation
gate on item and master-order status changes, then allow customer-facing status
updates independently after all active items have confirmed POs.

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
