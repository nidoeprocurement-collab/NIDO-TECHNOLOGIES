import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMyOrders } from "@/contexts/MyOrdersContext";
import { useAuth } from "@/contexts/AuthContext";
import { computeVendorComparisons, type VendorComparisonRow } from "@/lib/priceEngineStore";
import { getVendorById } from "@/lib/vendorDataStore";
import { savePO, generatePoNumber, type StoredPO } from "@/lib/purchaseOrderStore";
import { downloadPOPdf, getPODataUri } from "@/lib/generatePO";
import { getClientSLA } from "@/lib/slaEngine";
import { computeSLAStatus, parseLooseDate } from "@/lib/slaUtils";
import SLABadge from "@/components/shared/SLABadge";
import { computeCartGST } from "@/lib/cartGstHelper";
import { getEffectiveTaxPctForCategory } from "@/lib/taxEngine";
import { deductPhysicalStock, restorePhysicalStock } from "@/lib/vendorStore";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const VENDOR_POOL = [
  { id: "VA", name: "Vendor A", location: "Bengaluru, Karnataka", color: "#e6a817", rating: 4.6, deliveryDays: "3 - 4 Days", pricePerUnit: 120, gstin: "29ABCDE1234F1Z5", onTimeDelivery: "95%", qualityRating: "4.5 / 5", totalOrders: 152 },
  { id: "VB", name: "Vendor B", location: "Mumbai, Maharashtra", color: "#2b6cb0", rating: 4.2, deliveryDays: "5 - 6 Days", pricePerUnit: 115, gstin: "27BCDFE5678G2Z1", onTimeDelivery: "89%", qualityRating: "4.2 / 5", totalOrders: 98 },
  { id: "VC", name: "Vendor C", location: "Pune, Maharashtra", color: "#276749", rating: 4.0, deliveryDays: "2 - 3 Days", pricePerUnit: 125, gstin: "27CDEFG9012H3Z4", onTimeDelivery: "82%", qualityRating: "4.0 / 5", totalOrders: 74 },
  { id: "VD", name: "Vendor D", location: "Delhi, NCR", color: "#6b21a8", rating: 3.8, deliveryDays: "4 - 5 Days", pricePerUnit: 110, gstin: "07DEFGH3456I4Z7", onTimeDelivery: "78%", qualityRating: "3.8 / 5", totalOrders: 61 },
];


// Documents and notes start empty; users add them interactively
const INITIAL_DOCS: { id: string; name: string; ext: string; size: string; type: string; uploadedBy: string; uploadedOn: string; description: string }[] = [];
const INITIAL_NOTES: { id: string; author: string; date: string; text: string; visibility: string }[] = [];

const ALL_STATUS_MAP = {
  Pending: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  Confirmed: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Processing: { bg: "#faf5ff", color: "#6b21a8", border: "#d8b4fe" },
  Shipped: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  Delivered: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  "Partially Shipped": { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  "Partially Delivered": { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
};

const DOC_ICON = {
  pdf: { bg: "#fee2e2", color: "#dc2626", label: "PDF" },
  xlsx: { bg: "#d1fae5", color: "#059669", label: "XLS" },
  docx: { bg: "#dbeafe", color: "#2563eb", label: "DOC" },
  png: { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
  jpg: { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
};
const getDocIcon = ext => DOC_ICON[ext?.toLowerCase()] || { bg: "#f3f4f6", color: "#6b7280", label: ext?.toUpperCase() || "FILE" };

// ── Shared UI Helpers ─────────────────────────────────────────────────────────
function DocTypeIcon({ ext, size = 38 }) {
  const ic = getDocIcon(ext);
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: ic.color, flexShrink: 0 }}>
      {ic.label}
    </div>
  );
}

function Avatar({ initial, color, size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function StatusPill({ status }) {
  const s = ALL_STATUS_MAP[status] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
  return <span style={{ padding: "4px 11px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", display: "inline-block" }}>{status}</span>;
}

function StarRating({ rating, max = 5 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <span key={i} style={{ color: filled || half ? "#f59e0b" : "#d1d5db", fontSize: 13 }}>
            {filled ? "★" : half ? "⯨" : "★"}
          </span>
        );
      })}
      <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 600, marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

const lbSt = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inSt: any = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };

// ── Overlay / ModalBox helpers ────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
function ModalBox({ title, onClose, children, width = 440 }) {
  return (
    <div style={{ background: "hsl(var(--card))", borderRadius: 12, width, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid hsl(var(--border))" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "hsl(var(--muted-foreground))" }}>×</button>
      </div>
      {children}
    </div>
  );
}
function ModalFooter({ onCancel, onSave, saveLabel = "Save" }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", border: "1px solid hsl(var(--border))", borderRadius: 7, background: "hsl(var(--card))", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", color: "hsl(var(--foreground))" }}>Cancel</button>
      <button onClick={onSave} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>{saveLabel}</button>
    </div>
  );
}

// ── Vendor Selection Modal (popup) — uses Price Engine top-4 ─────────────────
/**
 * Returns the full vendor stock capacity for a product as originally entered,
 * regardless of how much the shop/cart has reserved so far.
 *
 * The shop's reserveStock() deducts from vendorStore live stock each time a
 * client adds to cart / places an order. For Vendor Selection (Nido-internal),
 * we need the original capacity: live stock + everything reserved across all
 * active (non-cancelled) orders for this product from this vendor.
 */
function getFullVendorStock(vendorId: string, masterProductCode: string, liveStock: number): number {
  try {
    const orders = JSON.parse(localStorage.getItem("nido_my_orders") || "[]");
    let totalReserved = 0;
    for (const order of orders) {
      if (order.status === "Cancelled") continue;
      for (const item of (order.cartItems || [])) {
        if (item.productCode !== masterProductCode) continue;
        for (const alloc of (item.vendorAllocations || [])) {
          if (alloc.vendorId === vendorId) {
            totalReserved += (alloc.allocated || 0);
          }
        }
      }
    }
    return liveStock + totalReserved;
  } catch {
    return liveStock;
  }
}

function VendorSelectionModal({ sub, selectedVendorId, onSelect, onClose }) {
  const comparisons: VendorComparisonRow[] = useMemo(() => {
    if (!sub.productCode) return [];
    // usePhysicalStock=true: the reservation for this order was already created
    // at checkout time (reserveVendorStock). Showing available stock here would
    // double-count that reservation and incorrectly cap the admin's allocation.
    // The admin must see each vendor's full physical stock so they can allocate
    // the ordered quantity without hitting an artificial limit.
    return computeVendorComparisons(sub.productCode, undefined, true);
  }, [sub.productCode]);

  // c.stock = physicalStock (not available), because reservations are
  // already accounted for at order creation; admin allocates against real stock.
  const getVendorStock = (c: VendorComparisonRow): number => c.stock;

  const fmt = (n: number) =>
    "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // On-time delivery % — deterministic approximation from rating
  const onTimePct = (c: VendorComparisonRow) =>
    Math.min(99, Math.round(c.rating * 5 + 74));

  // Lead time: split roughly 60/40 into dispatch + transit
  const splitLT = (lt: number) => {
    const d = Math.ceil(lt * 0.6);
    return { d, t: lt - d, total: lt };
  };

  // ── Checkbox + qty state ─────────────────────────────────────────────────
  const [rowQtys, setRowQtys] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    for (const c of comparisons) q[c.vendorId] = 0;
    if (selectedVendorId) {
      // Re-opening after a prior selection — keep that vendor at full qty.
      q[selectedVendorId] = sub.qty;
    } else {
      // Auto-select cheapest vendor first; if its stock is insufficient,
      // spill the remaining qty to the next cheapest, and so on.
      let remaining = sub.qty;
      for (const c of comparisons) {
        if (remaining <= 0) break;
        const assign = Math.min(remaining, c.stock);
        if (assign > 0) {
          q[c.vendorId] = assign;
          remaining -= assign;
        }
      }
    }
    return q;
  });
  const [checkedSet, setCheckedSet] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (selectedVendorId) {
      s.add(selectedVendorId);
    } else {
      // Check every vendor that received an auto-allocated qty above.
      let remaining = sub.qty;
      for (const c of comparisons) {
        if (remaining <= 0) break;
        const assign = Math.min(remaining, c.stock);
        if (assign > 0) {
          s.add(c.vendorId);
          remaining -= assign;
        }
      }
    }
    return s;
  });
  // Which vendor's details are shown at the bottom
  const [detailVendorId, setDetailVendorId] = useState<string>(
    selectedVendorId || comparisons[0]?.vendorId || ""
  );

  const handleToggleCheck = (vendorId: string) => {
    setCheckedSet(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
        setRowQtys(q => ({ ...q, [vendorId]: 0 }));
      } else {
        next.add(vendorId);
        // Default to remaining unallocated (min 1)
        const allocated = [...prev].reduce((s, vid) => s + (rowQtys[vid] || 0), 0);
        const rem = Math.max(1, sub.qty - allocated);
        setRowQtys(q => ({ ...q, [vendorId]: rem }));
      }
      return next;
    });
    setDetailVendorId(vendorId);
  };

  const handleQtyChange = (vendorId: string, val: number) => {
    const n = Math.max(0, val);
    setRowQtys(prev => ({ ...prev, [vendorId]: n }));
    if (n > 0 && !checkedSet.has(vendorId)) {
      setCheckedSet(prev => new Set([...prev, vendorId]));
    }
  };

  const selectedComps = comparisons.filter(c => checkedSet.has(c.vendorId));
  const totalAllocated = selectedComps.reduce((s, c) => s + (rowQtys[c.vendorId] || 0), 0);
  const remaining = sub.qty - totalAllocated;

  // True when no single vendor can cover the full order qty alone
  const needsSplit = comparisons.length > 0 && !comparisons.some(c => getVendorStock(c) >= sub.qty);
  // Total available across all vendors
  const totalAvailable = comparisons.reduce((s, c) => s + getVendorStock(c), 0);

  const buildMeta = (vendorId: string) => {
    const c = comparisons.find(x => x.vendorId === vendorId);
    const v = getVendorById(vendorId);
    return {
      vendorId,
      vendorName: c?.vendorName || vendorId,
      unitPrice: c?.landedCostPerUnit || 0,
      location: v ? `${v.city || ""}, ${v.state || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, "") : "",
      gstin: v?.taxId || (v as any)?.pan || "",
      contact: v?.primaryContact || "",
      email: v?.email || "",
      phone: v?.phone || "",
      addressLine1: v?.addressLine1 || (v as any)?.address || "",
      addressLine2: v?.addressLine2 || "",
      city: v?.city || "",
      state: v?.state || "",
      pincode: v?.zipCode || "",
    };
  };

  const handleConfirm = () => {
    const allocs = selectedComps
      .map(c => ({ vendorId: c.vendorId, qty: rowQtys[c.vendorId] || 0, meta: buildMeta(c.vendorId) }))
      .filter(a => a.qty > 0);
    if (allocs.length === 0) return;
    onSelect(sub.id, allocs);
    onClose();
  };

  const detailComp = comparisons.find(c => c.vendorId === detailVendorId);
  const detailVendorInfo = detailVendorId ? getVendorById(detailVendorId) : undefined;
  const canConfirm = selectedComps.length > 0 && totalAllocated === sub.qty;

  // 13-column grid: cb | # | Vendor | Price | Stock | LeadTime | Rating | OnTime | PayTerms | MOQ | AllocQty | Total | chevron
  const GRID = "36px 32px 1fr 100px 88px 110px 62px 72px 106px 66px 106px 98px 28px";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 1080, boxShadow: "0 20px 60px rgba(0,0,0,0.28)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
              Vendor Selection
              <span style={{ color: "#d1d5db", fontWeight: 300, fontSize: 18 }}>|</span>
              <span style={{ fontWeight: 500, color: "#374151", fontSize: 14 }}>{sub.id} ({sub.itemName})</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>Compare vendors and allocate quantity to get the best value for your order.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
        </div>

        {/* ── Info bar — 4 stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #e5e7eb" }}>
          {[
            { icon: "📋", label: "Required Qty", value: `${sub.qty} Nos` },
            { icon: "📅", label: "Required Date", value: sub.requiredDate },
            { icon: "🏷", label: "Product Code", value: sub.productCode || "—" },
            { icon: "🔖", label: "HSN Code", value: "—" },
          ].map((card, i) => (
            <div key={i} style={{ padding: "14px 20px", borderRight: i < 3 ? "1px solid #e5e7eb" : "none", display: "flex", alignItems: "center", gap: 12, background: "#fafafa" }}>
              <span style={{ fontSize: 22 }}>{card.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 3 }}>{card.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Split-required / stock warning banner ── */}
        {comparisons.length > 0 && (needsSplit || totalAvailable < sub.qty) && (
          <div style={{ padding: "10px 24px", background: totalAvailable < sub.qty ? "#fef2f2" : "#fffbeb", borderBottom: "1px solid " + (totalAvailable < sub.qty ? "#fecaca" : "#fde68a"), display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{totalAvailable < sub.qty ? "⚠️" : "ℹ️"}</span>
            <div>
              {totalAvailable < sub.qty ? (
                <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
                  Combined stock across all vendors ({totalAvailable} Nos) is less than the required qty ({sub.qty} Nos). Contact vendors to replenish before raising POs.
                </span>
              ) : (
                <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                  No single vendor has enough stock for this order ({sub.qty} Nos). Select multiple vendors below and split the qty across them to cover the full order.
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ overflow: "auto", flex: 1 }}>
          {/* ── Vendor comparison table ── */}
          {comparisons.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>🏪</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No vendor pricing data found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add this product to a vendor's catalog, then configure the Price Engine.</div>
            </div>
          ) : (
            <div style={{ minWidth: 960 }}>
              {/* Group-header row */}
              <div style={{ display: "grid", gridTemplateColumns: GRID, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#374151", textAlign: "center" }}>
                <div style={{ padding: "9px 0", borderRight: "1px solid #e5e7eb" }} />
                <div style={{ padding: "9px 0", borderRight: "1px solid #e5e7eb" }}>#</div>
                <div style={{ padding: "9px 12px", textAlign: "left", borderRight: "1px solid #e5e7eb" }}>Vendor</div>
                <div style={{ padding: "9px 6px", background: "#fffbeb", color: "#92400e", borderRight: "1px solid #e5e7eb" }}>Price Summary (₹)</div>
                <div style={{ padding: "9px 6px", gridColumn: "span 2", background: "#eff6ff", color: "#1d4ed8", borderRight: "1px solid #e5e7eb" }}>Availability &amp; Delivery</div>
                <div style={{ padding: "9px 6px", gridColumn: "span 2", background: "#f0fdf4", color: "#15803d", borderRight: "1px solid #e5e7eb" }}>Vendor Performance</div>
                <div style={{ padding: "9px 6px", gridColumn: "span 2", background: "#faf5ff", color: "#7e22ce", borderRight: "1px solid #e5e7eb" }}>Commercial Terms</div>
                <div style={{ padding: "9px 6px", borderRight: "1px solid #e5e7eb" }}>Allocate Qty</div>
                <div style={{ padding: "9px 6px" }}>Total Cost (₹)</div>
                <div />
              </div>

              {/* Sub-header row */}
              <div style={{ display: "grid", gridTemplateColumns: GRID, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 10.5, fontWeight: 600, color: "#6b7280", textAlign: "center" }}>
                <div style={{ padding: "6px 0" }} />
                <div style={{ padding: "6px 0" }} />
                <div style={{ padding: "6px 12px", textAlign: "left" }} />
                <div style={{ padding: "6px 4px", background: "#fffef5" }}>Client Selling Price<br />(Per Unit)</div>
                <div style={{ padding: "6px 4px", background: "#f0f7ff" }}>Available<br />Stock</div>
                <div style={{ padding: "6px 4px", background: "#f0f7ff" }}>Lead Time<br />(Dispatch + Transit)</div>
                <div style={{ padding: "6px 4px", background: "#f0fdf4" }}>Rating</div>
                <div style={{ padding: "6px 4px", background: "#f0fdf4" }}>On-Time<br />Delivery</div>
                <div style={{ padding: "6px 4px", background: "#fdf4ff" }}>Payment Terms</div>
                <div style={{ padding: "6px 4px", background: "#fdf4ff" }}>MOQ</div>
                <div style={{ padding: "6px 4px" }} />
                <div style={{ padding: "6px 4px" }} />
                <div />
              </div>

              {/* Data rows */}
              {comparisons.map((c, i) => {
                const isChecked = checkedSet.has(c.vendorId);
                const stock = getVendorStock(c);
                const stockOk = stock >= sub.qty;
                const qty = rowQtys[c.vendorId] || 0;
                const moqVal = c.moq || 0;
                const moqOk = qty === 0 || qty >= moqVal;
                const lt = splitLT(c.leadTime);
                const lineTotal = c.landedCostPerUnit * qty;
                const isLowest = i === 0;

                return (
                  <div
                    key={c.vendorId}
                    onClick={() => setDetailVendorId(c.vendorId)}
                    style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", borderBottom: "1px solid #f0f0f0", background: isChecked ? "#eff6ff" : "#fff", cursor: "pointer" }}
                  >
                    {/* Checkbox */}
                    <div style={{ display: "flex", justifyContent: "center", padding: "14px 0" }} onClick={e => { e.stopPropagation(); handleToggleCheck(c.vendorId); }}>
                      <div style={{ width: 18, height: 18, border: `2px solid ${isChecked ? "#2563eb" : "#d1d5db"}`, borderRadius: 4, background: isChecked ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                        {isChecked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>

                    {/* # badge */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: isLowest ? "#fef9c3" : "#f3f4f6", color: isLowest ? "#92400e" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                    </div>

                    {/* Vendor name */}
                    <div style={{ padding: "14px 12px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{c.vendorName}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                        {isLowest && <span style={{ fontSize: 10, background: "#fef9c3", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 8, padding: "1px 7px", fontWeight: 600 }}>Recommended</span>}
                        {isLowest && <span style={{ fontSize: 10.5, color: "#2563eb", fontWeight: 500 }}>Lowest Client Price</span>}
                      </div>
                    </div>

                    {/* Client Selling Price */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{fmt(c.landedCostPerUnit)}</div>
                    </div>

                    {/* Available Stock */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: stockOk ? "#f0fdf4" : "#fff7ed", color: stockOk ? "#166534" : "#c2410c", border: `1px solid ${stockOk ? "#bbf7d0" : "#fed7aa"}` }}>
                        {`${stock} Nos`}
                      </span>
                    </div>

                    {/* Lead Time */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0369a1" }}>{lt.d} + {lt.t} Days</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>({lt.total} Days)</div>
                    </div>

                    {/* Rating */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{c.rating.toFixed(1)}</span>
                      <span style={{ color: "#f59e0b", marginLeft: 3 }}>★</span>
                    </div>

                    {/* On-Time Delivery */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{onTimePct(c)}%</div>
                    </div>

                    {/* Payment Terms */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "#374151" }}>{c.paymentTerms || "—"}</div>
                    </div>

                    {/* MOQ */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "#374151" }}>{moqVal > 0 ? `${moqVal} Nos` : "—"}</div>
                    </div>

                    {/* Allocate Qty — stepper input capped to vendor available stock */}
                    <div style={{ padding: "10px 8px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${qty > stock ? "#f87171" : "#d1d5db"}`, borderRadius: 6, overflow: "hidden", background: "#fff" }}>
                        <input
                          type="number"
                          min={0}
                          max={stock}
                          value={qty}
                          onChange={e => handleQtyChange(c.vendorId, Math.min(parseInt(e.target.value) || 0, stock))}
                          style={{ flex: 1, width: 0, border: "none", outline: "none", textAlign: "center", fontSize: 13, fontWeight: 600, padding: "6px 4px", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid #e5e7eb" }}>
                          <button onClick={() => handleQtyChange(c.vendorId, Math.min(qty + 1, stock))} style={{ border: "none", background: "#f9fafb", cursor: "pointer", padding: "3px 6px", fontSize: 8, lineHeight: 1, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>▲</button>
                          <button onClick={() => handleQtyChange(c.vendorId, Math.max(0, qty - 1))} style={{ border: "none", background: "#f9fafb", cursor: "pointer", padding: "3px 6px", fontSize: 8, lineHeight: 1, color: "#374151" }}>▼</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, marginTop: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ color: "#9ca3af" }}>Max: {stock} Nos</span>
                        {isChecked && moqVal > 0 && (
                          <span style={{ color: moqOk ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {moqOk ? "✓ Within MOQ" : "▲ Below Required"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div style={{ textAlign: "right", paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmt(lineTotal)}</div>
                    </div>

                    {/* Chevron */}
                    <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14 }}>∨</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Selected Vendors summary ── */}
          {selectedComps.length > 0 && (
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#2563eb", marginBottom: 10 }}>Selected Vendors</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 1fr 130px", padding: "8px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.3 }}>
                  {["#", "Vendor", "Allocate Qty", "Client Selling Price (Per Unit)", "Total Cost (₹)"].map(h => <div key={h}>{h}</div>)}
                </div>
                {selectedComps.map((c, i) => {
                  const q = rowQtys[c.vendorId] || 0;
                  return (
                    <div key={c.vendorId} style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 1fr 130px", padding: "10px 16px", alignItems: "center", borderBottom: i < selectedComps.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                      <div style={{ fontSize: 12.5, color: "#6b7280" }}>{i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.vendorName}</div>
                      <div style={{ fontSize: 13, color: "#374151" }}>{q} Nos</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>{fmt(c.landedCostPerUnit)}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmt(c.landedCostPerUnit * q)}</div>
                    </div>
                  );
                })}
                {/* Total row */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 1fr 130px", padding: "10px 16px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  <div />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Total</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{totalAllocated} Nos</div>
                  <div />
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                    {fmt(selectedComps.reduce((s, c) => s + c.landedCostPerUnit * (rowQtys[c.vendorId] || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Vendor Details ── */}
          {detailVendorInfo && (
            <div style={{ padding: "14px 20px" }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 18px" }}>
                <div style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>Vendor Details</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 10 }}>{detailVendorInfo.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 40px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      ["GSTIN", detailVendorInfo.taxId || (detailVendorInfo as any).pan || "—"],
                      ["Location", detailVendorInfo.city || "—"],
                      ["Contact", detailVendorInfo.primaryContact || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ fontSize: 12.5, color: "#374151", display: "flex", gap: 6 }}>
                        <span style={{ minWidth: 56, color: "#6b7280" }}>{k}</span>
                        <span>:</span>
                        <span style={{ color: "#111827" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      ["Rating", `${detailVendorInfo.rating.toFixed(1)} / 5`],
                      ["Category", detailVendorInfo.category || "—"],
                      ["MOQ", detailComp ? `${detailComp.moq} units` : "—"],
                      ["Payment Terms", detailComp?.paymentTerms || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ fontSize: 12.5, color: "#374151", display: "flex", gap: 6 }}>
                        <span style={{ minWidth: 90, color: "#6b7280" }}>{k}</span>
                        <span>:</span>
                        <span style={{ color: "#111827", fontWeight: k === "Category" || k === "Payment Terms" ? 600 : 400 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid #e5e7eb", gap: 16 }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 26px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}
          >
            Cancel
          </button>

          {/* Allocation progress */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Allocated: <strong style={{ color: totalAllocated === sub.qty ? "#16a34a" : "#374151" }}>{totalAllocated}</strong> / {sub.qty} Nos
            </div>
            {remaining > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 8, padding: "2px 10px" }}>
                {remaining} Nos still unassigned
              </span>
            )}
            {remaining < 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: "2px 10px" }}>
                Over by {Math.abs(remaining)} Nos
              </span>
            )}
            {remaining === 0 && totalAllocated > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "2px 10px" }}>
                ✓ Fully covered
              </span>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{ padding: "10px 30px", border: "none", borderRadius: 8, background: canConfirm ? "#2563eb" : "#93c5fd", color: "#fff", cursor: canConfirm ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Selection Tab ──────────────────────────────────────────────────────
function VendorSelectionTab({ subOrders, selectedVendors, selectedVendorMeta, onOpenModal }) {
  // Returns [{vendorId, vendorName, stock}] per vendor for this product.
  // Use the stock value exactly as entered in vendor product assignment.
  const getVendorStockBreakdown = (productCode: string) => {
    if (!productCode) return [];
    return computeVendorComparisons(productCode).map(c => ({
      vendorId: c.vendorId,
      vendorName: c.vendorName,
      stock: c.stock,
    }));
  };

  const COLS = "20px 70px 1fr 42px 55px 180px 90px 70px";
  const HEADERS = ["#", "SUB ORDER ID", "ITEM DETAILS", "QTY", "REQ DATE", "VENDOR STOCK", "SELECTED VENDOR", "ACTION"];

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Vendor Selection</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
        Click "Select Vendor" to open the Price Engine dialog. The <strong>Vendor Stock</strong> column shows live individual stock per vendor so you can plan splits before selecting.
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COLS, gap: "2px", padding: "8px 10px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
          {HEADERS.map(h => <div key={h}>{h}</div>)}
        </div>

        {subOrders.map((sub, idx) => {
          const meta = selectedVendorMeta[sub.id];
          const hasVendor = !!meta || !!selectedVendors[sub.id];
          const displayName = meta?.vendorName || selectedVendors[sub.id] || null;
          const displayLoc = meta?.location || "";
          const stockBreakdown = getVendorStockBreakdown(sub.productCode);
          const totalStock = stockBreakdown.reduce((s, v) => s + v.stock, 0);

          return (
            <div key={sub.id} style={{ display: "grid", gridTemplateColumns: COLS, gap: "2px", padding: "10px", alignItems: "center", borderBottom: idx < subOrders.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              {/* # */}
              <div style={{ color: "#6b7280", fontSize: 13 }}>{sub.num}</div>

              {/* Sub Order ID */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>{sub.id}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
              </div>

              {/* Item Details */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{sub.itemName}</div>
                  {sub.referenceNumber && <div style={{ fontSize: 11, color: "#6b7280" }}>Ref: {sub.referenceNumber}</div>}
                </div>
              </div>

              {/* Qty */}
              <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty}<div style={{ fontSize: 10, color: "#9ca3af" }}>Nos</div></div>

              {/* Req Date */}
              <div style={{ fontSize: 12, color: "#374151" }}>{sub.requiredDate}</div>

              {/* Vendor Stock — per-vendor breakdown */}
              <div>
                {stockBreakdown.length === 0 ? (
                  <span style={{ fontSize: 11.5, color: "#9ca3af" }}>No data</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {stockBreakdown.map(v => {
                      const ok = v.stock >= sub.qty;
                      const zero = v.stock === 0;
                      return (
                        <div key={v.vendorId} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 11.5, color: "#374151", fontWeight: 500, minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.vendorName}</span>
                          <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 8, fontSize: 11, fontWeight: 700, flexShrink: 0,
                            background: zero ? "#f3f4f6" : ok ? "#f0fdf4" : "#fef2f2",
                            color: zero ? "#9ca3af" : ok ? "#166534" : "#991b1b",
                            border: `1px solid ${zero ? "#e5e7eb" : ok ? "#bbf7d0" : "#fecaca"}` }}>
                            {v.stock} Nos
                          </span>
                        </div>
                      );
                    })}
                    {/* Total */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, paddingTop: 3, borderTop: "1px dashed #e5e7eb" }}>
                      <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>Total</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: totalStock >= sub.qty ? "#15803d" : "#b91c1c" }}>{totalStock} Nos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Vendor */}
              <div>
                {displayName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {(displayName[0] || "V").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{displayName}</div>
                      {displayLoc && <div style={{ fontSize: 11, color: "#6b7280" }}>{displayLoc.split(",")[0]}</div>}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Not selected</span>
                )}
              </div>

              {/* Action */}
              <div>
                <button
                  onClick={() => onOpenModal(sub)}
                  style={{ padding: "6px 12px", border: `1px solid ${hasVendor ? "#2563eb" : "#d1d5db"}`, borderRadius: 7, background: hasVendor ? "#eff6ff" : "#fff", color: hasVendor ? "#2563eb" : "#374151", cursor: "pointer", fontWeight: 600, fontSize: 12.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  {hasVendor ? "Change" : "Select Vendor"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── View Items Modal ──────────────────────────────────────────────────────────
function ViewItemsModal({ group, onClose }) {
  // group: { vendorName, location, unitPrice, subOrders }
  const fmtINR = (n: number) => "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const total = group.subOrders.reduce((a, s) => a + group.unitPrice * s.qty, 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 780, boxShadow: "0 12px 48px rgba(0,0,0,0.22)", overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Items for {group.vendorName}</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>{group.subOrders.length} item{group.subOrders.length !== 1 ? "s" : ""}{group.location ? ` · ${group.location}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "30px 100px 1fr 50px 110px 110px", gap: "2px", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
            {["#", "SUB ORDER ID", "ITEM DETAILS", "QTY", "UNIT PRICE", "TOTAL"].map(h => <div key={h}>{h}</div>)}
          </div>
          {group.subOrders.map((sub, idx) => (
            <div key={sub.id} style={{ display: "grid", gridTemplateColumns: "30px 100px 1fr 50px 110px 110px", gap: "2px", padding: "12px 16px", alignItems: "start", borderBottom: idx < group.subOrders.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 3 }}>{sub.num}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{sub.id}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{sub.itemName}</div>
                  {sub.referenceNumber && <div style={{ fontSize: 11.5, color: "#6b7280" }}>Ref/Model No: {sub.referenceNumber}</div>}
                  {sub.specs.map(s => <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>)}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty}</div>
              <div style={{ fontSize: 13, color: "#374151" }}>{fmtINR(group.unitPrice)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmtINR(group.unitPrice * sub.qty)}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{fmtINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Selected Summary Tab ───────────────────────────────────────────────
// Simplified: shows ordered qty only. No checkboxes, no stock column, no custom qty input.
function VendorSelectedSummaryTab({ subOrders, selectedVendors, selectedVendorMeta, vendorAllocations, createdPOs, onCreatePurchaseOrders, onCancelPO }) {
  const fmtINR = (n: number) => "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // ── Pending items: vendor selected but PO not yet raised ──
  type PendingItem = {
    sub: any;
    allocations: Array<{ vendorId: string; qty: number; vendorName: string; unitPrice: number; location: string }>;
  };
  const pendingItems: PendingItem[] = [];
  for (const sub of subOrders) {
    const vid = selectedVendors[sub.id];
    if (!vid || Object.values(createdPOs).some((p: any) => p.subOrderId === sub.id)) continue;
    const allocs = vendorAllocations?.[sub.id];
    if (allocs && allocs.length > 0) {
      pendingItems.push({
        sub,
        allocations: allocs.map((a: any) => ({
          vendorId: a.vendorId,
          qty: a.qty,
          vendorName: a.meta?.vendorName || a.vendorId,
          unitPrice: a.meta?.unitPrice || 0,
          location: a.meta?.location || "",
        })),
      });
    } else {
      const meta = selectedVendorMeta[sub.id];
      pendingItems.push({
        sub,
        allocations: [{ vendorId: vid, qty: sub.qty, vendorName: meta?.vendorName || vid, unitPrice: meta?.unitPrice || 0, location: meta?.location || "" }],
      });
    }
  }

  // ── Created POs ──
  const poList = Object.values(createdPOs) as any[];
  const uniquePOs = Array.from(new Map(poList.map(p => [p.poNumber, p])).values());
  const hasPOs = uniquePOs.length > 0;
  const poTotal = uniquePOs.reduce((a, p) => a + (p.grandTotal ?? p.total ?? 0), 0);
  const poCreatedAt = hasPOs
    ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      " " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const nothingAtAll = !hasPOs && pendingItems.length === 0;

  const COL_PO  = "160px 180px 1fr 90px 150px 110px 100px";
  const COL_PND = "1fr 200px 90px 110px 120px";

  return (
    <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Empty state ── */}
      {nothingAtAll && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "48px 20px", textAlign: "center", color: "#9ca3af", background: "#fafafa" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No vendors selected yet</div>
          <div style={{ fontSize: 13 }}>Use the "Select Vendor" button in the Vendor Selection tab.</div>
        </div>
      )}

      {/* ── Created POs section ── */}
      {hasPOs && (
        <div>
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #86efac", borderRadius: 14, padding: "22px 28px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, color: "#fff" }}>✓</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#14532d", marginBottom: 4 }}>
                {uniquePOs.length} Purchase Order{uniquePOs.length !== 1 ? "s" : ""} Created Successfully!
              </div>
              <div style={{ fontSize: 13.5, color: "#166534", lineHeight: 1.6 }}>
                POs have been dispatched to the respective vendors. Each vendor received an individual PO.
              </div>
              <div style={{ fontSize: 12, color: "#4ade80", marginTop: 6, fontWeight: 500 }}>Generated on {poCreatedAt}</div>
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 10 }}>Created Purchase Orders</div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: COL_PO, padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
              {["PO NUMBER", "VENDOR", "ITEM", "QTY", "AMOUNT (INR)", "STATUS", "ACTION"].map(h => <div key={h}>{h}</div>)}
            </div>
            {uniquePOs.map((po, i) => (
              <div key={po.poNumber} style={{ display: "grid", gridTemplateColumns: COL_PO, padding: "15px 20px", alignItems: "center", borderBottom: i < uniquePOs.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#2563eb" }}>{po.poNumber}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Purchase Order</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {(po.vendorName?.[0] || "V").toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{po.vendorName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{po.item}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Sub Order: {po.subOrderId}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{po.qty} Nos</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{fmtINR(po.grandTotal ?? po.total ?? 0)}</div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />Created
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => { if (window.confirm(`Cancel ${po.poNumber}? This will remove the PO and allow vendor re-selection.`)) onCancelPO(po.subOrderId); }}
                    style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "4px 10px", fontFamily: "inherit" }}
                  >Cancel PO</button>
                </div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: COL_PO, padding: "12px 20px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", gridColumn: "1 / 5" }}>{uniquePOs.length} PO{uniquePOs.length !== 1 ? "s" : ""} Created</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{fmtINR(poTotal)}</div>
              <div /><div />
            </div>
          </div>
        </div>
      )}

      {/* ── Pending: vendor allocated, PO not yet raised ── */}
      {pendingItems.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                {hasPOs ? "Additional Vendor Selections — Pending PO" : "Vendor Selections — Ready to Raise PO"}
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>
                A separate PO is raised per vendor. Multi-vendor splits each create their own PO.
              </div>
            </div>
            <button
              onClick={() => onCreatePurchaseOrders(pendingItems.map(p => p.sub.id))}
              style={{ padding: "9px 22px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              Raise Purchase Orders ({pendingItems.length})
            </button>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: COL_PND, padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
              {["ITEM / SUB-ORDER", "VENDOR(S)", "ORDERED QTY", "UNIT PRICE", "EST. TOTAL"].map(h => <div key={h}>{h}</div>)}
            </div>

            {/* Rows */}
            {pendingItems.map((pi, idx) => {
              const isMulti = pi.allocations.length > 1;
              const totalQty = pi.allocations.reduce((s, a) => s + a.qty, 0);
              const estTotal = pi.allocations.reduce((s, a) => s + a.unitPrice * a.qty, 0);
              const primaryAlloc = pi.allocations[0];
              const VENDOR_COLORS = ["#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
              return (
                <div key={pi.sub.id} style={{ borderBottom: idx < pendingItems.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                  {isMulti ? (
                    /* ── Multi-vendor: item header + one sub-row per vendor ── */
                    <>
                      {/* Item header */}
                      <div style={{ display: "grid", gridTemplateColumns: COL_PND, padding: "12px 20px 8px", alignItems: "start", borderBottom: "1px dashed #f3f4f6" }}>
                        <div style={{ gridColumn: "1 / 3" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 2 }}>{pi.sub.itemName}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{pi.sub.id}{pi.sub.category ? ` · ${pi.sub.category}` : ""}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{totalQty} Nos</div>
                        <div style={{ fontSize: 11.5, color: "#6b7280" }}>Split across {pi.allocations.length} vendors</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{fmtINR(estTotal)}</div>
                      </div>
                      {/* Per-vendor sub-rows */}
                      {pi.allocations.map((a, ai) => {
                        const vendorColor = VENDOR_COLORS[ai % VENDOR_COLORS.length];
                        const lineTotal = a.unitPrice * a.qty;
                        return (
                          <div key={ai} style={{ display: "grid", gridTemplateColumns: COL_PND, padding: "9px 20px 9px 32px", alignItems: "center", background: ai % 2 === 0 ? "#fafafa" : "#fff", borderBottom: ai < pi.allocations.length - 1 ? "1px dashed #f3f4f6" : "none" }}>
                            {/* Item sub-label */}
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>└ Vendor {ai + 1}</div>
                            {/* Vendor */}
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: vendorColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                {(a.vendorName[0] || "V").toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{a.vendorName}</div>
                                {a.location && <div style={{ fontSize: 11, color: "#6b7280" }}>{a.location}</div>}
                              </div>
                            </div>
                            {/* Qty for this vendor */}
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{a.qty} Nos</div>
                            {/* Unit price */}
                            <div style={{ fontSize: 13, color: "#374151" }}>{fmtINR(a.unitPrice)}</div>
                            {/* Est. total for this vendor */}
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtINR(lineTotal)}</div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    /* ── Single vendor: original grid row ── */
                    <div style={{ display: "grid", gridTemplateColumns: COL_PND, padding: "14px 20px", alignItems: "start" }}>
                      {/* Item */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 2 }}>{pi.sub.itemName}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{pi.sub.id}</div>
                        {pi.sub.category && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{pi.sub.category}</div>}
                      </div>
                      {/* Vendor */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(primaryAlloc.vendorName[0] || "V").toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{primaryAlloc.vendorName}</div>
                          {primaryAlloc.location && <div style={{ fontSize: 11, color: "#6b7280" }}>{primaryAlloc.location}</div>}
                        </div>
                      </div>
                      {/* Ordered Qty */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", paddingTop: 2 }}>{totalQty} Nos</div>
                      {/* Unit Price */}
                      <div style={{ fontSize: 13, color: "#374151", paddingTop: 2 }}>{fmtINR(primaryAlloc.unitPrice)}</div>
                      {/* Est. Total */}
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", paddingTop: 2 }}>{fmtINR(estTotal)}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ display: "grid", gridTemplateColumns: COL_PND, padding: "12px 20px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""}</div>
              <div />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {pendingItems.reduce((a, pi) => a + pi.allocations.reduce((s, al) => s + al.qty, 0), 0)} Nos
              </div>
              <div />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
                {fmtINR(pendingItems.reduce((a, pi) => a + pi.allocations.reduce((s, al) => s + al.unitPrice * al.qty, 0), 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What's next */}
      {hasPOs && pendingItems.length === 0 && (
        <div style={{ padding: "16px 20px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <div style={{ fontSize: 13.5, color: "#1e40af", lineHeight: 1.6 }}>
            <strong>What's next?</strong> The vendors will receive their POs shortly and confirm delivery timelines. Track each order's status under the <strong>Sub Orders / Items</strong> tab.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload Document Modal ─────────────────────────────────────────────────────
function UploadDocModal({ onSave, onClose }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ type: "", description: "" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<any>();

  const handleFile = f => { if (f) setFile(f); };
  const ext = file ? (file as any).name.split(".").pop() : "";

  const handleSave = () => {
    if (!file) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + "\n" + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    onSave({ id: "d" + Date.now(), name: (file as any).name, ext, size: ((file as any).size / 1024).toFixed(0) + " KB", type: form.type || "Other", uploadedBy: "System Owner", uploadedOn: dateStr, description: form.description });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Upload Document</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${dragging ? "#2563eb" : "#d1d5db"}`, borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragging ? "#eff6ff" : "#f9fafb", marginBottom: 18, transition: "all 0.15s" }}>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => handleFile((e.target.files as any)[0])} />
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <DocTypeIcon ext={ext} size={36} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{(file as any).name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{((file as any).size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ marginLeft: 8, background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8, color: "#9ca3af" }}>⬆</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>Click to upload or drag & drop</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>PDF, XLSX, DOCX, PNG, JPG supported</div>
              </>
            )}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Document Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inSt, appearance: "none" }}>
              <option value="">Select type</option>
              {["Purchase Order", "Quotation", "Invoice", "Contract", "Shipping Document", "Other"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={lbSt}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a description..." style={{ ...inSt, resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid hsl(var(--border))", borderRadius: 7, background: "hsl(var(--card))", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", color: "hsl(var(--foreground))" }}>Cancel</button>
          <button onClick={handleSave} disabled={!file} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: file ? "hsl(var(--primary))" : "hsl(var(--primary)/0.5)", color: "hsl(var(--primary-foreground))", cursor: file ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Save Document</button>
        </div>
      </div>
    </div>
  );
}

// ── Documents & Notes Tab ─────────────────────────────────────────────────────
function DocTypeTag({ type }) {
  const map: any = { "Purchase Order": { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" }, "Quotation": { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" }, "Invoice": { bg: "#faf5ff", color: "#6b21a8", border: "#d8b4fe" }, "Contract": { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" }, "Shipping Document": { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" }, "Other": { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" } };
  const s = map[type] || map["Other"];
  return <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>{type}</span>;
}

function DocRowMenu({ onDownload, onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<any>(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", top: 28, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 300, minWidth: 170, overflow: "hidden" }}>
          <button onClick={() => { onDownload(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#374151" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span>⬇</span> Download Document
          </button>
          <div style={{ height: 1, background: "#f3f4f6" }} />
          <button onClick={() => { onRemove(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#dc2626" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span>🗑</span> Remove
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentsNotesTab({ orderId }: { orderId: string }) {
  const { user, isClientPortalUser } = useAuth();
  const notesKey = `nido_notes_${orderId}`;
  const docsKey = `nido_docs_${orderId}`;

  const [docs, setDocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(docsKey) || "null") || INITIAL_DOCS; } catch { return INITIAL_DOCS; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(notesKey) || "null") || INITIAL_NOTES; } catch { return INITIAL_NOTES; }
  });
  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState("Internal Note");
  const [showUpload, setShowUpload] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  // Reload docs/notes when the order changes, and persist on every change so
  // both stay in sync between the owner platform and the client portal.
  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(notesKey) || "null") || INITIAL_NOTES); } catch { setNotes(INITIAL_NOTES); }
    try { setDocs(JSON.parse(localStorage.getItem(docsKey) || "null") || INITIAL_DOCS); } catch { setDocs(INITIAL_DOCS); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    localStorage.setItem(notesKey, JSON.stringify(notes));
  }, [notes, notesKey]);

  useEffect(() => {
    localStorage.setItem(docsKey, JSON.stringify(docs));
  }, [docs, docsKey]);

  // Cross-tab sync: pick up notes/documents added from another open tab
  // (e.g. the owner platform and the client portal open side by side)
  // immediately, without needing a reload.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === notesKey) {
        try { setNotes(JSON.parse(e.newValue || "null") || INITIAL_NOTES); } catch { /* ignore */ }
      } else if (e.key === docsKey) {
        try { setDocs(JSON.parse(e.newValue || "null") || INITIAL_DOCS); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [notesKey, docsKey]);

  const filteredDocs = docs.filter(d => !docSearch || d.name.toLowerCase().includes(docSearch.toLowerCase()) || d.type.toLowerCase().includes(docSearch.toLowerCase()));

  // Client portal users are on the "external" side of the conversation —
  // Internal Notes are staff-only and never leave the owner platform.
  const visibleNotes = isClientPortalUser ? notes.filter(n => n.visibility !== "Internal Note") : notes;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const author = user?.name || (isClientPortalUser ? "Client" : "System Owner");
    // Portal notes are always external (visible to the owner platform) —
    // there's no "internal" concept on the client side.
    const noteVisibility = isClientPortalUser ? "External Note" : visibility;
    setNotes(prev => [{ id: "n" + Date.now(), author, date: dateStr, text: noteText.trim(), visibility: noteVisibility }, ...prev]);
    setNoteText("");
  };

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827" }}>Documents</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 1 }}>{docs.length} document{docs.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }}>🔍</span>
              <input value={docSearch} onChange={e => setDocSearch(e.target.value)} placeholder="Search documents..."
                style={{ padding: "7px 12px 7px 28px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
            </div>
            {!isClientPortalUser && (
              <button onClick={() => setShowUpload(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
                ⬆ Upload Document
              </button>
            )}
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, overflow: "hidden", marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 100px 90px 1fr 40px", gap: "2px", padding: "10px 12px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
            {["DOCUMENT NAME", "TYPE", "UPLOADED BY", "UPLOADED ON", "DESCRIPTION", "ACTIONS"].map(h => <div key={h}>{h}</div>)}
          </div>
          {filteredDocs.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13.5 }}>No documents found.</div>
          ) : filteredDocs.map((doc, i) => (
            <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 100px 90px 1fr 40px", gap: "2px", padding: "12px", alignItems: "center", borderBottom: i < filteredDocs.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <DocTypeIcon ext={doc.ext} />
                <div>
                  <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>{doc.name}</a>
                  <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{doc.size}</div>
                </div>
              </div>
              <div><DocTypeTag type={doc.type} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar initial="S" color="#2563eb" size={28} />
                <span style={{ fontSize: 13, color: "#374151" }}>{doc.uploadedBy}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#374151", whiteSpace: "pre-line", lineHeight: 1.5 }}>{doc.uploadedOn}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>{doc.description}</div>
              {isClientPortalUser ? (
                <button onClick={() => alert(`Downloading ${doc.name}...`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 16 }} title="Download">⬇</button>
              ) : (
                <DocRowMenu onDownload={() => alert(`Downloading ${doc.name}...`)} onRemove={() => setDocs(prev => prev.filter(d => d.id !== doc.id))} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 1 }}>Notes</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>
          {visibleNotes.length} note{visibleNotes.length !== 1 ? "s" : ""}{isClientPortalUser ? " \u2014 messages between you and the NIDO team" : ""}
        </div>
        {visibleNotes.map((note, i) => (
          <div key={note.id} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < visibleNotes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
            <Avatar initial={(note.author?.[0] || "S").toUpperCase()} color="#2563eb" size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{note.author}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{note.date}</span>
                {!isClientPortalUser && (
                  <span style={{ fontSize: 11, background: note.visibility === "Internal Note" ? "#eff6ff" : "#faf5ff", color: note.visibility === "Internal Note" ? "#1d4ed8" : "#7c3aed", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                    {note.visibility === "Internal Note" ? "🔒 Internal" : "🌐 Visible to client"}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{note.text}</div>
            </div>
          </div>
        ))}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: isClientPortalUser ? "1fr" : "1fr 220px" }}>
            <div style={{ padding: "14px 16px", borderRight: isClientPortalUser ? "none" : "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8, color: "#111827" }}>{isClientPortalUser ? "Message the NIDO team" : "Add Note"}</div>
              <textarea value={noteText} onChange={e => { if (e.target.value.length <= 500) setNoteText(e.target.value); }} placeholder="Write your note here..."
                rows={4} style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13.5, fontFamily: "inherit", color: "#374151", boxSizing: "border-box", background: "transparent" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{noteText.length} / 500</div>
                {isClientPortalUser && (
                  <button onClick={handleAddNote} disabled={!noteText.trim()}
                    style={{ padding: "8px 22px", border: "none", borderRadius: 8, background: noteText.trim() ? "#2563eb" : "#93c5fd", color: "#fff", cursor: noteText.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>
                    Send
                  </button>
                )}
              </div>
            </div>
            {!isClientPortalUser && (
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>Visibility</div>
                  {[["Internal Note", "🔒", "Only visible to internal users"], ["External Note", "🌐", "Visible to the client on the portal"]].map(([label, icon, sub]) => (
                    <div key={label} onClick={() => setVisibility(label)} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "pointer" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${visibility === label ? "#2563eb" : "#d1d5db"}`, background: visibility === label ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                        {visibility === label && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>{icon} {label}</div>
                        <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleAddNote} disabled={!noteText.trim()}
                    style={{ padding: "8px 22px", border: "none", borderRadius: 8, background: noteText.trim() ? "#2563eb" : "#93c5fd", color: "#fff", cursor: noteText.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showUpload && <UploadDocModal onSave={doc => setDocs(prev => [...prev, doc])} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

// ── Misc modals ───────────────────────────────────────────────────────────────
function EditAssignmentModal({ data, onSave, onClose }) {
  const [form, setForm] = useState(data);
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Edit Assignment" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          {[["assignedTo", "Assigned To"], ["role", "Role"], ["assignedOn", "Assigned On"]].map(([k, label]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={lbSt}>{label}</label>
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inSt} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inSt, resize: "vertical" }} />
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { onSave(form); onClose(); }} />
      </ModalBox>
    </Overlay>
  );
}

function AddTrackingModal({ current, onSave, onClose }) {
  const [form, setForm] = useState(current || { trackingNumber: "", carrier: "", note: "", linkLabel: "Track Package" });
  return (
    <Overlay onClose={onClose}>
      <ModalBox title={current ? "Update Tracking Info" : "Add Tracking Info"} onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          {[["trackingNumber", "Tracking Number", "e.g. 1Z999AA1234567890"], ["note", "Tracking Note", "e.g. Shipped on Apr 17, 2026"], ["linkLabel", "Link Label", "e.g. Track Package"]].map(([k, label, ph]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={lbSt}>{label}</label>
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={ph} style={inSt} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Carrier</label>
            <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={{ ...inSt, appearance: "none" }}>
              <option value="">Select carrier</option>
              {["UPS", "FedEx", "DHL", "USPS", "BlueDart", "Delhivery", "Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { if (form.trackingNumber && form.carrier) { onSave(form); onClose(); } }} saveLabel="Save Tracking" />
      </ModalBox>
    </Overlay>
  );
}

function ReferenceNumberModal({ itemName, current, onSave, onClose }) {
  const [value, setValue] = useState(current || "");
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Reference/Model No." onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>{itemName}</div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Reference/Model Number</label>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="Enter reference/model number" style={inSt} autoFocus />
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { onSave(value.trim()); onClose(); }} saveLabel="Save" />
      </ModalBox>
    </Overlay>
  );
}

function RaiseReturnModal({ itemName, onClose }) {
  const [reason, setReason] = useState(""), [details, setDetails] = useState(""), [submitted, setSubmitted] = useState(false);
  if (submitted) return (
    <Overlay onClose={onClose}>
      <ModalBox title="Return Request Raised" onClose={onClose}>
        <div style={{ padding: "24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Return request submitted!</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Your return request for <b>{itemName}</b> has been raised.</div>
        </div>
        <div style={{ padding: "0 22px 20px" }}><button onClick={onClose} style={{ width: "100%", padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Done</button></div>
      </ModalBox>
    </Overlay>
  );
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Raise Return Request" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>Item: <b>{itemName}</b></div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Reason for Return</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={{ ...inSt, appearance: "none" }}>
              <option value="">Select a reason</option>
              {["Damaged / Defective", "Wrong Item Received", "Item Not as Described", "Changed Mind", "Quantity Mismatch", "Other"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Additional Details</label>
            <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the issue..." style={{ ...inSt, resize: "vertical" }} />
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>⚠️ Return requests can only be raised within 3 days of delivery.</div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { if (reason) setSubmitted(true); }} saveLabel="Submit Return Request" />
      </ModalBox>
    </Overlay>
  );
}

function CancelOrderStatusModal({ onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Cancel Order" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>Are you sure you want to cancel this order?</div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>⚠️ Once cancelled, this order cannot be edited, its status cannot be changed, and it cannot be processed further.</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "20px 22px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid hsl(var(--border))", borderRadius: 7, background: "hsl(var(--card))", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", color: "hsl(var(--foreground))" }}>Keep Order</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Yes, Cancel Order</button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function CancelItemModal({ itemName, onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Cancel Item" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>Are you sure you want to cancel <b>{itemName}</b>?</div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>⚠️ Cancelling this item will notify the vendor and update the order status.</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "20px 22px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid hsl(var(--border))", borderRadius: 7, background: "hsl(var(--card))", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", color: "hsl(var(--foreground))" }}>Keep Item</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Yes, Cancel Item</button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function Stepper({ currentStatus, orderDate }: { currentStatus: string; orderDate?: string }) {
  const steps = [
    { label: "Processing", note: orderDate || "—" },
    { label: "Partially Shipped", note: "In Progress" },
    { label: "Partially Delivered", note: "Pending" },
    { label: "Delivered", note: "Pending" },
  ];
  const activeIdx = Math.max(0, steps.findIndex(s => s.label === currentStatus));
  return (
    <div style={{ display: "flex", alignItems: "flex-start", flex: 1, padding: "0 12px" }}>
      {steps.map((step, i) => {
        const done = i < activeIdx, active = i === activeIdx;
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? "#2563eb" : "#e5e7eb" }} />}
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? "#2563eb" : active ? "#eff6ff" : "#f9fafb", border: `2px solid ${done || active ? "#2563eb" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: done ? "#fff" : "#2563eb", fontSize: 13, fontWeight: 700 }}>
                  {done ? "✓" : "↗"}
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "#2563eb" : "#e5e7eb" }} />}
              </div>
              <div style={{ marginTop: 7, textAlign: "center" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? "#111827" : done ? "#374151" : "#9ca3af" }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{active ? step.note : done ? "Done" : step.note}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const menuItemSt: any = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#374151" };
const STATUS_STYLE: any = { Pending: { color: "#6b7280" }, Confirmed: { color: "#92400e" }, Processing: { color: "#6b21a8" }, Shipped: { color: "#1e40af" }, Delivered: { color: "#166534" } };

function ThreeDotMenu({ sub, onUpdateStatus, onAddTracking, onSetReference, referenceLocked, onCancel, onRaiseReturn, returnAllowed }) {
  const [open, setOpen] = useState(false), [statusSub, setStatusSub] = useState(false);
  const ref = useRef<any>(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setStatusSub(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); setStatusSub(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", top: 30, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 200, minWidth: 200 }}>
          <div style={{ position: "relative" }} onMouseEnter={() => setStatusSub(true)} onMouseLeave={() => setStatusSub(false)}>
            <button style={{ ...menuItemSt, background: statusSub ? "#f9fafb" : "none" }}><span>🔄</span> Update Status <span style={{ marginLeft: "auto", color: "#9ca3af" }}>‹</span></button>
            {statusSub && (
              // Opens to the LEFT of the parent menu (not right) so it stays
              // within the table/container bounds — the 3-dot menu sits at
              // the far-right column, so a right-opening flyout would run
              // past the row's edge and get clipped.
              <div style={{ position: "absolute", top: 0, right: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", minWidth: 160, overflow: "hidden", zIndex: 201 }}>
                {statuses.map(s => (
                  <button key={s} onClick={() => { onUpdateStatus(s); setOpen(false); setStatusSub(false); }}
                    style={{ ...menuItemSt, background: sub.itemStatus === s ? "#f0f7ff" : "none", color: sub.itemStatus === s ? "#2563eb" : "#374151", fontWeight: sub.itemStatus === s ? 600 : 400 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: STATUS_STYLE[s]?.color || "#6b7280", marginRight: 8, flexShrink: 0 }} />
                    {s} {sub.itemStatus === s && "✓"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button style={menuItemSt} onClick={() => { onAddTracking(); setOpen(false); }}><span>📦</span> {sub.tracking ? "Update Tracking Info" : "Add Tracking Info"}</button>
          <button
            style={{ ...menuItemSt, color: referenceLocked ? "#d1d5db" : "#374151", cursor: referenceLocked ? "not-allowed" : "pointer" }}
            onClick={() => { if (!referenceLocked) { onSetReference(); setOpen(false); } }}
          >
            <span>🏷️</span> {sub.referenceNumber ? "Edit Reference/Model No." : "Reference/Model No."}
            {referenceLocked && <span style={{ marginLeft: "auto", fontSize: 10, color: "#d1d5db", background: "#f9fafb", padding: "2px 5px", borderRadius: 4 }}>Locked</span>}
          </button>
          <div style={{ height: 1, background: "#f3f4f6", margin: "2px 0" }} />
          <button style={{ ...menuItemSt, color: "#dc2626" }} onClick={() => { onCancel(); setOpen(false); }}><span>✕</span> Cancel Item</button>
          <button style={{ ...menuItemSt, color: returnAllowed ? "#7c3aed" : "#d1d5db", cursor: returnAllowed ? "pointer" : "not-allowed" }}
            onClick={() => { if (returnAllowed) { onRaiseReturn(); setOpen(false); } }}>
            <span>↩</span> Raise Return Request
            {!returnAllowed && <span style={{ marginLeft: "auto", fontSize: 10, color: "#d1d5db", background: "#f9fafb", padding: "2px 5px", borderRadius: 4 }}>Expired</span>}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#111827" }}>{value}</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cartItemsToSubOrders(cartItems: any[], orderId: string, orderDate: string, poNumber: string) {
  return (cartItems || []).map((item: any, idx: number) => ({
    num: idx + 1,
    id: `SO-${orderId}-${String(idx + 1).padStart(3, "0")}`,
    itemName: item.name,
    image: item.image || "",
    sku: `SKU/SHOP-${item.id}`,
    category: item.category || "General",
    specs: Array.isArray(item.specs) ? item.specs : (item.specs ? [item.specs] : []),
    productCode: item.productCode || "",
    referenceNumber: "",
    vendorName: "Pending Assignment",
    vendorInitial: "P",
    vendorColor: "#6b7280",
    poNumber: poNumber,
    qty: item.quantity,
    unitPrice: `₹${Number(item.priceNum).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    total: `₹${(item.priceNum * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    requiredDate: item.leadTime ? `Within ${item.leadTime}` : "Within 30 Days",
    itemStatus: "Processing",
    updatedOn: orderDate,
    deliveredAt: null,
    tracking: null,
    // Stock reservations made at order-placement time (StockAllocation[]).
    // Used by Nido's vendor selection to add back reserved qty and show
    // the vendor's true supply capacity (currentStock + reservedForThisOrder).
    stockAllocations: item.vendorAllocations || [],
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useMyOrders();
  const { user, isClientPortalUser } = useAuth();
  const orderId = id || "";

  // Find the real order from context
  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

  // ── Checkout fallbacks ────────────────────────────────────────────────────
  // For orders placed before paymentMethod/deliveryAddress were persisted on
  // the order itself, read them live from the same localStorage keys the
  // checkout flow writes, so those fields are never shown as "—".
  const paymentFallback = useMemo(() => {
    if (order?.paymentMethod) return null; // field already stored on order
    try {
      const saved: Record<string, string> = JSON.parse(
        localStorage.getItem("nido_payment_selection") || "{}"
      );
      const methodId = saved.paymentMethod || "card";
      const LABELS: Record<string, string> = {
        card: "Credit / Debit Card", netbanking: "Net Banking", upi: "UPI",
        wallets: "Wallet", neft: "NEFT / RTGS", ban: "Company BAN",
      };
      const WALLET_NAMES: Record<string, string> = {
        phonepe: "PhonePe", paytm: "Paytm", amazonpay: "Amazon Pay",
        googlepay: "Google Pay", mobikwik: "MobiKwik",
      };
      const label = LABELS[methodId] ?? methodId;
      let detail = "";
      switch (methodId) {
        case "card": {
          const last4 = saved.cardNumber?.replace(/\s/g, "").slice(-4) || "";
          const name = saved.cardName || "";
          detail = last4 ? `**** **** **** ${last4}${name ? ` • ${name}` : ""}` : "Card details entered";
          break;
        }
        case "netbanking": detail = saved.netBankingBank || "Bank selected"; break;
        case "upi": detail = saved.upiId || "UPI ID entered"; break;
        case "wallets": {
          const wName = WALLET_NAMES[saved.selectedWallet] ?? saved.selectedWallet ?? "Wallet selected";
          const mob = saved.walletMobile ? ` • +91 ${saved.walletMobile}` : "";
          detail = `${wName}${mob}`;
          break;
        }
        case "neft":
          detail = saved.neftAccountName
            ? `${saved.neftAccountName} • ${saved.neftBankName || ""}`.trim().replace(/•\s*$/, "")
            : "Bank account entered";
          break;
        case "ban": detail = "Billed to company account"; break;
      }
      return { label, detail };
    } catch { return null; }
  }, [order?.paymentMethod]);

  const deliveryAddressFallback = useMemo(() => {
    if (order?.deliveryAddress) return null; // field already stored on order
    try {
      const clientId = localStorage.getItem("nido_shop_selected_client") || "";
      const addrs: any[] = JSON.parse(
        localStorage.getItem(`nido_delivery_addresses_${clientId}`) || "[]"
      );
      const addr = addrs.find(a => a.isDefault) ?? addrs[0] ?? null;
      if (!addr) return null;
      return [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
    } catch { return null; }
  }, [order?.deliveryAddress]);

  // Client portal users only ever see the read-only Sub Orders / Items tab —
  // vendor sourcing (Vendor Selected Summary) is an owner-platform concern.
  const TABS = isClientPortalUser ? ["Sub Orders / Items"] : ["Sub Orders / Items", "Vendor Selected Summary"];
  const [activeTab, setActiveTab] = useState("Sub Orders / Items");
  // Master status lives on the shared order record itself (single source of
  // truth) so a change made on the owner platform is visible immediately on
  // the client portal, and vice versa, without any separate local copy.
  const masterStatus = order?.status || "Processing";
  const isOrderInactive = masterStatus === "Cancelled" || masterStatus === "Draft";
  // Once an order is Cancelled it is a terminal state — no further status
  // changes or processing are allowed on it.
  const isOrderCancelled = masterStatus === "Cancelled";
  const setMasterStatus = (status: string) => {
    if (isClientPortalUser) return; // portal is read-only for order status
    if (isOrderCancelled) return; // cancelled orders can no longer be updated
    // Centralized in MyOrdersContext so a Cancelled/Draft transition always
    // cascades to sub-orders and clears vendor selection, whether triggered
    // here or from the order list's bulk status update.
    updateOrderStatus(orderId, status as any);
  };
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [pendingCancelStatus, setPendingCancelStatus] = useState(false);

  // Cancels the order and marks it as Cancelled (cascades to all sub-orders via context).
  // Stock is no longer reserved at cart time, so no stock release is needed here.
  // Stock restoration (if any POs were already raised) is handled when the PO itself
  // is cancelled from the Vendor Orders page.
  const handleCancelOrder = () => {
    setMasterStatus("Cancelled");
  };
  // Per-item overrides (status, tracking) are persisted separately from the
  // base cart-item snapshot so a cancel/status/tracking change made on one
  // platform (owner or client portal) is picked up by the other immediately.
  const itemStateKey = `nido_subitems_${orderId}`;
  const loadItemState = (): Record<string, any> => {
    try { return JSON.parse(localStorage.getItem(itemStateKey) || "{}"); } catch { return {}; }
  };
  const applyItemState = (base: any[], saved: Record<string, any>) =>
    base.map(s => saved[s.id] ? { ...s, ...saved[s.id], deliveredAt: saved[s.id].deliveredAt ? new Date(saved[s.id].deliveredAt) : s.deliveredAt } : s);

  const [subOrders, setSubOrders] = useState(() =>
    order?.cartItems?.length
      ? applyItemState(cartItemsToSubOrders(order.cartItems, orderId, order.orderDate, order.poNumber), loadItemState())
      : []
  );
  const [subSearch, setSubSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set<string>());
  const [createdPOs, setCreatedPOs] = useState<Record<string, any>>(() => {
    try { return JSON.parse(localStorage.getItem(`nido_pos_${orderId}`) || "{}"); } catch { return {}; }
  });
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`nido_vendors_${orderId}`) || "{}"); } catch { return {}; }
  });
  // Rich vendor info (unit price, address, etc.) — not persisted, set when user picks a vendor
  const [selectedVendorMeta, setSelectedVendorMeta] = useState<Record<string, {
    vendorId: string; vendorName: string; unitPrice: number; location: string;
    gstin: string; contact: string; email: string; phone: string;
    addressLine1: string; addressLine2: string; city: string; state: string; pincode: string;
  }>>({});
  // Multi-vendor allocations per sub-order: [{vendorId, qty, meta}]
  const [vendorAllocations, setVendorAllocations] = useState<Record<string, Array<{ vendorId: string; qty: number; meta: any }>>>({});

  // Reload per-order localStorage state when navigating between orders
  useEffect(() => {
    try { setCreatedPOs(JSON.parse(localStorage.getItem(`nido_pos_${orderId}`) || "{}")); } catch { setCreatedPOs({}); }
    try { setSelectedVendors(JSON.parse(localStorage.getItem(`nido_vendors_${orderId}`) || "{}")); } catch { setSelectedVendors({}); }
    setSelectedVendorMeta({});
    setVendorAllocations({});
  }, [orderId]);
  const [vendorModalSub, setVendorModalSub] = useState<any>(null);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [trackingTarget, setTrackingTarget] = useState(null);
  const [referenceTarget, setReferenceTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [assignment, setAssignment] = useState({
    assignedTo: order?.assigned || "Admin",
    role: order?.assignedRole || "Admin",
    assignedOn: order ? `${order.orderDate} ${order.orderTime}` : "—",
    notes: "Oversees end-to-end execution and vendor coordination for this order.",
  });

  // Reset all derived state whenever the orderId changes or order first resolves from context
  useEffect(() => {
    if (!order) return;
    setSubOrders(
      order.cartItems?.length
        ? applyItemState(cartItemsToSubOrders(order.cartItems, orderId, order.orderDate, order.poNumber), loadItemState())
        : []
    );
    setAssignment({
      assignedTo: order.assigned,
      role: order.assignedRole,
      assignedOn: `${order.orderDate} ${order.orderTime}`,
      notes: "Oversees end-to-end execution and vendor coordination for this order.",
    });
    // Run whenever orderId changes (navigation between orders) or order first resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, order?.id]);

  useEffect(() => {
    localStorage.setItem(`nido_pos_${orderId}`, JSON.stringify(createdPOs));
  }, [createdPOs, orderId]);

  useEffect(() => {
    localStorage.setItem(`nido_vendors_${orderId}`, JSON.stringify(selectedVendors));
  }, [selectedVendors, orderId]);

  // Persist per-item status/tracking changes (cancel, status update, add
  // tracking) so they are visible immediately to the other platform (owner
  // vs. client portal) on next render/reload, and pick up remote changes
  // made in another open tab in real time.
  useEffect(() => {
    if (!subOrders.length) return;
    const state: Record<string, any> = {};
    subOrders.forEach(s => { state[s.id] = { itemStatus: s.itemStatus, tracking: s.tracking, updatedOn: s.updatedOn, deliveredAt: s.deliveredAt ? s.deliveredAt.toISOString() : null, referenceNumber: s.referenceNumber }; });
    localStorage.setItem(itemStateKey, JSON.stringify(state));
  }, [subOrders, itemStateKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== itemStateKey) return;
      let saved: Record<string, any> = {};
      try { saved = JSON.parse(e.newValue || "{}"); } catch { return; }
      setSubOrders(prev => prev.map(s => saved[s.id] ? { ...s, ...saved[s.id], deliveredAt: saved[s.id].deliveredAt ? new Date(saved[s.id].deliveredAt) : s.deliveredAt } : s));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [itemStateKey]);

  // Same-tab equivalent of the "storage" listener above: a Cancelled/Draft
  // master status change (from this page or the order list) cascades to
  // sub-order state and clears vendor selection via MyOrdersContext, which
  // fires this event so this page picks up the change immediately without
  // needing a reload (the browser "storage" event only fires cross-tab).
  useEffect(() => {
    const onSubItemsUpdated = (e: Event) => {
      const detailOrderId = (e as CustomEvent).detail?.orderId;
      if (detailOrderId && detailOrderId !== orderId) return;
      setSubOrders(prev => applyItemState(prev, loadItemState()));
      try { setSelectedVendors(JSON.parse(localStorage.getItem(`nido_vendors_${orderId}`) || "{}")); } catch { setSelectedVendors({}); }
      setSelectedVendorMeta({});
    };
    window.addEventListener("orderSubItemsUpdated", onSubItemsUpdated);
    return () => window.removeEventListener("orderSubItemsUpdated", onSubItemsUpdated);
  }, [orderId]);

  const handleOpenVendorModal = (sub: any) => {
    // Vendor sourcing is not applicable once the order is Cancelled/Draft.
    if (isOrderInactive) return;
    setVendorModalSub(sub);
  };

  const isReturnAllowed = sub => sub.itemStatus === "Delivered" && sub.deliveredAt && Date.now() - sub.deliveredAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
  const updateStatus = (id, status) => setSubOrders(prev => prev.map(s => s.id === id ? { ...s, itemStatus: status, deliveredAt: status === "Delivered" ? new Date() : s.deliveredAt, updatedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : s));
  const filtered = subOrders.filter(s => !subSearch || s.itemName.toLowerCase().includes(subSearch.toLowerCase()) || s.id.toLowerCase().includes(subSearch.toLowerCase()));

  // Accepts an array of allocations from the modal (one per vendor split).
  // Primary vendor kept in selectedVendors/Meta for display in VendorSelectionTab.
  const handleSelectVendor = (subId: string, allocations: Array<{ vendorId: string; qty: number; meta: any }>) => {
    if (Object.values(createdPOs).some((p: any) => p.subOrderId === subId)) return;
    const primary = allocations[0];
    if (primary) {
      setSelectedVendors(prev => ({ ...prev, [subId]: primary.vendorId }));
      setSelectedVendorMeta(prev => ({ ...prev, [subId]: primary.meta }));
    }
    setVendorAllocations(prev => ({ ...prev, [subId]: allocations }));
  };

  // One PO per unique vendor across all selected sub-orders (handles multi-vendor splits).
  const handleCreatePurchaseOrders = (subIds: string[]) => {
    const selectedSet = new Set(subIds);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const displayDate = `${dd}/${mm}/${yyyy}`;

    // Flatten sub-orders into per-vendor line entries
    type LineEntry = { sub: any; qty: number; meta: any };
    const vendorLines = new Map<string, { meta: any; lines: LineEntry[] }>();

    for (const sub of subOrders) {
      if (!selectedSet.has(sub.id) || Object.values(createdPOs).some((p: any) => p.subOrderId === sub.id)) continue;

      // Get allocations: multi-vendor array or single-vendor fallback
      const allocs: Array<{ vendorId: string; qty: number; meta: any }> =
        vendorAllocations[sub.id]?.length
          ? vendorAllocations[sub.id]
          : selectedVendors[sub.id] && selectedVendorMeta[sub.id]
            ? [{ vendorId: selectedVendors[sub.id], qty: sub.qty, meta: selectedVendorMeta[sub.id] }]
            : [];

      for (const alloc of allocs) {
        if (!alloc.vendorId || !alloc.meta) continue;
        if (!vendorLines.has(alloc.vendorId)) {
          vendorLines.set(alloc.vendorId, { meta: alloc.meta, lines: [] });
        }
        vendorLines.get(alloc.vendorId)!.lines.push({ sub, qty: alloc.qty, meta: alloc.meta });
      }
    }

    const newPOs: Record<string, any> = {};

    for (const [vendorId, { meta, lines }] of vendorLines.entries()) {
      const poNumber = generatePoNumber();

      const lineItems = lines.map(({ sub, qty, meta: lm }) => {
        const unitPrice = lm.unitPrice || 0;
        const lineSubtotal = unitPrice * qty;
        const taxRate = getEffectiveTaxPctForCategory(sub.category);
        return {
          subOrderId: sub.id,
          item: sub.itemName,
          sku: sub.sku,
          productCode: sub.productCode || "",
          category: sub.category,
          hsnCode: "",
          specs: sub.specs,
          referenceNumber: sub.referenceNumber || "",
          qty,
          unitPrice,
          lineSubtotal,
          _taxRate: taxRate,
        };
      });

      const subtotal = lineItems.reduce((s, li) => s + li.lineSubtotal, 0);
      const totalSgstRaw = lineItems.reduce((s, li) => s + li.lineSubtotal * (li._taxRate / 2) / 100, 0);
      const totalCgstRaw = lineItems.reduce((s, li) => s + li.lineSubtotal * (li._taxRate / 2) / 100, 0);
      const sgstAmt = Math.round(totalSgstRaw * 100) / 100;
      const cgstAmt = Math.round(totalCgstRaw * 100) / 100;
      const grandTotal = subtotal + sgstAmt + cgstAmt;

      const primaryTaxRate = lineItems[0]?._taxRate ?? 18;
      const sgstPct = primaryTaxRate / 2;
      const cgstPct = primaryTaxRate / 2;

      const primarySub = lines[0].sub;
      const primaryLine = lineItems[0];

      const po: StoredPO = {
        poNumber,
        orderId,
        subOrderId: primarySub.id,
        subOrderIds: lines.map(l => l.sub.id),
        items: lineItems,
        vendorId,
        vendorName: meta.vendorName,
        vendorContact: meta.contact,
        vendorEmail: meta.email,
        vendorPhone: meta.phone,
        vendorGstin: meta.gstin,
        vendorAddress: [meta.addressLine1, meta.addressLine2, meta.city, meta.state, meta.pincode].filter(Boolean).join(", "),
        vendorAddressLine1: meta.addressLine1,
        vendorAddressLine2: meta.addressLine2,
        vendorCity: meta.city,
        vendorState: meta.state,
        vendorPincode: meta.pincode,
        item: primarySub.itemName,
        sku: primarySub.sku,
        category: primarySub.category,
        hsnCode: "",
        specs: primarySub.specs,
        referenceNumber: primarySub.referenceNumber || "",
        qty: primaryLine.qty,
        unitPrice: primaryLine.unitPrice,
        subtotal,
        sgstPct,
        cgstPct,
        sgstAmt,
        cgstAmt,
        grandTotal,
        paymentTerms: "Net 30",
        status: "Processing",
        createdOn: now.toISOString(),
        createdOnDisplay: displayDate,
        requestedDelivery: primarySub.requiredDate,
        documents: [],
        notes: [],
      };

      try {
        const dataUri = getPODataUri(po);
        po.documents = [{ id: `doc-${poNumber}-pdf`, name: `${poNumber}.pdf`, ext: "pdf", type: "Purchase Order", uploadedBy: "System", uploadedOn: displayDate, dataUrl: dataUri }];
        downloadPOPdf(po);
      } catch (e) {
        console.warn("PDF generation failed:", e);
      }

      savePO(po);

      // Deduct physicalStock AND release reservedStock now that the PO is raised.
      // This is the ONLY point where physical inventory decreases.
      // Available stock (physical − reserved) stays the same because both drop equally,
      // so the shop display does not change at this moment (reservation already did that).
      for (const { sub, qty: lineQty } of lines) {
        if (!sub.productCode) continue;
        deductPhysicalStock(vendorId, sub.productCode, lineQty);
      }

      for (const { sub } of lines) {
        const li = lineItems.find(x => x.subOrderId === sub.id)!;
        newPOs[`${sub.id}__${vendorId}`] = { vendorId, vendorName: meta.vendorName, poNumber, item: sub.itemName, qty: li.qty, productCode: sub.productCode, unitPrice: li.unitPrice, grandTotal, total: grandTotal, subOrderId: sub.id };
      }
    }

    if (Object.keys(newPOs).length > 0) {
      setCreatedPOs(prev => ({ ...prev, ...newPOs }));
    }
  };

  const handleCancelPO = (subId: string) => {
    // Restore physicalStock so vendor inventory returns to its pre-PO level.
    // reservedStock is NOT touched — it was already cleared when the PO was raised.
    // A sub-order may have multiple PO entries (split across vendors) — cancel all.
    const matchingEntries = Object.entries(createdPOs).filter(([, p]: [string, any]) => p.subOrderId === subId);
    for (const [, po] of matchingEntries as [string, any][]) {
      if (po?.vendorId && po?.productCode && po?.qty > 0) {
        restorePhysicalStock(po.vendorId, po.productCode, po.qty);
      }
    }
    setCreatedPOs(prev => {
      const n = { ...prev };
      for (const [key] of matchingEntries) delete n[key];
      return n;
    });
    setSelectedVendors(prev => { const n = { ...prev }; delete n[subId]; return n; });
    setSelectedVendorMeta(prev => { const n = { ...prev }; delete n[subId]; return n; });
    setVendorAllocations(prev => { const n = { ...prev }; delete n[subId]; return n; });
  };

  const card: any = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 };

  const selectedSummaryCount = Object.keys(selectedVendors).length;

  // Client portal: no PO number or vendor-selection columns — it's a
  // read-only, vendor-agnostic view of the sub-orders.
  const subOrdersColumns = isClientPortalUser
    ? ["#", "SUB ORDER ID", "ITEM DETAILS", "QTY", "UNIT PRICE", "TOTAL", "ITEM STATUS", "TRACKING INFO", "ACTIONS"]
    : ["#", "SUB ORDER ID", "ITEM DETAILS", "PO NUMBER", "QTY", "UNIT PRICE", "TOTAL", "ITEM STATUS", "TRACKING INFO", "SELECT VENDOR", "ACTIONS"];
  // Explicit min widths (via minmax) on every column plus a real column gap
  // prevent long values (prices, badges, buttons) from visually overlapping
  // into the neighboring column — a plain "1fr"/px template with no gap lets
  // wide content bleed past its track. The whole row is also wrapped in its
  // own horizontally-scrolling container (see subOrdersMinWidth below) so on
  // narrow viewports the columns scroll *within the tab* instead of being
  // clipped by the page's outer overflow.
  // Columns use minmax(min, fr) instead of fixed px so the table stretches
  // to fill whatever width the tab actually has (no dead space on wide
  // monitors) while still guaranteeing a readable minimum per column.
  const subOrdersColTemplate = isClientPortalUser
    ? "36px 130px minmax(220px,2fr) 60px minmax(90px,1fr) minmax(100px,1fr) minmax(120px,1fr) minmax(160px,1.2fr) 44px"
    : "30px 170px minmax(220px,1fr) minmax(110px,0.4fr) 55px minmax(100px,0.4fr) minmax(100px,0.4fr) minmax(120px,0.6fr) minmax(160px,0.6fr) minmax(130px,0.5fr) 100px";
  const subOrdersColGap = 6;
  // Sum of the column minimums above (plus gaps) — the smallest width the
  // grid will ever collapse to. Below this the wrapper scrolls horizontally
  // instead of clipping; above it the fr tracks grow to fill the tab.
  const subOrdersMinWidth = isClientPortalUser ? 1056 : 1320;

  // ── Order not found ───────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="bg-background text-foreground min-h-screen flex items-center justify-center" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
          <h2 className="text-foreground text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {orderId ? `Order "${orderId}" doesn't exist or hasn't been placed yet.` : "No order ID provided."}
          </p>
          <button
            onClick={() => navigate("/orders")}
            style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen" style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh" }} onClick={() => setShowStatusDd(false)}>
      {/* No maxWidth cap here — on wide monitors a fixed cap left visible
          empty gutters on both sides of the page. The content now stretches
          to fill whatever width AppLayout's <main> actually gives it. */}
      <div style={{ width: "100%", margin: "0 auto", padding: "28px 24px 48px", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={() => navigate(-1)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "inherit", marginBottom: 12, padding: 0 }}
              >
                ← Back to Orders
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Order Details / <span style={{ color: "#374151" }}>Order #{orderId}</span></h1>
                <StatusPill status={masterStatus} />
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span>Master Order</span><span style={{ color: "#d1d5db" }}>•</span>
                <span>Created on <b style={{ color: "#374151" }}>{order ? `${order.orderDate} ${order.orderTime}` : "—"}</b></span><span style={{ color: "#d1d5db" }}>•</span>
                <span>Requested by <b style={{ color: "#374151" }}>{order ? `${order.requester} (${order.requesterRole})` : "—"}</b></span>
              </div>
            </div>
            {/* Cancel Order button — top-right, hidden for portal users and already-cancelled orders */}
            {!isClientPortalUser && (
              isOrderCancelled ? (
                <span style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                  ✕ Order Cancelled
                </span>
              ) : (
                <button
                  onClick={() => setPendingCancelStatus(true)}
                  style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid #fca5a5", borderRadius: 8, background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  ✕ Cancel Order
                </button>
              )
            )}
          </div>
        </div>

        {/* SLA Status Panel */}
        {(() => {
          const tiers = getClientSLA();
          const std = tiers.find(t => t.name === "Standard") ?? tiers[0];
          const targetHrs = std?.orderProcessingTime ?? 24;
          const start = order ? `${order.orderDate} ${order.orderTime || ""}` : null;
          const done = masterStatus === "Delivered" || masterStatus === "Cancelled";
          const sla = computeSLAStatus(start, targetHrs, done);
          const colors: Record<string, string> = {
            'on-track': '#f0fdf4', 'warning': '#fffbeb', 'breached': '#fef2f2',
            'sla-met': '#f0fdf4', 'sla-missed': '#fef2f2', 'unknown': '#f9fafb',
          };
          const borders: Record<string, string> = {
            'on-track': '#bbf7d0', 'warning': '#fcd34d', 'breached': '#fecaca',
            'sla-met': '#bbf7d0', 'sla-missed': '#fecaca', 'unknown': '#e5e7eb',
          };
          return (
            <div style={{ background: colors[sla.state], border: `1px solid ${borders[sla.state]}`, borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Order Processing SLA</div>
                <div style={{ fontSize: 13, color: "#374151" }}>Target: <b>{targetHrs}h</b> (Standard tier)</div>
              </div>
              <SLABadge sla={sla} />
              {sla.deadlineISO && sla.state !== 'unknown' && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  SLA Deadline: <b style={{ color: "#374151" }}>{new Date(sla.deadlineISO).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</b>
                </div>
              )}
            </div>
          );
        })()}

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Billing Information</div>
            <Field label="Client" value={order?.client || "—"} />
            <Field label="Payment Method" value={order?.paymentMethod || paymentFallback?.label || "—"} />
            {(order?.paymentDetail || paymentFallback?.detail) && (
              <Field label="Payment Detail" value={order?.paymentDetail || paymentFallback?.detail || ""} />
            )}
            <Field label="Payment Terms" value={order?.paymentTerms || "Net 30 (Payment due in 30 days)"} />
          </div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Delivery Information</div>
            <Field label="Delivery Address" value={order?.deliveryAddress || deliveryAddressFallback || "As per checkout"} />
            <Field label="Requested Delivery" value="Within 30 days" />
            <Field label="Items" value={`${subOrders.length} sub-order${subOrders.length !== 1 ? "s" : ""} · ${subOrders.reduce((s, o) => s + o.qty, 0)} unit${subOrders.reduce((s, o) => s + o.qty, 0) !== 1 ? "s" : ""}`} />
          </div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Requestor / Client Information</div>{isClientPortalUser ? (
            <><Field label="Name" value={user?.name || "—"} /><Field label="Role" value={user?.role || (user?.userType === "client_admin" ? "Client Admin" : "Client User")} /><Field label="Organization" value={user?.clientName || order?.client || "—"} /></>
          ) : (
            <><Field label="Name" value={order?.requester || "—"} /><Field label="Role" value={order?.requesterRole || "—"} /><Field label="Organization" value={order?.client || "—"} /></>
          )}</div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Order Summary</div>{[
            ["Master Order ID", orderId],
            ["Sub Orders", String(subOrders.length)],
            ["Total Items", String(subOrders.reduce((s, o) => s + o.qty, 0))],
            ["Total Amount", order?.totalAmount || "—"],
            ["Created On", order ? `${order.orderDate} ${order.orderTime}` : "—"],
          ].map(([l, v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12.5, color: "#6b7280" }}>{l}</span><span style={{ fontSize: 13, fontWeight: l === "Total Amount" ? 700 : 500 }}>{v}</span></div>))}</div>
        </div>

        {/* Stepper + Assignment */}
        <div style={{ display: "grid", gridTemplateColumns: isClientPortalUser ? "1fr" : "1fr 300px", gap: 16, marginBottom: 20 }}>
          <div style={card}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚚</div>
                <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Master Order Status</div><div style={{ fontSize: 17, fontWeight: 700 }}>{masterStatus}</div><div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{subOrders.length} sub-order{subOrders.length !== 1 ? "s" : ""} in this order</div></div>
              </div>
              <Stepper currentStatus={masterStatus} orderDate={order?.orderDate} />
            </div>
            {!isClientPortalUser && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                {isOrderCancelled ? (
                  <span style={{ fontSize: 12.5, color: "#9ca3af", fontStyle: "italic" }}>This order is cancelled and can no longer be updated.</span>
                ) : (
                  <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowStatusDd(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid hsl(var(--primary))", borderRadius: 8, background: "hsl(var(--card))", color: "hsl(var(--primary))", cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>Update Master Status ▾</button>
                    {showStatusDd && (
                      <div style={{ position: "absolute", bottom: 42, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 210, overflow: "hidden" }}>
                        {["Processing", "Partially Shipped", "Partially Delivered", "Delivered", "Cancelled", "Draft"].map(opt => (
                          <button key={opt} onClick={() => {
                            setShowStatusDd(false);
                            if (opt === "Cancelled") { setPendingCancelStatus(true); return; }
                            setMasterStatus(opt);
                          }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", border: "none", background: opt === masterStatus ? "#eff6ff" : "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: opt === masterStatus ? "#2563eb" : "#374151", fontWeight: opt === masterStatus ? 600 : 400 }}>
                            {opt} {opt === masterStatus && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {!isClientPortalUser && (
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>Assignment</span>
                <button onClick={() => setShowEditAssignment(true)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>✎ Edit</button>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Assigned To</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Avatar initial={assignment.assignedTo.split(" ").map(w => w[0]).join("").slice(0, 2)} color="#2563eb" size={36} />
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{assignment.assignedTo}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{assignment.role}</div></div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Assigned On</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{assignment.assignedOn}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{assignment.notes}</div>
            </div>
          )}
        </div>

        {/* Tabs section */}
        {/* overflow left as "visible" (not "hidden") so the per-row Actions
            menu and its "Update Status" flyout are never clipped */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "visible", marginBottom: 20 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "0 20px" }}>
            <div style={{ display: "flex" }}>
              {TABS.map(tab => {
                let label = tab;
                if (tab === "Sub Orders / Items") label = `Sub Orders / Items (${subOrders.length})`;
                if (tab === "Vendor Selected Summary") label = selectedSummaryCount > 0 ? `Vendor Selected Summary (${selectedSummaryCount})` : "Vendor Selected Summary";
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: "14px 0", marginRight: 28, border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === tab ? "2px solid hsl(var(--primary))" : "2px solid transparent", marginBottom: -1, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {label}
                  </button>
                );
              })}
            </div>
            {activeTab === "Sub Orders / Items" && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>🔍</span>
                  <input value={subSearch} onChange={e => setSubSearch(e.target.value)} placeholder="Search items..." style={{ padding: "7px 12px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
                </div>
              </div>
            )}
          </div>

          {/* Sub Orders / Items tab */}
          {activeTab === "Sub Orders / Items" && (
            <>
              {/* Own horizontal scroll container, distinct from the outer
                  tabs-section (which stays overflow:visible for the Actions
                  flyout). This is the safety net against AppLayout's
                  overflow-x-hidden silently clipping columns on narrow
                  screens: if the row is ever wider than the tab, it scrolls
                  *inside the tab* rather than being cut off. */}
              <div style={{ overflowX: "auto", overflowY: "visible" }}>
                <div style={{ minWidth: subOrdersMinWidth, display: "grid", gridTemplateColumns: subOrdersColTemplate, columnGap: subOrdersColGap, padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", fontSize: 10.5, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
                  {subOrdersColumns.map(h => <div key={h} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{h}</div>)}
                </div>
                {filtered.map((sub, idx) => {
                  const expanded = expandedItems.has(sub.id), returnOk = isReturnAllowed(sub);
                  const subPOs = Object.values(createdPOs).filter((p: any) => p.subOrderId === sub.id) as any[];
                  const hasPO = subPOs.length > 0;
                  const selVendorId = selectedVendors[sub.id];
                  const selMeta = selectedVendorMeta[sub.id] || null;
                  const selVendor = selMeta ? { id: selMeta.vendorId, name: selMeta.vendorName, color: "#2563eb", location: selMeta.location } : null;
                  const subAllocs = vendorAllocations?.[sub.id];
                  const isMultiVendor = subAllocs && subAllocs.length > 1;
                  return (
                    <div key={sub.id} style={{ minWidth: subOrdersMinWidth, display: "grid", gridTemplateColumns: subOrdersColTemplate, columnGap: subOrdersColGap, padding: "16px 20px", alignItems: "start", borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                      <div style={{ color: "#6b7280", fontSize: 12.5, paddingTop: 3, minWidth: 0 }}>{sub.num}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", overflowWrap: "break-word" }}>{sub.id}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
                        {!isClientPortalUser && hasPO && <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap" }}>PO Created</span></div>}
                        {!isClientPortalUser && selectedVendors[sub.id] && !hasPO && <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, background: "#f0fdf4", color: "#166534", padding: "2px 6px", borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap" }}>Vendor Selected</span></div>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 42, height: 42, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                            {sub.image ? (
                              <img src={sub.image} alt={sub.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : "📦"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "break-word" }}>{sub.itemName}</div>
                            {sub.referenceNumber && <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 3, whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "break-word" }}>Ref/Model No: {sub.referenceNumber}</div>}
                          </div>
                        </div>
                      </div>
                      {!isClientPortalUser && (
                        <div style={{ minWidth: 0 }}>
                          {hasPO ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {subPOs.map((po: any) => (
                                <button
                                  key={po.poNumber}
                                  onClick={() => navigate(`/vendor-orders/${po.poNumber}`)}
                                  style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit", textAlign: "left", overflowWrap: "break-word" }}
                                >
                                  {po.poNumber} ↗
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: 12.5, fontWeight: 500, minWidth: 0 }}>{sub.qty}</div>
                      <div style={{ fontSize: 12.5, minWidth: 0, overflowWrap: "break-word" }}>{sub.unitPrice}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, minWidth: 0, overflowWrap: "break-word" }}>{sub.total}</div>
                      <div style={{ minWidth: 0 }}><StatusPill status={sub.itemStatus} /><div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4 }}>Updated on {sub.updatedOn}</div></div>
                      <div style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.6, minWidth: 0, overflowWrap: "break-word" }}>
                        {sub.tracking ? (<><div style={{ fontWeight: 600, fontSize: 12 }}>{sub.tracking.trackingNumber}</div><div style={{ color: "#6b7280" }}>{sub.tracking.carrier}</div><div style={{ color: "#6b7280" }}>{sub.tracking.note}</div><a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 11.5 }}>{sub.tracking.linkLabel}</a></>) : <span style={{ color: "#d1d5db" }}>-</span>}
                      </div>
                      {!isClientPortalUser && (
                        <div style={{ minWidth: 0 }}>
                          {isOrderInactive ? (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                          ) : hasPO ? (
                            // PO already issued — lock the vendor, no change allowed until PO is cancelled
                            <div>
                              {subPOs.map((po: any, pi: number) => (
                                <div key={po.poNumber} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: pi === 0 ? "#2563eb" : "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                    {(po.vendorName?.[0] || "V").toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflowWrap: "break-word" }}>{po.vendorName}</span>
                                </div>
                              ))}
                              <span style={{ fontSize: 10, color: "#9ca3af" }}>PO Issued · Cancel PO to change</span>
                            </div>
                          ) : selVendor ? (
                            <div>
                              {isMultiVendor ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                  {subAllocs.map((a: any, ai: number) => (
                                    <div key={ai} style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: ai === 0 ? "#2563eb" : "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                                        {(a.meta?.vendorName?.[0] || "V").toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#111827", overflowWrap: "break-word" }}>{a.meta?.vendorName || a.vendorId}</div>
                                        <div style={{ fontSize: 10.5, color: "#6b7280" }}>{a.qty} Nos</div>
                                      </div>
                                    </div>
                                  ))}
                                  <button onClick={() => handleOpenVendorModal(sub)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", padding: 0, textAlign: "left" }}>Change ›</button>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                      {(selVendor.name?.[0] || "V").toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflowWrap: "break-word" }}>{selVendor.name}</span>
                                  </div>
                                  <button onClick={() => handleOpenVendorModal(sub)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>Change ›</button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenVendorModal(sub)}
                              style={{ padding: "5px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 11.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              Select Vendor
                            </button>
                          )}
                        </div>
                      )}
                      {isOrderInactive ? (
                        <span style={{ fontSize: 12, color: "#d1d5db", minWidth: 0 }}>—</span>
                      ) : isClientPortalUser ? (
                        <div style={{ minWidth: 0 }}>
                          {sub.itemStatus !== "Cancelled" && sub.itemStatus !== "Delivered" ? (
                            <button
                              onClick={() => setCancelTarget(sub.id)}
                              style={{ padding: "5px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: 11.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              Cancel Item
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ minWidth: 0 }}>
                          <ThreeDotMenu sub={sub} onUpdateStatus={s => updateStatus(sub.id, s)} onAddTracking={() => setTrackingTarget(sub.id)} onSetReference={() => setReferenceTarget(sub.id)} referenceLocked={hasPO} onCancel={() => setCancelTarget(sub.id)} onRaiseReturn={() => setReturnTarget(sub.id)} returnAllowed={returnOk} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {(() => {
                // Use computeCartGST on the real cart items — same logic as CartPage and ReviewPage.
                // priceNum is tax-inclusive so we back-calculate per-category rates, not a flat 18%.
                const cartItems = order.cartItems || [];
                const { slabs, totalGst, preTaxSubtotal } = computeCartGST(
                  cartItems.map(i => ({ inclusiveAmount: i.priceNum * i.quantity, category: i.category }))
                );
                const grandTotal = preTaxSubtotal + totalGst;
                const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
                return (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 300 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13.5, color: "#6b7280" }}>Sub-total (excl. GST)</span>
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{fmt(preTaxSubtotal)}</span>
                      </div>
                      {slabs.map(sl => (
                        <div key={sl.rate} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13.5, color: "#6b7280" }}>GST ({sl.rate}%)</span>
                          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{fmt(sl.gst)}</span>
                        </div>
                      ))}
                      {slabs.length === 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13.5, color: "#6b7280" }}>GST</span>
                          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{fmt(totalGst)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Total Order Amount</span>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>{fmt(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" }}>Showing 1 to {filtered.length} of {subOrders.length} sub orders</div>
            </>
          )}

          {/* Vendor Selected Summary tab */}
          {activeTab === "Vendor Selected Summary" && (
            <VendorSelectedSummaryTab
              subOrders={subOrders}
              selectedVendors={selectedVendors}
              selectedVendorMeta={selectedVendorMeta}
              vendorAllocations={vendorAllocations}
              createdPOs={createdPOs}
              onCreatePurchaseOrders={handleCreatePurchaseOrders}
              onCancelPO={handleCancelPO}
            />
          )}

        </div>

        {/* Documents & Notes — standalone section, visible to both owner and
            client portal. Notes act as a messenger between the two; documents
            are visible to the client but only the owner platform can upload
            or remove them. */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginTop: 20 }}>
          <DocumentsNotesTab orderId={orderId} />
        </div>
      </div>

      {/* Vendor Selection Popup Modal — owner platform only */}
      {!isClientPortalUser && vendorModalSub && (
        <VendorSelectionModal
          sub={vendorModalSub}
          selectedVendorId={selectedVendors[vendorModalSub.id] || null}
          onSelect={handleSelectVendor}
          onClose={() => setVendorModalSub(null)}
        />
      )}

      {showEditAssignment && <EditAssignmentModal data={assignment} onSave={setAssignment} onClose={() => setShowEditAssignment(false)} />}
      {trackingTarget && <AddTrackingModal current={subOrders.find(s => s.id === trackingTarget)?.tracking || null} onSave={t => setSubOrders(prev => prev.map(s => s.id === trackingTarget ? { ...s, tracking: t } : s))} onClose={() => setTrackingTarget(null)} />}
      {referenceTarget && <ReferenceNumberModal itemName={subOrders.find(s => s.id === referenceTarget)?.itemName || ""} current={subOrders.find(s => s.id === referenceTarget)?.referenceNumber || ""} onSave={v => setSubOrders(prev => prev.map(s => s.id === referenceTarget ? { ...s, referenceNumber: v } : s))} onClose={() => setReferenceTarget(null)} />}
      {cancelTarget && <CancelItemModal itemName={subOrders.find(s => s.id === cancelTarget)?.itemName || ""} onConfirm={() => setSubOrders(prev => prev.map(s => s.id === cancelTarget ? { ...s, itemStatus: "Pending" } : s))} onClose={() => setCancelTarget(null)} />}
      {pendingCancelStatus && <CancelOrderStatusModal onConfirm={handleCancelOrder} onClose={() => setPendingCancelStatus(false)} />}
      {returnTarget && <RaiseReturnModal itemName={subOrders.find(s => s.id === returnTarget)?.itemName || ""} onClose={() => setReturnTarget(null)} />}
    </div>
  );
}
