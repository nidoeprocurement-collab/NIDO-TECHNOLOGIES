"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import {
  ChevronRight, Save, Send, Mail, ShieldCheck, KeyRound,
  Eye, Code2, History, RefreshCw, Search, Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import {
  getEmailConfig, updateEmailConfig, sendTestConfigEmail,
  listEmailTemplates, getEmailTemplate, updateEmailTemplate, sendTemplateTest,
  listEmailLogs, getEmailLog, resendEmailLog, downloadEmailLogUrl,
  type EmailConfig, type EmailProviderOption, type EmailTemplate,
  type EmailTemplateDetail, type EmailLog, type EmailLogStatus,
} from "@/lib/emailApi"

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL_TYPES: { key: string; label: string }[] = [
  { key: "welcome_email",              label: "Welcome Email" },
  { key: "user_invitation",            label: "User Invitation" },
  { key: "password_reset",             label: "Password Reset" },
  { key: "account_activation",         label: "Account Activation" },
  { key: "otp_verification",           label: "OTP Verification" },
  { key: "purchase_request_created",   label: "Purchase Request Created" },
  { key: "purchase_request_approved",  label: "Purchase Request Approved" },
  { key: "purchase_order",             label: "Purchase Order" },
  { key: "invoice_generated",          label: "Invoice Generated" },
  { key: "payment_reminder",           label: "Payment Reminder" },
  { key: "contract_assigned",          label: "Contract Assigned" },
  { key: "contract_renewal_reminder",  label: "Contract Renewal Reminder" },
  { key: "service_request_created",    label: "Service Request Created" },
  { key: "service_request_updated",    label: "Service Request Updated" },
  { key: "support_ticket_created",     label: "Support Ticket Created" },
  { key: "support_ticket_updated",     label: "Support Ticket Updated" },
  { key: "approval_request",           label: "Approval Request" },
  { key: "approval_completed",         label: "Approval Completed" },
  { key: "vendor_invitation",          label: "Vendor Invitation" },
  { key: "client_invitation",          label: "Client Invitation" },
  { key: "general_notification",       label: "General Notification" },
]

const STATUS_STYLES: Record<EmailLogStatus, string> = {
  pending:   "bg-slate-100 text-slate-700",
  sending:   "bg-blue-100 text-blue-700",
  sent:      "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function DbWarning({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 mb-6">
      {message}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailConfigurationPage() {

  // ── Settings tab state ──────────────────────────────────────────────────────
  const [cfgLoading, setCfgLoading]       = useState(true)
  const [cfgUnreachable, setCfgUnreachable] = useState(false)
  const [providers, setProviders]         = useState<EmailProviderOption[]>([])
  const [config, setConfig]               = useState<EmailConfig | null>(null)
  const [apiKeyInput, setApiKeyInput]     = useState("")
  const [testEmail, setTestEmail]         = useState("")
  const [saving, setSaving]               = useState(false)
  const [sendingTest, setSendingTest]     = useState(false)

  const loadConfig = async () => {
    setCfgLoading(true)
    const res = await getEmailConfig()
    if (res.success && res.data) {
      setConfig(res.data)
      setProviders(res.providers || [])
      setCfgUnreachable(false)
    } else {
      setCfgUnreachable(true)
    }
    setCfgLoading(false)
  }

  useEffect(() => { loadConfig() }, [])

  const update = <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) =>
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev))

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    const res = await updateEmailConfig({
      provider: config.provider,
      senderName: config.sender_name,
      senderEmail: config.sender_email,
      replyToEmail: config.reply_to_email,
      supportEmail: config.support_email,
      companyLogoUrl: config.company_logo_url,
      emailFooter: config.email_footer,
      defaultSignature: config.default_signature,
      defaultLanguage: config.default_language,
      defaultTimezone: config.default_timezone,
      rateLimitPerHour: config.rate_limit_per_hour,
      retryCount: config.retry_count,
      retryIntervalSeconds: config.retry_interval_seconds,
      enabled: config.enabled,
      disabledTypes: config.disabled_types,
      apiKey: apiKeyInput.trim() || undefined,
      updatedBy: "admin",
    })
    setSaving(false)
    if (res.success && res.data) {
      setConfig(res.data)
      setApiKeyInput("")
      toast.success("Email configuration saved")
    } else {
      toast.error(res.error || "Failed to save email configuration")
    }
  }

  const handleTestSend = async () => {
    if (!testEmail.trim()) { toast.error("Enter a recipient email first"); return }
    setSendingTest(true)
    const res = await sendTestConfigEmail(testEmail.trim())
    setSendingTest(false)
    if (res.success) {
      toast.success("Test email queued", { description: `Sent to ${testEmail.trim()}` })
    } else {
      toast.error(res.error || "Failed to send test email")
    }
  }

  // ── Templates tab state ─────────────────────────────────────────────────────
  const [templates, setTemplates]         = useState<EmailTemplate[]>([])
  const [tplLoading, setTplLoading]       = useState(true)
  const [tplUnreachable, setTplUnreachable] = useState(false)
  const [selectedKey, setSelectedKey]     = useState<string | null>(null)
  const [detail, setDetail]               = useState<EmailTemplateDetail | null>(null)
  const [tplSaving, setTplSaving]         = useState(false)
  const [testOpen, setTestOpen]           = useState(false)
  const [tplTestEmail, setTplTestEmail]   = useState("")
  const [sampleVars, setSampleVars]       = useState<Record<string, string>>({})
  const [sendingTplTest, setSendingTplTest] = useState(false)
  const [previewOpen, setPreviewOpen]     = useState(false)
  const [historyOpen, setHistoryOpen]     = useState(false)
  const [historyVersion, setHistoryVersion] = useState<import("@/lib/emailApi").EmailTemplateVersion | null>(null)

  const loadTemplates = async () => {
    setTplLoading(true)
    const res = await listEmailTemplates()
    if (res.success && res.data) {
      setTemplates(res.data)
      setTplUnreachable(false)
      if (!selectedKey && res.data.length) setSelectedKey(res.data[0].key)
    } else {
      setTplUnreachable(true)
    }
    setTplLoading(false)
  }

  useEffect(() => { loadTemplates() }, [])

  useEffect(() => {
    if (!selectedKey) return
    getEmailTemplate(selectedKey).then((res) => {
      if (res.success && res.data) {
        setDetail(res.data)
        const vars: Record<string, string> = {}
        res.data.detectedVariables.forEach((v) => { vars[v] = "" })
        setSampleVars(vars)
      }
    })
  }, [selectedKey])

  const handleTplSave = async () => {
    if (!detail) return
    setTplSaving(true)
    const res = await updateEmailTemplate(detail.key, {
      name: detail.name,
      category: detail.category,
      subject: detail.subject,
      htmlBody: detail.html_body,
      textBody: detail.text_body,
      enabled: detail.enabled,
      updatedBy: "admin",
    })
    setTplSaving(false)
    if (res.success && res.data) {
      toast.success("Template saved", { description: `Version ${res.data.version}` })
      loadTemplates()
      const refreshed = await getEmailTemplate(detail.key)
      if (refreshed.success && refreshed.data) setDetail(refreshed.data)
    } else {
      toast.error(res.error || "Failed to save template")
    }
  }

  const handleTplTestSend = async () => {
    if (!detail || !tplTestEmail.trim()) return
    setSendingTplTest(true)
    const res = await sendTemplateTest(detail.key, tplTestEmail.trim(), sampleVars)
    setSendingTplTest(false)
    if (res.success) {
      toast.success("Test email queued", { description: `Sent to ${tplTestEmail.trim()}` })
      setTestOpen(false)
    } else {
      toast.error(res.error || "Failed to send test email")
    }
  }

  const previewHtml = detail
    ? Object.entries(sampleVars).reduce(
        (html, [k, v]) => html.replaceAll(`{{${k}}}`, v || `{{${k}}}`),
        detail.html_body,
      )
    : ""

  // ── Logs tab state ──────────────────────────────────────────────────────────
  const [logs, setLogs]                   = useState<EmailLog[]>([])
  const [logsLoading, setLogsLoading]     = useState(true)
  const [logsUnreachable, setLogsUnreachable] = useState(false)
  const [logSearch, setLogSearch]         = useState("")
  const [logStatus, setLogStatus]         = useState<string>("all")
  const [logTotal, setLogTotal]           = useState(0)
  const [viewing, setViewing]             = useState<any>(null)
  const [resendingId, setResendingId]     = useState<string | null>(null)

  const loadLogs = async () => {
    setLogsLoading(true)
    const res = await listEmailLogs({
      status: logStatus === "all" ? undefined : logStatus,
      search: logSearch || undefined,
      limit: 50,
    })
    if (res.success && res.data) {
      setLogs(res.data)
      setLogTotal(res.pagination?.total || res.data.length)
      setLogsUnreachable(false)
    } else {
      setLogsUnreachable(true)
    }
    setLogsLoading(false)
  }

  useEffect(() => { loadLogs() }, [logStatus])

  const handleResend = async (id: string) => {
    setResendingId(id)
    const res = await resendEmailLog(id)
    setResendingId(null)
    if (res.success) {
      toast.success("Resend triggered")
      loadLogs()
    } else {
      toast.error(res.error || "Resend failed")
    }
  }

  const handleViewLog = async (id: string) => {
    const res = await getEmailLog(id)
    if (res.success && res.data) setViewing(res.data)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          <Link to="/configuration" className="hover:text-slate-800">Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">Email Configuration</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Mail className="w-7 h-7 text-blue-600" />
          Email Configuration
        </h1>

        {/* Tabs */}
        <Tabs defaultValue="settings">
          <TabsList className="mb-6">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* ── Settings tab ─────────────────────────────────────────────── */}
          <TabsContent value="settings">
            <div className="max-w-4xl">
              <p className="text-sm text-slate-500 mb-6">
                Provider, sender identity, branding and delivery defaults for every email the platform sends.
              </p>

              {cfgLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!cfgLoading && cfgUnreachable && (
                <DbWarning message="The email database isn't reachable right now, so configuration can't be loaded or saved yet. Once the database connection is fixed, refresh this page." />
              )}

              {!cfgLoading && config && (
                <div className="space-y-6">
                  <Section title="Service status" description="Turn the entire Email Service on or off.">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Email sending enabled</div>
                        <div className="text-sm text-muted-foreground">When off, all send attempts are rejected platform-wide.</div>
                      </div>
                      <Switch checked={config.enabled} onCheckedChange={(v) => update("enabled", v)} />
                    </div>
                  </Section>

                  <Section title="Provider" description="Resend is the default provider. Others can be added later without changing any calling code.">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select value={config.provider} onValueChange={(v) => update("provider", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {providers.map((p) => (
                              <SelectItem key={p.value} value={p.value} disabled={!p.available}>
                                {p.label}{!p.available ? " (coming soon)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> API Key</Label>
                        <Input
                          type="password"
                          placeholder={config.hasApiKey ? "•••••••••••••••• (saved — leave blank to keep)" : "Enter provider API key"}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Encrypted at rest. Never shown once saved.
                        </p>
                      </div>
                    </div>
                  </Section>

                  <Section title="Sender identity">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sender name</Label>
                        <Input value={config.sender_name} onChange={(e) => update("sender_name", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sender email</Label>
                        <Input value={config.sender_email} onChange={(e) => update("sender_email", e.target.value)} placeholder="noreply@yourcompany.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Reply-to email</Label>
                        <Input value={config.reply_to_email} onChange={(e) => update("reply_to_email", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Support email</Label>
                        <Input value={config.support_email} onChange={(e) => update("support_email", e.target.value)} />
                      </div>
                    </div>
                  </Section>

                  <Section title="Branding" description="Applied to every email's header and footer.">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Company logo URL</Label>
                        <Input value={config.company_logo_url} onChange={(e) => update("company_logo_url", e.target.value)} placeholder="https://…/logo.png" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Email footer text</Label>
                        <Textarea value={config.email_footer} onChange={(e) => update("email_footer", e.target.value)} rows={2} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Default signature</Label>
                        <Textarea value={config.default_signature} onChange={(e) => update("default_signature", e.target.value)} rows={2} />
                      </div>
                    </div>
                  </Section>

                  <Section title="Defaults">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Default language</Label>
                        <Input value={config.default_language} onChange={(e) => update("default_language", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Default timezone</Label>
                        <Input value={config.default_timezone} onChange={(e) => update("default_timezone", e.target.value)} />
                      </div>
                    </div>
                  </Section>

                  <Section title="Delivery & retry policy">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Rate limit (per hour)</Label>
                        <Input type="number" min={1} value={config.rate_limit_per_hour}
                          onChange={(e) => update("rate_limit_per_hour", Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Retry count</Label>
                        <Input type="number" min={0} max={10} value={config.retry_count}
                          onChange={(e) => update("retry_count", Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Retry interval (seconds)</Label>
                        <Input type="number" min={5} value={config.retry_interval_seconds}
                          onChange={(e) => update("retry_interval_seconds", Number(e.target.value))} />
                      </div>
                    </div>
                  </Section>

                  <Section title="Send a test email" description="Verifies your provider and branding end-to-end.">
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="you@yourcompany.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="max-w-sm"
                      />
                      <Button variant="outline" onClick={handleTestSend} disabled={sendingTest}>
                        <Send className="w-4 h-4 mr-2" /> {sendingTest ? "Sending…" : "Send Test Email"}
                      </Button>
                    </div>
                  </Section>

                  <Section
                    title="Email type controls"
                    description="Disable specific email types platform-wide. Disabled types are silently dropped even when a module tries to send them."
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {EMAIL_TYPES.map(({ key, label }) => {
                        const disabled = config.disabled_types.includes(key)
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={!disabled}
                              onCheckedChange={(enabled) =>
                                update(
                                  "disabled_types",
                                  enabled
                                    ? config.disabled_types.filter((t) => t !== key)
                                    : [...config.disabled_types, key],
                                )
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </Section>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Templates tab ────────────────────────────────────────────── */}
          <TabsContent value="templates">
            {!tplLoading && tplUnreachable && (
              <DbWarning message="The email database isn't reachable right now, so templates can't be loaded yet." />
            )}
            {!tplLoading && !tplUnreachable && (
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                <div className="border rounded-lg divide-y overflow-hidden max-h-[70vh] overflow-y-auto">
                  {templates.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setSelectedKey(t.key)}
                      className={`w-full text-left p-2 hover:bg-slate-50 transition-colors ${selectedKey === t.key ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{t.name}</span>
                        {!t.enabled && <Badge variant="secondary" className="text-xs">Off</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.category}</div>
                    </button>
                  ))}
                </div>

                {detail && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">{detail.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {detail.category} · v{detail.version} · key: <code className="text-xs">{detail.key}</code>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Enabled</Label>
                        <Switch checked={detail.enabled} onCheckedChange={(v) => setDetail({ ...detail, enabled: v })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input value={detail.subject} onChange={(e) => setDetail({ ...detail, subject: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Code2 className="w-3.5 h-3.5" /> HTML body</Label>
                      <Textarea
                        rows={14}
                        className="font-mono text-xs"
                        value={detail.html_body}
                        onChange={(e) => setDetail({ ...detail, html_body: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Plain-text body</Label>
                      <Textarea
                        rows={4}
                        value={detail.text_body}
                        onChange={(e) => setDetail({ ...detail, text_body: e.target.value })}
                      />
                    </div>

                    {detail.detectedVariables.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Variables: {detail.detectedVariables.map((v) => (
                          <Badge key={v} variant="outline" className="mx-1 font-mono">{`{{${v}}}`}</Badge>
                        ))}
                      </div>
                    )}

                    {detail.versions.length > 0 && (
                      <button
                        onClick={() => setHistoryOpen(true)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" /> View {detail.versions.length} previous version(s)
                      </button>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleTplSave} disabled={tplSaving}>
                        <Save className="w-4 h-4 mr-2" /> {tplSaving ? "Saving…" : "Save Template"}
                      </Button>
                      <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </Button>
                      <Button variant="outline" onClick={() => setTestOpen(true)}>
                        <Send className="w-4 h-4 mr-2" /> Test Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Logs tab ─────────────────────────────────────────────────── */}
          <TabsContent value="logs">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Monitor sent emails, delivery statuses and resend failures.</p>
              <Button variant="outline" onClick={loadLogs}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>

            {!logsLoading && logsUnreachable && (
              <DbWarning message="The email database isn't reachable right now, so logs can't be loaded yet." />
            )}

            {!logsUnreachable && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Search recipient or subject…"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadLogs()}
                    />
                  </div>
                  <Select value={logStatus} onValueChange={setLogStatus}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadLogs}>Search</Button>
                  <span className="text-sm text-muted-foreground ml-auto">{logTotal} total</span>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="text-left p-2">Recipient</th>
                        <th className="text-left p-2">Subject</th>
                        <th className="text-left p-2">Template</th>
                        <th className="text-left p-2">Trigger</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Attempts</th>
                        <th className="text-left p-2">Sent</th>
                        <th className="text-right p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2">{log.to_email}</td>
                          <td className="p-2 max-w-[220px] truncate">{log.subject}</td>
                          <td className="p-2 text-xs text-muted-foreground">{log.template_key}</td>
                          <td className="p-2 text-xs text-muted-foreground">{log.trigger_module}</td>
                          <td className="p-2">
                            <Badge className={STATUS_STYLES[log.status]}>{log.status}</Badge>
                            {log.last_error && (
                              <div className="text-xs text-red-500 max-w-[180px] truncate" title={log.last_error}>
                                {log.last_error}
                              </div>
                            )}
                          </td>
                          <td className="p-2">{log.attempts}</td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                          </td>
                          <td className="p-2 text-right space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => handleViewLog(log.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <a href={downloadEmailLogUrl(log.id)} target="_blank" rel="noreferrer">
                              <Button size="icon" variant="ghost"><Download className="w-4 h-4" /></Button>
                            </a>
                            {(log.status === "failed" || log.status === "pending") && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={resendingId === log.id}
                                onClick={() => handleResend(log.id)}
                              >
                                <RefreshCw className={`w-4 h-4 ${resendingId === log.id ? "animate-spin" : ""}`} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!logsLoading && logs.length === 0 && (
                        <tr><td colSpan={8} className="p-2 text-center text-muted-foreground">No emails yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Templates dialogs ────────────────────────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) setHistoryVersion(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4" /> Version history — {detail?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <div className="border rounded-lg divide-y overflow-hidden">
              {detail?.versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setHistoryVersion(v)}
                  className={`w-full text-left p-2 hover:bg-slate-50 transition-colors text-sm ${historyVersion?.id === v.id ? "bg-blue-50" : ""}`}
                >
                  <div className="font-medium">v{v.version}</div>
                  <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                  {v.created_by && <div className="text-xs text-muted-foreground">by {v.created_by}</div>}
                </button>
              ))}
            </div>
            {historyVersion ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Subject</span>
                  <div className="mt-1 font-medium">{historyVersion.subject}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">HTML body</span>
                  <pre className="mt-1 text-xs font-mono bg-slate-50 border rounded p-2 max-h-48 overflow-auto whitespace-pre-wrap">{historyVersion.html_body}</pre>
                </div>
                {historyVersion.text_body && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Plain-text body</span>
                    <pre className="mt-1 text-xs font-mono bg-slate-50 border rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap">{historyVersion.text_body}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center justify-center h-32">
                Select a version to preview it
              </div>
            )}
          </div>
          <DialogFooter>
            {historyVersion && detail && (
              <Button
                variant="outline"
                onClick={() => {
                  setDetail({ ...detail, subject: historyVersion.subject, html_body: historyVersion.html_body, text_body: historyVersion.text_body })
                  setHistoryOpen(false)
                  setHistoryVersion(null)
                }}
              >
                Restore this version
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setHistoryOpen(false); setHistoryVersion(null) }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview: {detail?.subject}</DialogTitle></DialogHeader>
          <iframe title="preview" className="w-full h-[60vh] border rounded" srcDoc={previewHtml} />
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send test email — {detail?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input value={tplTestEmail} onChange={(e) => setTplTestEmail(e.target.value)} placeholder="you@yourcompany.com" />
            </div>
            {detail?.detectedVariables.map((v) => (
              <div key={v} className="space-y-1">
                <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                <Input
                  value={sampleVars[v] || ""}
                  onChange={(e) => setSampleVars((prev) => ({ ...prev, [v]: e.target.value }))}
                  placeholder={`Sample value for ${v}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleTplTestSend} disabled={sendingTplTest}>
              {sendingTplTest ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Logs dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewing?.subject}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">To:</span> {viewing.to_email}</div>
              <div><span className="text-muted-foreground">Status:</span> {viewing.status}</div>
              {viewing.last_error && <div className="text-red-600"><span className="text-muted-foreground">Error:</span> {viewing.last_error}</div>}
              <iframe title="body" className="w-full h-[50vh] border rounded" srcDoc={viewing.html_body} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
