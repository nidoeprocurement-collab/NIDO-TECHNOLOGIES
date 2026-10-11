import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Clock3, Eye, Loader2, Plus, RefreshCw, Save, ShieldAlert, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClients, type StoredClient } from "@/lib/clientStore";
import ServiceTicketAssignmentRules from "./ServiceTicketAssignmentRules";
import {
  autoAssignmentApi,
  type AssignmentConfig,
  type AssignmentEmployee,
  type AssignmentHistoryItem,
  type AssignmentPreview,
  type AssignmentRosterEmployee,
  type AssignmentTierConfig,
  type AssignmentTierName,
  type UnassignedOrder,
} from "@/lib/autoAssignmentApi";
import { getRoles, getUsers, NIDO_ROLES_EVENT, NIDO_USERS_EVENT, type NidoRole, type NidoUser } from "@/lib/nidoUsersStore";

type Panel = "rules" | "preview" | "history" | "service";
type HistoryFilters = {
  tier: string;
  employeeId: string;
  method: string;
  status: string;
  startDate: string;
  endDate: string;
};

const TIER_NAMES: AssignmentTierName[] = ["Premium", "Medium", "Standard"];
const EDIT_ROLES = new Set(["System Owner", "System Admin", "Procurement Manager", "Operations Manager", "Team Lead"]);
const EMPTY_FILTERS: HistoryFilters = {
  tier: "",
  employeeId: "",
  method: "",
  status: "",
  startDate: "",
  endDate: "",
};

function getRoster(users: NidoUser[], roles: NidoRole[]): AssignmentRosterEmployee[] {
  return users.map((user) => {
    const role = roles.find((candidate) => candidate.name === user.role);
    return {
      id: user.id,
      name: user.name || user.email || user.employeeId || "Unnamed employee",
      role: user.role || "",
      department: user.department || "",
      active: user.status === "Active",
      roleActive: !user.role || role?.status === "Active",
    };
  });
}

function getEmployeeFromRoster(id: string, roster: AssignmentRosterEmployee[]): AssignmentEmployee | null {
  const employee = roster.find((candidate) => candidate.id === id);
  if (!employee) return null;
  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    active: employee.active && employee.roleActive,
    sequence: 1,
  };
}

function canonicalTier(value: unknown): string {
  const tier = String(value || "").trim().toLowerCase();
  if (tier === "premium" || tier === "premium clients") return "Premium";
  if (tier === "medium" || tier === "medium clients") return "Medium";
  if (tier === "standard" || tier === "standard clients") return "Standard";
  return "";
}

function clientTier(client: StoredClient): string {
  return String(client.client_tier || client.tier || "");
}

function resequence(employees: AssignmentEmployee[]): AssignmentEmployee[] {
  return employees.map((employee, index) => ({ ...employee, sequence: index + 1 }));
}

function moveEmployee(tier: AssignmentTierConfig, index: number, direction: -1 | 1): AssignmentTierConfig {
  const next = [...tier.employees].sort((a, b) => a.sequence - b.sequence);
  const target = index + direction;
  if (target < 0 || target >= next.length) return tier;
  [next[index], next[target]] = [next[target], next[index]];
  return { ...tier, employees: resequence(next) };
}

function statusLabel(status: AssignmentHistoryItem["status"]): string {
  if (status === "reassigned") return "Reassigned";
  if (status === "assigned") return "Assigned";
  if (status === "disabled") return "Auto assignment off";
  return "Unassigned";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AutoAssignmentTab() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = Boolean(user?.role && EDIT_ROLES.has(user.role) && hasPermission("configuration", "edit"));
  const [panel, setPanel] = useState<Panel>("rules");
  const [config, setConfig] = useState<AssignmentConfig | null>(null);
  const [preview, setPreview] = useState<AssignmentPreview[]>([]);
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedOrder[]>([]);
  const [users, setUsers] = useState<NidoUser[]>([]);
  const [roles, setRoles] = useState<NidoRole[]>([]);
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AssignmentHistoryItem | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [reassignmentReason, setReassignmentReason] = useState("");
  const [assigning, setAssigning] = useState(false);

  const roster = useMemo(() => getRoster(users, roles), [users, roles]);
  const activeRoster = useMemo(
    () => roster.filter((employee) => employee.active && employee.roleActive),
    [roster],
  );
  const tierCoverage = useMemo(
    () => clients.reduce<Record<string, number>>((counts, client) => {
      const tier = canonicalTier(clientTier(client));
      counts[tier || "Unmapped"] = (counts[tier || "Unmapped"] || 0) + 1;
      return counts;
    }, {}),
    [clients],
  );

  const refreshUsersAndClients = () => {
    setUsers(getUsers());
    setRoles(getRoles());
    setClients(getClients());
  };

  const refreshActivity = async (nextFilters = filters) => {
    const [nextPreview, nextHistory] = await Promise.all([
      autoAssignmentApi.preview(),
      autoAssignmentApi.history(nextFilters),
    ]);
    setPreview(nextPreview);
    setHistory(nextHistory.history);
    setUnassigned(nextHistory.unassigned);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    refreshUsersAndClients();
    try {
      const [nextConfig, nextPreview, nextHistory] = await Promise.all([
        autoAssignmentApi.getConfig(),
        autoAssignmentApi.preview(),
        autoAssignmentApi.history(EMPTY_FILTERS),
      ]);
      setConfig(nextConfig);
      setPreview(nextPreview);
      setHistory(nextHistory.history);
      setUnassigned(nextHistory.unassigned);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load assignment settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const refresh = () => refreshUsersAndClients();
    window.addEventListener(NIDO_USERS_EVENT, refresh);
    window.addEventListener(NIDO_ROLES_EVENT, refresh);
    window.addEventListener("nidoClientsUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NIDO_USERS_EVENT, refresh);
      window.removeEventListener(NIDO_ROLES_EVENT, refresh);
      window.removeEventListener("nidoClientsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const updateTier = (tierName: AssignmentTierName, update: Partial<AssignmentTierConfig>) => {
    setConfig((current) => current ? {
      ...current,
      tiers: current.tiers.map((tier) => tier.tier === tierName ? { ...tier, ...update } : tier),
    } : current);
  };

  const addEmployee = (tierName: AssignmentTierName, employeeId: string) => {
    if (!employeeId || !config) return;
    const tier = config.tiers.find((entry) => entry.tier === tierName);
    if (!tier || tier.employees.some((employee) => employee.id === employeeId)) return;
    const employee = getEmployeeFromRoster(employeeId, roster);
    if (!employee) return;
    updateTier(tierName, { employees: resequence([...tier.employees, employee]) });
  };

  const save = async () => {
    if (!config || !canManage) return;
    setSaving(true);
    setError("");
    try {
      const saved = await autoAssignmentApi.saveConfig({
        enabled: config.enabled,
        tiers: config.tiers,
        employees: roster,
      });
      setConfig(saved);
      await refreshActivity();
      toast({ title: "Saved", description: "Tier assignment rules and rotation settings were saved." });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save assignment settings.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = async () => {
    try {
      const result = await autoAssignmentApi.history(filters);
      setHistory(result.history);
      setUnassigned(result.unassigned);
    } catch (filterError) {
      const message = filterError instanceof Error ? filterError.message : "Could not load assignment history.";
      setError(message);
    }
  };

  const openManualAssignment = (entry: AssignmentHistoryItem) => {
    setSelectedOrder(entry);
    setSelectedEmployeeId("");
    setReassignmentReason("");
  };

  const saveManualAssignment = async () => {
    if (!selectedOrder || !selectedEmployeeId) return;
    setAssigning(true);
    try {
      await autoAssignmentApi.manuallyAssign(selectedOrder.assignment_id, selectedEmployeeId, reassignmentReason);
      toast({ title: "Order assigned", description: `${selectedOrder.order_id} was manually assigned.` });
      setSelectedOrder(null);
      await refreshActivity(filters);
    } catch (assignmentError) {
      const message = assignmentError instanceof Error ? assignmentError.message : "Could not assign this order.";
      toast({ title: "Assignment failed", description: message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading order assignment…
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-4">
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure independent Premium, Medium, and Standard client queues. Assignment sequence positions persist in PostgreSQL.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2 border-b border-border" role="tablist" aria-label="Auto assignment sections">
        {([
          ["rules", "Tier rules"],
          ["preview", "Preview"],
          ["history", "Assignment history"],
          ["service", "Service & ticket rules"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={panel === value}
            onClick={() => setPanel(value)}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              panel === value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "service" && <ServiceTicketAssignmentRules canManage={canManage} />}

      {panel === "rules" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Automatic order assignment</h2>
                <p className="mt-1 text-sm text-muted-foreground">When off, new orders stay in the unassigned queue.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={config.enabled}
                  disabled={!canManage}
                  onChange={(event) => setConfig((current) => current ? { ...current, enabled: event.target.checked } : current)}
                />
                {config.enabled ? "Enabled" : "Disabled"}
              </label>
            </CardContent>
          </Card>

          {TIER_NAMES.map((tierName) => {
            const tier = config.tiers.find((entry) => entry.tier === tierName);
            if (!tier) return null;
            const usedIds = new Set(tier.employees.map((employee) => employee.id));
            const addable = activeRoster.filter((employee) => !usedIds.has(employee.id));
            const ordered = [...tier.employees].sort((a, b) => a.sequence - b.sequence);
            const fallbackOptions = activeRoster;
            return (
              <Card key={tierName} className="overflow-visible">
                <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{tierName} clients</CardTitle>
                    <CardDescription>Independent round-robin order and rotation cursor.</CardDescription>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={tier.enabled}
                      disabled={!canManage || (!tier.enabled && ordered.filter((entry) => entry.active).length === 0)}
                      onChange={(event) => updateTier(tierName, { enabled: event.target.checked })}
                    />
                    {tier.enabled ? "Tier active" : "Tier inactive"}
                  </label>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[620px]">
                      <thead className="bg-muted/50">
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2.5">Sequence</th>
                          <th className="px-3 py-2.5">Employee</th>
                          <th className="px-3 py-2.5">Role / department</th>
                          <th className="px-3 py-2.5">Availability</th>
                          <th className="px-3 py-2.5 text-right">Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordered.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No employees in this tier sequence yet.</td></tr>
                        ) : ordered.map((employee, index) => (
                          <tr key={employee.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-3 text-sm font-medium">{index + 1}</td>
                            <td className="px-3 py-3 text-sm">{employee.name}</td>
                            <td className="px-3 py-3 text-sm text-muted-foreground">
                              {[employee.role, employee.department].filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${employee.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                {employee.active ? "Active" : "Unavailable"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Move ${employee.name} up`}
                                  disabled={!canManage || index === 0}
                                  onClick={() => updateTier(tierName, moveEmployee(tier, index, -1))}
                                ><ArrowUp className="h-4 w-4" /></Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Move ${employee.name} down`}
                                  disabled={!canManage || index === ordered.length - 1}
                                  onClick={() => updateTier(tierName, moveEmployee(tier, index, 1))}
                                ><ArrowDown className="h-4 w-4" /></Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Remove ${employee.name} from ${tierName}`}
                                  disabled={!canManage}
                                  onClick={() => updateTier(tierName, { employees: resequence(ordered.filter((entry) => entry.id !== employee.id)) })}
                                ><X className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {canManage && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        aria-label={`Add employee to ${tierName}`}
                        value=""
                        disabled={addable.length === 0}
                        onChange={(event) => addEmployee(tierName, event.target.value)}
                        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">{addable.length ? "Choose an active employee to add" : "No eligible employees available"}</option>
                        {addable.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}{employee.role ? ` — ${employee.role}` : ""}
                          </option>
                        ))}
                      </select>
                      <span className="inline-flex items-center gap-1 self-center text-xs text-muted-foreground">
                        <Plus className="h-3.5 w-3.5" /> Employees can be used in more than one tier.
                      </span>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`fallback-${tierName}`} className="mb-1.5 block text-sm font-medium">When no sequence employee is available</label>
                      <select
                        id={`fallback-${tierName}`}
                        value={tier.fallbackBehavior}
                        disabled={!canManage}
                        onChange={(event) => updateTier(tierName, {
                          fallbackBehavior: event.target.value as AssignmentTierConfig["fallbackBehavior"],
                        })}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="unassigned_notify">Keep unassigned and notify the assignment team</option>
                        <option value="fallback_employee">Use a designated fallback employee</option>
                      </select>
                    </div>
                    {tier.fallbackBehavior === "fallback_employee" && (
                      <div>
                        <label htmlFor={`fallback-employee-${tierName}`} className="mb-1.5 block text-sm font-medium">Fallback employee</label>
                        <select
                          id={`fallback-employee-${tierName}`}
                          value={tier.fallbackEmployeeId || ""}
                          disabled={!canManage}
                          onChange={(event) => updateTier(tierName, { fallbackEmployeeId: event.target.value || null })}
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                        >
                          <option value="">Choose an active employee</option>
                          {fallbackOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current rotation starts at {tier.employees.find((employee) => employee.id === tier.nextEmployeeId)?.name || ordered[0]?.name || "the first sequence employee"}.
                    Previewing does not advance it.
                  </p>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client tier coverage</CardTitle>
              <CardDescription>Assignments use the tier already set on each client. Unknown or blank tiers are left unassigned; they are never guessed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                {TIER_NAMES.map((tier) => (
                  <span key={tier} className="rounded-full bg-muted px-3 py-1.5">{tier}: {tierCoverage[tier] || 0}</span>
                ))}
                {(tierCoverage.Unmapped || 0) > 0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">Needs tier mapping: {tierCoverage.Unmapped}</span>
                )}
              </div>
              <Link className="text-sm font-medium text-primary hover:underline" to="/clients">
                Review client tiers
              </Link>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {activeRoster.length} active employees available · Rotation pointers are saved server-side.
            </p>
            {canManage ? (
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Configuration
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">You have view-only access to these settings.</p>
            )}
          </div>
        </div>
      )}

      {panel === "preview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {preview.map((tierPreview) => (
            <Card key={tierPreview.tier}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {tierPreview.tier}
                  <span className={`rounded-full px-2 py-1 text-xs ${tierPreview.enabled ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {tierPreview.enabled ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
                <CardDescription>Next five assignments · no rotation changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tierPreview.assignments.map((item) => (
                  <div key={item.order} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Order {item.order}</span>
                    <span className="text-right font-medium">{item.employeeName}{item.fallback ? " (fallback)" : ""}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {panel === "history" && (
        <div className="space-y-4">
          {unassigned.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                  <ShieldAlert className="h-4 w-4" /> Unassigned order queue ({unassigned.length})
                </CardTitle>
                <CardDescription>These orders need an eligible employee or a corrected client tier.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {unassigned.map((item) => (
                  <div key={item.assignment_id} className="flex flex-col gap-2 rounded-md border border-amber-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.order_id} · {item.client_name || item.client_id}</p>
                      <p className="text-xs text-muted-foreground">{item.client_tier || "Tier not set"} · {item.message}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={!canManage} onClick={() => {
                      const entry = history.find((record) => record.assignment_id === item.assignment_id);
                      openManualAssignment(entry || {
                        id: 0,
                        assignment_id: item.assignment_id,
                        order_id: item.order_id,
                        client_id: item.client_id,
                        client_name: item.client_name,
                        client_tier: item.client_tier,
                        previous_employee_id: null,
                        previous_employee_name: null,
                        new_employee_id: null,
                        new_employee_name: null,
                        current_employee_id: item.assigned_employee_id,
                        current_employee_name: item.assigned_employee_name,
                        assignment_method: "Automatic",
                        sequence_position: null,
                        status: "unassigned",
                        reason: item.message,
                        actor_name: "Auto Assignment",
                        actor_role: "",
                        created_at: item.created_at,
                      });
                    }}>
                      <Users className="mr-2 h-4 w-4" /> Assign
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment history</CardTitle>
              <CardDescription>Each automatic assignment, manual assignment, and reassignment is retained as an audit event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                <select aria-label="Filter by client tier" value={filters.tier} onChange={(e) => setFilters({ ...filters, tier: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="">All tiers</option>{TIER_NAMES.map((tier) => <option key={tier}>{tier}</option>)}
                </select>
                <select aria-label="Filter by employee" value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="">All employees</option>{users.map((employee) => <option key={employee.id} value={employee.id}>{employee.name || employee.email}</option>)}
                </select>
                <select aria-label="Filter by assignment method" value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="">All methods</option><option>Automatic</option><option>Manual</option>
                </select>
                <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="">All statuses</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option><option value="disabled">Auto assignment off</option><option value="reassigned">Reassigned</option>
                </select>
                <input aria-label="Start date" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm" />
                <input aria-label="End date" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="h-9 rounded-md border border-border bg-background px-2 text-sm" />
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => void applyFilters()}><Eye className="mr-2 h-4 w-4" /> Apply filters</Button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2.5">Order / date</th><th className="px-3 py-2.5">Client / tier</th>
                      <th className="px-3 py-2.5">Previous → new employee</th><th className="px-3 py-2.5">Method / status</th>
                      <th className="px-3 py-2.5">Reason / actor</th><th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No assignment history matches these filters.</td></tr>
                    ) : history.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-3 text-sm"><div className="font-medium">{entry.order_id}</div><div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{formatTimestamp(entry.created_at)}</div></td>
                        <td className="px-3 py-3 text-sm"><div>{entry.client_name || entry.client_id}</div><div className="mt-1 text-xs text-muted-foreground">{entry.client_tier || "Tier not set"}</div></td>
                        <td className="px-3 py-3 text-sm">{entry.previous_employee_name || "—"} <span className="text-muted-foreground">→</span> {entry.new_employee_name || "Unassigned"}</td>
                        <td className="px-3 py-3 text-sm"><div>{entry.assignment_method}</div><div className={`mt-1 text-xs ${entry.status === "unassigned" ? "text-amber-700" : "text-muted-foreground"}`}>{statusLabel(entry.status)}</div></td>
                        <td className="max-w-xs px-3 py-3 text-xs text-muted-foreground"><div>{entry.reason || (entry.sequence_position ? `Sequence position ${entry.sequence_position}` : "—")}</div><div className="mt-1">{entry.actor_name} · {entry.actor_role}</div></td>
                        <td className="px-3 py-3 text-right">
                          {canManage && (
                            <Button size="sm" variant="outline" onClick={() => openManualAssignment(entry)}>
                              {entry.current_employee_id ? "Reassign" : "Assign"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Showing up to 500 matching events.</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrder?.current_employee_id ? "Reassign order" : "Manually assign order"}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_id} · {selectedOrder?.client_name || selectedOrder?.client_id} · {selectedOrder?.client_tier}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="manual-assignment-employee" className="mb-1.5 block text-sm font-medium">Active eligible employee</label>
              <select
                id="manual-assignment-employee"
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Choose employee</option>
                {(config.tiers.find((tier) => tier.tier === canonicalTier(selectedOrder?.client_tier))?.employees || [])
                  .filter((employee) => employee.active)
                  .map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.role || employee.department || "Active employee"}</option>)}
              </select>
            </div>
            {selectedOrder?.current_employee_id && (
              <div>
                <label htmlFor="manual-assignment-reason" className="mb-1.5 block text-sm font-medium">Reason for reassignment <span className="text-red-600">*</span></label>
                <textarea
                  id="manual-assignment-reason"
                  value={reassignmentReason}
                  onChange={(event) => setReassignmentReason(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-border bg-background p-3 text-sm"
                  placeholder="Explain why the current assignee is changing"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button
              disabled={assigning || !selectedEmployeeId || Boolean(selectedOrder?.current_employee_id && !reassignmentReason.trim())}
              onClick={() => void saveManualAssignment()}
            >
              {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
