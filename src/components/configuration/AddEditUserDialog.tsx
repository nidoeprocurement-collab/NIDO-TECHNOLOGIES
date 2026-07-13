"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { NidoRole, NidoUser } from "@/lib/nidoUsersStore"

interface AddEditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: NidoUser | null
  roles: NidoRole[]
  onSave: (values: Omit<NidoUser, "id">) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AddEditUserDialog({ open, onOpenChange, user, roles, onSave }: AddEditUserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [status, setStatus] = useState<"Active" | "Inactive">("Active")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "")
      setEmail(user?.email ?? "")
      setRole(user?.role ?? roles[0]?.name ?? "")
      setJobTitle(user?.jobTitle ?? "")
      setDepartment(user?.department ?? "")
      setStatus(user?.status ?? "Active")
      setError("")
    }
  }, [open, user, roles])

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.")
      return
    }
    if (!role) {
      setError("Select a role for this user.")
      return
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      role,
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      status,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update this user's details and role." : "Invite a new user to the platform and assign them a role."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@nidotech.com" />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Job Title</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Procurement Manager" />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Procurement" />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Inactive")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{user ? "Save Changes" : "Add User"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
