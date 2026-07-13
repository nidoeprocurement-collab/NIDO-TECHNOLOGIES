import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, MoreHorizontal } from "lucide-react"

export default function VendorCreditsPage() {
  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Header */}
      <Card className="rounded-xl border border-gray-200 bg-white shadow-none">
        <div className="flex items-center justify-between px-2 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            All Vendor Credits
          </h1>

          <div className="flex items-center gap-2">
            <Button className="h-9 rounded-lg bg-blue-600 px-2 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-gray-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card className="mt-3 rounded-xl border border-gray-200 bg-white p-2 shadow-none">
        {/* Header Row */}
        <div className="grid h-12 grid-cols-[40px_1fr_1.8fr_2fr_2fr_1.5fr_1fr_1fr] items-center rounded-lg border border-gray-200 bg-gray-50 px-2">
          <div className="flex justify-center">
            <Checkbox />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            DATE
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            CREDIT NOTE#
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            REFERENCE NUMBER
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            VENDOR NAME
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            STATUS
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            AMOUNT
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            BALANCE
          </div>
        </div>

        {/* Empty Table Body */}
        <div className="min-h-[320px]" />
      </Card>
    </div>
  )
}