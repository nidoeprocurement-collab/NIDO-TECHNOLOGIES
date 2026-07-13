import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, MoreHorizontal } from "lucide-react"

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-white p-3">
      {/* Header Card */}
      <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-none">
        <div className="flex items-center justify-between px-2 py-4">
          <h1 className="text-[20px] font-bold text-[#111827]">
            All Payments
          </h1>

          <div className="flex items-center gap-2">
            <Button className="h-9 rounded-lg bg-[#2563eb] px-2 text-white hover:bg-[#1d4ed8]">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-[#e5e7eb] bg-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="mt-3 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-none">
        {/* Header Row */}
        <div className="grid h-[42px] grid-cols-[40px_1fr_1.3fr_1.4fr_1.6fr_1fr_1fr_1fr_1.2fr_1.4fr] items-center rounded-lg border border-[#dfe3e8] bg-white px-2">
          <div className="flex justify-center">
            <Checkbox />
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            DATE
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            PAYMENT #
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            REFERENCE#
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            VENDOR NAME
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            BILL#
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            MODE
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            STATUS
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            AMOUNT
          </div>

          <div className="text-[10px] font-semibold tracking-[2px] text-slate-500">
            UNUSED AMOUNT
          </div>
        </div>

        {/* Empty Body */}
        <div className="min-h-[450px]" />
      </Card>
    </div>
  )
}