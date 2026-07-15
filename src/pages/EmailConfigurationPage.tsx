"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { ChevronRight, Save, Send, Mail, ShieldCheck, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"

import {
  getEmailConfig,
  updateEmailConfig,
  sendTestConfigEmail,
  type EmailConfig,
  type EmailProviderOption,
} from "@/lib/emailApi"

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

export default function EmailConfigurationPage() {
  const [loading, setLoading] = useState(true)
  const [dbUnreachable, setDbUnreachable] = useState(false)
  const [providers, setProviders] = useState<EmailProviderOption[]>([])
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getEmailConfig()
    if (res.success && res.data) {
      setConfig(res.data)
      setProviders(res.providers || [])
      setDbUnreachable(false)
    } else {
      setDbUnreachable(true)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const update = <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

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
    if (!testEmail.trim()) {
      toast.error("Enter a recipient email first")
      return
    }
    setSendingTest(true)
    const res = await sendTestConfigEmail(testEmail.trim())
    setSendingTest(false)
    if (res.success) {
      toast.success("Test email queued", { description: `Sent to ${testEmail.trim()}` })
    } else {
      toast.error(res.error || "Failed to send test email")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6 max-w-4xl">
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          <Link to="/configuration" className="hover:text-slate-800">Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">Email Configuration</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-7 h-7 text-blue-600" />
              Email Configuration
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provider, sender identity, branding and delivery defaults for every email the platform sends.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/configuration/email-templates" className="text-sm text-blue-600 hover:underline">Templates</Link>
            <Link to="/configuration/email-logs" className="text-sm text-blue-600 hover:underline">Logs</Link>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && dbUnreachable && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 mb-6">
            The email database isn't reachable right now, so configuration can't be loaded or saved yet.
            Once the database connection is fixed, refresh this page.
          </div>
        )}

        {!loading && config && (
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

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
