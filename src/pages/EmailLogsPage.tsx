"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { ChevronRight, RefreshCw, Search, Download, Eye, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import {
  listEmailLogs, getEmailLog, resendEmailLog, downloadEmailLogUrl,
  type EmailLog, type EmailLogStatus,
} from "@/lib/emailApi"

const STATUS_STYLES: Record<EmailLogStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dbUnreachable, setDbUnreachable] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [total, setTotal] = useState(0)
  const [viewing, setViewing] = useState<any>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await listEmailLogs({
      status: status === "all" ? undefined : status,
      search: search || undefined,
      limit: 50,
    })
    if (res.success && res.data) {
      setLogs(res.data)
      setTotal(res.pagination?.total || res.data.length)
      setDbUnreachable(false)
    } else {
      setDbUnreachable(true)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const handleResend = async (id: string) => {
    setResendingId(id)
    const res = await resendEmailLog(id)
    setResendingId(null)
    if (res.success) {
      toast.success("Resend triggered")
      load()
    } else {
      toast.error(res.error || "Resend failed")
    }
  }

  const handleView = async (id: string) => {
    const res = await getEmailLog(id)
    if (res.success && res.data) setViewing(res.data)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6">
        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          <Link to="/configuration" className="hover:text-slate-800">Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/configuration/email-settings" className="hover:text-slate-800">Email Configuration</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">Email Logs</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-7 h-7 text-blue-600" /> Email Logs
          </h1>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {!loading && dbUnreachable && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 mb-6">
            The email database isn't reachable right now, so logs can't be loaded yet.
          </div>
        )}

        {!dbUnreachable && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Search recipient or subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
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
              <Button variant="outline" onClick={load}>Search</Button>
              <span className="text-sm text-muted-foreground ml-auto">{total} total</span>
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
                        <Button size="icon" variant="ghost" onClick={() => handleView(log.id)}>
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
                  {!loading && logs.length === 0 && (
                    <tr><td colSpan={8} className="p-2 text-center text-muted-foreground">No emails yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

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
