"use client"

import { useState } from "react"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

const users = [
  {
    name: "System Owner",
    email: "owner@nidotech.com",
    role: "1",
    jobTitle: "CEO",
    department: "Management",
    status: "Active",
  },
  {
    name: "Mark Adams",
    email: "admin@nidotech.com",
    role: "1",
    jobTitle: "System Admin",
    department: "IT",
    status: "Active",
  },
  {
    name: "Jane Smith",
    email: "procurement@nidotech.com",
    role: "2",
    jobTitle: "Procurement Manager",
    department: "Procurement",
    status: "Active",
  },
  {
    name: "David Chen",
    email: "ap@nidotech.com",
    role: "2",
    jobTitle: "Accounts Payable",
    department: "Finance",
    status: "Active",
  },
  {
    name: "Vendor User",
    email: "vendor@apex.com",
    role: "4",
    jobTitle: "Vendor Manager",
    department: "Sales",
    status: "Active",
  },
  {
    name: "Client Admin",
    email: "clientadmin@corp.com",
    role: "4",
    jobTitle: "Admin",
    department: "Operations",
    status: "Active",
  },
]

export default function ManageUsersPanel() {
  const [search, setSearch] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Description + Add User */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add and manage client or vendor users.
        </p>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Name
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Email
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Role
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Job Title
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Department
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.email}
                  className="border-b hover:bg-muted/20"
                >
                  <td className="px-4 py-4 font-medium">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-muted-foreground">
                    {user.email}
                  </td>

                  <td className="px-4 py-4">
                    {user.role}
                  </td>

                  <td className="px-4 py-4">
                    {user.jobTitle}
                  </td>

                  <td className="px-4 py-4">
                    {user.department}
                  </td>

                  <td className="px-4 py-4">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {user.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}