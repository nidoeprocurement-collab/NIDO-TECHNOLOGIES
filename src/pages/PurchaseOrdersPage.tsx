"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Plus, FileText, Search, RefreshCw } from "lucide-react"
import { getAllPOs, type StoredPO, type POStatus } from "@/lib/purchaseOrderStore"
import { getProcurementSLA } from "@/lib/slaEngine"
import { computeSLAStatus } from "@/lib/slaUtils"
import SLABadge from "@/components/shared/SLABadge"

// Download a PO PDF from the stored data-URI
function downloadPODoc(po: StoredPO) {
  const doc = po.documents?.find((d) => d.ext === "pdf" && d.dataUrl)
  if (!doc?.dataUrl) return
  const a = document.createElement("a")
  a.href = doc.dataUrl
  a.download = doc.name || `${po.poNumber}.pdf`
  a.click()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso // not a real date — show as-is (e.g. "Within 30 days")
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

// ── Status badge colours ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<POStatus, { bg: string; text: string; border: string }> = {
  Draft:       { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
  Processing:  { bg: "#faf5ff", text: "#6b21a8", border: "#d8b4fe" },
  Confirmed:   { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" },
  Shipped:     { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  Delivered:   { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  Closed:      { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  Cancelled:   { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
}

function StatusPill({ status }: { status: POStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["Draft"]
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  )
}

// Billed status is derived — no field exists yet, default to "Unbilled" for new POs
function getBilledStatus(po: StoredPO): string {
  if (po.status === "Closed" || po.status === "Delivered") return "Billed"
  if (po.status === "Cancelled") return "Void"
  return "Unbilled"
}

function BilledPill({ label }: { label: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Billed:   { bg: "#f0fdf4", text: "#166534" },
    Unbilled: { bg: "#f9fafb", text: "#6b7280" },
    Void:     { bg: "#fef2f2", text: "#991b1b" },
  }
  const s = map[label] ?? map["Unbilled"]
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.text,
        border: "1px solid transparent",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [pos, setPos] = useState<StoredPO[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  // Load POs on mount and whenever the localStorage store changes
  function loadPOs() {
    setPos(getAllPOs())
  }

  useEffect(() => {
    loadPOs()
    // Re-read when another tab or component saves a new PO
    const handler = () => loadPOs()
    window.addEventListener("storage", handler)
    window.addEventListener("poCreated", handler)
    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener("poCreated", handler)
    }
  }, [])

  // Filter by search
  const filtered = pos.filter((po) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      po.poNumber.toLowerCase().includes(q) ||
      po.orderId.toLowerCase().includes(q) ||
      po.vendorName.toLowerCase().includes(q) ||
      po.referenceNumber?.toLowerCase().includes(q)
    )
  })

  const allChecked = filtered.length > 0 && filtered.every((po) => selected.has(po.poNumber))

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((po) => po.poNumber)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-[1280px] mx-auto">

      {/* Top Container */}
      <div className="bg-card border border-border rounded-xl p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Purchase Orders</h1>
            {pos.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{pos.length} purchase order{pos.length !== 1 ? "s" : ""}</p>
            )}
          </div>

          <div className="flex items-center gap-2">

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO, order, vendor…"
                className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-blue-400 bg-background w-52"
              />
            </div>

            {/* Refresh */}
            <Button variant="outline" size="sm" onClick={loadPOs} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* New Button */}
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>

          </div>
        </div>

        {/* Table Container */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">

          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>

                {/* Checkbox */}
                <TableHead className="w-[40px]">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Date
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Purchase Order#
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Source Order#
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Reference#
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Vendor Name
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  SLA
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Billed Status
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-right">
                  Amount
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Delivery Date
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-center w-[60px]">
                  PDF
                </TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText size={40} className="text-muted-foreground/40" />
                      <p className="text-sm font-medium">
                        {search.trim() ? "No purchase orders match your search" : "No purchase orders yet"}
                      </p>
                      {!search.trim() && (
                        <p className="text-xs text-muted-foreground/70">
                          Purchase orders are created when you assign vendors to items in an order.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((po) => (
                  <TableRow
                    key={po.poNumber}
                    className={`hover:bg-muted/30 transition-colors ${selected.has(po.poNumber) ? "bg-blue-50/50" : ""}`}
                  >
                    {/* Checkbox */}
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selected.has(po.poNumber)}
                        onCheckedChange={() => toggleOne(po.poNumber)}
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {po.createdOnDisplay || formatDate(po.createdOn)}
                    </TableCell>

                    {/* Purchase Order# */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => navigate(`/orders/${po.orderId}`)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {po.poNumber}
                        </button>
                        <span className="text-xs text-muted-foreground">Purchase Order</span>
                      </div>
                    </TableCell>

                    {/* Source Order# */}
                    <TableCell>
                      <button
                        onClick={() => navigate(`/orders/${po.orderId}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {po.orderId || "—"}
                      </button>
                    </TableCell>

                    {/* Reference# */}
                    <TableCell className="text-sm text-muted-foreground">
                      {po.referenceNumber || po.subOrderId || "—"}
                    </TableCell>

                    {/* Vendor Name */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "#2563eb" }}
                        >
                          {(po.vendorName?.[0] ?? "V").toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">{po.vendorName}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusPill status={po.status} />
                    </TableCell>

                    {/* SLA */}
                    <TableCell>
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
                        };
                        const stageName = stageMap[po.status] ?? "Purchase Order Creation";
                        const stage = stages.find(s => s.stage === stageName);
                        const targetHrs = stage?.targetTimeHrs ?? 24;
                        const done = po.status === "Delivered";
                        const sla = computeSLAStatus(po.createdOn, targetHrs, done);
                        return <SLABadge sla={sla} compact />;
                      })()}
                    </TableCell>

                    {/* Billed Status */}
                    <TableCell>
                      <BilledPill label={getBilledStatus(po)} />
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-sm font-semibold text-foreground text-right whitespace-nowrap">
                      {formatINR(po.grandTotal)}
                    </TableCell>

                    {/* Delivery Date */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {po.requestedDelivery
                        ? formatDate(po.requestedDelivery)
                        : "—"}
                    </TableCell>

                    {/* PDF Download */}
                    <TableCell className="text-center">
                      {po.documents?.some((d) => d.ext === "pdf" && d.dataUrl) ? (
                        <button
                          onClick={() => downloadPODoc(po)}
                          title="Download PO PDF"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

        </div>

      </div>
    </div>
  )
}
