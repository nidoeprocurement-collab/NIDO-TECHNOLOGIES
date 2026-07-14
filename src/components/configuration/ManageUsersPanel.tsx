"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Search, Plus, Download, FileText, MoreHorizontal,
  Pencil, Trash2, Key, UserCheck, UserX, PauseCircle,
  MailPlus, AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import AddEditUserDialog from "./AddEditUserDialog"
import {
  type NidoUser, type NidoRole,
  getUsers, getRoles, addUser, updateUser, deleteUser,
  exportUsersCsv, exportUsersPdf,
  NIDO_ROLES_EVENT, NIDO_USERS_EVENT,
} from "@/lib/nidoUsersStore"

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: NidoUser["status"] }) {
  const cls =
    status === "Active"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
    status === "Suspended"? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  return <Badge className={cls}>{status}</Badge>;
}

// ── Reset Password dialog ──────────────────────────────────────────────────────
function ResetPasswordDialog({
  user, open, onOpenChange,
}: { user: NidoUser | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [newPw, setNewPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setNewPw(""); setErr(""); } }, [open]);

  const handleSave = () => {
    if (newPw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (user) {
      updateUser(user.id, { password: newPw, forcePasswordChange: false });
      toast.success("Password reset", { description: `${user.name}'s password has been updated.` });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Key size={18} /> Reset Password</DialogTitle>
          <DialogDescription>Set a new password for <strong>{user?.name}</strong>.</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-2 block text-sm font-medium">New Password</Label>
          <Input
            type="password"
            value={newPw}
            onChange={e => { setNewPw(e.target.value); setErr(""); }}
            placeholder="Minimum 6 characters"
          />
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Reset Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Per-row actions dropdown ───────────────────────────────────────────────────
function ActionsMenu({
  user,
  onEdit,
  onRefresh,
}: { user: NidoUser; onEdit: () => void; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const act = (fn: () => void) => { fn(); setOpen(false); };

  const handleStatus = (status: NidoUser["status"]) => {
    updateUser(user.id, { status });
    onRefresh();
    toast.success(`User ${status === "Active" ? "enabled" : status === "Inactive" ? "disabled" : "suspended"}`,
      { description: `${user.name} is now ${status}.` });
  };

  const handleForcePasswordChange = () => {
    updateUser(user.id, { forcePasswordChange: true });
    onRefresh();
    toast.success("Force password change set", { description: `${user.name} will be prompted to change their password on next login.` });
  };

  const handleSendInvitation = () => {
    toast.success("Invitation sent", { description: `An invitation email has been sent to ${user.email}.` });
  };

  const handleDelete = () => {
    if (!window.confirm(`Remove ${user.name} (${user.email})? This cannot be undone.`)) return;
    deleteUser(user.id);
    onRefresh();
    toast.success("User removed");
  };

  const itemCls = "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted rounded transition-colors cursor-pointer";

  return (
    <>
      <div className="relative" ref={ref}>
        <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)}>
          <MoreHorizontal size={16} />
        </Button>

        {open && (
          <div className="absolute right-0 top-9 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[190px] py-1">
            <button className={itemCls} onClick={() => act(onEdit)}>
              <Pencil size={14} className="text-muted-foreground" /> Edit User
            </button>
            <button className={itemCls} onClick={() => { setResetPwOpen(true); setOpen(false); }}>
              <Key size={14} className="text-muted-foreground" /> Reset Password
            </button>
            <div className="my-1 border-t border-border" />
            {user.status !== "Active" && (
              <button className={itemCls} onClick={() => act(() => handleStatus("Active"))}>
                <UserCheck size={14} className="text-green-600" /> Enable Account
              </button>
            )}
            {user.status === "Active" && (
              <button className={itemCls} onClick={() => act(() => handleStatus("Inactive"))}>
                <UserX size={14} className="text-muted-foreground" /> Disable Account
              </button>
            )}
            {user.status === "Active" && (
              <button className={itemCls} onClick={() => act(() => handleStatus("Suspended"))}>
                <PauseCircle size={14} className="text-amber-600" /> Suspend Account
              </button>
            )}
            <div className="my-1 border-t border-border" />
            <button className={itemCls} onClick={() => act(handleForcePasswordChange)}>
              <AlertTriangle size={14} className="text-amber-600" /> Force Password Change
            </button>
            <button className={itemCls} onClick={() => act(handleSendInvitation)}>
              <MailPlus size={14} className="text-muted-foreground" /> Send Invitation
            </button>
            <div className="my-1 border-t border-border" />
            <button className={`${itemCls} text-red-600`} onClick={() => act(handleDelete)}>
              <Trash2 size={14} /> Delete User
            </button>
          </div>
        )}
      </div>

      <ResetPasswordDialog user={user} open={resetPwOpen} onOpenChange={setResetPwOpen} />
    </>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function ManageUsersPanel() {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<NidoUser[]>([])
  const [roles, setRoles] = useState<NidoRole[]>([])
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<NidoUser | null>(null)

  const refresh = () => { setUsers(getUsers()); setRoles(getRoles()); }

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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.employeeId || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUser = () => { setEditingUser(null); setUserDialogOpen(true); }
  const handleEditUser = (user: NidoUser) => { setEditingUser(user); setUserDialogOpen(true); }

  const handleSaveUser = (values: Omit<NidoUser, "id">) => {
    if (editingUser) {
      const duplicate = users.some(u => u.id !== editingUser.id && u.email.toLowerCase() === values.email.toLowerCase())
      if (duplicate) { toast.error("Email already in use"); return; }
      updateUser(editingUser.id, values)
      toast.success("User updated", { description: `${values.name}'s details have been saved.` })
    } else {
      const duplicate = users.some(u => u.email.toLowerCase() === values.email.toLowerCase())
      if (duplicate) { toast.error("Email already in use"); return; }
      addUser(values)
      toast.success("User added", { description: `${values.name} can now access the platform.` })
    }
    refresh()
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted-foreground">Manage NIDO internal platform employees and their access.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { if (!filteredUsers.length) { toast.info("Nothing to export"); return; } exportUsersCsv(filteredUsers); toast.success("CSV exported"); }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => { if (!filteredUsers.length) { toast.info("Nothing to export"); return; } exportUsersPdf(filteredUsers); toast.success("PDF exported"); }}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={handleAddUser}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Emp ID", "Name", "Email", "Role", "Department", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{user.employeeId || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{user.name}</div>
                    {user.designation && <div className="text-xs text-muted-foreground">{user.designation}</div>}
                    {user.forcePasswordChange && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                        <AlertTriangle size={10} /> Password change required
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm">{user.role}</td>
                  <td className="px-4 py-3 text-sm">{user.department}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{user.lastLogin ?? "Never"}</td>
                  <td className="px-4 py-3">
                    <ActionsMenu user={user} onEdit={() => handleEditUser(user)} onRefresh={refresh} />
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
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
