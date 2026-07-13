"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Search, Plus, Pencil, Trash2, Download, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import AddEditUserDialog from "./AddEditUserDialog"
import {
  type NidoUser,
  type NidoRole,
  getUsers,
  getRoles,
  addUser,
  updateUser,
  deleteUser,
  exportUsersCsv,
  exportUsersPdf,
  NIDO_ROLES_EVENT,
  NIDO_USERS_EVENT,
} from "@/lib/nidoUsersStore"

export default function ManageUsersPanel() {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<NidoUser[]>([])
  const [roles, setRoles] = useState<NidoRole[]>([])
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<NidoUser | null>(null)

  const refresh = () => {
    setUsers(getUsers())
    setRoles(getRoles())
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(NIDO_ROLES_EVENT, handler)
    window.addEventListener(NIDO_USERS_EVENT, handler)
    return () => {
      window.removeEventListener(NIDO_ROLES_EVENT, handler)
      window.removeEventListener(NIDO_USERS_EVENT, handler)
    }
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUser = () => {
    setEditingUser(null)
    setUserDialogOpen(true)
  }

  const handleEditUser = (user: NidoUser) => {
    setEditingUser(user)
    setUserDialogOpen(true)
  }

  const handleSaveUser = (values: Omit<NidoUser, "id">) => {
    if (editingUser) {
      const duplicate = users.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === values.email.toLowerCase())
      if (duplicate) {
        toast.error("Email already in use", { description: "Another user already has this email address." })
        return
      }
      updateUser(editingUser.id, values)
      toast.success("User updated", { description: `${values.name}'s details have been saved.` })
    } else {
      const duplicate = users.some((u) => u.email.toLowerCase() === values.email.toLowerCase())
      if (duplicate) {
        toast.error("Email already in use", { description: "A user with this email address already exists." })
        return
      }
      addUser(values)
      toast.success("User added", { description: `${values.name} can now access the platform.` })
    }
    refresh()
  }

  const handleDeleteUser = (user: NidoUser) => {
    if (!window.confirm(`Remove ${user.name} (${user.email})? This cannot be undone.`)) return
    deleteUser(user.id)
    toast.success("User removed")
    refresh()
  }

  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      toast.info("Nothing to export")
      return
    }
    exportUsersCsv(filteredUsers)
    toast.success("CSV exported", { description: `${filteredUsers.length} user(s) exported.` })
  }

  const handleExportPdf = () => {
    if (filteredUsers.length === 0) {
      toast.info("Nothing to export")
      return
    }
    exportUsersPdf(filteredUsers)
    toast.success("PDF exported", { description: `${filteredUsers.length} user(s) exported.` })
  }

  return (
    <div className="space-y-6">
      {/* Description + Actions */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted-foreground">
          Add and manage client or vendor users.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          <Button onClick={handleAddUser}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
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
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Name
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Email
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Role
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Job Title
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Department
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>

                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-muted/20"
                >
                  <td className="px-4 py-2 font-medium">
                    {user.name}
                  </td>

                  <td className="px-4 py-2 text-muted-foreground">
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
                    <Badge className={user.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-200 text-slate-600 hover:bg-slate-200"}>
                      {user.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AddEditUserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        roles={roles}
        onSave={handleSaveUser}
      />
    </div>
  )
}
