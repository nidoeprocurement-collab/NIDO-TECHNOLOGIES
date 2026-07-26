import { useState, useEffect, useRef, useMemo } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { useNavigate } from "react-router-dom";
import { POLink, OrderLink } from "@/components/shared/IdLinks";
import { getAllPOs, getPOByNumber, updatePO, type StoredPO } from "@/lib/purchaseOrderStore";
import { getProcurementSLA } from "@/lib/slaEngine";
import { computeSLAStatus } from "@/lib/slaUtils";
import SLABadge from "@/components/shared/SLABadge";

type OrderStatus = "Draft" | "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Closed" | "Cancelled";

interface Order {
  id: string;
  orderId: string;
  vendor: string;
  date: string;
  dateStr: string;
  status: OrderStatus;
  amount: number;
  amountStr: string;
  delivery: string;
  by: string;
}

const INITIAL_ORDERS: Order[] = [
  { id: "PO-10034", orderId: "ORD-8821", vendor: "TechHub Solutions", date: "2026-04-16", dateStr: "Apr 16, 2026", status: "Processing", amount: 2192.0, amountStr: "$2,192.00", delivery: "Apr 28, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10033", orderId: "ORD-8820", vendor: "Office Supplies Co.", date: "2026-04-15", dateStr: "Apr 15, 2026", status: "Confirmed", amount: 856.5, amountStr: "$856.50", delivery: "Apr 27, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10032", orderId: "ORD-8819", vendor: "Global Industrial", date: "2026-04-15", dateStr: "Apr 15, 2026", status: "Shipped", amount: 1450.0, amountStr: "$1,450.00", delivery: "Apr 25, 2026", by: "John Smith" },
  { id: "PO-10031", orderId: "ORD-8818", vendor: "Furniture Mart", date: "2026-04-14", dateStr: "Apr 14, 2026", status: "Delivered", amount: 3200.0, amountStr: "$3,200.00", delivery: "Apr 24, 2026", by: "Sarah Johnson" },
  { id: "PO-10030", orderId: "ORD-8817", vendor: "TechHub Solutions", date: "2026-04-14", dateStr: "Apr 14, 2026", status: "Draft", amount: 750.0, amountStr: "$750.00", delivery: "–", by: "Pavan (System Owner)" },
  { id: "PO-10029", orderId: "ORD-8816", vendor: "Printer World", date: "2026-04-13", dateStr: "Apr 13, 2026", status: "Confirmed", amount: 620.0, amountStr: "$620.00", delivery: "Apr 23, 2026", by: "Mike Wilson" },
  { id: "PO-10028", orderId: "ORD-8815", vendor: "Office Supplies Co.", date: "2026-04-13", dateStr: "Apr 13, 2026", status: "Processing", amount: 1125.75, amountStr: "$1,125.75", delivery: "Apr 22, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10027", orderId: "ORD-8814", vendor: "Global Industrial", date: "2026-04-12", dateStr: "Apr 12, 2026", status: "Delivered", amount: 2890.0, amountStr: "$2,890.00", delivery: "Apr 21, 2026", by: "John Smith" },
  { id: "PO-10026", orderId: "ORD-8813", vendor: "Furniture Mart", date: "2026-04-11", dateStr: "Apr 11, 2026", status: "Shipped", amount: 1980.0, amountStr: "$1,980.00", delivery: "Apr 20, 2026", by: "Sarah Johnson" },
  { id: "PO-10025", orderId: "ORD-8812", vendor: "TechHub Solutions", date: "2026-04-11", dateStr: "Apr 11, 2026", status: "Closed", amount: 4500.0, amountStr: "$4,500.00", delivery: "Apr 19, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10024", orderId: "ORD-8811", vendor: "Office Supplies Co.", date: "2026-04-10", dateStr: "Apr 10, 2026", status: "Delivered", amount: 1340.0, amountStr: "$1,340.00", delivery: "Apr 18, 2026", by: "Mike Wilson" },
  { id: "PO-10023", orderId: "ORD-8810", vendor: "Global Industrial", date: "2026-04-09", dateStr: "Apr 9, 2026", status: "Closed", amount: 5200.0, amountStr: "$5,200.00", delivery: "Apr 17, 2026", by: "John Smith" },
  { id: "PO-10022", orderId: "ORD-8809", vendor: "Printer World", date: "2026-04-09", dateStr: "Apr 9, 2026", status: "Delivered", amount: 430.0, amountStr: "$430.00", delivery: "Apr 15, 2026", by: "Sarah Johnson" },
  { id: "PO-10021", orderId: "ORD-8808", vendor: "TechHub Solutions", date: "2026-04-08", dateStr: "Apr 8, 2026", status: "Shipped", amount: 3100.0, amountStr: "$3,100.00", delivery: "Apr 16, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10020", orderId: "ORD-8807", vendor: "Furniture Mart", date: "2026-04-07", dateStr: "Apr 7, 2026", status: "Delivered", amount: 2670.0, amountStr: "$2,670.00", delivery: "Apr 14, 2026", by: "John Smith" },
  { id: "PO-10019", orderId: "ORD-8806", vendor: "Office Supplies Co.", date: "2026-04-07", dateStr: "Apr 7, 2026", status: "Closed", amount: 890.0, amountStr: "$890.00", delivery: "Apr 13, 2026", by: "Mike Wilson" },
  { id: "PO-10018", orderId: "ORD-8805", vendor: "Global Industrial", date: "2026-04-06", dateStr: "Apr 6, 2026", status: "Processing", amount: 4100.0, amountStr: "$4,100.00", delivery: "Apr 20, 2026", by: "Sarah Johnson" },
  { id: "PO-10017", orderId: "ORD-8804", vendor: "Printer World", date: "2026-04-05", dateStr: "Apr 5, 2026", status: "Delivered", amount: 710.0, amountStr: "$710.00", delivery: "Apr 11, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10016", orderId: "ORD-8803", vendor: "TechHub Solutions", date: "2026-04-04", dateStr: "Apr 4, 2026", status: "Shipped", amount: 2250.0, amountStr: "$2,250.00", delivery: "Apr 10, 2026", by: "John Smith" },
  { id: "PO-10015", orderId: "ORD-8802", vendor: "Furniture Mart", date: "2026-04-03", dateStr: "Apr 3, 2026", status: "Closed", amount: 3750.0, amountStr: "$3,750.00", delivery: "Apr 8, 2026", by: "Sarah Johnson" },
  { id: "PO-10014", orderId: "ORD-8801", vendor: "Office Supplies Co.", date: "2026-04-02", dateStr: "Apr 2, 2026", status: "Processing", amount: 960.0, amountStr: "$960.00", delivery: "Apr 12, 2026", by: "Mike Wilson" },
  { id: "PO-10013", orderId: "ORD-8800", vendor: "Global Industrial", date: "2026-04-01", dateStr: "Apr 1, 2026", status: "Delivered", amount: 3300.0, amountStr: "$3,300.00", delivery: "Apr 6, 2026", by: "Pavan (System Owner)" },
  { id: "PO-10012", orderId: "ORD-8799", vendor: "Printer World", date: "2026-03-31", dateStr: "Mar 31, 2026", status: "Processing", amount: 580.0, amountStr: "$580.00", delivery: "Apr 9, 2026", by: "John Smith" },
  { id: "PO-10011", orderId: "ORD-8798", vendor: "TechHub Solutions", date: "2026-03-30", dateStr: "Mar 30, 2026", status: "Draft", amount: 1200.0, amountStr: "$1,200.00", delivery: "–", by: "Sarah Johnson" },
  { id: "PO-10010", orderId: "ORD-8797", vendor: "Furniture Mart", date: "2026-03-29", dateStr: "Mar 29, 2026", status: "Delivered", amount: 4800.0, amountStr: "$4,800.00", delivery: "Apr 2, 2026", by: "Mike Wilson" },
  { id: "PO-10009", orderId: "ORD-8796", vendor: "Office Supplies Co.", date: "2026-03-28", dateStr: "Mar 28, 2026", status: "Processing", amount: 720.0, amountStr: "$720.00", delivery: "Apr 5, 2026", by: "Pavan (System Owner)" },
];

const TABS: (OrderStatus | "All")[] = ["All", "Draft", "Processing", "Shipped", "Delivered", "Closed", "Cancelled"];
const VENDORS = ["All Vendors", "TechHub Solutions", "Office Supplies Co.", "Global Industrial", "Furniture Mart", "Printer World"];
const PER_PAGE = 10;

const badgeStyles: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  Processing: { bg: "#eff6ff", color: "#185fa5", border: "#b5d4f4" },
  Confirmed:  { bg: "#eaf3de", color: "#3b6d11", border: "#c0dd97" },
  Shipped:    { bg: "#f3f4f6", color: "#555",    border: "#d1d5db" },
  Delivered:  { bg: "#e1f5ee", color: "#0f6e56", border: "#9fe1cb" },
  Draft:      { bg: "#fafafa", color: "#777",    border: "#ddd" },
  Closed:     { bg: "#fbeaf0", color: "#993556", border: "#f4c0d1" },
  Cancelled:  { bg: "#fff1f0", color: "#a32d2d", border: "#f7c1c1" },
};

function Badge({ status }: { status: OrderStatus }) {
  const s = badgeStyles[status];
  return (
    <span style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

// ─── Order Detail Page ───────────────────────────────────────────────────────
interface OrderDetailProps {
  order: Order;
  onBack: () => void;
}

const LINE_ITEMS = [
  { name: "Office Chair", sku: "SKU-0041", qty: 2, unit: "$320.00", total: "$640.00" },
  { name: "Standing Desk", sku: "SKU-0089", qty: 1, unit: "$750.00", total: "$750.00" },
  { name: "Monitor Stand", sku: "SKU-0103", qty: 3, unit: "$60.00",  total: "$180.00" },
];

function OrderDetail({ order, onBack }: OrderDetailProps) {
  const { config } = useConfig();
  const skuPrefix = config.prefixes.find(p => p.key === "sku")?.value || "SKU-";
  const displayedLineItems = useMemo(
    () => LINE_ITEMS.map(li => ({ ...li, sku: li.sku.replace(/^SKU-/, skuPrefix) })),
    [skuPrefix]
  );
  const infoRows: [string, React.ReactNode][] = [
    ["Order ID",   <OrderLink id={order.orderId} style={{ fontFamily: "monospace", fontWeight: 500 }} />],
    ["PO Number",  <POLink id={order.id} style={{ fontWeight: 500 }} />],
    ["Vendor",     order.vendor],
    ["PO Date",    order.dateStr],
    ["Delivery",   order.delivery],
  ];
  const finRows: [string, React.ReactNode][] = [
    ["Total Amount", <strong>{order.amountStr}</strong>],
    ["Created By",   order.by],
    ["Status",       <Badge status={order.status} />],
  ];
  const timeline = [
    { label: "Order created", who: order.by, when: order.dateStr, icon: "➕", color: "#4a6cf7" },
    { label: `Status set to ${order.status}`, who: "System", when: order.dateStr, icon: "🔄", color: "#3b6d11" },
    { label: "Delivery scheduled", who: "System", when: order.delivery, icon: "🚚", color: "#888" },
  ];

  const _bg   = "hsl(var(--background))";
  const _card = "hsl(var(--card))";
  const _fg   = "hsl(var(--foreground))";
  const _muted= "hsl(var(--muted-foreground))";
  const _bdr  = "hsl(var(--border))";
  const _mutedBg = "hsl(var(--muted))";

  const cell: React.CSSProperties = { padding: "9px 12px", fontSize: 13, borderBottom: `1px solid ${_bdr}`, color: _fg };
  const th: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: _muted, textTransform: "uppercase", letterSpacing: ".05em", padding: "8px 12px", borderBottom: `1px solid ${_bdr}`, textAlign: "left", background: _mutedBg };

  return (
    <div style={{ position: "fixed", inset: 0, background: _bg, zIndex: 500, overflowY: "auto" }}>
      <div style={{ padding: "28px 36px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: `1px solid ${_bdr}`, borderRadius: 8, background: _card, fontSize: 13, cursor: "pointer", color: _fg }}>
            ← Back to Orders
          </button>
          <span style={{ color: _muted }}>/</span>
          <POLink id={order.id} style={{ fontSize: 13 }} />
          <span style={{ color: _muted }}>/</span>
          <OrderLink id={order.orderId} style={{ fontSize: 13 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: _fg, marginBottom: 6 }}>
              Order Detail — <OrderLink id={order.orderId} style={{ fontSize: 22 }} />
            </h1>
            <p style={{ fontSize: 13, color: _muted }}>Purchase Order: <POLink id={order.id} style={{ fontWeight: 700 }} /></p>
          </div>
          <Badge status={order.status} />
        </div>

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[{ title: "Order Information", rows: infoRows }, { title: "Financial Summary", rows: finRows }].map(({ title, rows }) => (
            <div key={title} style={{ background: _card, border: `1px solid ${_bdr}`, borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: _muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>{title}</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {rows.map(([label, val]) => (
                    <tr key={label}>
                      <td style={{ ...cell, color: _muted, width: "45%" }}>{label}</td>
                      <td style={cell}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div style={{ background: _card, border: `1px solid ${_bdr}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: _muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>Line Items</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Item", "SKU", "Qty", "Unit Price", "Total"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {displayedLineItems.map(item => (
                <tr key={item.sku}>
                  <td style={cell}>{item.name}</td>
                  <td style={{ ...cell, fontFamily: "monospace", fontSize: 12, color: _muted }}>{item.sku}</td>
                  <td style={cell}>{item.qty}</td>
                  <td style={cell}>{item.unit}</td>
                  <td style={{ ...cell, fontWeight: 500 }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timeline */}
        <div style={{ background: _card, border: `1px solid ${_bdr}`, borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: _muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>Activity Timeline</p>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: _mutedBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>{t.icon}</div>
              <div>
                <p style={{ fontSize: 13, color: _fg, fontWeight: 500 }}>{t.label}</p>
                <p style={{ fontSize: 12, color: _muted }}>{t.who} · {t.when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (m: string) => {
    setMsg(m); setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2800);
  };
  return { msg, visible, show };
}

// ── Map a StoredPO → the Order shape used by this list ───────────────────────
function storedPOToOrder(po: StoredPO): Order {
  const createdDate = new Date(po.createdOn);
  const fmtINR = (n: number) =>
    "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    id:        po.poNumber,
    orderId:   po.orderId,
    vendor:    po.vendorName,
    date:      createdDate.toISOString().split("T")[0],
    dateStr:   createdDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    status:    po.status as OrderStatus,
    amount:    po.grandTotal,
    amountStr: fmtINR(po.grandTotal),
    delivery:  po.requestedDelivery || "Within 30 days",
    by:        "System Owner",
  };
}

// ─── Bulk Notes Modal ─────────────────────────────────────────────────────────
function BulkNotesModal({ selectedCount, onApply, onClose }: {
  selectedCount: number;
  onApply: (note: string, visibility: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("Internal Note");
  const visibilityOptions = [
    { label: "Internal Note", icon: "🔒", sub: "Only visible to internal users" },
    { label: "External Note", icon: "🌐", sub: "Visible to the client on the portal" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "hsl(var(--card))", borderRadius: 14, padding: "28px 32px",
        width: 560, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", fontFamily: "inherit",
        border: "1px solid hsl(var(--border))",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))" }}>Bulk Update Notes</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "hsl(var(--muted-foreground))" }}>
          Add a note to <strong style={{ color: "hsl(var(--foreground))" }}>{selectedCount} selected order{selectedCount !== 1 ? "s" : ""}</strong>.
        </p>

        {/* Note composer */}
        <div style={{ border: "1px solid hsl(var(--border))", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 210px" }}>
            {/* Left: textarea */}
            <div style={{ padding: "14px 16px", borderRight: "1px solid hsl(var(--border))" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8, color: "hsl(var(--foreground))" }}>Add Note</div>
              <textarea
                value={note}
                onChange={e => { if (e.target.value.length <= 500) setNote(e.target.value); }}
                placeholder="Write your note here..."
                rows={4}
                style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13.5, fontFamily: "inherit", color: "hsl(var(--foreground))", boxSizing: "border-box", background: "transparent", lineHeight: 1.5 }}
              />
              <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>{note.length} / 500</div>
            </div>

            {/* Right: visibility */}
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--foreground))", marginBottom: 12 }}>Visibility</div>
              {visibilityOptions.map(({ label, icon, sub }) => (
                <div key={label} onClick={() => setVisibility(label)} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "pointer" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${visibility === label ? "#2563eb" : "hsl(var(--border))"}`, background: visibility === label ? "#2563eb" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                    {visibility === label && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: 5 }}>{icon} {label}</div>
                    <div style={{ fontSize: 11.5, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px 0", border: "1px solid hsl(var(--border))", borderRadius: 8,
            background: "hsl(var(--card))", color: "hsl(var(--foreground))", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
          }}>Cancel</button>
          <button
            onClick={() => { if (note.trim()) { onApply(note.trim(), visibility); onClose(); } }}
            disabled={!note.trim()}
            style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
              background: note.trim() ? "#2563eb" : "#93c5fd", color: "#fff",
              cursor: note.trim() ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: 14, fontFamily: "inherit",
            }}>Save Note</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function VendorOrderList() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const poPrefix = config.prefixes.find(p => p.key === "purchaseOrder")?.value || "PO-";

  // Build orders list: real POs from store (prepended) + static demo orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const realPOs = getAllPOs().map(storedPOToOrder);
    // De-duplicate: real POs take precedence over static entries with the same ID
    const realIds = new Set(realPOs.map(o => o.id));
    const staticOrders = INITIAL_ORDERS.filter(o => !realIds.has(o.id));
    return [...realPOs, ...staticOrders];
  });

  // Re-read store when page mounts (e.g. after navigation back from a PO detail)
  useEffect(() => {
    const realPOs = getAllPOs().map(storedPOToOrder);
    const realIds = new Set(realPOs.map(o => o.id));
    const staticOrders = INITIAL_ORDERS.filter(o => !realIds.has(o.id));
    setOrders([...realPOs, ...staticOrders]);
  }, []);
  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<keyof Order | "">("");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("");
  const [bulkNote, setBulkNote] = useState("");
  const [confirmBulkCancel, setConfirmBulkCancel] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState("");
  const toast = useToast();

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Remap static "PO-" IDs to the configured prefix reactively
  const displayedOrders = useMemo(
    () => orders.map(o => ({ ...o, id: o.id.replace(/^PO-/, poPrefix) })),
    [orders, poPrefix]
  );

  const getFiltered = (): Order[] => {
    let rows = [...displayedOrders];
    if (activeTab !== "All") rows = rows.filter(r => r.status === activeTab);
    if (statusFilter !== "All") rows = rows.filter(r => r.status === statusFilter);
    if (vendorFilter !== "All Vendors") rows = rows.filter(r => r.vendor === vendorFilter);
    if (search) rows = rows.filter(r =>
      r.id.toLowerCase().includes(search) ||
      r.vendor.toLowerCase().includes(search) ||
      r.orderId.toLowerCase().includes(search)
    );
    if (sortCol) {
      rows.sort((a, b) => {
        const va = a[sortCol as keyof Order];
        const vb = b[sortCol as keyof Order];
        return (typeof va === "number" ? (va as number) - (vb as number) : String(va).localeCompare(String(vb))) * sortDir;
      });
    }
    return rows;
  };

  const filtered = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const tabCount = (t: OrderStatus | "All") => t === "All" ? orders.length : orders.filter(r => r.status === t).length;

  const handleSort = (col: keyof Order) => {
    if (sortCol === col) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortCol(col); setSortDir(1); }
  };

  const toggleRow = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const toggleAll = () => {
    const allSel = filtered.every(r => selected.has(r.id));
    setSelected(allSel ? new Set() : new Set(filtered.map(r => r.id)));
  };

  const applyBulkStatus = () => {
    if (!bulkStatus) { toast.show("Please select a status"); return; }
    if (selected.size === 0) { toast.show("Select at least one order first"); return; }
    if (bulkStatus === "Cancelled") {
      // Cancelling is a terminal action — confirm before applying.
      setStatusModal(false);
      setConfirmBulkCancel(true);
      return;
    }
    performBulkStatusUpdate(bulkStatus as OrderStatus);
  };

  const performBulkStatusUpdate = (status: OrderStatus, cancelReason?: string) => {
    // Orders already Cancelled are a terminal state and are skipped — they
    // can no longer be edited or processed further.
    const eligible = [...selected].filter(id => orders.find(o => o.id === id)?.status !== "Cancelled");
    setOrders(prev => prev.map(r => {
      if (!eligible.includes(r.id)) return r;
      const extra = status === "Cancelled" && cancelReason ? { cancelReason } : {};
      return { ...r, status, ...extra };
    }));
    // Persist cancellations to the store so purchaseOrderStore dispatches the
    // poCancelled event and OrderDetailsPage resets its vendor-selection state.
    if (status === "Cancelled") {
      for (const id of eligible) {
        const changes: any = { status: "Cancelled" };
        if (cancelReason) changes.cancelReason = cancelReason;
        updatePO(id, changes);
      }
    }
    const skipped = selected.size - eligible.length;
    toast.show(
      skipped > 0
        ? `Status updated to "${status}" for ${eligible.length} order(s). ${skipped} already-cancelled order(s) were skipped.`
        : `Status updated to "${status}" for ${eligible.length} order(s)`
    );
    setStatusModal(false); setBulkStatus(""); setConfirmBulkCancel(false); setBulkCancelReason("");
  };

  const applyBulkNotes = (note: string, visibility: string) => {
    if (selected.size === 0) { toast.show("Select at least one order first"); return; }
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const newNote = {
      id: "n" + Date.now(),
      author: "System Owner",
      initials: "SO",
      color: "#2563eb",
      date: dateStr,
      text: note,
      visibility,
    };
    let persisted = 0;
    [...selected].forEach(poNumber => {
      const po = getPOByNumber(poNumber);
      if (po) {
        updatePO(poNumber, { notes: [newNote, ...(po.notes || [])] });
        persisted++;
      }
    });
    toast.show(persisted > 0
      ? `Note added to ${persisted} order(s)`
      : `Note saved (orders will show it when reopened)`
    );
    setNotesModal(false); setBulkNote("");
  };

  const doExport = () => {
    const csv = ["PO Number,Order ID,Vendor,PO Date,Status,Total Amount,Requested Delivery,Created By",
      ...filtered.map(r => `${r.id},${r.orderId},${r.vendor},${r.dateStr},${r.status},${r.amountStr},${r.delivery},${r.by}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "orders.csv"; a.click();
    toast.show("Orders exported as CSV");
    setOpenDropdown(null);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg   = "hsl(var(--background))";
  const card = "hsl(var(--card))";
  const fg   = "hsl(var(--foreground))";
  const muted= "hsl(var(--muted-foreground))";
  const bdr  = "hsl(var(--border))";
  const mutedBg = "hsl(var(--muted))";

  const s = {
    page:      { padding: "28px 36px", background: bg, minHeight: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize: 14, color: fg } as React.CSSProperties,
    card:      { background: card, border: `1px solid ${bdr}`, borderRadius: 12, overflow: "hidden" } as React.CSSProperties,
    th:        { fontSize: 11, fontWeight: 600, color: muted, textTransform: "uppercase" as const, letterSpacing: ".05em", padding: "11px 14px", borderBottom: `1px solid ${bdr}`, textAlign: "left" as const, background: mutedBg, whiteSpace: "nowrap" as const },
    td:        { padding: "13px 14px", borderBottom: `1px solid ${bdr}`, fontSize: 13, verticalAlign: "middle" as const, color: fg },
    link:      { color: "#4a6cf7", textDecoration: "none", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties,
    orderLink: { color: "#4a6cf7", textDecoration: "none", fontWeight: 500, cursor: "pointer", fontFamily: "monospace", fontSize: 13, background: "none", border: "none", padding: 0 } as React.CSSProperties,
    btn:       { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", border: `1px solid ${bdr}`, borderRadius: 8, fontSize: 13, background: card, color: fg, cursor: "pointer", whiteSpace: "nowrap" as const },
    ddItem:    { display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", fontSize: 13, color: fg, cursor: "pointer", textDecoration: "none", background: "none", border: "none", width: "100%", textAlign: "left" as const },
    pgBtn:     (active: boolean): React.CSSProperties => ({ minWidth: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${bdr}`, fontSize: 13, cursor: "pointer", background: active ? "#4a6cf7" : card, color: active ? "#fff" : fg }),
    cb:        (checked: boolean, indeterminate?: boolean): React.CSSProperties => ({ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked || indeterminate ? "#4a6cf7" : bdr}`, background: checked || indeterminate ? "#4a6cf7" : card, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }),
  };

  const Dropdown = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ display: openDropdown === id ? "block" : "none", position: "absolute", right: 0, top: "calc(100% + 6px)", background: card, border: `1px solid ${bdr}`, borderRadius: 10, minWidth: 180, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,.15)", overflow: "hidden" }}>
      {children}
    </div>
  );

  const SortIcon = ({ col }: { col: keyof Order }) => (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1, marginLeft: 3 }}>
      <span style={{ display: "block", width: 0, height: 0, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderBottom: `3px solid ${sortCol === col && sortDir === 1 ? "#4a6cf7" : "#ccc"}` }} />
      <span style={{ display: "block", width: 0, height: 0, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: `3px solid ${sortCol === col && sortDir === -1 ? "#4a6cf7" : "#ccc"}` }} />
    </span>
  );

  const Checkbox = ({ checked, indeterminate, onClick }: { checked: boolean; indeterminate?: boolean; onClick: () => void }) => (
    <div style={s.cb(checked, indeterminate)} onClick={onClick}>
      {(checked || indeterminate) && (
        indeterminate
          ? <span style={{ display: "block", width: 8, height: 2, background: "#fff", borderRadius: 1 }} />
          : <span style={{ display: "block", width: 9, height: 5, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />
      )}
    </div>
  );

  const Modal = ({ open, title, onClose, onApply, children }: { open: boolean; title: string; onClose: () => void; onApply: () => void; children: React.ReactNode }) => {
    if (!open) return null;
    const _c = "hsl(var(--card))"; const _b = "hsl(var(--border))"; const _f = "hsl(var(--foreground))";
    return (
      <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: _c, borderRadius: 14, padding: 24, width: 340, boxShadow: "0 16px 48px rgba(0,0,0,.2)", border: `1px solid ${_b}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: _f }}>{title}</h3>
          {children}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${_b}`, background: _c, color: _f }}>Cancel</button>
            <button onClick={onApply} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #4a6cf7", background: "#4a6cf7", color: "#fff" }}>Apply</button>
          </div>
        </div>
      </div>
    );
  };

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  if (detailOrder) return <OrderDetail order={detailOrder} onBack={() => setDetailOrder(null)} />;

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast.visible && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a1a2e", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      <Modal open={statusModal} title="Bulk update status" onClose={() => setStatusModal(false)} onApply={applyBulkStatus}>
        <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as OrderStatus)} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${bdr}`, borderRadius: 8, fontSize: 13, marginBottom: 16, outline: "none", background: card, color: fg }}>
          <option value="">Select a status...</option>
          {(["Draft","Processing","Confirmed","Shipped","Delivered","Closed","Cancelled"] as OrderStatus[]).map(st => <option key={st}>{st}</option>)}
        </select>
      </Modal>
      {notesModal && (
        <BulkNotesModal
          selectedCount={selected.size}
          onApply={(note, visibility) => applyBulkNotes(note, visibility)}
          onClose={() => { setNotesModal(false); setBulkNote(""); }}
        />
      )}

      {confirmBulkCancel && (
        <div onClick={e => { if (e.target === e.currentTarget) { setConfirmBulkCancel(false); setBulkCancelReason(""); } }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: card, borderRadius: 14, padding: 24, width: 420, boxShadow: "0 16px 48px rgba(0,0,0,.2)", border: `1px solid ${bdr}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#dc2626" }}>Cancel {selected.size} order{selected.size !== 1 ? "s" : ""}?</h3>
            <p style={{ fontSize: 13, color: fg, marginBottom: 12, lineHeight: 1.5 }}>
              This action cannot be undone. Once cancelled, these orders can no longer be edited, have their status changed, or be processed further.
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: fg, marginBottom: 5 }}>
              Reason for Cancellation <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              value={bulkCancelReason}
              onChange={e => setBulkCancelReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for cancellation..."
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${bulkCancelReason.trim() ? bdr : "#fca5a5"}`, borderRadius: 7, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none", marginBottom: 4, background: card, color: fg }}
            />
            {!bulkCancelReason.trim() && <div style={{ fontSize: 11.5, color: "#dc2626", marginBottom: 14 }}>Reason is required before confirming cancellation.</div>}
            {bulkCancelReason.trim() && <div style={{ marginBottom: 14 }} />}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setConfirmBulkCancel(false); setBulkCancelReason(""); }} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${bdr}`, background: card, color: fg }}>Keep Orders</button>
              <button onClick={() => { if (!bulkCancelReason.trim()) return; performBulkStatusUpdate("Cancelled", bulkCancelReason.trim()); }} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: bulkCancelReason.trim() ? "pointer" : "not-allowed", border: "1px solid #dc2626", background: bulkCancelReason.trim() ? "#dc2626" : "#fca5a5", color: "#fff", transition: "background 0.15s" }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: 24, fontWeight: 600, color: fg, marginBottom: 4 }}>Orders</h1>
      <p style={{ fontSize: 13, color: muted, marginBottom: 24 }}>Manage and track all purchase orders across your organization</p>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: "0 0 300px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 15 }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setCurrentPage(1); }}
            placeholder="Search by PO number, vendor, or items..."
            style={{ width: "100%", padding: "8px 10px 8px 34px", border: `1px solid ${bdr}`, borderRadius: 8, fontSize: 13, background: card, color: fg, outline: "none" }} />
        </div>

        {/* Status filter */}
        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button style={s.btn} onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}>
            Status ▾
          </button>
          <Dropdown id="status">
            {(["All", ...Object.keys(badgeStyles)] as (OrderStatus | "All")[]).map(st => (
              <button key={st} style={s.ddItem} onClick={() => { setStatusFilter(st); setCurrentPage(1); setOpenDropdown(null); }}>{st === "All" ? "All Statuses" : st}</button>
            ))}
          </Dropdown>
        </div>

        {/* Vendor filter */}
        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button style={s.btn} onClick={() => setOpenDropdown(openDropdown === "vendor" ? null : "vendor")}>
            Vendor ▾
          </button>
          <Dropdown id="vendor">
            {VENDORS.map(v => (
              <button key={v} style={s.ddItem} onClick={() => { setVendorFilter(v); setCurrentPage(1); setOpenDropdown(null); }}>{v}</button>
            ))}
          </Dropdown>
        </div>

        <button style={s.btn}>Date Range ▾</button>

        {/* More menu */}
        <div style={{ marginLeft: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button style={{ ...s.btn, padding: "8px 11px" }} onClick={() => setOpenDropdown(openDropdown === "more" ? null : "more")}>⋯</button>
          <Dropdown id="more">
            <button style={s.ddItem} onClick={doExport}>📥 Export</button>
            <hr style={{ border: "none", borderTop: `1px solid ${bdr}`, margin: "4px 0" }} />
            <button style={s.ddItem} onClick={() => { setStatusModal(true); setOpenDropdown(null); }}>🔄 Bulk Update Status</button>
            <button style={s.ddItem} onClick={() => { setNotesModal(true); setOpenDropdown(null); }}>📝 Bulk Update Notes</button>
          </Dropdown>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1.5px solid ${bdr}`, gap: 0, overflowX: "auto" }}>
        {TABS.map(t => (
          <div key={t} onClick={() => { setActiveTab(t); setCurrentPage(1); }}
            style={{ padding: "10px 18px", fontSize: 13, color: activeTab === t ? "#4a6cf7" : muted, cursor: "pointer", borderBottom: activeTab === t ? "2.5px solid #4a6cf7" : "2.5px solid transparent", marginBottom: -1.5, whiteSpace: "nowrap", fontWeight: activeTab === t ? 500 : 400 }}>
            {t === "All" ? "All Orders" : t} ({tabCount(t)})
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={s.card}>
        {/* Selection bar */}
        {selected.size > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, color: fg, borderBottom: `1px solid ${bdr}`, background: mutedBg }}>
            <Checkbox checked={allSelected} indeterminate={someSelected} onClick={toggleAll} />
            <span>{selected.size} of {filtered.length} selected &nbsp;|&nbsp;
              <button onClick={() => setSelected(new Set())} style={{ color: "#4a6cf7", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }}>Clear</button>
            </span>
          </div>
        ) : (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${bdr}`, background: mutedBg, display: "flex", alignItems: "center" }}>
            <Checkbox checked={false} onClick={toggleAll} />
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 48, paddingLeft: 16 }}></th>
                {([["id","PO Number"],["vendor","Vendor"],["date","PO Date"],["orderId","Order ID"],["status","Status"],["amount","Total Amount"],["delivery","Requested Delivery"],["by","Created By"]] as [keyof Order, string][]).map(([col, label]) => (
                  <th key={col} style={s.th}>
                    <span onClick={() => handleSort(col)} style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                      {label} <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                <th style={s.th}>SLA</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} style={{ ...s.td, textAlign: "center", color: muted, padding: 32 }}>No orders found</td></tr>
              ) : pageRows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/vendor-orders/${row.id}`)}
                  style={{ background: selected.has(row.id) ? "hsl(var(--primary)/0.08)" : "transparent", cursor: "pointer" }}
                  onMouseEnter={e => { if (!(e.target as HTMLElement).closest('button')) (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected.has(row.id) ? "hsl(var(--primary)/0.08)" : "transparent"; }}
                >
                  <td style={{ ...s.td, paddingLeft: 16 }} onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(row.id)} onClick={() => toggleRow(row.id)} /></td>
                  <td style={s.td}><POLink id={row.id} /></td>
                  <td style={s.td}>{row.vendor}</td>
                  <td style={s.td}>{row.dateStr}</td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    <OrderLink id={row.orderId} />
                  </td>
                  <td style={s.td}><Badge status={row.status} /></td>
                  <td style={s.td}>{row.amountStr}</td>
                  <td style={s.td}>{row.delivery}</td>
                  <td style={s.td}>{row.by}</td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    {(() => {
                      const stages = getProcurementSLA();
                      const stageMap: Record<string, string> = {
                        "Draft":               "Purchase Order Creation",
                        "Pending":             "Purchase Order Approval",
                        "Processing":          "Vendor Confirmation",
                        "Confirmed":           "Vendor Confirmation",
                        "Partially Shipped":   "Goods Dispatch",
                        "Shipped":             "Goods Dispatch",
                        "Partially Delivered": "Goods Receipt",
                        "Delivered":           "Payment Processing",
                        "Closed":              "Payment Processing",
                      };
                      const stageName = stageMap[row.status] ?? "Purchase Order Creation";
                      const stage = stages.find(s => s.stage === stageName);
                      const targetHrs = stage?.targetTimeHrs ?? 24;
                      const done = row.status === "Delivered" || row.status === "Closed";
                      const sla = computeSLAStatus(row.date, targetHrs, done);
                      return <SLABadge sla={sla} compact />;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", fontSize: 13, color: "#888", borderTop: "1px solid #f0f0f5" }}>
          <span>{filtered.length === 0 ? "No orders found" : `Showing ${(page - 1) * PER_PAGE + 1} to ${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} orders`}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={s.pgBtn(false)} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</div>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <div key={p} style={s.pgBtn(p === page)} onClick={() => setCurrentPage(p)}>{p}</div>
            ))}
            <div style={s.pgBtn(false)} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>›</div>
          </div>
        </div>
      </div>
    </div>
  );
}