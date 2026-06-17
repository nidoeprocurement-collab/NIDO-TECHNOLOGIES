"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilesPage() {
  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">All Profiles</h1>
        <Button>+ New</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile Name</TableHead>
                <TableHead>Expense Account</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Last Expense Date</TableHead>
                <TableHead>Next Expense Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="cursor-pointer">
                <TableCell className="text-blue-600">
                  Regular AMC for Laptop - 54362
                </TableCell>
                <TableCell>IT and Internet Expenses</TableCell>
                <TableCell>Distributions</TableCell>
                <TableCell>Weekly</TableCell>
                <TableCell>2026-04-07</TableCell>
                <TableCell>2026-04-14</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-green-600">
                    ACTIVE
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Regular AMC for Laptop - 54362
              <Badge className="ml-2 bg-green-100 text-green-700">
                Active
              </Badge>
            </CardTitle>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="outline" size="sm">More</Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="expenses">All Expenses</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Expense Amount
                </p>
                <h2 className="text-xl font-semibold">₹500.00</h2>
                <p className="text-xs text-muted-foreground mt-2">
                  IT and Internet Expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Repeats
                </p>
                <h2 className="text-xl font-semibold">Weekly</h2>
                <p className="text-xs text-muted-foreground mt-2">
                  Distributions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Next Expense Date
                </p>
                <h2 className="text-xl font-semibold">2026-04-14</h2>
                <p className="text-xs text-muted-foreground mt-2">
                  Start: 2026-04-07 <br />
                  End: 2026-05-02
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Other Details */}
          <div>
            <h3 className="font-medium mb-2">Other Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
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

          {/* History */}
          <div>
            <h3 className="font-medium mb-2">History</h3>
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p>
                  4/8/2026 4:29:00 AM — Recurring expense created for Rs.500.00
                </p>
                <p>
                  4/8/2026 4:29:00 AM — Expense created for Rs.500.00
                </p>
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}