import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  fetchNidoAuditLogsFromSupabase,
  type SupabaseAuditLogEntry,
} from "@/lib/auditLogsApi";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<SupabaseAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prefix = eventFilter === "all" ? null : eventFilter;
      const rows = await fetchNidoAuditLogsFromSupabase({
        limit: 200,
        eventPrefix: prefix,
      });
      setLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (entry) =>
        entry.event_type.toLowerCase().includes(q) ||
        entry.outcome.toLowerCase().includes(q) ||
        (entry.target_email_masked ?? "").toLowerCase().includes(q) ||
        JSON.stringify(entry.details ?? {}).toLowerCase().includes(q),
    );
  }, [logs, search]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Server-recorded security, provisioning, role, user, and impersonation audit events from Supabase.
          </p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => void loadLogs()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search event, masked email, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Events" },
              { id: "nido_roles", label: "Roles" },
              { id: "nido_users", label: "Users" },
              { id: "client_", label: "Clients" },
              { id: "impersonation", label: "Impersonation" },
            ].map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={eventFilter === item.id ? "default" : "outline"}
                onClick={() => setEventFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Loading audit logs from Supabase...
                  </td>
                </tr>
              )}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No audit events match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.event_type}</td>
                    <td className="px-4 py-3">
                      {entry.outcome === "success" ? (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 gap-1">
                          <XCircle className="h-3 w-3" /> {entry.outcome}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.target_scope || "—"}</td>
                    <td className="px-4 py-3 text-xs">{entry.target_email_masked || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono max-w-md truncate">
                      {entry.details ? JSON.stringify(entry.details) : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
