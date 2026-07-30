import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { safeReadJson } from "@/lib/utils"

const BILLS_STORAGE_KEY = "nido_purchase_bills_v1"

interface Bill {
  id: string
  billNumber: string
  referenceNumber?: string
  vendorName?: string
  status?: string
  billDate?: string
  dueDate?: string
  items?: { quantity: number; rate: number; discount?: number; taxPercent?: number }[]
  paymentMade?: number
  adjustment?: number
}

function calcTotal(bill: Bill): number {
  const subtotal = (bill.items ?? []).reduce((s, i) => {
    const line = i.quantity * i.rate
    const disc = line * ((i.discount ?? 0) / 100)
    const taxable = line - disc
    const tax = taxable * ((i.taxPercent ?? 0) / 100)
    return s + taxable + tax
  }, 0)
  return subtotal + (bill.adjustment ?? 0)
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
  VOID: "bg-gray-100 text-gray-500 border-gray-200",
}

function fmtDate(iso?: string) {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return iso }
}

export default function BillsPage() {
  const navigate = useNavigate()
  const [bills, setBills] = useState<Bill[]>([])

  useEffect(() => {
    const load = () => setBills(safeReadJson<Bill[]>(BILLS_STORAGE_KEY, []))
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">All Bills</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-gray-50">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Bill #</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Reference</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Vendor Name</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Due Date</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    No bills yet. Convert a purchase order to create one.
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => {
                  const total = calcTotal(bill)
                  const status = bill.status ?? "OPEN"
                  return (
                    <TableRow
                      key={bill.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/transactions/purchase/bills/${bill.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                      <TableCell className="text-sm text-gray-600">{fmtDate(bill.billDate)}</TableCell>
                      <TableCell className="text-blue-600 font-medium text-sm">{bill.billNumber}</TableCell>
                      <TableCell className="text-sm text-gray-600">{bill.referenceNumber || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-800 font-medium">{bill.vendorName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.OPEN}`}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{fmtDate(bill.dueDate)}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-gray-900">
                        ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
