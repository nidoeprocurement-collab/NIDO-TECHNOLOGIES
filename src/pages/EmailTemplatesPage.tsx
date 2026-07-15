"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { ChevronRight, Send, Eye, Save, Code2, History, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

import {
  listEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  sendTemplateTest,
  type EmailTemplate,
  type EmailTemplateDetail,
} from "@/lib/emailApi"

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dbUnreachable, setDbUnreachable] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [detail, setDetail] = useState<EmailTemplateDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({})
  const [sendingTest, setSendingTest] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyVersion, setHistoryVersion] = useState<import("@/lib/emailApi").EmailTemplateVersion | null>(null)

  const loadList = async () => {
    setLoading(true)
    const res = await listEmailTemplates()
    if (res.success && res.data) {
      setTemplates(res.data)
      setDbUnreachable(false)
      if (!selectedKey && res.data.length) setSelectedKey(res.data[0].key)
    } else {
      setDbUnreachable(true)
    }
    setLoading(false)
  }

  useEffect(() => { loadList() }, [])

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

  const handleSave = async () => {
    if (!detail) return
    setSaving(true)
    const res = await updateEmailTemplate(detail.key, {
      name: detail.name,
      category: detail.category,
      subject: detail.subject,
      htmlBody: detail.html_body,
      textBody: detail.text_body,
      enabled: detail.enabled,
      updatedBy: "admin",
    })
    setSaving(false)
    if (res.success && res.data) {
      toast.success("Template saved", { description: `Version ${res.data.version}` })
      loadList()
      const refreshed = await getEmailTemplate(detail.key)
      if (refreshed.success && refreshed.data) setDetail(refreshed.data)
    } else {
      toast.error(res.error || "Failed to save template")
    }
  }

  const handleTestSend = async () => {
    if (!detail || !testEmail.trim()) return
    setSendingTest(true)
    const res = await sendTemplateTest(detail.key, testEmail.trim(), sampleVars)
    setSendingTest(false)
    if (res.success) {
      toast.success("Test email queued", { description: `Sent to ${testEmail.trim()}` })
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

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6">
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          <Link to="/configuration" className="hover:text-slate-800">Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/configuration/email-settings" className="hover:text-slate-800">Email Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">Email Templates</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Mail className="w-7 h-7 text-blue-600" /> Email Templates
        </h1>

        {!loading && dbUnreachable && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 mb-6">
            The email database isn't reachable right now, so templates can't be loaded yet.
          </div>
        )}

        {!loading && !dbUnreachable && (
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
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Template"}
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
      </div>

      {/* Version history dialog */}
      <Dialog open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) setHistoryVersion(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4" /> Version history — {detail?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            {/* version list */}
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
            {/* version detail */}
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
                  setDetail({
                    ...detail,
                    subject: historyVersion.subject,
                    html_body: historyVersion.html_body,
                    text_body: historyVersion.text_body,
                  })
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
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@yourcompany.com" />
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
            <Button onClick={handleTestSend} disabled={sendingTest}>
              {sendingTest ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
