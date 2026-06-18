"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ManageUsersPanel from "./ManageUsersPanel"

const roles = [
  {
    name: "System Owner",
    description: "Full system access with all permissions",
    status: "Active",
    users: 1,
  },
  {
    name: "Procurement Manager",
    description: "Manages purchase orders and procurement",
    status: "Active",
    users: 2,
  },
  {
    name: "Accounts Payable",
    description: "Manages invoices and payments",
    status: "Active",
    users: 1,
  },
  {
    name: "Vendor Admin",
    description: "Manages vendor information",
    status: "Active",
    users: 1,
  },
]

export default function NidoUsersPage() {
  const [activeTab, setActiveTab] = useState("roles")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Nido-Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage roles and platform users
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="h-12 bg-white border rounded-lg p-1">
            <TabsTrigger
              value="roles"
              className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              User Roles
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="px-6"
            >
              Add / Manage Users
            </TabsTrigger>
          </TabsList>

          {/* User Roles Tab Content */}
          <TabsContent value="roles" className="space-y-6 mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  className="pl-10"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold">
            User Roles
          </h2>
          <p className="text-sm text-muted-foreground">
            Define roles and their permissions.
          </p>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Role Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Description
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Assigned Users
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.name}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <button className="font-medium text-blue-600 hover:text-blue-800">
                        {role.name}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {role.description}
                    </td>

                    <td className="px-6 py-4">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {role.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {role.users} Users
                    </td>

                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-muted-foreground">
              <span>
                Showing 1 to 4 of 4 entries
              </span>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Add/Manage Users Tab Content */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <ManageUsersPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
