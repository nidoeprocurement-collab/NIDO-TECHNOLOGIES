"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Search, Plus, Download, Pencil, Trash2, FileText, Shield,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ManageUsersPanel from "./ManageUsersPanel"
import AddEditRoleDialog from "./AddEditRoleDialog"
import RolePermissionsDialog from "./RolePermissionsDialog"
import {
  type NidoRole,
  getRoles, addRole, updateRole, deleteRole,
  getRoleUserCount, exportRolesCsv, exportRolesPdf,
  NIDO_ROLES_EVENT, NIDO_USERS_EVENT,
} from "@/lib/nidoUsersStore"
import { isSuperAdmin } from "@/lib/permissionsStore"

export default function NidoUsersPage() {
  const [activeTab, setActiveTab]               = useState("roles")
  const [searchRole, setSearchRole]             = useState("")
  const [roles, setRoles]                       = useState<NidoRole[]>([])
  const [roleDialogOpen, setRoleDialogOpen]     = useState(false)
  const [editingRole, setEditingRole]           = useState<NidoRole | null>(null)
  const [permDialogOpen, setPermDialogOpen]     = useState(false)
  const [permRole, setPermRole]                 = useState<NidoRole | null>(null)
  const [, forceRefresh]                        = useState(0)

  const refreshRoles = () => { setRoles(getRoles()); forceRefresh(n => n + 1); }

  useEffect(() => {
    refreshRoles()
    const handler = () => refreshRoles()
    window.addEventListener(NIDO_ROLES_EVENT, handler)
    window.addEventListener(NIDO_USERS_EVENT, handler)
    return () => {
      window.removeEventListener(NIDO_ROLES_EVENT, handler)
      window.removeEventListener(NIDO_USERS_EVENT, handler)
    }
  }, [])

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchRole.toLowerCase())
  )

  const handleAddRole = () => { setEditingRole(null); setRoleDialogOpen(true); }
  const handleEditRole = (role: NidoRole) => { setEditingRole(role); setRoleDialogOpen(true); }

  const handleSaveRole = (values: { name: string; description: string; status: "Active" | "Inactive" }) => {
    if (editingRole) {
      updateRole(editingRole.id, values)
      toast.success("Role updated", { description: `"${values.name}" has been saved.` })
    } else {
      addRole(values)
      toast.success("Role added", { description: `"${values.name}" is now available to assign to users.` })
    }
    refreshRoles()
  }

  const handleDeleteRole = (role: NidoRole) => {
    const assigned = getRoleUserCount(role.name)
    if (assigned > 0) {
      toast.error("Can't delete role", { description: `${assigned} user(s) still have this role. Reassign them first.` })
      return
    }
    if (!window.confirm(`Delete the role "${role.name}"? This cannot be undone.`)) return
    deleteRole(role.id)
    toast.success("Role deleted")
    refreshRoles()
  }

  const handleOpenPermissions = (role: NidoRole) => {
    setPermRole(role)
    setPermDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 md:py-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nido-Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage roles, permissions, and platform users</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-12 bg-background border border-border rounded-lg p-1">
            <TabsTrigger value="roles" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
              User Roles
            </TabsTrigger>
            <TabsTrigger value="users" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
              Add / Manage Users
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* USER ROLES TAB */}
        {activeTab === "roles" && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search roles..."
                      className="pl-10"
                      value={searchRole}
                      onChange={e => setSearchRole(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => { if (!filteredRoles.length) { toast.info("Nothing to export"); return; } exportRolesCsv(filteredRoles); toast.success("CSV exported"); }}>
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => { if (!filteredRoles.length) { toast.info("Nothing to export"); return; } exportRolesPdf(filteredRoles); toast.success("PDF exported"); }}>
                      <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={handleAddRole}>
                      <Plus className="mr-2 h-4 w-4" /> Add Role
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold">User Roles</h2>
              <p className="text-sm text-muted-foreground">Define roles and configure their module permissions.</p>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Assigned Users</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => (
                      <tr key={role.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <button className="font-medium text-blue-600 hover:underline" onClick={() => handleEditRole(role)}>
                            {role.name}
                          </button>
                          {isSuperAdmin(role.name) && (
                            <Badge className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                              Super Admin
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm">{role.description}</td>
                        <td className="px-6 py-4">
                          <Badge className={role.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"}>
                            {role.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">{getRoleUserCount(role.name)} Users</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPermissions(role)}
                              title="Configure permissions for this role"
                            >
                              <Shield className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                              Permissions
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRoles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No roles match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="border-t px-4 py-2 text-sm text-muted-foreground">
                  Showing {filteredRoles.length} of {roles.length} roles
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === "users" && <ManageUsersPanel />}
      </div>

      <AddEditRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        onSave={handleSaveRole}
      />

      <RolePermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        role={permRole}
      />
    </div>
  )
}
