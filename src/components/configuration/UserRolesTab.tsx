"use client"

import { Plus, Download, Search } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const roles = [
  {
    name: "System Owner",
    description: "Full system access with all permissions",
    users: 1,
  },
  {
    name: "Procurement Manager",
    description: "Manages purchase orders and procurement",
    users: 2,
  },
  {
    name: "Accounts Payable",
    description: "Manages invoices and payments",
    users: 1,
  },
  {
    name: "Vendor Admin",
    description: "Manages vendor information",
    users: 1,
  },
]

export default function UserRolesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nido-Users</h1>
        <p className="text-muted-foreground">
          Manage roles and platform users
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            User Roles
          </TabsTrigger>
          <TabsTrigger value="users">
            Add / Manage Users
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search roles..."
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4">ROLE NAME</th>
                <th className="text-left p-4">DESCRIPTION</th>
                <th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">ASSIGNED USERS</th>
                <th className="text-left p-4">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.name}
                  className="border-b last:border-0"
                >
                  <td className="p-4 font-medium text-blue-600">
                    {role.name}
                  </td>

                  <td className="p-4 text-muted-foreground">
                    {role.description}
                  </td>

                  <td className="p-4">
                    <Badge className="bg-green-500 hover:bg-green-500">
                      Active
                    </Badge>
                  </td>

                  <td className="p-4">
                    {role.users} Users
                  </td>

                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 text-sm text-muted-foreground">
            Showing 1 to 4 of 4 entries
          </div>
        </CardContent>
      </Card>
    </div>
  )
}