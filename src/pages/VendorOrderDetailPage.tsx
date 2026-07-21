import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPOByNumber, updatePO, type StoredPO } from "@/lib/purchaseOrderStore";
import { getAllVendorProducts, updateVendorProduct } from "@/lib/vendorStore";
import { downloadPOPdf } from "@/lib/generatePO";

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
      deliveryMethod: "Direct Delivery",
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
        referenceNumber: "",
        specs: ["USB Wired", "Black | Ergonomic Design"],
        qty: 8, unitPrice: "$149.00", total: "$1,192.00",
        status: "Shipped", expectedDelivery: "Apr 28, 2026",
        tracking: { number: "1Z999AA1234567890", carrier: "UPS", note: "Shipped on Apr 17, 2026", link: "Track Package" },
      },
      {
        id: "i2", num: 2, name: "Filing Cabinet", image: "🗄️",
        referenceNumber: "",
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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.right - 150 });
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, color: "#6b7280", fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center" }}
      >
        ⋮
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.14)", zIndex: 9999, minWidth: 150, overflow: "hidden" }}
        >
          <button onClick={() => { onDownload(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#374151" }}>
            ⬇ Download
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", color: "#dc2626" }}>
            🗑 Delete
          </button>
        </div>
      )}
    </>
  );
}

// ── Upload Document Modal ─────────────────────────────────────────────────────
function UploadDocumentModal({ onSave, onClose }: { onSave: (doc: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", type: "Order Confirmation", uploadedBy: "", file: null as File | null });
  const fileRef = useRef<HTMLInputElement>(null);

  const DOC_TYPES = ["Order Confirmation", "Invoice", "Packing Slip", "Delivery Note", "Contract", "Other"];

  const handleSubmit = () => {
    const fileName = form.file ? form.file.name : form.name.trim();
    if (!fileName || !form.uploadedBy.trim()) return;
    const ext = fileName.split(".").pop()?.toLowerCase() || "file";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    onSave({ id: "d" + Date.now(), name: fileName, ext, type: form.type, uploadedBy: form.uploadedBy.trim(), uploadedOn: dateStr });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Upload Document</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* File picker */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>File</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", background: "#f9fafb" }}
            >
              {form.file ? (
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#374151" }}>📄 {form.file.name}</div>
              ) : (
                <>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📁</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Click to choose a file</div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                style={{ display: "none" }}
                onChange={e => {
                  const f = e.target.files?.[0] || null;
                  setForm(prev => ({ ...prev, file: f, name: f?.name || prev.name }));
                }}
              />
            </div>
          </div>
          {/* Document type */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Document Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}
            >
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {/* Uploaded By */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Uploaded By</label>
            <input
              value={form.uploadedBy}
              onChange={e => setForm(f => ({ ...f, uploadedBy: e.target.value }))}
              placeholder="Your name"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.file && !form.name.trim()}
            style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: (!form.file && !form.name.trim()) ? "#93c5fd" : "#2563eb", color: "#fff", cursor: (!form.file && !form.name.trim()) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ status, onChange, disabled }: { status: string; onChange: (s: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_STYLE[status] || STATUS_STYLE["Pending"];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (disabled) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}`, opacity: 0.7 }}>
        {status}
      </span>
    );
  }

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

// ── Cancel Item Status Modal ──────────────────────────────────────────────────
function CancelItemStatusModal({ itemName, onConfirm, onClose }: { itemName: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>Cancel Item</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>
            Are you sure you want to mark <strong>{itemName}</strong> as cancelled? Once cancelled, this item's status cannot be changed further.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 22px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Keep Item</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 7, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Yes, Cancel Item</button>
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

// ── Convert StoredPO → detail page shape ──────────────────────────────────────
function storedPOToDetail(po: StoredPO) {
  const fmtINR = (n: number) =>
    "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateObj = new Date(po.createdOn);
  const dateDisp =
    dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return {
    poNumber: po.poNumber,
    status: po.status,
    createdOn: dateDisp,
    vendorName: po.vendorName,
    linkedMasterOrder: po.orderId,
    totalItems: 1,
    totalAmount: fmtINR(po.grandTotal),
    orderDate: dateDisp,
    vendor: {
      name: po.vendorName,
      contactPerson: po.vendorContact || "—",
      email: po.vendorEmail || "—",
      phone: po.vendorPhone || "—",
    },
    shipping: {
      address: [po.vendorAddressLine1, po.vendorCity, po.vendorState].filter(Boolean).join(", ") || "—",
      deliveryMethod: "Direct Delivery",
      requestedDelivery: po.requestedDelivery || "Within 30 days",
    },
    billing: {
      address: "No. 41/1, 2nd Floor, 10th Cross, Bangalore 560027",
      paymentTerms: po.paymentTerms,
      paymentMethod: "Bank Transfer",
    },
    assignment: {
      assignedTo: "System Owner",
      initials: "SO",
      role: "Procurement Manager",
      assignedOn: dateDisp,
      notes: "Auto-generated purchase order from the Nido procurement system.",
    },
    items:
      po.items && po.items.length > 0
        ? po.items.map((li, i) => ({
            id: `i${i + 1}`,
            num: i + 1,
            name: li.item,
            image: "📦",
            referenceNumber: li.referenceNumber || "",
            specs: li.specs || [],
            qty: li.qty,
            unitPrice: fmtINR(li.unitPrice),
            total: fmtINR(li.lineSubtotal),
            status: po.status === "Cancelled" ? "Cancelled" : "Processing",
            expectedDelivery: po.requestedDelivery || "Within 30 days",
            tracking: null,
          }))
        : [
            {
              id: "i1",
              num: 1,
              name: po.item,
              image: "📦",
              referenceNumber: po.referenceNumber || "",
              specs: po.specs || [],
              qty: po.qty,
              unitPrice: fmtINR(po.unitPrice),
              total: fmtINR(po.subtotal),
              status: po.status === "Cancelled" ? "Cancelled" : "Processing",
              expectedDelivery: po.requestedDelivery || "Within 30 days",
              tracking: null,
            },
          ],
    documents: po.documents || [],
    notes: po.notes || [],
    // keep subtotal rows for the footer
    _subtotal: po.subtotal,
    _sgstAmt: po.sgstAmt,
    _cgstAmt: po.cgstAmt,
    _grandTotal: po.grandTotal,
    _sgstPct: po.sgstPct,
    _cgstPct: po.cgstPct,
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const poKey = id || "PO-10034";

  // Load from shared PO store if available, else fall back to static mock data
  const realPO: StoredPO | undefined = getPOByNumber(poKey);
  const initialData = realPO
    ? storedPOToDetail(realPO)
    : (PO_DATA[poKey] || { ...PO_DATA.default, poNumber: poKey });

  const [orderStatus, setOrderStatus] = useState(initialData.status);
  const [items, setItems] = useState(initialData.items);
  const [documents, setDocuments] = useState(initialData.documents);
  const [notes, setNotes] = useState(initialData.notes);
  const [assignment, setAssignment] = useState(initialData.assignment);
  const [search, setSearch] = useState("");
  const [showCancelPO, setShowCancelPO] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteVisibility, setNoteVisibility] = useState("Internal Note");
  const [cancelled, setCancelled] = useState(false);
  const [updateTrackingItem, setUpdateTrackingItem] = useState<{ id: string; name: string; tracking: any } | null>(null);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [pendingItemCancel, setPendingItemCancel] = useState<{ id: string; name: string } | null>(null);

  // A cancelled PO is a terminal state: no further status changes, item
  // edits, vendor/reference updates, or tracking changes are allowed. Derive
  // from orderStatus (single source of truth) rather than only the local
  // `cancelled` flag, so a PO cancelled elsewhere (e.g. bulk status update
  // on the orders list) is also locked here.
  const isCancelled = orderStatus === "Cancelled" || cancelled;

  // Reset all state when navigating between different PO detail pages
  useEffect(() => {
    const po = getPOByNumber(poKey);
    const data = po
      ? storedPOToDetail(po)
      : (PO_DATA[poKey] || { ...PO_DATA.default, poNumber: poKey });
    setOrderStatus(data.status);
    setItems(data.items);
    setDocuments(data.documents);
    setNotes(data.notes);
    setAssignment(data.assignment);
    setCancelled(false);
  }, [poKey]);

  // Sync status changes back to the shared PO store (only for real POs)
  useEffect(() => {
    const currentRealPO = getPOByNumber(poKey);
    if (currentRealPO) updatePO(poKey, { status: orderStatus as any });
  }, [orderStatus, poKey]);

  const filteredItems = items.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    (it.referenceNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleItemStatusChange = (id: string, status: string) => {
    if (isCancelled) return; // PO is cancelled — no further status changes allowed
    if (status === "Cancelled") {
      const it = items.find(i => i.id === id);
      setPendingItemCancel({ id, name: it?.name || "this item" });
      return;
    }
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
  };
  const confirmItemCancel = () => {
    if (!pendingItemCancel) return;
    setItems(prev => prev.map(it => it.id === pendingItemCancel.id ? { ...it, status: "Cancelled" } : it));
  };
  const handleReferenceNumberChange = (id: string, referenceNumber: string) => {
    if (isCancelled) return;
    setItems(prev => {
      const updated = prev.map(it => it.id === id ? { ...it, referenceNumber } : it);
      const currentRealPO = getPOByNumber(poKey);
      if (currentRealPO) {
        const updatedItems = currentRealPO.items.map((li, i) =>
          updated[i]?.id === id || li.subOrderId === id ? { ...li, referenceNumber } : li
        );
        const changes: Partial<StoredPO> = { items: updatedItems };
        if (currentRealPO.subOrderId === id || (!currentRealPO.items.length && currentRealPO.item)) {
          changes.referenceNumber = referenceNumber;
        }
        updatePO(poKey, changes);
      }
      return updated;
    });
  };
  const handleDeleteItem = (id: string) => {
    if (isCancelled) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };
  const handleUpdateTracking = (id: string, tracking: any) => {
    if (isCancelled) return;
    setItems(prev => prev.map(it => it.id === id ? { ...it, tracking } : it));
  };
  const handleDeleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };
  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setNotes(prev => [{ id: "n" + Date.now(), author: "System Owner", initials: "SO", color: "#2563eb", date: dateStr, text: noteText.trim(), visibility: noteVisibility }, ...prev]);
    setNoteText("");
  };

  const card: any = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#ffffff", minHeight: "100vh", color: "#111827" }}>
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
              {isCancelled && <span style={{ padding: "4px 11px", borderRadius: 14, fontSize: 12.5, fontWeight: 500, background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }}>PO Cancelled</span>}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>Vendor Order</span>
              <span style={{ color: "#d1d5db" }}>•</span>
              <span>Created on <b style={{ color: "#374151" }}>{initialData.createdOn}</b></span>
              <span style={{ color: "#d1d5db" }}>•</span>
              <span>From <b style={{ color: "#374151" }}>{initialData.vendorName}</b></span>
            </div>
          </div>
          {!isCancelled && (
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
              {isCancelled ? (
                <span style={{ fontSize: 12.5, color: "#9ca3af", fontStyle: "italic" }}>This PO is cancelled and can no longer be updated.</span>
              ) : (
                <UpdateStatusDropdown current={orderStatus} onChange={setOrderStatus} />
              )}
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
                    <div style={{ marginTop: 4 }}>
                      <input
                        value={item.referenceNumber || ""}
                        onChange={e => handleReferenceNumberChange(item.id, e.target.value)}
                        disabled={isCancelled}
                        placeholder="Enter reference/model number"
                        style={{ width: "100%", maxWidth: 200, padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: isCancelled ? "#f9fafb" : "#fff" }}
                      />
                    </div>
                    <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit", marginTop: 4 }}>View more</button>
                  </div>
                </div>
              </div>
              <div>
                {item.specs.map(s => <div key={s} style={{ fontSize: 11.5, color: "#6b7280" }}>• {s}</div>)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.qty}</div>
              <div style={{ fontSize: 13 }}>{item.unitPrice}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.total}</div>
              <div>
                <StatusDropdown status={item.status} onChange={s => handleItemStatusChange(item.id, s)} disabled={isCancelled || item.status === "Cancelled"} />
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
                {!isCancelled && (
                  <div style={{ marginTop: 7 }}>
                    <button
                      onClick={() => setUpdateTrackingItem({ id: item.id, name: item.name, tracking: item.tracking })}
                      style={{ padding: "3px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#f9fafb", color: "#374151", cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}
                    >
                      Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Totals */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 280 }}>
              {realPO ? (
                <>
                  {[
                    ["Sub-total", "₹ " + realPO.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
                    [`SGST (${realPO.sgstPct}%)`, "₹ " + realPO.sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
                    [`CGST (${realPO.cgstPct}%)`, "₹ " + realPO.cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13.5, color: "#6b7280" }}>{l}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </>
              ) : (
                [["Sub-total", "$1,790.00"], ["Tax (10%)", "$222.00"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13.5, color: "#6b7280" }}>{l}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</span>
                  </div>
                ))
              )}
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
            <button onClick={() => setShowUploadDocument(true)} style={{ padding: "7px 16px", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>+ Upload Document</button>
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
                      onDownload={() => {
                        if ((doc as any).dataUrl) {
                          const a = document.createElement("a");
                          a.href = (doc as any).dataUrl;
                          a.download = doc.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } else if (realPO) {
                          downloadPOPdf(realPO);
                        } else {
                          alert(`Downloading: ${doc.name}`);
                        }
                      }}
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
          <div style={{ borderBottom: "1px solid #f3f4f6", padding: "14px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notes</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{notes.length} note{notes.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ padding: "20px 24px 28px" }}>
            {/* Note list */}
            {notes.map((note, i) => (
              <div key={note.id} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < notes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <Avatar initials={(note.initials || note.author?.charAt(0) || "U")} color={note.color || "#2563eb"} size={32} />
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

            {/* Inline Add Note composer */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginTop: notes.length > 0 ? 8 : 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 220px" }}>
                <div style={{ padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8, color: "#111827" }}>Add Note</div>
                  <textarea
                    value={noteText}
                    onChange={e => { if (e.target.value.length <= 500) setNoteText(e.target.value); }}
                    placeholder="Write your note here..."
                    rows={4}
                    style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13.5, fontFamily: "inherit", color: "#374151", boxSizing: "border-box", background: "transparent" }}
                  />
                  <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{noteText.length} / 500</div>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>Visibility</div>
                    {([["Internal Note", "🔒", "Only visible to internal users"], ["External Note", "🌐", "Visible to vendors and other external users"]] as [string, string, string][]).map(([label, icon, sub]) => (
                      <div key={label} onClick={() => setNoteVisibility(label)} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "pointer" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${noteVisibility === label ? "#2563eb" : "#d1d5db"}`, background: noteVisibility === label ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                          {noteVisibility === label && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>{icon} {label}</div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                      style={{ padding: "8px 22px", border: "none", borderRadius: 8, background: noteText.trim() ? "#2563eb" : "#93c5fd", color: "#fff", cursor: noteText.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showCancelPO && (
        <CancelPOModal
          poNumber={initialData.poNumber}
          onConfirm={() => {
            // Restore vendor stock for all line items on this PO
            const po = getPOByNumber(poKey);
            if (po) {
              const storeMap = getAllVendorProducts();
              const vendorProducts = storeMap[po.vendorId] || [];
              for (const li of (po.items || [])) {
                if (!li.productCode) continue;
                const match = vendorProducts.find(
                  p => p.masterProductCode === li.productCode && p.status === 'Active'
                );
                if (match) {
                  const current = parseInt(match.stock) || 0;
                  updateVendorProduct(po.vendorId, match.id, { stock: String(current + li.qty) });
                }
              }
            }
            setCancelled(true);
            setOrderStatus("Cancelled");
          }}
          onClose={() => setShowCancelPO(false)}
        />
      )}
      {pendingItemCancel && (
        <CancelItemStatusModal
          itemName={pendingItemCancel.name}
          onConfirm={confirmItemCancel}
          onClose={() => setPendingItemCancel(null)}
        />
      )}
      {showEditAssignment && (
        <EditAssignmentModal
          data={assignment}
          onSave={d => setAssignment(d)}
          onClose={() => setShowEditAssignment(false)}
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
      {showUploadDocument && (
        <UploadDocumentModal
          onSave={doc => setDocuments(prev => [...prev, doc])}
          onClose={() => setShowUploadDocument(false)}
        />
      )}
    </div>
  );
}
