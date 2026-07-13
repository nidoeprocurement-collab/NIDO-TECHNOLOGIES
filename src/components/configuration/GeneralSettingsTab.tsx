import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Eye, Save, Upload } from "lucide-react"

const STORAGE_KEY = "nido_general_settings"

interface GeneralSettings {
  organization: {
    companyName: string
    gstNumber: string
    panNumber: string
    registeredAddress: string
    phone: string
    email: string
    website: string
    industry: string
    fiscalYearStart: string
  }
  theme: {
    mode: "light" | "dark" | "system"
    accentColor: string
    density: "comfortable" | "compact"
    fontSize: "small" | "medium" | "large"
  }
  localization: {
    language: string
    timezone: string
    dateFormat: string
    currency: string
    numberFormat: string
  }
  procurement: {
    defaultCurrency: string
    defaultPaymentTerms: string
    defaultShippingMethod: string
    defaultGstPercent: string
    approvalThreshold: string
    autoApproveUnderThreshold: boolean
    requireVendorQuoteComparison: boolean
  }
  notifications: {
    email: boolean
    sms: boolean
    inApp: boolean
    orderStatusChanges: boolean
    approvalRequests: boolean
    budgetAlerts: boolean
    weeklySummary: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeoutMinutes: string
    passwordExpiryDays: string
    requireStrongPasswords: boolean
    ipAllowlist: string
  }
}

const DEFAULTS: GeneralSettings = {
  organization: {
    companyName: "Nido Tech Pvt. Ltd.",
    gstNumber: "27AACCN1234A11ZD",
    panNumber: "AACCN1234A",
    registeredAddress: "123 Corporate Ave, Chennai",
    phone: "+91-44-1234-5678",
    email: "info@nido-tech.com",
    website: "www.nido-tech.com",
    industry: "Information Technology",
    fiscalYearStart: "April",
  },
  theme: {
    mode: "light",
    accentColor: "blue",
    density: "comfortable",
    fontSize: "medium",
  },
  localization: {
    language: "English (India)",
    timezone: "Asia/Kolkata (IST, GMT+5:30)",
    dateFormat: "DD/MM/YYYY",
    currency: "INR (₹)",
    numberFormat: "1,23,456.00 (Indian)",
  },
  procurement: {
    defaultCurrency: "INR (₹)",
    defaultPaymentTerms: "Net 30 (Payment due in 30 days)",
    defaultShippingMethod: "Standard Shipping",
    defaultGstPercent: "18",
    approvalThreshold: "50000",
    autoApproveUnderThreshold: true,
    requireVendorQuoteComparison: true,
  },
  notifications: {
    email: true,
    sms: false,
    inApp: true,
    orderStatusChanges: true,
    approvalRequests: true,
    budgetAlerts: true,
    weeklySummary: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMinutes: "30",
    passwordExpiryDays: "90",
    requireStrongPasswords: true,
    ipAllowlist: "",
  },
}

function loadSettings(): GeneralSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      organization: { ...DEFAULTS.organization, ...parsed.organization },
      theme: { ...DEFAULTS.theme, ...parsed.theme },
      localization: { ...DEFAULTS.localization, ...parsed.localization },
      procurement: { ...DEFAULTS.procurement, ...parsed.procurement },
      notifications: { ...DEFAULTS.notifications, ...parsed.notifications },
      security: { ...DEFAULTS.security, ...parsed.security },
    }
  } catch {
    return DEFAULTS
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onCheckedChange }: { label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function GeneralSettingsPage() {
  const [activeTab, setActiveTab] = useState("organization")
  const [settings, setSettings] = useState<GeneralSettings>(() => loadSettings())

  useEffect(() => {
    document.title = "General Settings — Nido Tech"
  }, [])

  const update = <K extends keyof GeneralSettings>(section: K, patch: Partial<GeneralSettings[K]>) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    toast.success("Settings saved", { description: "Your general settings have been updated." })
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            General Settings
          </h1>

          <p className="text-muted-foreground">
            Configure Nido Tech platform settings
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.message(settings.organization.companyName, { description: `${settings.organization.email} • ${settings.organization.phone}` })}>
            <Eye className="mr-2 h-4 w-4" />
            View Company Profile
          </Button>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="organization">
            Organization
          </TabsTrigger>

          <TabsTrigger value="theme">
            Theme & Appearance
          </TabsTrigger>

          <TabsTrigger value="localization">
            Localization
          </TabsTrigger>

          <TabsTrigger value="procurement">
            Procurement Defaults
          </TabsTrigger>

          <TabsTrigger value="notifications">
            Notification & Alerts
          </TabsTrigger>

          <TabsTrigger value="security">
            Security
          </TabsTrigger>
        </TabsList>

        {/* Organization */}
        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block text-sm font-medium">Company Name</Label>
              <Input value={settings.organization.companyName} onChange={e => update("organization", { companyName: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">GST Number</Label>
              <Input value={settings.organization.gstNumber} onChange={e => update("organization", { gstNumber: e.target.value })} />
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="mb-4 font-semibold">
              Nido Tech Company Logo
            </h3>

            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                Logo
              </div>

              <Button variant="outline" onClick={() => toast.info("Logo upload isn't wired to a file picker yet.")}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Nido Logo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block text-sm font-medium">PAN Number</Label>
              <Input value={settings.organization.panNumber} onChange={e => update("organization", { panNumber: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Registered Address</Label>
              <Input value={settings.organization.registeredAddress} onChange={e => update("organization", { registeredAddress: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Phone</Label>
              <Input value={settings.organization.phone} onChange={e => update("organization", { phone: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Email</Label>
              <Input type="email" value={settings.organization.email} onChange={e => update("organization", { email: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Website</Label>
              <Input value={settings.organization.website} onChange={e => update("organization", { website: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Industry</Label>
              <Input value={settings.organization.industry} onChange={e => update("organization", { industry: e.target.value })} />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Fiscal Year Start</Label>
              <Select value={settings.organization.fiscalYearStart} onValueChange={v => update("organization", { fiscalYearStart: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["January", "April", "July", "October"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Theme & Appearance */}
        <TabsContent value="theme" className="space-y-6">
          <Section title="Appearance" description="Control how the Nido Tech workspace looks for everyone on your team.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Theme Mode</Label>
                <Select value={settings.theme.mode} onValueChange={v => update("theme", { mode: v as GeneralSettings["theme"]["mode"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">Match System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Accent Color</Label>
                <Select value={settings.theme.accentColor} onValueChange={v => update("theme", { accentColor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Layout Density</Label>
                <Select value={settings.theme.density} onValueChange={v => update("theme", { density: v as GeneralSettings["theme"]["density"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Font Size</Label>
                <Select value={settings.theme.fontSize} onValueChange={v => update("theme", { fontSize: v as GeneralSettings["theme"]["fontSize"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white ${
                settings.theme.accentColor === "purple" ? "bg-purple-600" :
                settings.theme.accentColor === "green" ? "bg-green-600" :
                settings.theme.accentColor === "orange" ? "bg-orange-500" : "bg-blue-600"
              }`}>
                Sample Button
              </span>
              <span className="text-sm text-muted-foreground">{settings.theme.mode === "dark" ? "Dark mode" : settings.theme.mode === "system" ? "System default" : "Light mode"} · {settings.theme.density} · {settings.theme.fontSize} text</span>
            </div>
          </Section>
        </TabsContent>

        {/* Localization */}
        <TabsContent value="localization" className="space-y-6">
          <Section title="Language & Region" description="These defaults apply across orders, reports, and notifications.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Language</Label>
                <Select value={settings.localization.language} onValueChange={v => update("localization", { language: v })}>
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
                <Select value={settings.localization.timezone} onValueChange={v => update("localization", { timezone: v })}>
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
                <Select value={settings.localization.dateFormat} onValueChange={v => update("localization", { dateFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Currency</Label>
                <Select value={settings.localization.currency} onValueChange={v => update("localization", { currency: v })}>
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
                <Label className="mb-2 block text-sm font-medium">Number Format</Label>
                <Select value={settings.localization.numberFormat} onValueChange={v => update("localization", { numberFormat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1,23,456.00 (Indian)">1,23,456.00 (Indian)</SelectItem>
                    <SelectItem value="123,456.00 (International)">123,456.00 (International)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* Procurement Defaults */}
        <TabsContent value="procurement" className="space-y-6">
          <Section title="Order Defaults" description="Pre-filled values used when creating new orders and purchase orders.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Default Currency</Label>
                <Select value={settings.procurement.defaultCurrency} onValueChange={v => update("procurement", { defaultCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                    <SelectItem value="USD ($)">USD ($)</SelectItem>
                    <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Default Payment Terms</Label>
                <Select value={settings.procurement.defaultPaymentTerms} onValueChange={v => update("procurement", { defaultPaymentTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15 (Payment due in 15 days)">Net 15 (Payment due in 15 days)</SelectItem>
                    <SelectItem value="Net 30 (Payment due in 30 days)">Net 30 (Payment due in 30 days)</SelectItem>
                    <SelectItem value="Net 45 (Payment due in 45 days)">Net 45 (Payment due in 45 days)</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Default Shipping Method</Label>
                <Select value={settings.procurement.defaultShippingMethod} onValueChange={v => update("procurement", { defaultShippingMethod: v })}>
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
                <Input type="number" min={0} max={100} value={settings.procurement.defaultGstPercent} onChange={e => update("procurement", { defaultGstPercent: e.target.value })} />
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Approval Threshold (₹)</Label>
                <Input type="number" min={0} value={settings.procurement.approvalThreshold} onChange={e => update("procurement", { approvalThreshold: e.target.value })} />
              </div>
            </div>

            <div className="pt-2 border-t">
              <ToggleRow
                label="Auto-approve orders under threshold"
                description="Orders below the approval threshold skip manual review."
                checked={settings.procurement.autoApproveUnderThreshold}
                onCheckedChange={v => update("procurement", { autoApproveUnderThreshold: v })}
              />
              <ToggleRow
                label="Require vendor quote comparison"
                description="At least two vendor quotes must be attached before a PO can be created."
                checked={settings.procurement.requireVendorQuoteComparison}
                onCheckedChange={v => update("procurement", { requireVendorQuoteComparison: v })}
              />
            </div>
          </Section>
        </TabsContent>

        {/* Notification & Alerts */}
        <TabsContent value="notifications" className="space-y-6">
          <Section title="Delivery Channels" description="Choose how you want to be notified.">
            <ToggleRow label="Email notifications" checked={settings.notifications.email} onCheckedChange={v => update("notifications", { email: v })} />
            <ToggleRow label="SMS notifications" checked={settings.notifications.sms} onCheckedChange={v => update("notifications", { sms: v })} />
            <ToggleRow label="In-app notifications" checked={settings.notifications.inApp} onCheckedChange={v => update("notifications", { inApp: v })} />
          </Section>

          <Section title="Alert Types" description="Pick which events trigger a notification.">
            <ToggleRow label="Order status changes" description="Notify when a sub-order or master order status updates." checked={settings.notifications.orderStatusChanges} onCheckedChange={v => update("notifications", { orderStatusChanges: v })} />
            <ToggleRow label="Approval requests" description="Notify approvers when an order needs their sign-off." checked={settings.notifications.approvalRequests} onCheckedChange={v => update("notifications", { approvalRequests: v })} />
            <ToggleRow label="Budget & spend alerts" description="Notify when spend approaches or exceeds a set threshold." checked={settings.notifications.budgetAlerts} onCheckedChange={v => update("notifications", { budgetAlerts: v })} />
            <ToggleRow label="Weekly summary email" description="A digest of orders, approvals, and vendor activity every Monday." checked={settings.notifications.weeklySummary} onCheckedChange={v => update("notifications", { weeklySummary: v })} />
          </Section>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Section title="Authentication" description="Protect accounts on this workspace.">
            <ToggleRow
              label="Require two-factor authentication"
              description="All users must verify sign-in with a second factor."
              checked={settings.security.twoFactorEnabled}
              onCheckedChange={v => update("security", { twoFactorEnabled: v })}
            />
            <ToggleRow
              label="Require strong passwords"
              description="Passwords must include uppercase, lowercase, a number, and a symbol."
              checked={settings.security.requireStrongPasswords}
              onCheckedChange={v => update("security", { requireStrongPasswords: v })}
            />
          </Section>

          <Section title="Session & Access">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Session Timeout (minutes)</Label>
                <Select value={settings.security.sessionTimeoutMinutes} onValueChange={v => update("security", { sessionTimeoutMinutes: v })}>
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
                <Select value={settings.security.passwordExpiryDays} onValueChange={v => update("security", { passwordExpiryDays: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">IP Allowlist</Label>
              <Textarea
                placeholder="One IP address or CIDR range per line, e.g. 203.0.113.0/24"
                value={settings.security.ipAllowlist}
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
