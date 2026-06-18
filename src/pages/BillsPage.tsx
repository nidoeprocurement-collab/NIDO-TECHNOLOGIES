"use client"

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

import { MoreHorizontal, Download, Plus } from "lucide-react"

export default function BillsPage() {
  return (
    <div className="bg-gray-100 min-h-screen p-4">

      {/* Main Container */}
      <div className="bg-white border rounded-lg p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">All Bills</h1>

          <div className="flex items-center gap-2">

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* More */}
            <Button size="icon" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {/* New */}
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>

            {/* More */}
            <Button size="icon" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>

          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-hidden">

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>

                {/* Checkbox */}
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Date
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Bill#
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Reference Number
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Vendor Name
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Status
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Due Date
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground text-right">
                  Amount
                </TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>

              {/* Row 1 */}
              <TableRow>
                <TableCell>
                  <Checkbox />
                </TableCell>

                <TableCell>06/03/2021</TableCell>

                <TableCell className="text-blue-600 font-medium">
                  104
                </TableCell>

                <TableCell>-</TableCell>

                <TableCell>Global Supply Co</TableCell>

                <TableCell className="text-green-600 font-medium">
                  PAID
                </TableCell>

                <TableCell>06/03/2021</TableCell>

                <TableCell className="text-right font-medium">
                  ₹4,142.00
                </TableCell>
              </TableRow>

              {/* Row 2 */}
              <TableRow>
                <TableCell>
                  <Checkbox />
                </TableCell>

                <TableCell>26/06/2021</TableCell>

                <TableCell className="text-blue-600 font-medium">
                  11
                </TableCell>

                <TableCell>-</TableCell>

                <TableCell>SecureTech Ltd</TableCell>

                <TableCell className="text-green-600 font-medium">
                  PAID
                </TableCell>

                <TableCell>26/06/2021</TableCell>

                <TableCell className="text-right font-medium">
                  ₹18,880.00
                </TableCell>
              </TableRow>

            </TableBody>
          </Table>

        </div>
      </div>
    </div>
  )
}