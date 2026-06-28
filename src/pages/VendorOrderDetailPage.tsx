import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const PO_DATA: Record<string, any> = {
  default: {
    poNumber: "PO-10034",
    status: "Shipped",
    createdOn: "Apr 16, 2026 12:35 PM",
    vendorName: "TechHub Solutions",
    linkedMasterOrder: "ORD-24815779",
    totalItems: 8,
    totalAmount: "$1,192.00",
    orderDate: "Apr 16, 2026 12:35 PM",
    vendor: {
      name: "TechHub Solutions",
      contactPerson: "Rohit Mehta",
      email: "sales@techhub.com",
      phone: "+1 (408) 555-0198",
    },
    shipping: {
      address: "1235 Ave, San, CA 94821",
      deliveryMethod: "Standard Ground",
      requestedDelivery: "Apr 28, 2026",
    },
    billing: {
      address: "1235 Ave, San, CA 94821",
      paymentTerms: "Net 30",
      paymentMethod: "Bank Transfer",
    },
    assignment: {
      assignedTo: "Anita Kapoor",
      initials: "AK",
      role: "Procurement Manager",
      assignedOn: "Apr 16, 2026 12:35 PM",
      notes: "Oversight on vendor coordination and delivery tracking.",
    },
    items: [
      {
        id: "i1", num: 1, name: "Mechanical Keyboard", image: "⌨️",
        sku: "SKU: SKU/SHOP-10",
        specs: ["USB Wired", "Black | Ergonomic Design"],
        qty: 8, unitPrice: "$149.00", total: "$1,192.00",
        status: "Shipped", expectedDelivery: "Apr 28, 2026",
        tracking: { number: "1Z999AA1234567890", carrier: "UPS", note: "Shipped on Apr 17, 2026", link: "Track Package" },
      },
      {
        id: "i2", num: 2, name: "Filing Cabinet", image: "🗄️",
        sku: "SKU: SKU/SHOP-3",
        specs: ["3 Drawers", "Metal | Lockable"],
        qty: 2, unitPrice: "$299.00", total: "$598.00",
        status: "Confirmed", expectedDelivery: "Apr 28, 2026",
        tracking: null,
      },
    ],
    documents: [
      { id: "d1", name: "PO-10034_Confirmation.pdf", ext: "pdf", type: "Order Confirmation", uploadedBy: "Anita Kapoor", uploadedOn: "Apr 16, 2026 01:05 PM" },
    ],
    notes: [
      { id: "n1", author: "Anita Kapoor", initials: "AK", color: "#2563eb", date: "Apr 16, 2026 01:10 PM", text: "Confirmed shipment details with TechHub. Items will be dispatched by Apr 17, 2026.", visibility: "Internal Note" },
    ],
  },
};

const ITEM_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Pending:    { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  Confirmed:  { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  Processing: { bg: "#faf5ff", color: "#6b21a8", border: "#d8b4fe" },
  Shipped:    { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  Delivered:  { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  Cancelled:  { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
};

const STEPPER_STEPS = ["Confirmed", "Processing", "Shipped", "Delivered"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Pending"];
  return (
    <span style={{ padding: "4px 11px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", display: "inline-block" }}>
      {status}
    </span>
  );
}

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: accent ? "#2563eb" : "#111827" }}>{value}</div>
    </div>
  );
}

function DocIcon({ ext }: { ext: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pdf:  { bg: "#fee2e2", color: "#dc2626", label: "PDF" },
    xlsx: { bg: "#d1fae5", color: "#059669", label: "XLS" },
    docx: { bg: "#dbeafe", color: "#2563eb", label: "DOC" },
    png:  { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
    jpg:  { bg: "#fef9c3", color: "#ca8a04", label: "IMG" },
  };
  const ic = map[ext?.toLowerCase()] || { bg: "#f3f4f6", color: "#6b7280", label: ext?.toUpperCase() || "FILE" };
  return (
    <div style={{ width: 36, height: 36, borderRadius: 6, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: ic.color, flexShrink: 0 }}>
      {ic.label}
    </div>
  );
}

// ── Update Tracking Modal ─────────────────────────────────────────────────────
function UpdateTrackingModal({ itemName, tracking, onSave, onClose }: { itemName: string; tracking: any; onSave: (t: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    number: tracking?.number || "",
    carrier: tracking?.carrier || "",
    note: tracking?.note || "",
    link: tracking?.link || "Track Package",
  });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Update Tracking Info</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{itemName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {([
            ["number", "Tracking Number", "e.g. 1Z999AA1234567890"],
            ["carrier", "Carrier", "e.g. UPS, FedEx, DHL"],
            ["note", "Note", "e.g. Shipped on Apr 17, 2026"],
          ] as [string, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button
            onClick={() => { onSave({ ...form, link: form.link || "Track Package" }); onClose(); }}
            style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
          >
            Save Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Doc Actions Menu ──────────────────────────────────────────────────────────
function DocActionsMenu({ onDownload, onDelete }: { onDownload: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, color: "#6b7280", fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center" }}
      >
        ⋮
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 30, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 300, minWidth: 150, overflow: "hidden" }}>
          <button onClick={() => { onDownload(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#374151" }}>
            ⬇ Download
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#dc2626" }}>
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_STYLE[status] || STATUS_STYLE["Pending"];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, cursor: "pointer", fontFamily: "inherit" }}
      >
        {status} ▾
      </button>
      {open && (
        <div style={{ position: "absolute", left: 0, top: 32, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 160, overflow: "hidden" }}>
          {ITEM_STATUSES.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 14px", border: "none", background: opt === status ? "#eff6ff" : "none", textAlign: "left", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: opt === status ? "#2563eb" : "#374151", fontWeight: opt === status ? 600 : 400 }}
            >
              {opt} {opt === status && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Edit Assignment Modal ─────────────────────────────────────────────────────
function EditAssignmentModal({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...data });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Edit Assignment</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[["assignedTo", "Assigned To"], ["role", "Role"], ["notes", "Notes"]].map(([key, label]) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
              {key === "notes"
                ? <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                : <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel PO Modal ───────────────────────────────────────────────────────────
function CancelPOModal({ poNumber, onConfirm, onClose }: { poNumber: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>Cancel Purchase Order</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>
            Are you sure you want to cancel <strong>{poNumber}</strong>? This action cannot be undone and the vendor will be notified.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Keep PO</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel PO</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Note Modal ────────────────────────────────────────────────────────────
function AddNoteModal({ onSave, onClose }: { onSave: (text: string, vis: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [vis, setVis] = useState("Internal Note");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Add Note</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Note</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Enter your note..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Visibility</label>
            <select value={vis} onChange={e => setVis(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
              <option>Internal Note</option>
              <option>Vendor Visible</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => { if (text.trim()) { onSave(text.trim(), vis); onClose(); } }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Save Note</button>
        </div>
      </div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ currentStatus }: { currentStatus: string }) {
  const steps = STEPPER_STEPS;
  const currentIdx = steps.indexOf(currentStatus);
  const dates: Record<string, string> = {
    Confirmed: "Apr 16, 2026",
    Processing: "Apr 16, 2026",
    Shipped: "Apr 17, 2026",
    Delivered: "Pending",
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flex: 1 }}>
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? "#22c55e" : "#e5e7eb", marginTop: 0 }} />}
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? "#22c55e" : active ? "#3b82f6" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                  {done ? <span style={{ color: "#fff", fontSize: 14 }}>✓</span> : active ? <span style={{ fontSize: 16 }}>🚚</span> : <span style={{ fontSize: 14 }}>🔔</span>}
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "#e5e7eb" }} />}
              </div>
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: done || active ? "#111827" : "#9ca3af" }}>{step}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{dates[step]}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Update Status Dropdown ────────────────────────────────────────────────────
function UpdateStatusDropdown({ current, onChange }: { current: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts = ["Confirmed", "Processing", "Shipped", "Delivered"];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", border: "1px solid #2563eb", borderRadius: 8, background: "#fff", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>
        Update Status ▾
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: 44, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 180, overflow: "hidden" }}>
          {opts.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", border: "none", background: opt === current ? "#eff6ff" : "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: opt === current ? "#2563eb" : "#374151", fontWeight: opt === current ? 600 : 400 }}>
              {opt} {opt === current && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const poKey = id || "PO-10034";
  const initialData = PO_DATA[poKey] || { ...PO_DATA.default, poNumber: poKey };

  const [orderStatus, setOrderStatus] = useState(initialData.status);
  const [items, setItems] = useState(initialData.items);
  const [documents, setDocuments] = useState(initialData.documents);
  const [notes, setNotes] = useState(initialData.notes);
  const [assignment, setAssignment] = useState(initialData.assignment);
  const [search, setSearch] = useState("");
  const [showCancelPO, setShowCancelPO] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [updateTrackingItem, setUpdateTrackingItem] = useState<{ id: string; name: string; tracking: any } | null>(null);

  const filteredItems = items.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemStatusChange = (id: string, status: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
  };
  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };
  const handleUpdateTracking = (id: string, tracking: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, tracking } : it));
  };
  const handleDeleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const card: any = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f9fafb", minHeight: "100vh", color: "#111827" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "inherit", marginBottom: 12, padding: 0 }}>
          ← Back
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                Vendor Order Details / <span style={{ color: "#374151" }}>{initialData.poNumber}</span>
              </h1>
              <StatusPill status={orderStatus} />
              {cancelled && <span style={{ padding: "4px 11px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }}>PO Cancelled</span>}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>Vendor Order</span>
              <span style={{ color: "#d1d5db" }}>•</span>
              <span>Created on <b style={{ color: "#374151" }}>{initialData.createdOn}</b></span>
              <span style={{ color: "#d1d5db" }}>•</span>
              <span>From <b style={{ color: "#374151" }}>{initialData.vendorName}</b></span>
            </div>
          </div>
          {!cancelled && (
            <button
              onClick={() => setShowCancelPO(true)}
              style={{ padding: "9px 20px", border: "1px solid #fca5a5", borderRadius: 8, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit", flexShrink: 0 }}
            >
              Cancel PO
            </button>
          )}
        </div>

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 20, marginBottom: 20 }}>
          <InfoCard title="Vendor Information">
            <Field label="Vendor Name" value={initialData.vendor.name} />
            <Field label="Contact Person" value={initialData.vendor.contactPerson} />
            <Field label="Email" value={initialData.vendor.email} />
            <Field label="Phone" value={initialData.vendor.phone} />
          </InfoCard>
          <InfoCard title="Shipping Information">
            <Field label="Shipping Address" value={initialData.shipping.address} />
            <Field label="Delivery Method" value={initialData.shipping.deliveryMethod} />
            <Field label="Requested Delivery" value={initialData.shipping.requestedDelivery} />
          </InfoCard>
          <InfoCard title="Billing Information">
            <Field label="Billing Address" value={initialData.billing.address} />
            <Field label="Payment Terms" value={initialData.billing.paymentTerms} />
            <Field label="Payment Method" value={initialData.billing.paymentMethod} />
          </InfoCard>
          <InfoCard title="Vendor Order Summary">
            {[
              ["PO Number", initialData.poNumber],
              ["Linked Master Order", initialData.linkedMasterOrder],
              ["Total Items", initialData.totalItems],
              ["Total Amount", initialData.totalAmount],
              ["Order Date", initialData.orderDate],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "#6b7280" }}>{l as string}</span>
                <span style={{ fontSize: 13, fontWeight: l === "Linked Master Order" ? 600 : 500, color: l === "Linked Master Order" ? "#2563eb" : "#111827", cursor: l === "Linked Master Order" ? "pointer" : "default" }}
                  onClick={() => l === "Linked Master Order" && navigate(`/orders/${v}`)}
                >{v as string}</span>
              </div>
            ))}
          </InfoCard>
        </div>

        {/* Stepper + Assignment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🚚</div>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 1 }}>Order Status</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{orderStatus}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Updated on Apr 17, 2026</div>
              </div>
            </div>
            <Stepper currentStatus={orderStatus} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <UpdateStatusDropdown current={orderStatus} onChange={setOrderStatus} />
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Assignment</span>
              <button onClick={() => setShowEditAssignment(true)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Edit</button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Assigned To</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Avatar initials={assignment.initials} color="#2563eb" size={36} />
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

        {/* Items Section */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "0 20px" }}>
            <div style={{ padding: "14px 0", fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Items ({items.length})
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ padding: "7px 12px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 160px 60px 110px 110px 140px 160px 180px", padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
            {["#", "ITEM DETAILS", "SKU / DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL", "STATUS", "EXPECTED DELIVERY", "TRACKING INFO"].map(h => <div key={h}>{h}</div>)}
          </div>
          {filteredItems.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No items found.</div>
          )}
          {filteredItems.map((item, idx) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 160px 60px 110px 110px 140px 160px 180px", padding: "16px 20px", alignItems: "start", borderBottom: idx < filteredItems.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
              <div style={{ color: "#6b7280", fontSize: 13, paddingTop: 3 }}>{item.num}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.image}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.name}</div>
                    <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}>View more</button>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 500 }}>{item.sku}</div>
                {item.specs.map(s => <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.qty}</div>
              <div style={{ fontSize: 13 }}>{item.unitPrice}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.total}</div>
              <div>
                <StatusDropdown status={item.status} onChange={s => handleItemStatusChange(item.id, s)} />
              </div>
              <div style={{ fontSize: 12.5, color: "#374151" }}>{item.expectedDelivery}</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                {item.tracking ? (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{item.tracking.number}</div>
                    <div style={{ color: "#6b7280" }}>{item.tracking.carrier}</div>
                    <div style={{ color: "#6b7280" }}>{item.tracking.note}</div>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb", textDecoration: "none", fontSize: 12 }}>{item.tracking.link}</a>
                  </>
                ) : <span style={{ color: "#d1d5db" }}>—</span>}
                <div style={{ marginTop: 7 }}>
                  <button
                    onClick={() => setUpdateTrackingItem({ id: item.id, name: item.name, tracking: item.tracking })}
                    style={{ padding: "3px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#f9fafb", color: "#374151", cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Totals */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 260 }}>
              {[["Sub-total", "$1,790.00"], ["Tax (10%)", "$222.00"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, color: "#6b7280" }}>{l}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Total Order Amount</span>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{initialData.totalAmount}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" }}>
            Showing 1 to {filteredItems.length} of {items.length} items
          </div>
        </div>

        {/* Documents Section */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "14px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Documents ({documents.length})</div>
            <button style={{ padding: "7px 16px", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>+ Upload Document</button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {documents.length === 0 ? (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No documents</div>
              </div>
            ) : (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px 180px 60px", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>
                  {["DOCUMENT NAME", "TYPE", "UPLOADED BY", "UPLOADED ON", "ACTIONS"].map(h => <div key={h}>{h}</div>)}
                </div>
                {documents.map((doc, idx) => (
                  <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px 180px 60px", padding: "14px 16px", alignItems: "center", borderBottom: idx < documents.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <DocIcon ext={doc.ext} />
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{doc.name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{doc.type}</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{doc.uploadedBy}</div>
                    <div style={{ fontSize: 12.5, color: "#6b7280" }}>{doc.uploadedOn}</div>
                    <DocActionsMenu
                      onDownload={() => alert(`Downloading: ${doc.name}`)}
                      onDelete={() => handleDeleteDoc(doc.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "14px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notes ({notes.length})</div>
            <button onClick={() => setShowAddNote(true)} style={{ padding: "7px 16px", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>+ Add Note</button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {notes.length === 0 ? (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No notes yet</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {notes.map(note => (
                  <div key={note.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar initials={note.initials} color={note.color} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{note.author}</div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{note.date}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11.5, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 8 }}>{note.visibility}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{note.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      {showCancelPO && (
        <CancelPOModal
          poNumber={initialData.poNumber}
          onConfirm={() => { setCancelled(true); setOrderStatus("Cancelled"); }}
          onClose={() => setShowCancelPO(false)}
        />
      )}
      {showEditAssignment && (
        <EditAssignmentModal
          data={assignment}
          onSave={d => setAssignment(d)}
          onClose={() => setShowEditAssignment(false)}
        />
      )}
      {showAddNote && (
        <AddNoteModal
          onSave={(text, vis) => setNotes(prev => [{
            id: "n" + Date.now(), author: "System Owner", initials: "SO", color: "#6b7280", date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), text, visibility: vis
          }, ...prev])}
          onClose={() => setShowAddNote(false)}
        />
      )}
      {updateTrackingItem && (
        <UpdateTrackingModal
          itemName={updateTrackingItem.name}
          tracking={updateTrackingItem.tracking}
          onSave={t => handleUpdateTracking(updateTrackingItem.id, t)}
          onClose={() => setUpdateTrackingItem(null)}
        />
      )}
    </div>
  );
}
