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
