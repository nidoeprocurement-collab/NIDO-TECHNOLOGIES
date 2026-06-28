import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const VENDOR_POOL = [
  { id: "VA", name: "Vendor A", location: "Bengaluru, Karnataka", color: "#e6a817", rating: 4.6, deliveryDays: "3 - 4 Days", pricePerUnit: 120, gstin: "29ABCDE1234F1Z5", onTimeDelivery: "95%", qualityRating: "4.5 / 5", totalOrders: 152 },
  { id: "VB", name: "Vendor B", location: "Mumbai, Maharashtra",  color: "#2b6cb0", rating: 4.2, deliveryDays: "5 - 6 Days", pricePerUnit: 115, gstin: "27BCDFE5678G2Z1", onTimeDelivery: "89%", qualityRating: "4.2 / 5", totalOrders: 98  },
  { id: "VC", name: "Vendor C", location: "Pune, Maharashtra",    color: "#276749", rating: 4.0, deliveryDays: "2 - 3 Days", pricePerUnit: 125, gstin: "27CDEFG9012H3Z4", onTimeDelivery: "82%", qualityRating: "4.0 / 5", totalOrders: 74  },
  { id: "VD", name: "Vendor D", location: "Delhi, NCR",           color: "#6b21a8", rating: 3.8, deliveryDays: "4 - 5 Days", pricePerUnit: 110, gstin: "07DEFGH3456I4Z7", onTimeDelivery: "78%", qualityRating: "3.8 / 5", totalOrders: 61  },
];

const INITIAL_ORDERS = [
  {
    num: 1, id: "SO-1001", itemName: "Mechanical Keyboard", sku: "SKU/SHOP-10", category: "General",
    specs: ["USB Wired", "Black | Ergonomic Design"],
    vendorName: "TechHub Solutions", vendorInitial: "T", vendorColor: "#c53030",
    poNumber: "PO-10034", qty: 50, unitPrice: "₹120.00", total: "₹6,000.00", requiredDate: "30 May 2024",
    itemStatus: "Shipped", updatedOn: "Apr 17, 2026", deliveredAt: null,
    tracking: { trackingNumber: "1Z999AA1234567890", carrier: "UPS", note: "Shipped on Apr 17, 2026", linkLabel: "Track Package" },
  },
  {
    num: 2, id: "SO-1002", itemName: "Filing Cabinet", sku: "SKU/SHOP-3", category: "General",
    specs: ["3 Drawers", "Metal | Lockable"],
    vendorName: "OfficeMart Supplies", vendorInitial: "O", vendorColor: "#2b6cb0",
    poNumber: "PO-10035", qty: 30, unitPrice: "₹115.00", total: "₹3,450.00", requiredDate: "28 May 2024",
    itemStatus: "Confirmed", updatedOn: "Apr 16, 2026", deliveredAt: null, tracking: null,
  },
  {
    num: 3, id: "SO-1003", itemName: "Printer Paper (Box)", sku: "SKU/SHOP-5", category: "Office Supplies",
    specs: ["5000 Sheets", "A4 | 80 GSM"],
    vendorName: "PaperWorld Distributors", vendorInitial: "A", vendorColor: "#276749",
    poNumber: "PO-10036", qty: 82, unitPrice: "₹125.00", total: "₹10,250.00", requiredDate: "01 Jun 2024",
    itemStatus: "Delivered", updatedOn: "Apr 18, 2026",
    deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tracking: { trackingNumber: "1Z999AA9876543210", carrier: "FedEx", note: "Delivered on Apr 18, 2026", linkLabel: "Proof of Delivery" },
  },
];

const INITIAL_DOCS = [
  { id: "d1", name: "PO-24815779.pdf", ext: "pdf", size: "245 KB", type: "Purchase Order", uploadedBy: "System Owner", uploadedOn: "Apr 16, 2026\n12:35 PM", description: "Master purchase order ORD-24815779" },
  { id: "d2", name: "Vendor_Quotation_TechHub.xlsx", ext: "xlsx", size: "112 KB", type: "Quotation", uploadedBy: "System Owner", uploadedOn: "Apr 16, 2026\n12:40 PM", description: "Quotation from TechHub Solutions" },
  { id: "d3", name: "Shipping_Requirements.pdf", ext: "pdf", size: "89 KB", type: "Other", uploadedBy: "System Owner", uploadedOn: "Apr 16, 2026\n12:42 PM", description: "Special shipping instructions and delivery notes" },
];

const INITIAL_NOTES = [
  { id: "n1", author: "System Owner", date: "Apr 16, 2026 12:45 PM", text: "Confirmed delivery date with TechHub Solutions. They will ship all items by Apr 17, 2026.", visibility: "Internal Note" },
];

const ALL_STATUS_MAP = {
  Pending:             { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  Confirmed:           { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Processing:          { bg: "#faf5ff", color: "#6b21a8", border: "#d8b4fe" },
  Shipped:             { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  Delivered:           { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  "Partially Shipped": { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  "Partially Delivered":{ bg: "#ecfdf5",color: "#065f46", border: "#6ee7b7" },
};

const DOC_ICON = {
  pdf:  { bg: "#fee2e2", color: "#dc2626", label: "PDF" },
  xlsx: { bg: "#d1fae5", color: "#059669", label: "XLS" },
  docx: { bg: "#dbeafe", color: "#2563eb", label: "DOC" },
  png:  { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
  jpg:  { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
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
    <div style={{ background: "#fff", borderRadius: 12, width, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
      </div>
      {children}
    </div>
  );
}
function ModalFooter({ onCancel, onSave, saveLabel = "Save" }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
      <button onClick={onSave} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>{saveLabel}</button>
    </div>
  );
}

// ── Vendor Selection Modal (popup) ────────────────────────────────────────────
function VendorSelectionModal({ sub, selectedVendorId, onSelect, onClose }) {
  const [picked, setPicked] = useState(selectedVendorId || VENDOR_POOL[0].id);
  const pickedVendor = VENDOR_POOL.find(v => v.id === picked);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 860, boxShadow: "0 12px 48px rgba(0,0,0,0.22)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Vendor Selection - Sub Order : {sub.id} ( {sub.itemName} )</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>

        {/* Req info */}
        <div style={{ padding: "14px 22px 0", display: "flex", gap: 32 }}>
          <div style={{ fontSize: 13.5 }}>Required Quantity : <b style={{ color: "#111827" }}>{sub.qty} Nos</b></div>
          <div style={{ fontSize: 13.5 }}>Required Date : <b style={{ color: "#111827" }}>{sub.requiredDate}</b></div>
        </div>

        {/* Vendor table */}
        <div style={{ padding: "14px 22px 0", overflow: "auto" }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 140px 130px 130px 110px", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              {["", "Vendor", "Rating", "Delivery Time", "Cost (Per Unit)", "Total Cost"].map(h => <div key={h}>{h}</div>)}
            </div>
            {VENDOR_POOL.map((v, i) => {
              const isSelected = picked === v.id;
              const totalCost = v.pricePerUnit * sub.qty;
              return (
                <div
                  key={v.id}
                  onClick={() => setPicked(v.id)}
                  style={{ display: "grid", gridTemplateColumns: "36px 1fr 140px 130px 130px 110px", padding: "13px 16px", alignItems: "center", borderBottom: i < VENDOR_POOL.length - 1 ? "1px solid #f3f4f6" : "none", background: isSelected ? "#eff6ff" : "#fff", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, background: isSelected ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSelected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                  </div>
                  <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13.5, color: "#111827" }}>{v.name}</div>
                  <div><StarRating rating={v.rating} /></div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{v.deliveryDays}</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>₹ {v.pricePerUnit.toFixed(2)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>₹ {totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Details */}
        {pickedVendor && (
          <div style={{ margin: "14px 22px 0", border: "1px solid #e5e7eb", borderRadius: 9, padding: "14px 18px", background: "#fafafa" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Vendor Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{pickedVendor.name}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>GSTIN : {pickedVendor.gstin}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>Location : {pickedVendor.location}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 12.5, color: "#374151" }}>On Time Delivery : <b>{pickedVendor.onTimeDelivery}</b></div>
                <div style={{ fontSize: 12.5, color: "#374151" }}>Quality Rating : <b>{pickedVendor.qualityRating}</b></div>
                <div style={{ fontSize: 12.5, color: "#374151" }}>Total Orders : <b>{pickedVendor.totalOrders}</b></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 22px 18px", marginTop: "auto" }}>
          <button
            onClick={() => { onSelect(sub.id, picked); onClose(); }}
            style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
          >
            Select Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Selection Tab ──────────────────────────────────────────────────────
function VendorSelectionTab({ subOrders, selectedVendors, onOpenModal }) {
  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Vendor Selection</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>Select a vendor for each sub-order. Click "Select Vendor" to open the vendor selection dialog.</div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "50px 120px 1fr 80px 100px 150px 140px", padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
          {["#", "SUB ORDER ID", "ITEM DETAILS", "QTY", "REQ DATE", "SELECTED VENDOR", "ACTION"].map(h => <div key={h}>{h}</div>)}
        </div>

        {subOrders.map((sub, idx) => {
          const selVendorId = selectedVendors[sub.id];
          const selVendor = selVendorId ? VENDOR_POOL.find(v => v.id === selVendorId) : null;
          return (
            <div key={sub.id} style={{ display: "grid", gridTemplateColumns: "50px 120px 1fr 80px 100px 150px 140px", padding: "16px 20px", alignItems: "center", borderBottom: idx < subOrders.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{sub.num}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>{sub.id}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{sub.itemName}</div>
                  <div style={{ fontSize: 11.5, color: "#6b7280" }}>SKU: {sub.sku}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty} Nos</div>
              <div style={{ fontSize: 12.5, color: "#374151" }}>{sub.requiredDate}</div>
              <div>
                {selVendor ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar initial={selVendor.id} color={selVendor.color} size={26} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{selVendor.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{selVendor.location.split(",")[0]}</div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12.5, color: "#9ca3af" }}>Not selected</span>
                )}
              </div>
              <div>
                <button
                  onClick={() => onOpenModal(sub)}
                  style={{ padding: "7px 16px", border: `1px solid ${selVendor ? "#2563eb" : "#d1d5db"}`, borderRadius: 7, background: selVendor ? "#eff6ff" : "#fff", color: selVendor ? "#2563eb" : "#374151", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
                >
                  {selVendor ? "Change Vendor" : "Select Vendor"}
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
  const total = group.subOrders.reduce((a, s) => a + group.vendor.pricePerUnit * s.qty, 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 780, boxShadow: "0 12px 48px rgba(0,0,0,0.22)", overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Items for {group.vendor.name}</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>{group.subOrders.length} item{group.subOrders.length !== 1 ? "s" : ""} · {group.vendor.location}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px 120px 1fr 70px 130px 130px", padding: "10px 22px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
            {["#", "SUB ORDER ID", "ITEM DETAILS", "QTY", "UNIT PRICE", "TOTAL"].map(h => <div key={h}>{h}</div>)}
          </div>
          {group.subOrders.map((sub, idx) => (
            <div key={sub.id} style={{ display: "grid", gridTemplateColumns: "36px 120px 1fr 70px 130px 130px", padding: "15px 22px", alignItems: "start", borderBottom: idx < group.subOrders.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 3 }}>{sub.num}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{sub.id}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{sub.itemName}</div>
                  <div style={{ fontSize: 11.5, color: "#6b7280" }}>SKU: {sub.sku}</div>
                  {sub.specs.map(s => <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>)}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty}</div>
              <div style={{ fontSize: 13, color: "#374151" }}>₹ {group.vendor.pricePerUnit.toFixed(2)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>₹ {(group.vendor.pricePerUnit * sub.qty).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Selected Summary Tab ───────────────────────────────────────────────
function VendorSelectedSummaryTab({ subOrders, selectedVendors, createdPOs, onCreatePurchaseOrders, onCancelPO }) {
  const [viewItemsGroup, setViewItemsGroup] = useState<any>(null);

  const vendorMap: Record<string, { vendor: typeof VENDOR_POOL[0], subOrders: typeof subOrders }> = {};
  for (const sub of subOrders) {
    const vid = selectedVendors[sub.id];
    if (!vid) continue;
    const vendor = VENDOR_POOL.find(v => v.id === vid);
    if (!vendor) continue;
    if (!vendorMap[vid]) vendorMap[vid] = { vendor, subOrders: [] };
    vendorMap[vid].subOrders.push(sub);
  }

  const vendorGroups = Object.values(vendorMap);
  const totalItems = vendorGroups.reduce((acc, g) => acc + g.subOrders.length, 0);
  const totalQty = vendorGroups.reduce((acc, g) => acc + g.subOrders.reduce((a, s) => a + s.qty, 0), 0);
  const totalAmount = vendorGroups.reduce((acc, g) => acc + g.subOrders.reduce((a, s) => a + g.vendor.pricePerUnit * s.qty, 0), 0);

  const hasPOs = Object.keys(createdPOs).length > 0;
  const anySelected = vendorGroups.length > 0;
  const poList = Object.values(createdPOs) as any[];
  const poTotal = poList.reduce((a, p) => a + p.total, 0);
  const createdAt = hasPOs ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  if (hasPOs) {
    return (
      <div style={{ padding: "28px 28px 36px" }}>
        {/* Success banner */}
        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #86efac", borderRadius: 14, padding: "28px 32px", marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#14532d", marginBottom: 6 }}>Purchase Orders Created Successfully!</div>
            <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
              Thank you! <strong>{poList.length} Purchase Order{poList.length !== 1 ? "s" : ""}</strong> have been generated and dispatched to the respective vendors.
              Your order is now being processed.
            </div>
            <div style={{ fontSize: 12.5, color: "#4ade80", marginTop: 8, fontWeight: 500 }}>Generated on {createdAt}</div>
          </div>
        </div>

        {/* PO cards */}
        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 14 }}>Created Purchase Orders</div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 180px 1fr 80px 140px 110px 90px", padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
            {["PO NUMBER", "VENDOR", "ITEM", "QTY", "AMOUNT (INR)", "STATUS", "ACTION"].map(h => <div key={h}>{h}</div>)}
          </div>
          {poList.map((po, i) => {
            const vendor = VENDOR_POOL.find(v => v.id === po.vendorId);
            return (
              <div key={po.poNumber} style={{ display: "grid", gridTemplateColumns: "160px 180px 1fr 80px 140px 110px 90px", padding: "16px 20px", alignItems: "center", borderBottom: i < poList.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#2563eb" }}>{po.poNumber}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Purchase Order</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar initial={po.vendorId} color={vendor?.color || "#6b7280"} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{po.vendorName}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{vendor?.location?.split(",")[0]}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{po.item}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Sub Order: {po.subOrderId}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{po.qty} Nos</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>₹ {po.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                    Created
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => { if (window.confirm(`Cancel ${po.poNumber}? This will remove the PO and allow vendor re-selection for this item.`)) onCancelPO(po.subOrderId); }}
                    style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "4px 10px", fontFamily: "inherit" }}
                  >
                    Cancel PO
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "160px 180px 1fr 80px 140px 110px 90px", padding: "13px 20px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", gridColumn: "1 / 5" }}>{poList.length} PO{poList.length !== 1 ? "s" : ""} Created</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>₹ {poTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <div /><div />
          </div>
        </div>

        {/* Thank you note */}
        <div style={{ marginTop: 22, padding: "16px 20px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <div style={{ fontSize: 13.5, color: "#1e40af", lineHeight: 1.6 }}>
            <strong>What's next?</strong> The vendors will receive their POs shortly and confirm delivery timelines. You can track each order's status under the <strong>Sub Orders / Items</strong> tab.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Vendors Selected Summary</div>
        {anySelected && (
          <button
            onClick={onCreatePurchaseOrders}
            style={{ padding: "9px 22px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
          >
            Create Purchase Orders
          </button>
        )}
      </div>

      {vendorGroups.length === 0 ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "48px 20px", textAlign: "center", color: "#9ca3af", background: "#fafafa" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No vendors selected yet</div>
          <div style={{ fontSize: 13 }}>Use the "Select Vendor" button in each row of the Sub Orders tab.</div>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 100px 1fr 130px 160px 100px", padding: "11px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
            {["Vendor", "Items Count", "Sub Orders", "Total Quantity", "Total Amount (INR)", "Action"].map(h => <div key={h}>{h}</div>)}
          </div>

          {vendorGroups.map((g, i) => {
            const vendorQty = g.subOrders.reduce((a, s) => a + s.qty, 0);
            const vendorAmount = g.subOrders.reduce((a, s) => a + g.vendor.pricePerUnit * s.qty, 0);
            return (
              <div key={g.vendor.id} style={{ display: "grid", gridTemplateColumns: "200px 100px 1fr 130px 160px 100px", padding: "16px 20px", alignItems: "center", borderBottom: i < vendorGroups.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initial={g.vendor.id} color={g.vendor.color} size={36} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{g.vendor.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{g.vendor.location}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, color: "#374151" }}>{g.subOrders.length} {g.subOrders.length === 1 ? "Item" : "Items"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.subOrders.map(s => (
                    <span key={s.id} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{s.id}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{vendorQty} Nos</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>₹ {vendorAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <div>
                  <button
                    style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", padding: 0 }}
                    onClick={() => setViewItemsGroup(g)}
                  >
                    View Items
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ display: "grid", gridTemplateColumns: "200px 100px 1fr 130px 160px 100px", padding: "13px 20px", background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>Total : {totalItems} Items</div>
            <div /><div />
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{totalQty} Nos</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <div />
          </div>
        </div>
      )}

      {viewItemsGroup && <ViewItemsModal group={viewItemsGroup} onClose={() => setViewItemsGroup(null)} />}
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
              {["Purchase Order","Quotation","Invoice","Contract","Shipping Document","Other"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={lbSt}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a description..." style={{ ...inSt, resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={!file} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: file ? "#2563eb" : "#93c5fd", color: "#fff", cursor: file ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Save Document</button>
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

function DocumentsNotesTab() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState("Internal Note");
  const [showUpload, setShowUpload] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  const filteredDocs = docs.filter(d => !docSearch || d.name.toLowerCase().includes(docSearch.toLowerCase()) || d.type.toLowerCase().includes(docSearch.toLowerCase()));

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setNotes(prev => [{ id: "n" + Date.now(), author: "System Owner", date: dateStr, text: noteText.trim(), visibility }, ...prev]);
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
            <button onClick={() => setShowUpload(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
              ⬆ Upload Document
            </button>
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, overflow: "hidden", marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 130px 160px 140px 1fr 48px", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
            {["DOCUMENT NAME","TYPE","UPLOADED BY","UPLOADED ON","DESCRIPTION","ACTIONS"].map(h => <div key={h}>{h}</div>)}
          </div>
          {filteredDocs.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13.5 }}>No documents found.</div>
          ) : filteredDocs.map((doc, i) => (
            <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "2fr 130px 160px 140px 1fr 48px", padding: "14px 16px", alignItems: "center", borderBottom: i < filteredDocs.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
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
              <DocRowMenu onDownload={() => alert(`Downloading ${doc.name}...`)} onRemove={() => setDocs(prev => prev.filter(d => d.id !== doc.id))} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 1 }}>Notes</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>{notes.length} note{notes.length !== 1 ? "s" : ""}</div>
        {notes.map((note, i) => (
          <div key={note.id} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < notes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
            <Avatar initial="S" color="#2563eb" size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{note.author}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{note.date}</span>
                <span style={{ fontSize: 11, background: note.visibility === "Internal Note" ? "#eff6ff" : "#faf5ff", color: note.visibility === "Internal Note" ? "#1d4ed8" : "#7c3aed", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                  {note.visibility === "Internal Note" ? "🔒 Internal" : "🌐 External"}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{note.text}</div>
            </div>
          </div>
        ))}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px" }}>
            <div style={{ padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8, color: "#111827" }}>Add Note</div>
              <textarea value={noteText} onChange={e => { if (e.target.value.length <= 500) setNoteText(e.target.value); }} placeholder="Write your note here..."
                rows={4} style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13.5, fontFamily: "inherit", color: "#374151", boxSizing: "border-box", background: "transparent" }} />
              <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{noteText.length} / 500</div>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>Visibility</div>
                {[["Internal Note", "🔒", "Only visible to internal users"], ["External Note", "🌐", "Visible to vendors and other external users"]].map(([label, icon, sub]) => (
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
          {[["assignedTo","Assigned To"],["role","Role"],["assignedOn","Assigned On"]].map(([k, label]) => (
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
          {[["trackingNumber","Tracking Number","e.g. 1Z999AA1234567890"],["note","Tracking Note","e.g. Shipped on Apr 17, 2026"],["linkLabel","Link Label","e.g. Track Package"]].map(([k, label, ph]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={lbSt}>{label}</label>
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={ph} style={inSt} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Carrier</label>
            <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={{ ...inSt, appearance: "none" }}>
              <option value="">Select carrier</option>
              {["UPS","FedEx","DHL","USPS","BlueDart","Delhivery","Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { if (form.trackingNumber && form.carrier) { onSave(form); onClose(); } }} saveLabel="Save Tracking" />
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
              {["Damaged / Defective","Wrong Item Received","Item Not as Described","Changed Mind","Quantity Mismatch","Other"].map(r => <option key={r}>{r}</option>)}
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

function CancelItemModal({ itemName, onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Cancel Item" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>Are you sure you want to cancel <b>{itemName}</b>?</div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>⚠️ Cancelling this item will notify the vendor and update the order status.</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "20px 22px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Keep Item</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Yes, Cancel Item</button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function Stepper({ currentStatus }) {
  const steps = [{ label: "Processing", note: "Apr 16, 2026" }, { label: "Partially Shipped", note: "In Progress" }, { label: "Partially Delivered", note: "Pending" }, { label: "Delivered", note: "Pending" }];
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

function ThreeDotMenu({ sub, onUpdateStatus, onAddTracking, onCancel, onRaiseReturn, returnAllowed }) {
  const [open, setOpen] = useState(false), [statusSub, setStatusSub] = useState(false);
  const ref = useRef<any>(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setStatusSub(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const statuses = ["Pending","Confirmed","Processing","Shipped","Delivered"];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); setStatusSub(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", top: 30, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 200, minWidth: 200 }}>
          <div style={{ position: "relative" }} onMouseEnter={() => setStatusSub(true)} onMouseLeave={() => setStatusSub(false)}>
            <button style={menuItemSt}><span>🔄</span> Update Status <span style={{ marginLeft: "auto", color: "#9ca3af" }}>›</span></button>
            {statusSub && (
              <div style={{ position: "absolute", top: 0, left: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", minWidth: 160, overflow: "hidden", zIndex: 201 }}>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id || "ORD-24815779";

  const TABS = ["Sub Orders / Items", "Vendor Selected Summary", "Documents & Notes"];
  const [activeTab, setActiveTab] = useState("Sub Orders / Items");
  const [masterStatus, setMasterStatus] = useState("Partially Shipped");
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [subOrders, setSubOrders] = useState(INITIAL_ORDERS);
  const [subSearch, setSubSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set<string>());
  const [createdPOs, setCreatedPOs] = useState<Record<string, any>>(() => {
    try { return JSON.parse(localStorage.getItem(`nido_pos_${orderId}`) || "{}"); } catch { return {}; }
  });
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`nido_vendors_${orderId}`) || "{}"); } catch { return {}; }
  });
  const [vendorModalSub, setVendorModalSub] = useState<any>(null);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [trackingTarget, setTrackingTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [assignment, setAssignment] = useState({ assignedTo: "Anita Kapoor", role: "Procurement Manager", assignedOn: "Apr 16, 2026 12:35 PM", notes: "Oversees end-to-end execution and vendor coordination for this order." });

  useEffect(() => {
    localStorage.setItem(`nido_pos_${orderId}`, JSON.stringify(createdPOs));
  }, [createdPOs, orderId]);

  useEffect(() => {
    localStorage.setItem(`nido_vendors_${orderId}`, JSON.stringify(selectedVendors));
  }, [selectedVendors, orderId]);

  const isReturnAllowed = sub => sub.itemStatus === "Delivered" && sub.deliveredAt && Date.now() - sub.deliveredAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
  const updateStatus = (id, status) => setSubOrders(prev => prev.map(s => s.id === id ? { ...s, itemStatus: status, deliveredAt: status === "Delivered" ? new Date() : s.deliveredAt, updatedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : s));
  const filtered = subOrders.filter(s => !subSearch || s.itemName.toLowerCase().includes(subSearch.toLowerCase()) || s.id.toLowerCase().includes(subSearch.toLowerCase()));

  const handleSelectVendor = (subId: string, vendorId: string) => {
    if (createdPOs[subId]) return;
    setSelectedVendors(prev => ({ ...prev, [subId]: vendorId }));
  };

  const handleCreatePurchaseOrders = () => {
    const newPOs: Record<string, any> = {};
    for (const sub of subOrders) {
      if (createdPOs[sub.id]) continue;
      const vendorId = selectedVendors[sub.id];
      if (!vendorId) continue;
      const vendor = VENDOR_POOL.find(v => v.id === vendorId);
      if (!vendor) continue;
      const poNum = "PO-" + Math.floor(10000 + Math.random() * 90000);
      newPOs[sub.id] = {
        vendorId: vendor.id,
        vendorName: vendor.name,
        poNumber: poNum,
        item: sub.itemName,
        qty: sub.qty,
        unitPrice: vendor.pricePerUnit,
        total: vendor.pricePerUnit * sub.qty,
        subOrderId: sub.id,
      };
    }
    setCreatedPOs(prev => ({ ...prev, ...newPOs }));
  };

  const handleCancelPO = (subId: string) => {
    setCreatedPOs(prev => {
      const next = { ...prev };
      delete next[subId];
      return next;
    });
    setSelectedVendors(prev => {
      const next = { ...prev };
      delete next[subId];
      return next;
    });
  };

  const card: any = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 };

  const selectedSummaryCount = Object.keys(selectedVendors).length;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f9fafb", minHeight: "100vh", color: "#111827" }} onClick={() => setShowStatusDd(false)}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 24px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "inherit", marginBottom: 12, padding: 0 }}
          >
            ← Back to Orders
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Order Details / <span style={{ color: "#374151" }}>Order #{orderId}</span></h1>
            <StatusPill status="Processing" />
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Master Order</span><span style={{ color: "#d1d5db" }}>•</span>
            <span>Created on <b style={{ color: "#374151" }}>Apr 16, 2026 12:33 PM</b></span><span style={{ color: "#d1d5db" }}>•</span>
            <span>Requested by <b style={{ color: "#374151" }}>Pavan (System Owner)</b></span>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Billing Information</div><Field label="Billing Address" value="1235 Ave, San, CA 94821" /><Field label="Payment Method" value="Bank Transfer" /><Field label="Payment Terms" value="Net 30" /></div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Shipping Information</div><Field label="Shipping Address" value="1235 Ave, San, CA 94821" /><Field label="Delivery Method" value="Standard Ground" /><Field label="Requested Delivery" value="Apr 28, 2026" /></div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Requestor / Client Information</div><Field label="Name" value="Pavan" /><Field label="Email" value="pavan@corpessentials.com" /><Field label="Phone" value="+1 (408) 035-3779673" /><Field label="Organization" value="Infosys" /></div>
          <div style={card}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Order Summary</div>{[["Master Order ID","ORD-24815779"],["Sub Orders","3"],["Total Items","14"],["Total Amount","₹19,700.00"],["Created On","Apr 16, 2026 12:33 PM"]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12.5, color: "#6b7280" }}>{l}</span><span style={{ fontSize: 13, fontWeight: l === "Total Amount" ? 700 : 500 }}>{v}</span></div>))}</div>
        </div>

        {/* Stepper + Assignment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
          <div style={card}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚚</div>
                <div><div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Master Order Status</div><div style={{ fontSize: 17, fontWeight: 700 }}>{masterStatus}</div><div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>3 of 3 sub-orders are in progress</div></div>
              </div>
              <Stepper currentStatus={masterStatus} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowStatusDd(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid #2563eb", borderRadius: 8, background: "#fff", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>Update Master Status ▾</button>
                {showStatusDd && (
                  <div style={{ position: "absolute", bottom: 42, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 210, overflow: "hidden" }}>
                    {["Processing","Partially Shipped","Partially Delivered","Delivered"].map(opt => (
                      <button key={opt} onClick={() => { setMasterStatus(opt); setShowStatusDd(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", border: "none", background: opt === masterStatus ? "#eff6ff" : "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: opt === masterStatus ? "#2563eb" : "#374151", fontWeight: opt === masterStatus ? 600 : 400 }}>
                        {opt} {opt === masterStatus && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Assignment</span>
              <button onClick={() => setShowEditAssignment(true)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>✎ Edit</button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Assigned To</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Avatar initial={assignment.assignedTo.split(" ").map(w => w[0]).join("").slice(0,2)} color="#2563eb" size={36} />
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{assignment.assignedTo}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{assignment.role}</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Assigned On</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{assignment.assignedOn}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{assignment.notes}</div>
          </div>
        </div>

        {/* Tabs section */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "0 20px" }}>
            <div style={{ display: "flex" }}>
              {TABS.map(tab => {
                let label = tab;
                if (tab === "Sub Orders / Items") label = `Sub Orders / Items (${subOrders.length})`;
                if (tab === "Vendor Selected Summary") label = selectedSummaryCount > 0 ? `Vendor Selected Summary (${selectedSummaryCount})` : "Vendor Selected Summary";
                if (tab === "Documents & Notes") label = "Documents & Notes (3)";
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: "14px 0", marginRight: 28, border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? "#2563eb" : "#6b7280", borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent", marginBottom: -1, fontFamily: "inherit", whiteSpace: "nowrap" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "36px 130px 1fr 110px 52px 90px 80px 130px 180px 130px 48px", padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
                {["#","SUB ORDER ID","ITEM DETAILS","PO NUMBER","QTY","UNIT PRICE","TOTAL","ITEM STATUS","TRACKING INFO","SELECT VENDOR","ACTIONS"].map(h => <div key={h}>{h}</div>)}
              </div>
              {filtered.map((sub, idx) => {
                const expanded = expandedItems.has(sub.id), returnOk = isReturnAllowed(sub), hasPO = !!createdPOs[sub.id];
                const selVendorId = selectedVendors[sub.id];
                const selVendor = selVendorId ? VENDOR_POOL.find(v => v.id === selVendorId) : null;
                return (
                  <div key={sub.id} style={{ display: "grid", gridTemplateColumns: "36px 130px 1fr 110px 52px 90px 80px 130px 180px 130px 48px", padding: "16px 20px", alignItems: "start", borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                    <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 3 }}>{sub.num}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{sub.id}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
                      {hasPO && <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>PO Created</span></div>}
                      {selectedVendors[sub.id] && !hasPO && <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, background: "#f0fdf4", color: "#166534", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>Vendor Selected</span></div>}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 42, height: 42, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{sub.itemName}</div>
                          <div style={{ fontSize: 11.5, color: "#6b7280" }}>SKU: {sub.sku}</div>
                          {sub.specs.slice(0, expanded ? undefined : 1).map(s => <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>)}
                          {sub.specs.length > 1 && <button onClick={() => setExpandedItems(s => { const n = new Set(s); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); return n; })} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit", marginTop: 2 }}>{expanded ? "View less" : "View more"}</button>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/vendor-orders/${hasPO ? createdPOs[sub.id].poNumber : sub.poNumber}`)}
                        style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit" }}
                      >
                        {hasPO ? createdPOs[sub.id].poNumber : sub.poNumber} ↗
                      </button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty}</div>
                    <div style={{ fontSize: 13 }}>{sub.unitPrice}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.total}</div>
                    <div><StatusPill status={sub.itemStatus} /><div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Updated on {sub.updatedOn}</div></div>
                    <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                      {sub.tracking ? (<><div style={{ fontWeight: 600, fontSize: 12.5 }}>{sub.tracking.trackingNumber}</div><div style={{ color: "#6b7280" }}>{sub.tracking.carrier}</div><div style={{ color: "#6b7280" }}>{sub.tracking.note}</div><a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 12 }}>{sub.tracking.linkLabel}</a></>) : <span style={{ color: "#d1d5db" }}>-</span>}
                    </div>
                    <div>
                      {selVendor ? (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Avatar initial={selVendor.id} color={selVendor.color} size={22} />
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{selVendor.name}</span>
                          </div>
                          <button onClick={() => setVendorModalSub(sub)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>Change ›</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setVendorModalSub(sub)}
                          style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap" }}
                        >
                          Select Vendor
                        </button>
                      )}
                    </div>
                    <ThreeDotMenu sub={sub} onUpdateStatus={s => updateStatus(sub.id, s)} onAddTracking={() => setTrackingTarget(sub.id)} onCancel={() => setCancelTarget(sub.id)} onRaiseReturn={() => setReturnTarget(sub.id)} returnAllowed={returnOk} />
                  </div>
                );
              })}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 270 }}>
                  {[["Sub-total","₹19,700.00"],["Tax (10%)","₹1,970.00"]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13.5, color: "#6b7280" }}>{l}</span><span style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</span></div>))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}><span style={{ fontSize: 14, fontWeight: 700 }}>Total Order Amount</span><span style={{ fontSize: 15, fontWeight: 800 }}>₹21,670.00</span></div>
                </div>
              </div>
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" }}>Showing 1 to {filtered.length} of {subOrders.length} sub orders</div>
            </>
          )}

          {/* Vendor Selected Summary tab */}
          {activeTab === "Vendor Selected Summary" && (
            <VendorSelectedSummaryTab
              subOrders={subOrders}
              selectedVendors={selectedVendors}
              createdPOs={createdPOs}
              onCreatePurchaseOrders={handleCreatePurchaseOrders}
              onCancelPO={handleCancelPO}
            />
          )}

          {activeTab === "Documents & Notes" && <DocumentsNotesTab />}
        </div>

        {/* Activity Timeline */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Order Activity Timeline</div>
          {[{ label: "Order Created", date: "Apr 16, 2026 12:33 PM", by: "by Pavan" }, { label: "Sent to Vendors", date: "Apr 16, 2026 01:15 PM", by: "by System" }, { label: "POs Generated", date: "Apr 16, 2026 02:05 PM", by: "by System" }, { label: "Partially Shipped", date: "Apr 17, 2026 10:20 AM", by: "by System" }].map((ev, i, arr) => (
            <div key={ev.label} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#2563eb", marginTop: 3 }} />
                {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 26 }} />}
              </div>
              <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.label}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 1 }}>{ev.date}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{ev.by}</div>
              </div>
            </div>
          ))}
          <button style={{ marginTop: 14, background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>View Full Timeline →</button>
        </div>
      </div>

      {/* Vendor Selection Popup Modal */}
      {vendorModalSub && (
        <VendorSelectionModal
          sub={vendorModalSub}
          selectedVendorId={selectedVendors[vendorModalSub.id] || null}
          onSelect={handleSelectVendor}
          onClose={() => setVendorModalSub(null)}
        />
      )}

      {showEditAssignment && <EditAssignmentModal data={assignment} onSave={setAssignment} onClose={() => setShowEditAssignment(false)} />}
      {trackingTarget && <AddTrackingModal current={subOrders.find(s => s.id === trackingTarget)?.tracking || null} onSave={t => setSubOrders(prev => prev.map(s => s.id === trackingTarget ? { ...s, tracking: t } : s))} onClose={() => setTrackingTarget(null)} />}
      {cancelTarget && <CancelItemModal itemName={subOrders.find(s => s.id === cancelTarget)?.itemName || ""} onConfirm={() => setSubOrders(prev => prev.map(s => s.id === cancelTarget ? { ...s, itemStatus: "Pending" } : s))} onClose={() => setCancelTarget(null)} />}
      {returnTarget && <RaiseReturnModal itemName={subOrders.find(s => s.id === returnTarget)?.itemName || ""} onClose={() => setReturnTarget(null)} />}
    </div>
  );
}
