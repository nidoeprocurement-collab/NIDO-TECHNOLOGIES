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
    <div className="max-w-[1280px] mx-auto">

      {/* Top Container */}
      <div className="bg-card border border-border rounded-xl p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            All Purchase Orders
          </h1>

          <div className="flex items-center gap-2">

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