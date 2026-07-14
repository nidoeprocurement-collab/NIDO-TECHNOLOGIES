import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Eye, Save, Upload, AlertCircle, RotateCcw } from "lucide-react"
import { useConfig } from "@/contexts/ConfigContext"
import type { GeneralSettings } from "@/lib/configService"

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-2 space-y-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  label, description, checked, onCheckedChange,
}: {
  label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function GeneralSettingsPage() {
  // `config` is the last-saved (committed) snapshot — what the rest of the
  // app sees.  `draft` is the local working copy shown in this form only.
  // Nothing propagates app-wide until the user clicks Save Changes.
  const { config, commitSettings } = useConfig()

  const [draft, setDraft] = useState<GeneralSettings>(() => config)

  // Keep draft in sync when config changes from outside (e.g. cross-tab save).
  useEffect(() => {
    setDraft(config)
  }, [config])

  useEffect(() => {
    document.title = "General Settings — " + draft.organization.displayName
  }, [draft.organization.displayName])

  // Patch a section in the local draft only — nothing touches the real config.
  const update = <K extends keyof GeneralSettings>(section: K, patch: Partial<GeneralSettings[K]>) => {
    setDraft(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  // True when the local draft differs from what is saved.
  const isDirty = JSON.stringify(draft) !== JSON.stringify(config)

  const handleSave = () => {
    commitSettings(draft)
    toast.success("Settings saved", { description: "Changes applied across the entire platform." })
  }

  const handleDiscard = () => {
    setDraft(config)
    toast.message("Changes discarded", { description: "Settings reverted to last saved values." })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      update("organization", { logoUrl: dataUrl })
      toast.success("Logo uploaded", { description: "Save to apply it across the platform." })
    }
    reader.readAsDataURL(file)
  }

  const { organization: org, theme, localization, procurement, notifications, security } = draft

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">General Settings</h1>
          <p className="text-muted-foreground">
            Global configuration engine — changes apply across the entire platform in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle size={14} />
              Unsaved changes
            </div>
          )}
          <Button variant="outline" onClick={() => toast.message(org.companyName, { description: `${org.email} • ${org.phone}` })}>
            <Eye className="mr-2 h-4 w-4" />
            View Company Profile
          </Button>
          {isDirty && (
            <Button variant="outline" onClick={handleDiscard}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Discard
            </Button>
          )}
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="organization">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="theme">Theme & Appearance</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="procurement">Procurement Defaults</TabsTrigger>
          <TabsTrigger value="notifications">Notifications & Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ── Organization ────────────────────────────────────────────────── */}
        <TabsContent value="organization" className="space-y-6 mt-4">
          <Section title="Brand & Identity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Company Name</Label>
                <Input value={org.companyName} onChange={e => update("organization", { companyName: e.target.value })} placeholder="Legal company name" />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Display Name</Label>
                <Input value={org.displayName} onChange={e => update("organization", { displayName: e.target.value })} placeholder="Short name shown in UI" />
              </div>
            </div>

            {/* Logo upload */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 font-medium">Company Logo</h4>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border overflow-hidden bg-gray-50">
                  {org.logoUrl
                    ? <img src={org.logoUrl} alt="Company Logo" className="h-full w-full object-contain" />
                    : <span className="text-xs text-muted-foreground text-center px-2">No logo</span>}
                </div>
                <div>
                  <label htmlFor="logo-upload">
                    <Button variant="outline" asChild>
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <p className="mt-1 text-xs text-muted-foreground">PNG, SVG or JPG. Shown in sidebar, login page, and PDF documents.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Legal & Tax Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">GST Number</Label>
                <Input value={org.gstNumber} onChange={e => update("organization", { gstNumber: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">PAN Number</Label>
                <Input value={org.panNumber} onChange={e => update("organization", { panNumber: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">CIN</Label>
                <Input value={org.cin} onChange={e => update("organization", { cin: e.target.value })} placeholder="Corporate Identification Number" />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Industry</Label>
                <Input value={org.industry} onChange={e => update("organization", { industry: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Fiscal Year Start</Label>
                <Select value={org.fiscalYearStart} onValueChange={v => update("organization", { fiscalYearStart: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["January", "April", "July", "October"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Phone</Label>
                <Input value={org.phone} onChange={e => update("organization", { phone: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Support Phone</Label>
                <Input value={org.supportPhone} onChange={e => update("organization", { supportPhone: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Email</Label>
                <Input type="email" value={org.email} onChange={e => update("organization", { email: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Support Email</Label>
                <Input type="email" value={org.supportEmail} onChange={e => update("organization", { supportEmail: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Website</Label>
                <Input value={org.website} onChange={e => update("organization", { website: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Addresses">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Registered Address</Label>
                <Textarea rows={3} value={org.registeredAddress} onChange={e => update("organization", { registeredAddress: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Billing Address</Label>
                <Textarea rows={3} value={org.billingAddress} onChange={e => update("organization", { billingAddress: e.target.value })} placeholder="Leave blank to use registered address" />
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* ── Theme & Appearance ───────────────────────────────────────────── */}
        <TabsContent value="theme" className="space-y-6 mt-4">
          <Section title="Appearance" description="Changes apply immediately — no reload required.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Theme Mode</Label>
                <Select value={theme.mode} onValueChange={v => update("theme", { mode: v as typeof theme.mode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Font Size</Label>
                <Select value={theme.fontSize} onValueChange={v => update("theme", { fontSize: v as typeof theme.fontSize })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (13px)</SelectItem>
                    <SelectItem value="medium">Medium (15px)</SelectItem>
                    <SelectItem value="large">Large (17px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Theme changes apply immediately. Save to make them permanent.
            </p>
          </Section>
        </TabsContent>

        {/* ── Localization ─────────────────────────────────────────────────── */}
        <TabsContent value="localization" className="space-y-6 mt-4">
          <Section title="Language & Region" description="All dates, amounts, and reports use these settings.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Language</Label>
                <Select value={localization.language} onValueChange={v => update("localization", { language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English (India)">English (India)</SelectItem>
                    <SelectItem value="English (US)">English (US)</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Timezone</Label>
                <Select value={localization.timezone} onValueChange={v => update("localization", { timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata (IST, GMT+5:30)">Asia/Kolkata (IST, GMT+5:30)</SelectItem>
                    <SelectItem value="Asia/Dubai (GST, GMT+4:00)">Asia/Dubai (GST, GMT+4:00)</SelectItem>
                    <SelectItem value="Europe/London (GMT+0:00)">Europe/London (GMT+0:00)</SelectItem>
                    <SelectItem value="America/New_York (EST, GMT-5:00)">America/New_York (EST, GMT-5:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Date Format</Label>
                <Select value={localization.dateFormat} onValueChange={v => update("localization", { dateFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                    <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Time Format</Label>
                <Select value={localization.timeFormat} onValueChange={v => update("localization", { timeFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Currency</Label>
                <Select value={localization.currency} onValueChange={v => {
                  const sym = v.match(/\((.+?)\)/)?.[1] ?? v
                  update("localization", { currency: v, currencySymbol: sym })
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR (₹)">INR (₹) — Indian Rupee</SelectItem>
                    <SelectItem value="USD ($)">USD ($) — US Dollar</SelectItem>
                    <SelectItem value="EUR (€)">EUR (€) — Euro</SelectItem>
                    <SelectItem value="GBP (£)">GBP (£) — British Pound</SelectItem>
                    <SelectItem value="AED (د.إ)">AED (د.إ) — UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Number Format</Label>
                <Select value={localization.numberFormat} onValueChange={v => update("localization", { numberFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1,23,456.00 (Indian)">1,23,456.00 (Indian)</SelectItem>
                    <SelectItem value="123,456.00 (International)">123,456.00 (International)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Week Start Day</Label>
                <Select value={localization.weekStartDay} onValueChange={v => update("localization", { weekStartDay: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Measurement Units</Label>
                <Select value={localization.measurementUnit} onValueChange={v => update("localization", { measurementUnit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Metric">Metric (kg, km, cm)</SelectItem>
                    <SelectItem value="Imperial">Imperial (lb, mi, in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* ── Procurement Defaults ─────────────────────────────────────────── */}
        <TabsContent value="procurement" className="space-y-6 mt-4">
          <Section title="Order Defaults" description="Pre-filled values used when creating new procurement documents.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Currency</Label>
                <Select value={procurement.defaultCurrency} onValueChange={v => update("procurement", { defaultCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                    <SelectItem value="USD ($)">USD ($)</SelectItem>
                    <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                    <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Payment Terms</Label>
                <Select value={procurement.defaultPaymentTerms} onValueChange={v => update("procurement", { defaultPaymentTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15 (Payment due in 15 days)">Net 15</SelectItem>
                    <SelectItem value="Net 30 (Payment due in 30 days)">Net 30</SelectItem>
                    <SelectItem value="Net 45 (Payment due in 45 days)">Net 45</SelectItem>
                    <SelectItem value="Net 60 (Payment due in 60 days)">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Delivery Terms</Label>
                <Select value={procurement.defaultDeliveryTerms} onValueChange={v => update("procurement", { defaultDeliveryTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ex-Works">Ex-Works</SelectItem>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="DDP">DDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Shipping Method</Label>
                <Select value={procurement.defaultShippingMethod} onValueChange={v => update("procurement", { defaultShippingMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Shipping">Standard Shipping</SelectItem>
                    <SelectItem value="Express Shipping">Express Shipping</SelectItem>
                    <SelectItem value="Vendor Pickup">Vendor Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default GST %</Label>
                <Input type="number" min={0} max={100} value={procurement.defaultGstPercent} onChange={e => update("procurement", { defaultGstPercent: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Lead Time (days)</Label>
                <Input type="number" min={0} value={procurement.defaultLeadTimeDays} onChange={e => update("procurement", { defaultLeadTimeDays: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default MOQ</Label>
                <Input type="number" min={1} value={procurement.defaultMOQ} onChange={e => update("procurement", { defaultMOQ: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Quote Validity (days)</Label>
                <Input type="number" min={1} value={procurement.defaultQuoteValidityDays} onChange={e => update("procurement", { defaultQuoteValidityDays: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Order Priority</Label>
                <Select value={procurement.defaultOrderPriority} onValueChange={v => update("procurement", { defaultOrderPriority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Approval Threshold ({localization.currencySymbol})</Label>
                <Input type="number" min={0} value={procurement.approvalThreshold} onChange={e => update("procurement", { approvalThreshold: e.target.value })} />
              </div>
            </div>
            <div className="pt-2 border-t">
              <ToggleRow
                label="Auto-approve orders under threshold"
                description="Orders below the approval threshold skip manual review."
                checked={procurement.autoApproveUnderThreshold}
                onCheckedChange={v => update("procurement", { autoApproveUnderThreshold: v })}
              />
              <ToggleRow
                label="Require vendor quote comparison"
                description="At least two vendor quotes must be attached before a PO can be created."
                checked={procurement.requireVendorQuoteComparison}
                onCheckedChange={v => update("procurement", { requireVendorQuoteComparison: v })}
              />
            </div>
          </Section>
        </TabsContent>

        {/* ── Notifications & Alerts ───────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6 mt-4">
          <Section title="Delivery Channels" description="Choose how platform notifications are delivered.">
            <ToggleRow label="Email notifications" checked={notifications.email} onCheckedChange={v => update("notifications", { email: v })} />
            <ToggleRow label="SMS notifications" checked={notifications.sms} onCheckedChange={v => update("notifications", { sms: v })} />
            <ToggleRow label="In-app notifications" checked={notifications.inApp} onCheckedChange={v => update("notifications", { inApp: v })} />
            <ToggleRow label="Push notifications" checked={notifications.pushNotifications} onCheckedChange={v => update("notifications", { pushNotifications: v })} />
          </Section>
          <Section title="Alert Types" description="Pick which events trigger a notification.">
            <ToggleRow label="Order status changes" description="Notify when a sub-order or master order status updates." checked={notifications.orderStatusChanges} onCheckedChange={v => update("notifications", { orderStatusChanges: v })} />
            <ToggleRow label="Approval requests" description="Notify approvers when an order needs their sign-off." checked={notifications.approvalRequests} onCheckedChange={v => update("notifications", { approvalRequests: v })} />
            <ToggleRow label="Budget & spend alerts" description="Notify when spend approaches or exceeds a set threshold." checked={notifications.budgetAlerts} onCheckedChange={v => update("notifications", { budgetAlerts: v })} />
            <ToggleRow label="Invoice notifications" description="Notify on invoice creation, approval, and overdue status." checked={notifications.invoiceNotifications} onCheckedChange={v => update("notifications", { invoiceNotifications: v })} />
            <ToggleRow label="Contract renewal alerts" description="Notify before contracts expire." checked={notifications.contractRenewalAlerts} onCheckedChange={v => update("notifications", { contractRenewalAlerts: v })} />
            <ToggleRow label="SLA alerts" description="Notify when SLA thresholds are approaching or breached." checked={notifications.slaAlerts} onCheckedChange={v => update("notifications", { slaAlerts: v })} />
            <ToggleRow label="Weekly summary email" description="A digest of orders, approvals, and vendor activity every Monday." checked={notifications.weeklySummary} onCheckedChange={v => update("notifications", { weeklySummary: v })} />
          </Section>
        </TabsContent>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6 mt-4">
          <Section title="Authentication" description="Protect accounts on this workspace.">
            <ToggleRow
              label="Require two-factor authentication"
              description="All users must verify sign-in with a second factor."
              checked={security.twoFactorEnabled}
              onCheckedChange={v => update("security", { twoFactorEnabled: v })}
            />
            <ToggleRow
              label="Require strong passwords"
              description="Passwords must include uppercase, lowercase, a number, and a symbol."
              checked={security.requireStrongPasswords}
              onCheckedChange={v => update("security", { requireStrongPasswords: v })}
            />
            <ToggleRow
              label="Audit logging"
              description="Record all admin actions for compliance and security review."
              checked={security.auditLogging}
              onCheckedChange={v => update("security", { auditLogging: v })}
            />
          </Section>
          <Section title="Session & Access">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Session Timeout (minutes)</Label>
                <Select value={security.sessionTimeoutMinutes} onValueChange={v => update("security", { sessionTimeoutMinutes: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="120">120</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Password Expiry (days)</Label>
                <Select value={security.passwordExpiryDays} onValueChange={v => update("security", { passwordExpiryDays: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Max Login Attempts</Label>
                <Select value={security.maxLoginAttempts} onValueChange={v => update("security", { maxLoginAttempts: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Account Lock Duration (minutes)</Label>
                <Select value={security.accountLockDurationMinutes} onValueChange={v => update("security", { accountLockDurationMinutes: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">File Upload Limit (MB)</Label>
                <Input type="number" min={1} value={security.fileUploadLimitMB} onChange={e => update("security", { fileUploadLimitMB: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Allowed File Types</Label>
              <Input value={security.allowedFileTypes} onChange={e => update("security", { allowedFileTypes: e.target.value })} placeholder=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" />
              <p className="mt-1 text-xs text-muted-foreground">Comma-separated file extensions.</p>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">IP Allowlist</Label>
              <Textarea
                placeholder="One IP address or CIDR range per line, e.g. 203.0.113.0/24"
                value={security.ipAllowlist}
                onChange={e => update("security", { ipAllowlist: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty to allow sign-in from any IP address.</p>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
