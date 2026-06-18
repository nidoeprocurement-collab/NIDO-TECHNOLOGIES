"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

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

const users = [
  {
    name: "System Owner",
    email: "owner@nidotech.com",
    role: "System Owner",
    jobTitle: "CEO",
    department: "Management",
    status: "Active",
  },
  {
    name: "Mark Adams",
    email: "admin@nidotech.com",
    role: "System Admin",
    jobTitle: "System Admin",
    department: "IT",
    status: "Active",
  },
  {
    name: "Jane Smith",
    email: "procurement@nidotech.com",
    role: "Procurement Manager",
    jobTitle: "Procurement Manager",
    department: "Procurement",
    status: "Active",
  },
  {
    name: "David Chen",
    email: "ap@nidotech.com",
    role: "Accounts Payable",
    jobTitle: "Accounts Payable",
    department: "Finance",
    status: "Active",
  },
]

export default function NidoUsersPage() {
  const [activeTab, setActiveTab] = useState("roles")
  const [searchRole, setSearchRole] = useState("")
  const [searchUser, setSearchUser] = useState("")

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchRole.toLowerCase())
  )

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase())
  )

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
          onValueChange={setActiveTab}
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
              className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              Add / Manage Users
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* USER ROLES TAB */}
        {activeTab === "roles" && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      placeholder="Search roles..."
                      className="pl-10"
                      value={searchRole}
                      onChange={(e) =>
                        setSearchRole(e.target.value)
                      }
                    />
                  </div>

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

            <div>
              <h2 className="text-lg font-semibold">
                User Roles
              </h2>

              <p className="text-sm text-muted-foreground">
                Define roles and their permissions.
              </p>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Role Name
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Description
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Assigned Users
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRoles.map((role) => (
                      <tr
                        key={role.name}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <button className="font-medium text-blue-600">
                            {role.name}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm">
                          {role.description}
                        </td>

                        <td className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-700">
                            {role.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-4">
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

                <div className="border-t px-6 py-4 text-sm text-muted-foreground">
                  Showing 1 to {filteredRoles.length} of{" "}
                  {roles.length} entries
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Add / Manage Users
                </h2>

                <p className="text-sm text-muted-foreground">
                  Add and manage client or vendor users.
                </p>
              </div>

              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchUser}
                    onChange={(e) =>
                      setSearchUser(e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Name
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Email
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Role
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Job Title
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Department
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                        Status
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.email}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          {user.name}
                        </td>

                        <td className="px-6 py-4">
                          {user.email}
                        </td>

                        <td className="px-6 py-4">
                          {user.role}
                        </td>

                        <td className="px-6 py-4">
                          {user.jobTitle}
                        </td>

                        <td className="px-6 py-4">
                          {user.department}
                        </td>

                        <td className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-700">
                            {user.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
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
          </>
        )}
      </div>
    </div>
  )
}