import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

type ItemStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered";

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  note: string;
  linkLabel: string;
}

interface SubOrder {
  num: number;
  id: string;
  itemName: string;
  sku: string;
  category: string;
  specs: string[];
  vendorName: string;
  vendorInitial: string;
  vendorColor: string;
  poNumber: string;
  qty: number;
  unitPrice: string;
  total: string;
  itemStatus: ItemStatus;
  updatedOn: string;
  deliveredAt: Date | null;
  tracking: TrackingInfo | null;
}

const INITIAL_ORDERS: SubOrder[] = [
  {
    num: 1, id: "SUB-24815779-1", itemName: "Mechanical Keyboard", sku: "SKU/SHOP-10", category: "General",
    specs: ["USB Wired", "Black | Ergonomic Design"],
    vendorName: "TechHub Solutions", vendorInitial: "T", vendorColor: "#c53030",
    poNumber: "PO-10034", qty: 8, unitPrice: "$149.00", total: "$1,192.00",
    itemStatus: "Shipped", updatedOn: "Apr 17, 2026",
    deliveredAt: null,
    tracking: { trackingNumber: "1Z999AA1234567890", carrier: "UPS", note: "Shipped on Apr 17, 2026", linkLabel: "Track Package" },
  },
  {
    num: 2, id: "SUB-24815779-2", itemName: "Filing Cabinet", sku: "SKU/SHOP-3", category: "General",
    specs: ["3 Drawers", "Metal | Lockable"],
    vendorName: "OfficeMart Supplies", vendorInitial: "O", vendorColor: "#2b6cb0",
    poNumber: "PO-10035", qty: 2, unitPrice: "$299.00", total: "$598.00",
    itemStatus: "Confirmed", updatedOn: "Apr 16, 2026",
    deliveredAt: null,
    tracking: null,
  },
  {
    num: 3, id: "SUB-24815779-3", itemName: "Printer Paper (Box)", sku: "SKU/SHOP-5", category: "Office Supplies",
    specs: ["5000 Sheets", "A4 | 80 GSM"],
    vendorName: "PaperWorld Distributors", vendorInitial: "A", vendorColor: "#276749",
    poNumber: "PO-10036", qty: 4, unitPrice: "$45.00", total: "$180.00",
    itemStatus: "Delivered", updatedOn: "Apr 18, 2026",
    deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago → within 3 days
    tracking: { trackingNumber: "1Z999AA9876543210", carrier: "FedEx", note: "Delivered on Apr 18, 2026", linkLabel: "Proof of Delivery" },
  },
];

const STATUS_STYLE: Record<ItemStatus, { bg: string; color: string; border: string }> = {
  Pending:   { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  Confirmed: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Processing:{ bg: "#faf5ff", color: "#6b21a8", border: "#d8b4fe" },
  Shipped:   { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  Delivered: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
};

const MASTER_STATUS_OPTIONS = ["Processing", "Partially Shipped", "Partially Delivered", "Delivered"];

function Avatar({ initial, color, size = 28 }: { initial: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Processing:           { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
    "Partially Shipped":  { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
    "Partially Delivered":{ bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" },
    Delivered:            { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    Pending:              { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
    Confirmed:            { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
    Shipped:              { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  };
  const s = map[status] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
  return (
    <span style={{ padding: "4px 11px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", display: "inline-block" }}>
      {status}
    </span>
  );
}

// ─── Edit Assignment Modal ────────────────────────────────────────────────────
interface AssignmentData { assignedTo: string; role: string; assignedOn: string; notes: string; }

function EditAssignmentModal({ data, onSave, onClose }: { data: AssignmentData; onSave: (d: AssignmentData) => void; onClose: () => void }) {
  const [form, setForm] = useState<AssignmentData>(data);
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Edit Assignment" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          {(["assignedTo", "role", "assignedOn"] as const).map(k => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={lbSt}>{k === "assignedTo" ? "Assigned To" : k === "role" ? "Role" : "Assigned On"}</label>
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inSt} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inSt, resize: "vertical" as const }} />
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { onSave(form); onClose(); }} />
      </ModalBox>
    </Overlay>
  );
}

// ─── Add Tracking Modal ───────────────────────────────────────────────────────
function AddTrackingModal({ current, onSave, onClose }: { current: TrackingInfo | null; onSave: (t: TrackingInfo) => void; onClose: () => void }) {
  const [form, setForm] = useState<TrackingInfo>(current || { trackingNumber: "", carrier: "", note: "", linkLabel: "Track Package" });
  return (
    <Overlay onClose={onClose}>
      <ModalBox title={current ? "Update Tracking Info" : "Add Tracking Info"} onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Tracking Number</label>
            <input value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} placeholder="e.g. 1Z999AA1234567890" style={inSt} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Carrier</label>
            <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={{ ...inSt, appearance: "none" as const }}>
              <option value="">Select carrier</option>
              {["UPS", "FedEx", "DHL", "USPS", "BlueDart", "Delhivery", "Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Tracking Note</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="e.g. Shipped on Apr 17, 2026" style={inSt} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Link Label</label>
            <input value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} placeholder="e.g. Track Package" style={inSt} />
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { if (form.trackingNumber && form.carrier) { onSave(form); onClose(); } }} saveLabel="Save Tracking" />
      </ModalBox>
    </Overlay>
  );
}

// ─── Raise Return Modal ───────────────────────────────────────────────────────
function RaiseReturnModal({ itemName, onClose }: { itemName: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return (
    <Overlay onClose={onClose}>
      <ModalBox title="Return Request Raised" onClose={onClose}>
        <div style={{ padding: "24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Return request submitted!</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Your return request for <b>{itemName}</b> has been raised. Our team will review and get back to you within 2-3 business days.</div>
        </div>
        <div style={{ padding: "0 22px 20px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Done</button>
        </div>
      </ModalBox>
    </Overlay>
  );
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Raise Return Request" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
            Item: <b>{itemName}</b>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Reason for Return</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={{ ...inSt, appearance: "none" as const }}>
              <option value="">Select a reason</option>
              {["Damaged / Defective", "Wrong Item Received", "Item Not as Described", "Changed Mind", "Quantity Mismatch", "Other"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbSt}>Additional Details</label>
            <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the issue..." style={{ ...inSt, resize: "vertical" as const }} />
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>⚠️ Return requests can only be raised within 3 days of delivery.</div>
        </div>
        <ModalFooter onCancel={onClose} onSave={() => { if (reason) setSubmitted(true); }} saveLabel="Submit Return Request" />
      </ModalBox>
    </Overlay>
  );
}

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
function CancelItemModal({ itemName, onConfirm, onClose }: { itemName: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Cancel Item" onClose={onClose}>
        <div style={{ padding: "20px 22px 8px" }}>
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
            Are you sure you want to cancel <b>{itemName}</b>? This action cannot be undone.
          </div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
            ⚠️ Cancelling this item will notify the vendor and update the order status.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "20px 22px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Keep Item</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Yes, Cancel Item</button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { label: "Processing", note: "Apr 16, 2026" },
    { label: "Partially Shipped", note: "In Progress" },
    { label: "Partially Delivered", note: "Pending" },
    { label: "Delivered", note: "Pending" },
  ];
  const activeIdx = Math.max(0, steps.findIndex(s => s.label === currentStatus));
  return (
    <div style={{ display: "flex", alignItems: "flex-start", flex: 1, padding: "0 12px" }}>
      {steps.map((step, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
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
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{active ? step.note : (done ? "Done" : step.note)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared Modal primitives ──────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
function ModalBox({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, width: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  );
}
function ModalFooter({ onCancel, onSave, saveLabel = "Save" }: { onCancel: () => void; onSave: () => void; saveLabel?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
      <button onClick={onSave} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>{saveLabel}</button>
    </div>
  );
}

const lbSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inSt: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" as const, outline: "none" };

// ─── Three-dot menu ───────────────────────────────────────────────────────────
function ThreeDotMenu({ sub, onUpdateStatus, onAddTracking, onCancel, onRaiseReturn, returnAllowed }: {
  sub: SubOrder;
  onUpdateStatus: (s: ItemStatus) => void;
  onAddTracking: () => void;
  onCancel: () => void;
  onRaiseReturn: () => void;
  returnAllowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [statusSub, setStatusSub] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setStatusSub(false); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const statuses: ItemStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); setStatusSub(false); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 20, padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>⋮</button>

      {open && (
        <div style={{ position: "absolute", top: 30, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 200, minWidth: 200, overflow: "visible" }}>

          {/* 1. Update Status */}
          <div style={{ position: "relative" }}
            onMouseEnter={() => setStatusSub(true)}
            onMouseLeave={() => setStatusSub(false)}>
            <button style={menuItemSt}>
              <span>🔄</span> Update Status <span style={{ marginLeft: "auto", color: "#9ca3af" }}>›</span>
            </button>
            {statusSub && (
              <div style={{ position: "absolute", top: 0, left: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.13)", minWidth: 160, overflow: "hidden", zIndex: 201 }}>
                {statuses.map(s => {
                  const st = STATUS_STYLE[s];
                  return (
                    <button key={s} onClick={() => { onUpdateStatus(s); setOpen(false); setStatusSub(false); }}
                      style={{ ...menuItemSt, background: sub.itemStatus === s ? "#f0f7ff" : "none", color: sub.itemStatus === s ? "#2563eb" : "#374151", fontWeight: sub.itemStatus === s ? 600 : 400 }}
                      onMouseEnter={e => { if (sub.itemStatus !== s) e.currentTarget.style.background = "#f9fafb"; }}
                      onMouseLeave={e => { if (sub.itemStatus !== s) e.currentTarget.style.background = "none"; }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: st.color, marginRight: 8, flexShrink: 0 }} />
                      {s} {sub.itemStatus === s && "✓"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Add Tracking Info */}
          <button style={menuItemSt} onClick={() => { onAddTracking(); setOpen(false); }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span>📦</span> {sub.tracking ? "Update Tracking Info" : "Add Tracking Info"}
          </button>

          <div style={{ height: 1, background: "#f3f4f6", margin: "2px 0" }} />

          {/* 3. Cancel Item */}
          <button style={{ ...menuItemSt, color: "#dc2626" }} onClick={() => { onCancel(); setOpen(false); }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span>✕</span> Cancel Item
          </button>

          {/* 4. Raise Return Request */}
          <button
            style={{ ...menuItemSt, color: returnAllowed ? "#7c3aed" : "#d1d5db", cursor: returnAllowed ? "pointer" : "not-allowed" }}
            onClick={() => { if (returnAllowed) { onRaiseReturn(); setOpen(false); } }}
            title={!returnAllowed ? "Available only within 3 days of delivery" : ""}
            onMouseEnter={e => { if (returnAllowed) e.currentTarget.style.background = "#faf5ff"; }}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span>↩</span> Raise Return Request
            {!returnAllowed && <span style={{ marginLeft: "auto", fontSize: 10, color: "#d1d5db", background: "#f9fafb", padding: "2px 5px", borderRadius: 4 }}>Expired</span>}
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemSt: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px",
  border: "none", background: "none", textAlign: "left", cursor: "pointer",
  fontSize: 13.5, fontFamily: "inherit", color: "#374151",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#111827" }}>{value}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id || "ORD-24815779";
  const [activeTab, setActiveTab] = useState<"Sub Orders" | "Documents & Notes">("Sub Orders");
  const [masterStatus, setMasterStatus] = useState("Partially Shipped");
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [subOrders, setSubOrders] = useState<SubOrder[]>(INITIAL_ORDERS);
  const [subSearch, setSubSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [trackingTarget, setTrackingTarget] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<string | null>(null);
  const [assignment, setAssignment] = useState({ assignedTo: "Anita Kapoor", role: "Procurement Manager", assignedOn: "Apr 16, 2026 12:35 PM", notes: "Oversees end-to-end execution and vendor coordination for this order." });

  const isReturnAllowed = (sub: SubOrder) => {
    if (sub.itemStatus !== "Delivered" || !sub.deliveredAt) return false;
    const diffMs = Date.now() - sub.deliveredAt.getTime();
    return diffMs <= 3 * 24 * 60 * 60 * 1000;
  };

  const updateStatus = (id: string, status: ItemStatus) => {
    setSubOrders(prev => prev.map(s => s.id === id ? {
      ...s, itemStatus: status,
      deliveredAt: status === "Delivered" ? new Date() : s.deliveredAt,
      updatedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    } : s));
  };

  const updateTracking = (id: string, tracking: TrackingInfo) => {
    setSubOrders(prev => prev.map(s => s.id === id ? { ...s, tracking } : s));
  };

  const cancelItem = (id: string) => {
    setSubOrders(prev => prev.map(s => s.id === id ? { ...s, itemStatus: "Pending" } : s));
  };

  const filtered = subOrders.filter(s =>
    !subSearch || s.itemName.toLowerCase().includes(subSearch.toLowerCase()) || s.id.toLowerCase().includes(subSearch.toLowerCase())
  );

  const cardSt: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f9fafb", minHeight: "100vh", color: "#111827" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 24px 48px" }}>

        {/* ── Header ── */}
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
          <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Master Order</span><span style={{ color: "#d1d5db" }}>•</span>
            <span>Created on <b style={{ color: "#374151" }}>Apr 16, 2026 12:33 PM</b></span><span style={{ color: "#d1d5db" }}>•</span>
            <span>Requested by <b style={{ color: "#374151" }}>Pavan (System Owner)</b></span>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={cardSt}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Billing Information</div>
            <Field label="Billing Address" value="1235 Ave, San, CA 94821" />
            <Field label="Payment Method" value="Bank Transfer" />
            <Field label="Payment Terms" value="Net 30" />
          </div>
          <div style={cardSt}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Shipping Information</div>
            <Field label="Shipping Address" value="1235 Ave, San, CA 94821" />
            <Field label="Delivery Method" value="Standard Ground" />
            <Field label="Requested Delivery" value="Apr 28, 2026" />
          </div>
          <div style={cardSt}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Requestor / Client Information</div>
            <Field label="Name" value="Pavan" />
            <Field label="Email" value="pavan@corpessentials.com" />
            <Field label="Phone" value="+1 (408) 035-3779673" />
            <Field label="Organization" value="Infosys" />
          </div>
          <div style={cardSt}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Order Summary</div>
            {[["Master Order ID","ORD-24815779"],["Sub Orders","3"],["Total Items","14"],["Total Amount","$2,192.00"],["Created On","Apr 16, 2026 12:33 PM"]].map(([l,v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "#6b7280" }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: l === "Total Amount" ? 700 : 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stepper + Assignment ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
          <div style={cardSt}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚚</div>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Master Order Status</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{masterStatus}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>3 of 3 sub-orders are in progress</div>
                </div>
              </div>
              <Stepper currentStatus={masterStatus} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <div style={{ position: "relative" }}>
                <button onClick={e => { e.stopPropagation(); setShowStatusDd(v => !v); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid #2563eb", borderRadius: 8, background: "#fff", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>
                  Update Master Status ▾
                </button>
                {showStatusDd && (
                  <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 42, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 210, overflow: "hidden" }}>
                    {MASTER_STATUS_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => { setMasterStatus(opt); setShowStatusDd(false); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", border: "none", background: opt === masterStatus ? "#eff6ff" : "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: opt === masterStatus ? "#2563eb" : "#374151", fontWeight: opt === masterStatus ? 600 : 400 }}
                        onMouseEnter={e => { if (opt !== masterStatus) e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={e => { if (opt !== masterStatus) e.currentTarget.style.background = "none"; }}>
                        {opt} {opt === masterStatus && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Assignment</span>
              <button onClick={() => setShowEditAssignment(true)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>✎ Edit</button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Assigned To</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Avatar initial={assignment.assignedTo.split(" ").map(w => w[0]).join("").slice(0,2)} color="#2563eb" size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{assignment.assignedTo}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{assignment.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Assigned On</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{assignment.assignedOn}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{assignment.notes}</div>
          </div>
        </div>

        {/* ── Sub Orders Table ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "0 20px" }}>
            <div style={{ display: "flex" }}>
              {(["Sub Orders", "Documents & Notes"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "14px 0", marginRight: 28, border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? "#2563eb" : "#6b7280", borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent", marginBottom: -1, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {tab === "Sub Orders" ? "Sub Orders (3)" : "Documents & Notes (3)"}
                </button>
              ))}
            </div>
            {activeTab === "Sub Orders" && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>🔍</span>
                  <input value={subSearch} onChange={e => setSubSearch(e.target.value)} placeholder="Search items..."
                    style={{ padding: "7px 12px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#374151" }}>▼ Filters</button>
              </div>
            )}
          </div>

          {activeTab === "Sub Orders" && (
            <>
              {/* Table head */}
              <div style={{ display: "grid", gridTemplateColumns: "36px 130px 1fr 150px 110px 52px 90px 80px 130px 180px 48px", padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
                {["#","SUB ORDER ID","ITEM DETAILS","VENDOR","PO NUMBER","QTY","UNIT PRICE","TOTAL","ITEM STATUS","TRACKING INFO","ACTIONS"].map(h => <div key={h}>{h}</div>)}
              </div>

              {filtered.map((sub, idx) => {
                const expanded = expandedItems.has(sub.id);
                const returnOk = isReturnAllowed(sub);
                return (
                  <div key={sub.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "36px 130px 1fr 150px 110px 52px 90px 80px 130px 180px 48px", padding: "16px 20px", alignItems: "start" }}>
                      <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 3 }}>{sub.num}</div>
                      <div>
                        <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{sub.id}</a>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub.category}</div>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 42, height: 42, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{sub.itemName}</div>
                            <div style={{ fontSize: 11.5, color: "#6b7280" }}>SKU: {sub.sku}</div>
                            {sub.specs.slice(0, expanded ? undefined : 1).map(s => (
                              <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>
                            ))}
                            {sub.specs.length > 1 && (
                              <button onClick={() => setExpandedItems(s => { const n = new Set(s); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); return n; })}
                                style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit", marginTop: 2 }}>
                                {expanded ? "View less" : "View more"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar initial={sub.vendorInitial} color={sub.vendorColor} size={28} />
                        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{sub.vendorName}</span>
                      </div>
                      <div>
                        <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 13 }}>{sub.poNumber} ↗</a>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{sub.qty}</div>
                      <div style={{ fontSize: 13 }}>{sub.unitPrice}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.total}</div>
                      {/* Status — read-only pill */}
                      <div>
                        <StatusPill status={sub.itemStatus} />
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Updated on {sub.updatedOn}</div>
                      </div>
                      {/* Tracking */}
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                        {sub.tracking ? (
                          <>
                            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{sub.tracking.trackingNumber}</div>
                            <div style={{ color: "#6b7280" }}>{sub.tracking.carrier}</div>
                            <div style={{ color: "#6b7280" }}>{sub.tracking.note}</div>
                            <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 12 }}>{sub.tracking.linkLabel}</a>
                          </>
                        ) : <span style={{ color: "#d1d5db" }}>-</span>}
                      </div>
                      {/* 3-dot menu */}
                      <ThreeDotMenu
                        sub={sub}
                        onUpdateStatus={s => updateStatus(sub.id, s)}
                        onAddTracking={() => setTrackingTarget(sub.id)}
                        onCancel={() => setCancelTarget(sub.id)}
                        onRaiseReturn={() => setReturnTarget(sub.id)}
                        returnAllowed={returnOk}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 270 }}>
                  {[["Sub-total","$1,970.00"],["Tax (10%)","$222.00"]].map(([l,v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13.5, color: "#6b7280" }}>{l}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Total Order Amount</span>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>$2,192.00</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" }}>
                Showing 1 to {filtered.length} of {subOrders.length} sub orders
              </div>
            </>
          )}

          {activeTab === "Documents & Notes" && (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No documents or notes attached yet.</div>
          )}
        </div>

        {/* ── Activity Timeline ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Order Activity Timeline</div>
          {[
            { label: "Order Created", date: "Apr 16, 2026 12:33 PM", by: "by Pavan" },
            { label: "Sent to Vendors", date: "Apr 16, 2026 01:15 PM", by: "by System" },
            { label: "POs Generated", date: "Apr 16, 2026 02:05 PM", by: "by System" },
            { label: "Partially Shipped", date: "Apr 17, 2026 10:20 AM", by: "by System" },
          ].map((ev, i, arr) => (
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

      {/* ── Modals ── */}
      {showEditAssignment && <EditAssignmentModal data={assignment} onSave={setAssignment} onClose={() => setShowEditAssignment(false)} />}

      {trackingTarget && (
        <AddTrackingModal
          current={subOrders.find(s => s.id === trackingTarget)?.tracking || null}
          onSave={t => updateTracking(trackingTarget, t)}
          onClose={() => setTrackingTarget(null)}
        />
      )}

      {cancelTarget && (
        <CancelItemModal
          itemName={subOrders.find(s => s.id === cancelTarget)?.itemName || ""}
          onConfirm={() => cancelItem(cancelTarget)}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {returnTarget && (
        <RaiseReturnModal
          itemName={subOrders.find(s => s.id === returnTarget)?.itemName || ""}
          onClose={() => setReturnTarget(null)}
        />
      )}
    </div>
  );
}
