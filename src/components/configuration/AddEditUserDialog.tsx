"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { SYSTEM_OWNER_ROLE, type NidoRole, type NidoUser } from "@/lib/nidoUsersStore"

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
  const [status, setStatus]           = useState<NidoUser["status"]>("Active")
  const [error, setError]             = useState("")

  const isEdit = !!user

  useEffect(() => {
    if (open) {
      setEmployeeId(user?.employeeId   ?? "")
      setName(      user?.name         ?? "")
      setEmail(     user?.email        ?? "")
      setPhone(     user?.phone        ?? "")
      setPassword(  "")           // never pre-fill password
      setRole(      user?.role         ?? roles[0]?.name ?? "")
      setJobTitle(  user?.jobTitle     ?? "")
      setDesignation(user?.designation ?? "")
      setDepartment(user?.department   ?? "")
      setStatus(    user?.status       ?? "Active")
      setError("")
    }
  }, [open, user, roles])

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    if (!EMAIL_RE.test(email.trim()))  { setError("Enter a valid email address.");  return; }
    if (!role)                         { setError("Select a role for this user.");  return; }
    if (!isEdit && !password.trim())   { setError("Password is required for new users."); return; }

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
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-44-1234-5678" />
          </div>

          {/* Row 3 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Employee ID</Label>
            <Input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-001" />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Role <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.filter(r => r.status === "Active" && r.name !== SYSTEM_OWNER_ROLE).map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label className="mb-2 block text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as NidoUser["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
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
