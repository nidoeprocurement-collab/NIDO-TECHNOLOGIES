"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { getNextEmployeeId, SYSTEM_OWNER_ROLE, type NidoRole, type NidoUser } from "@/lib/nidoUsersStore"
import { sanitizePhoneNumber, isValidPhoneNumber } from "@/lib/phoneValidation"

interface AddEditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: NidoUser | null
  roles: NidoRole[]
  onSave: (values: Omit<NidoUser, "id">, options?: { sendInvitation: boolean }) => Promise<boolean | void> | boolean | void
  fullScreen?: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AddEditUserDialog({ open, onOpenChange, user, roles, onSave, fullScreen = false }: AddEditUserDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [sendInvitation, setSendInvitation] = useState(true)
  const [role, setRole] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [designation, setDesignation] = useState("")
  const [reportingManager, setReportingManager] = useState("")
  const [department, setDepartment] = useState("")
  const [dateOfJoining, setDateOfJoining] = useState("")
  const [status, setStatus] = useState<NidoUser["status"]>("Active")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEdit = !!user

  useEffect(() => {
    if (open) {
      const assignableRole = roles.find(
        r => r.status === "Active" && r.name !== SYSTEM_OWNER_ROLE,
      )?.name ?? ""
      setEmployeeId(user?.employeeId ?? getNextEmployeeId())
      setName(user?.name ?? "")
      setEmail(user?.email ?? "")
      setPhone(user?.phone ?? "")
      setPassword("")           // never pre-fill password
      setSendInvitation(true)
      setRole(user?.role ?? assignableRole)
      setJobTitle(user?.jobTitle ?? "")
      setDesignation(user?.designation ?? "")
      setReportingManager(user?.reportingManager ?? "")
      setDepartment(user?.department ?? "")
      setDateOfJoining(user?.dateOfJoining ?? user?.createdAt?.slice(0, 10) ?? new Date().toISOString().split("T")[0])
      setStatus(user?.status ?? "Active")
      setSubmitting(false)
      setError("")
    }
  }, [open, user, roles])

  const handleSubmit = async () => {
    if (submitting) return
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    if (!EMAIL_RE.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (!role) { setError("Select a role for this user."); return; }
    if (!isEdit && !sendInvitation) { setError("Send Invitation Email must be enabled for new internal users."); return; }
    if (role === SYSTEM_OWNER_ROLE) { setError("The System Owner role is reserved."); return; }
    if (phone && !isValidPhoneNumber(phone)) { setError("Phone number must contain exactly 10 digits."); return; }

    const now = new Date().toISOString().split("T")[0]

    setSubmitting(true)
    setError("")
    try {
      const result = await onSave(
        {
          employeeId: employeeId.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          // New users set their own password via onboarding; edits keep existing password if blank.
          password: isEdit ? (password.trim() || user?.password || "") : "",
          role,
          jobTitle: jobTitle.trim(),
          designation: designation.trim() || jobTitle.trim(),
          reportingManager: reportingManager.trim(),
          department: department.trim(),
          dateOfJoining: dateOfJoining || now,
          status,
          lastLogin: user?.lastLogin,
          createdAt: user?.createdAt ?? now,
          updatedAt: now,
          forcePasswordChange: isEdit ? (user?.forcePasswordChange ?? false) : true,
          invitationStatus: isEdit ? user?.invitationStatus : "sent",
          invitationSentAt: isEdit ? user?.invitationSentAt : new Date().toISOString(),
        },
        { sendInvitation },
      )
      if (result !== false) {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save user.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={fullScreen
        ? "fixed inset-0 left-0 top-0 z-50 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
        : "max-w-2xl"}>
        <DialogHeader className={fullScreen ? "shrink-0 border-b px-6 py-5 text-left sm:text-left" : undefined}>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details. Leave the password field blank to keep the current password."
              : "Create a new NIDO platform employee. An invitation email will be sent so they can set their own password."}
          </DialogDescription>
        </DialogHeader>

        <div className={fullScreen
          ? "grid flex-1 grid-cols-1 gap-5 overflow-y-auto px-6 py-6 md:grid-cols-2 lg:grid-cols-3"
          : "grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-2"}>
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
          {isEdit ? (
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Password <span className="text-xs text-muted-foreground">(blank = keep current)</span>
              </Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
          ) : (
            <div className="flex flex-col justify-center rounded-lg border border-border bg-muted/30 px-4 py-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvitation}
                  onChange={e => setSendInvitation(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">Send Invitation Email</span>
                  <span className="block text-xs text-muted-foreground">
                    User will set their own password via NIDO onboarding.
                  </span>
                </span>
              </label>
            </div>
          )}
          <div>
            <Label className="mb-2 block text-sm font-medium">Phone</Label>
            <Input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(sanitizePhoneNumber(e.target.value))} placeholder="10-digit phone number" />
          </div>

          {/* Row 3 */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Employee ID</Label>
            <Input
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="EMP-00001"
              disabled={!isEdit}
            />
            {!isEdit && <p className="mt-1 text-xs text-muted-foreground">Generated automatically from the next serial number.</p>}
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
          <div>
            <Label className="mb-2 block text-sm font-medium">Reporting Manager</Label>
            <Input value={reportingManager} onChange={e => setReportingManager(e.target.value)} placeholder="e.g. John Smith" />
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

        {error && <p className="px-6 text-sm text-red-600">{error}</p>}

        <DialogFooter className={fullScreen ? "shrink-0 border-t px-6 py-4" : undefined}>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting
              ? (isEdit ? "Saving..." : "Sending Invitation...")
              : (isEdit ? "Save Changes" : "Send Invitation & Add User")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
