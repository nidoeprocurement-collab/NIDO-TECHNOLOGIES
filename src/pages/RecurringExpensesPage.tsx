"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { MoreHorizontal, Plus } from "lucide-react"

export default function ProfilesPage() {
  return (
    <div className="bg-gray-100 min-h-screen p-4 space-y-4">

      {/* ================= TOP TABLE ================= */}
      <div className="bg-white border rounded-lg p-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-semibold">All Profiles</h1>

          <div className="flex gap-2">
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>

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
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>

                <TableHead className="text-xs uppercase text-muted-foreground">
                  Profile Name
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Expense Account
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Vendor Name
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Frequency
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Last Expense Date
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Next Expense Date
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="bg-blue-50">
                <TableCell>
                  <Checkbox checked />
                </TableCell>

                <TableCell className="text-blue-600">
                  Regular AMC for Laptop - 54362
                </TableCell>
                <TableCell>IT and Internet Expenses</TableCell>
                <TableCell>Distributions</TableCell>
                <TableCell>Weekly</TableCell>
                <TableCell>2026-04-07</TableCell>
                <TableCell>2026-04-14</TableCell>
                <TableCell>
                  <span className="text-green-600 text-sm font-medium">
                    ACTIVE
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================= DETAILS ================= */}
      <div className="bg-white border rounded-lg p-4 space-y-4">

        {/* Title */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Regular AMC for Laptop - 54362
            </h2>

            <Badge className="bg-green-100 text-green-700">
              Active
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button size="icon" variant="outline">✎</Button>
            <Button variant="outline" size="sm">More</Button>
            <Button size="icon" variant="ghost">✕</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Expense Amount
              </p>
              <h3 className="text-lg font-semibold">₹500.00</h3>

              <p className="text-xs text-muted-foreground mt-3">
                Expense Account
              </p>
              <p className="text-sm">IT and Internet Expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Repeats
              </p>
              <h3 className="text-lg font-semibold">Weekly</h3>

              <p className="text-xs text-muted-foreground mt-3">
                Paid Through
              </p>
              <p className="text-sm">Distributions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Next Expense Date
              </p>
              <h3 className="text-lg font-semibold">2026-04-14</h3>

              <p className="text-xs text-muted-foreground mt-3">
                Start On
              </p>
              <p className="text-sm">2026-04-07</p>

              <p className="text-xs text-muted-foreground mt-2">
                Ends On
              </p>
              <p className="text-sm">2026-05-02</p>
            </CardContent>
          </Card>

        </div>

        {/* Other Details */}
        <div>
          <h3 className="font-medium mb-3">Other Details</h3>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="text-blue-600">Nido Technologies</p>
            </div>

            <div>
              <p className="text-muted-foreground">GST Treatment</p>
              <p>Out of Scope</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* History */}
        <div>
          <h3 className="font-medium mb-2">History</h3>

          <div className="border rounded-md p-4 text-sm text-muted-foreground space-y-2">
            <p>
              4/8/2026 4:29:00 AM — Recurring expense created for Rs.500.00
            </p>
            <p>
              4/8/2026 4:29:00 AM — Expense Created for Rs.500.00
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}