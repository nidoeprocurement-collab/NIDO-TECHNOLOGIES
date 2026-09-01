"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { SYSTEM_OWNER_ROLE, type NidoRole, type NidoUser } from "@/lib/nidoUsersStore"
import { sanitizePhoneNumber } from "@/lib/phoneValidation"

interface AddEditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: NidoUser | null
  roles: NidoRole[]
  onSave: (values: Omit<NidoUser, "id">) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AddEditUserDialog({ open, onOpenChange, user, roles, onSave }: AddEditUserDialogProps) {
  const [employeeId, setEmployeeId]   = useState("")
  const [name, setName]               = useState("")
  const [email, setEmail]             = useState("")
  const [phone, setPhone]             = useState("")
  const [password, setPassword]       = useState("")
  const [role, setRole]               = useState("")
  const [jobTitle, setJobTitle]       = useState("")
  const [designation, setDesignation] = useState("")
  const [department, setDepartment]   = useState("")
  const [dateOfJoining, setDateOfJoining] = useState("")
  const [status, setStatus]           = useState<NidoUser["status"]>("Active")
  const [error, setError]             = useState("")

  const isEdit = !!user

  useEffect(() => {
    if (open) {
      const assignableRole = roles.find(
        r => r.status === "Active" && r.name !== SYSTEM_OWNER_ROLE,
      )?.name ?? ""
      setEmployeeId(user?.employeeId   ?? "")
      setName(      user?.name         ?? "")
      setEmail(     user?.email        ?? "")
      setPhone(     user?.phone        ?? "")
      setPassword(  "")           // never pre-fill password
      setRole(      user?.role         ?? assignableRole)
      setJobTitle(  user?.jobTitle     ?? "")
      setDesignation(user?.designation ?? "")
      setDepartment(user?.department   ?? "")
      setDateOfJoining(user?.dateOfJoining ?? user?.createdAt?.slice(0, 10) ?? new Date().toISOString().split("T")[0])
      setStatus(    user?.status       ?? "Active")
      setError("")
    }
  }, [open, user, roles])

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    if (!EMAIL_RE.test(email.trim()))  { setError("Enter a valid email address.");  return; }
    if (!role)                         { setError("Select a role for this user.");  return; }
    if (!isEdit && !password.trim())   { setError("Password is required for new users."); return; }
    if (role === SYSTEM_OWNER_ROLE)    { setError("The System Owner role is reserved."); return; }

    const now = new Date().toISOString().split("T")[0]

    onSave({
      employeeId:          employeeId.trim(),
      name:                name.trim(),
      email:               email.trim(),
      phone:               phone.trim(),
      // For edits: keep existing password if field left blank
      password:            password.trim() || user?.password || "Password@123",
      role,
      jobTitle:            jobTitle.trim(),
      designation:         designation.trim() || jobTitle.trim(),
      department:          department.trim(),
      dateOfJoining:       dateOfJoining || now,
      status,
      lastLogin:           user?.lastLogin,
      createdAt:           user?.createdAt ?? now,
      updatedAt:           now,
      forcePasswordChange: user?.forcePasswordChange ?? false,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details. Leave the password field blank to keep the current password."
              : "Create a new NIDO platform employee. They can log in immediately with the password you set."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Row 1 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Email <span className="text-red-500">*</span></Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@nidotech.com" />
          </div>

          {/* Row 2 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Password {isEdit ? <span className="text-xs text-muted-foreground">(blank = keep current)</span> : <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current" : "Min 6 characters"}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Phone</Label>
            <Input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(sanitizePhoneNumber(e.target.value))} placeholder="10-digit phone number" />
          </div>

          {/* Row 3 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Employee ID</Label>
            <Input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-001" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Role <span className="text-red-500">*</span></Label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {!role && <option value="">Select a role</option>}
              {roles.filter(r => r.status === "Active" && r.name !== SYSTEM_OWNER_ROLE).map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Row 4 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Job Title</Label>
            <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Procurement Manager" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Designation</Label>
            <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior Manager" />
          </div>

          {/* Row 5 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Department</Label>
            <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Procurement" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Date of Joining</Label>
            <Input type="date" value={dateOfJoining} onChange={e => setDateOfJoining(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Status</Label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as NidoUser["status"])}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Last Login <span className="text-xs text-muted-foreground">(system-managed)</span></Label>
            <Input value={user?.lastLogin || "Never"} disabled />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add User"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
