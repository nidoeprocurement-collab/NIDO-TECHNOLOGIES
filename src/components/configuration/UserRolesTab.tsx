"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  Search, Plus, Download, Upload, MoreVertical, Pencil, Trash2, FileText, Shield,
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
  getRoles, updateRole, deleteRole,
  getRoleUserCount, exportRolesCsv, exportRolesPdf,
  NIDO_ROLES_EVENT, NIDO_USERS_EVENT,
  replaceRolesFromBackend,
} from "@/lib/nidoUsersStore"
import {
  ACTIONS,
  getRolePermissions,
  isSuperAdmin,
  saveRolePermissions,
  type ModulePermissions,
} from "@/lib/permissionsStore"
import {
  createNidoRoleInSupabase,
  deleteNidoRoleInSupabase,
  isSupabaseUuid,
  loadNidoRolesAndPermissionsFromSupabase,
  saveNidoRolePermissionsInSupabase,
  updateNidoRoleInSupabase,
} from "@/lib/nidoRolesApi"
import { ROLE_PERMISSION_MODULE_OPTIONS } from "@/lib/platformModuleCatalog"

const NIDO_PERMISSION_CSV_COLUMNS = [
  "role_name", "description", "status", "module_key", "module", "module_description",
  ...ACTIONS.map(action => action.key),
] as const

function csvEscape(value: string | boolean): string {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function parseCsv(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, "")
  const firstLine = text.split(/\r?\n/, 1)[0] || ""
  const commaCount = (firstLine.match(/,/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  const delimiter = tabCount > commaCount && tabCount > semiCount
    ? "\t"
    : semiCount > commaCount
      ? ";"
      : ","

  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]
    if (character === '"' && quoted && next === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === delimiter && !quoted) {
      row.push(value.trim())
      value = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1
      row.push(value.trim())
      if (row.some(cell => cell.length > 0)) rows.push(row)
      row = []
      value = ""
    } else {
      value += character
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quote.")
  if (value.length > 0 || row.length > 0) {
    row.push(value.trim())
    if (row.some(cell => cell.length > 0)) rows.push(row)
  }
  return rows
}

function normalizeNidoCsvHeader(cell: string): string {
  const cleaned = cell
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  switch (cleaned) {
    case "role":
    case "rolename":
    case "name":
      return "role_name"
    case "role_description":
    case "desc":
      return "description"
    case "role_status":
      return "status"
    case "modulekey":
      return "module_key"
    case "module_name":
    case "modulename":
      return "module"
    case "moduledescription":
      return "module_description"
    default:
      return cleaned
  }
}

function parseCsvBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return ["true", "yes", "y", "1", "t", "x", "✓", "✔", "enabled", "allow", "allowed", "active"].includes(normalized)
}

function parseNidoCsvStatus(value: string): "Active" | "Inactive" {
  const normalized = value.trim().toLowerCase()
  if (["inactive", "disabled", "false", "no", "0", "deactivated"].includes(normalized)) {
    return "Inactive"
  }
  return "Active"
}

export default function NidoUsersPage() {
  const [searchParams, setSearchParams]         = useSearchParams()
  const initialTab = searchParams.get("tab") === "users" ? "users" : "roles"
  const [activeTab, setActiveTabState]          = useState(initialTab)
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("tab", tab)
      return next
    }, { replace: true })
  }
  const [searchRole, setSearchRole]             = useState("")
  const [roles, setRoles]                       = useState<NidoRole[]>([])
  const [roleDialogOpen, setRoleDialogOpen]     = useState(false)
  const [editingRole, setEditingRole]           = useState<NidoRole | null>(null)
  const [permDialogOpen, setPermDialogOpen]     = useState(false)
  const [permRole, setPermRole]                 = useState<NidoRole | null>(null)
  const [showRoleActionsMenu, setShowRoleActionsMenu] = useState(false)
  const [rolesLoading, setRolesLoading]         = useState(true)
  const [rolesSyncError, setRolesSyncError]     = useState<string | null>(null)
  const [deletingRoleId, setDeletingRoleId]     = useState<string | null>(null)
  const [, forceRefresh]                        = useState(0)
  const [currentRolePage, setCurrentRolePage]   = useState(1)
  const rolePageSize = 10

  const refreshRoles = () => { setRoles(getRoles()); forceRefresh(n => n + 1); }

  const loadRolesFromBackend = async (autoSyncIfMissing = false) => {
    setRolesLoading(true)
    setRolesSyncError(null)
    try {
      const result = await loadNidoRolesAndPermissionsFromSupabase({ autoSyncIfMissing })
      setRoles(result.roles)
      forceRefresh(n => n + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load roles from Supabase."
      setRolesSyncError(msg)
      refreshRoles()
    } finally {
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    const tab = searchParams.get("tab") === "users" ? "users" : "roles"
    setActiveTabState(tab)
  }, [searchParams])

  useEffect(() => {
    void loadRolesFromBackend(true)
    const handler = () => refreshRoles()
    window.addEventListener(NIDO_ROLES_EVENT, handler)
    window.addEventListener(NIDO_USERS_EVENT, handler)
    return () => {
      window.removeEventListener(NIDO_ROLES_EVENT, handler)
      window.removeEventListener(NIDO_USERS_EVENT, handler)
    }
  }, [])

  const filteredRoles = roles.filter(r =>
    r.department.toLowerCase().includes(searchRole.toLowerCase()) ||
    r.name.toLowerCase().includes(searchRole.toLowerCase())
  )
  const totalRolePages = Math.max(1, Math.ceil(filteredRoles.length / rolePageSize))
  const paginatedRoles = filteredRoles.slice(
    (currentRolePage - 1) * rolePageSize,
    currentRolePage * rolePageSize,
  )

  useEffect(() => {
    setCurrentRolePage(1)
  }, [searchRole])

  useEffect(() => {
    setCurrentRolePage(page => Math.min(page, totalRolePages))
  }, [totalRolePages])

  const handleAddRole = () => { setEditingRole(null); setRoleDialogOpen(true); }
  const handleEditRole = (role: NidoRole) => {
    if (isSuperAdmin(role.name)) {
      toast.error("System Owner is protected", { description: "The System Owner role cannot be modified." })
      return
    }
    setEditingRole(role)
    setRoleDialogOpen(true)
  }

  const handleSaveRole = async (values: { department: string; name: string; description: string; status: "Active" | "Inactive" }): Promise<boolean> => {
    if (values.name.trim().toLowerCase() === "system owner") {
      toast.error("System Owner is protected", { description: "The System Owner role cannot be created or modified." })
      return false
    }

    if (editingRole) {
      if (isSuperAdmin(editingRole.name)) {
        toast.error("System Owner is protected", { description: "The System Owner role cannot be modified." })
        return false
      }
      const updated = await updateNidoRoleInSupabase(editingRole.id, values)
      updateRole(editingRole.id, updated)
      setRoles(prev => replaceRolesFromBackend(prev.map(r => (r.id === editingRole.id ? updated : r))))
      toast.success("Role updated", { description: `"${updated.name}" has been saved in Supabase.` })
      return true
    }

    const created = await createNidoRoleInSupabase(values)
    setRoles(prev => replaceRolesFromBackend([...prev.filter(r => r.id !== created.id), created]))
    toast.success("Role added", { description: `"${created.name}" has been created in Supabase.` })
    return true
  }

  const handleDeleteRole = async (role: NidoRole) => {
    if (deletingRoleId) return
    if (isSuperAdmin(role.name)) {
      toast.error("System Owner is protected", { description: "The System Owner role cannot be deleted." })
      return
    }
    const assigned = getRoleUserCount(role.name)
    if (assigned > 0) {
      toast.error("Can't delete role", { description: `${assigned} user(s) still have this role. Reassign them first.` })
      return
    }
    if (!window.confirm(`Delete the role "${role.name}"? This cannot be undone.`)) return

    setDeletingRoleId(role.id)
    try {
      await deleteNidoRoleInSupabase(role.id)
      deleteRole(role.id)
      setRoles(prev => replaceRolesFromBackend(prev.filter(r => r.id !== role.id)))
      toast.success("Role deleted")
    } catch (err) {
      toast.error("Could not delete role", {
        description: err instanceof Error ? err.message : "Unable to delete role in Supabase.",
      })
    } finally {
      setDeletingRoleId(null)
    }
  }

  const handleSaveRolePermissions = async (role: NidoRole, matrix: Record<string, ModulePermissions>) => {
    if (isSuperAdmin(role.name)) return
    if (isSupabaseUuid(role.id)) {
      await saveNidoRolePermissionsInSupabase(role.id, matrix)
    }
    saveRolePermissions(role.name, matrix)
    forceRefresh(n => n + 1)
  }

  const handleOpenPermissions = (role: NidoRole) => {
    setPermRole(role)
    setPermDialogOpen(true)
  }

  const downloadNidoPermissionsTemplate = () => {
    setShowRoleActionsMenu(false)
    const header = NIDO_PERMISSION_CSV_COLUMNS.map(csvEscape).join(",")
    const blob = new Blob([`${header}\r\n`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "nido-role-permissions-template.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const exportNidoPermissionsCsv = () => {
    setShowRoleActionsMenu(false)
    if (!filteredRoles.length) {
      toast.info("Nothing to export")
      return
    }
    const header = NIDO_PERMISSION_CSV_COLUMNS.map(csvEscape).join(",")
    const rows = filteredRoles.flatMap(role => {
      const storedPermissions = getRolePermissions(role.name)
      return ROLE_PERMISSION_MODULE_OPTIONS.map(module => [
        role.name,
        role.description,
        role.status,
        module.key,
        module.label,
        module.description,
        ...ACTIONS.map(action => Boolean(isSuperAdmin(role.name) || storedPermissions[module.key]?.[action.key])),
      ].map(csvEscape).join(","))
    })
    const blob = new Blob([[header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "nido-role-permissions.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Role permissions exported")
  }

  const handleNidoBulkUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setShowRoleActionsMenu(false)
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const rows = parseCsv(await file.text())
      if (rows.length < 2) throw new Error("The CSV template is empty. Please add at least one role row below the header before uploading.")

      const header = rows[0].map(normalizeNidoCsvHeader)
      if (!header.includes("role_name")) {
        throw new Error("Missing required CSV column: role_name.")
      }
      const columnIndex = Object.fromEntries(header.map((column, index) => [column, index])) as Record<string, number>
      const moduleByKey = new Map(ROLE_PERMISSION_MODULE_OPTIONS.map(module => [module.key.toLowerCase(), module]))
      const moduleByLabel = new Map(ROLE_PERMISSION_MODULE_OPTIONS.map(module => [module.label.toLowerCase(), module]))
      const imported = new Map<string, {
        name: string
        description: string
        status: "Active" | "Inactive"
        permissions: Record<string, ModulePermissions>
      }>()

      let lastRoleName = ""

      rows.slice(1).forEach((cells) => {
        if (!cells.some(cell => cell.trim().length > 0)) return

        const explicitRoleName = columnIndex.role_name !== undefined
          ? (cells[columnIndex.role_name] || "").trim()
          : ""
        const roleName = explicitRoleName || lastRoleName
        if (!roleName) return
        lastRoleName = roleName

        if (roleName.toLowerCase() === "system owner") {
          throw new Error("System Owner cannot be changed through bulk upload.")
        }

        const rawStatus = columnIndex.status !== undefined
          ? (cells[columnIndex.status] || "").trim()
          : ""
        const status = rawStatus ? parseNidoCsvStatus(rawStatus) : undefined
        const rawDescription = columnIndex.description !== undefined
          ? (cells[columnIndex.description] || "").trim()
          : ""

        const roleKey = roleName.toLowerCase()
        const current = imported.get(roleKey) || {
          name: roleName,
          description: rawDescription,
          status: status || "Active",
          permissions: {},
        }
        if (rawDescription) current.description = rawDescription
        if (status) current.status = status

        const moduleKeyRaw = columnIndex.module_key !== undefined
          ? (cells[columnIndex.module_key] || "").trim()
          : ""
        const moduleLabelRaw = columnIndex.module !== undefined
          ? (cells[columnIndex.module] || "").trim()
          : ""
        const module =
          moduleByKey.get(moduleKeyRaw.toLowerCase()) ||
          moduleByLabel.get(moduleKeyRaw.toLowerCase()) ||
          moduleByKey.get(moduleLabelRaw.toLowerCase()) ||
          moduleByLabel.get(moduleLabelRaw.toLowerCase())

        if (module) {
          const permissions: ModulePermissions = {}
          ACTIONS.forEach(action => {
            permissions[action.key] = columnIndex[action.key] !== undefined
              ? parseCsvBoolean(cells[columnIndex[action.key]] || "")
              : false
          })
          current.permissions[module.key] = permissions
        }
        imported.set(roleKey, current)
      })

      if (imported.size === 0) {
        throw new Error("No valid role rows were found in the CSV file.")
      }

      const existingByName = new Map(roles.map(role => [role.name.toLowerCase(), role]))
      const importedRoles = Array.from(imported.values())

      let syncedCount = 0
      for (const incoming of importedRoles) {
        if (incoming.name.trim().toLowerCase() === "system owner") continue
        const existing = existingByName.get(incoming.name.toLowerCase())
        let persistedRole: NidoRole
        if (existing && isSupabaseUuid(existing.id)) {
          persistedRole = await updateNidoRoleInSupabase(existing.id, {
            department: existing.department ?? "",
            name: incoming.name,
            description: incoming.description,
            status: incoming.status,
          })
        } else {
          persistedRole = await createNidoRoleInSupabase({
            department: existing?.department ?? "",
            name: incoming.name,
            description: incoming.description,
            status: incoming.status,
          })
        }
        await saveNidoRolePermissionsInSupabase(persistedRole.id, incoming.permissions)
        syncedCount += 1
      }
      await loadRolesFromBackend(false)
      toast.success(`Imported ${syncedCount} role${syncedCount === 1 ? "" : "s"} to Supabase`)
    } catch (error) {
      toast.error("Could not import CSV", {
        description: error instanceof Error ? error.message : "Please check the file format.",
      })
    }
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
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowRoleActionsMenu(open => !open)}
                      aria-label="Role and permission actions"
                      aria-expanded={showRoleActionsMenu}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {showRoleActionsMenu && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-background p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => { setShowRoleActionsMenu(false); handleAddRole(); }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <Plus className="mr-2 inline h-4 w-4" /> Add Role
                        </button>
                        <button
                          type="button"
                          onClick={downloadNidoPermissionsTemplate}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <Download className="mr-2 inline h-4 w-4" /> Download Template
                        </button>
                        <button
                          type="button"
                          onClick={exportNidoPermissionsCsv}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <Download className="mr-2 inline h-4 w-4" /> Export Permissions CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoleActionsMenu(false)
                            if (!filteredRoles.length) {
                              toast.info("Nothing to export")
                              return
                            }
                            exportRolesCsv(filteredRoles)
                            toast.success("Roles CSV exported")
                          }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <Download className="mr-2 inline h-4 w-4" /> Export Roles CSV
                        </button>
                        <label className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                          <Upload className="mr-2 inline h-4 w-4" /> Bulk Upload CSV
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleNidoBulkUpload}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoleActionsMenu(false)
                            if (!filteredRoles.length) {
                              toast.info("Nothing to export")
                              return
                            }
                            exportRolesPdf(filteredRoles)
                            toast.success("PDF exported")
                          }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <FileText className="mr-2 inline h-4 w-4" /> Export PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold">User Roles</h2>
              <p className="text-sm text-muted-foreground">
                Define roles and configure their module permissions.
                {rolesLoading && " Syncing with Supabase..."}
              </p>
              {rolesSyncError && (
                <p className="mt-1 text-sm text-red-600">{rolesSyncError}</p>
              )}
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Assigned Users</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map(role => (
                      <tr key={role.id} className="border-b border-border hover:bg-muted/30">
                         <td className="px-6 py-4 text-sm">{role.department || "—"}</td>
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
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSuperAdmin(role.name)}
                              onClick={() => handleEditRole(role)}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSuperAdmin(role.name) || deletingRoleId === role.id}
                              onClick={() => void handleDeleteRole(role)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRoles.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No roles match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {filteredRoles.length === 0
                      ? "Showing 0 roles"
                      : `Showing ${(currentRolePage - 1) * rolePageSize + 1}–${Math.min(currentRolePage * rolePageSize, filteredRoles.length)} of ${filteredRoles.length} matching roles (${roles.length} total)`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentRolePage === 1}
                      onClick={() => setCurrentRolePage(page => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center">Page {currentRolePage} of {totalRolePages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentRolePage >= totalRolePages}
                      onClick={() => setCurrentRolePage(page => Math.min(totalRolePages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
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
        onSavePermissions={handleSaveRolePermissions}
      />
    </div>
  )
}
