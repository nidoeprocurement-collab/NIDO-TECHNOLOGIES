"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table"

export default function PurchaseOrdersPage() {
  return (
    <div className="p-6 space-y-4">

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base font-semibold">
            All Purchase Orders
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">
              + New
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Table Header Only (Empty State) */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Purchase Order#</TableHead>
                <TableHead>Source Order#</TableHead>
                <TableHead>Reference#</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billed Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Delivery Date</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}