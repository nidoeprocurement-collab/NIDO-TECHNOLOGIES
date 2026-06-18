"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table"

import { Download, Plus } from "lucide-react"

export default function PurchaseOrdersPage() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">

      {/* Top Container */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">
            All Purchase Orders
          </h1>

          <div className="flex items-center gap-2">

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-gray-50"
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
        <div className="border rounded-md overflow-hidden bg-white">

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>

                {/* Checkbox */}
                <TableHead className="w-[40px]">
                  <Checkbox />
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
                  Billed Status
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-right">
                  Amount
                </TableHead>

                <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">
                  Delivery Date
                </TableHead>

              </TableRow>
            </TableHeader>
          </Table>

        </div>

      </div>
    </div>
  )
}