import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Save,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { autoAssignmentApi, type AssignmentConfig, type AssignmentHistoryItem, type AssignmentPreview, type AssignmentRosterEmployee, type AssignmentTierConfig, type AssignmentTierName, type UnassignedOrder } from "@/lib/autoAssignmentApi";
import { getRoles, getUsers, NIDO_ROLES_EVENT, NIDO_USERS_EVENT } from "@/lib/nidoUsersStore";

const TIERS: AssignmentTierName[] = ["Premium", "Medium", "Standard"];
const MANAGER_ROLES = new Set([
  "System Owner",
  "System Admin",
  "Procurement Manager",
  "Operations Manager",
  "Team Lead",
]);

type HistoryFilters = {
  tier: string;
  employeeId: string;
  method: string;
  status: string;
  startDate: string;
  endDate: string;
};

type AssignmentTarget = {
  assignmentId: string;
  orderId: string;
  clientName: string;
  tier: string;
  currentEmployeeId: string | null;
  currentEmployeeName: string | null;
};

const EMPTY_FILTERS: HistoryFilters = {
  tier: "",
  employeeId: "",
  method: "",
  status: "",
  startDate: "",
  endDate: "",
};

interface LiveRosterEmployee extends AssignmentRosterEmployee {
  employeeId: string;
}

function currentRoster(): LiveRosterEmployee[] {
  if (typeof window === "undefined") return [];
  const activeRoles = new Map(getRoles().map((role) => [role.name, role.status === "Active"]));
  return getUsers().map((user) => ({
    id: user.id,
    employeeId: user.employeeId || "",
    name: user.name || user.email || user.employeeId || "Unnamed employee",
    role: user.role || "",
    department: user.department || "",
    active: user.status === "Active" && user.locked !== true,
    roleActive: !user.role || activeRoles.get(user.role) === true,
  }));
}

function cloneConfig(config: AssignmentConfig): AssignmentConfig {
  return {
    ...config,
    tiers: config.tiers.map((tier) => ({
      ...tier,
      employees: tier.employees.map((employee) => ({ ...employee })),
    })),
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function tierLabel(tier: string) {
  return tier === "Premium" || tier === "Medium" || tier === "Standard" ? tier : "Unclassified";
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "assigned" || status === "reassigned"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "unassigned"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-muted bg-muted text-muted-foreground";
  return <Badge variant="outline" className={style}>{status.replaceAll("_", " ")}</Badge>;
}

interface TierRuleCardProps {
  tier: AssignmentTierConfig;
  roster: LiveRosterEmployee[];
  canManage: boolean;
  onChange: (next: AssignmentTierConfig) => void;
}

function TierRuleCard({ tier, roster, canManage, onChange }: TierRuleCardProps) {
  const currentEmployee = tier.employees.find((employee) => employee.id === tier.nextEmployeeId);
  const eligibleIds = new Set(tier.employees.map((employee) => employee.id));
  const activeCount = tier.employees.filter((employee) => {
    const person = roster.find((candidate) => candidate.id === employee.id);
    return person?.active && person.roleActive;
  }).length;

  const toggleEmployee = (person: AssignmentRosterEmployee, checked: boolean) => {
    const existing = tier.employees.find((employee) => employee.id === person.id);
    if (checked && !existing) {
      onChange({
        ...tier,
        employees: [
          ...tier.employees,
          {
            id: person.id,
            name: person.name,
            role: person.role,
            department: person.department,
            active: person.active && person.roleActive,
            sequence: tier.employees.length + 1,
          },
        ],
      });
      return;
    }
    if (!checked && existing) {
      const employees = tier.employees
        .filter((employee) => employee.id !== person.id)
        .map((employee, index) => ({ ...employee, sequence: index + 1 }));
      onChange({
        ...tier,
        employees,
        nextEmployeeId: employees.some((employee) => employee.id === tier.nextEmployeeId)
          ? tier.nextEmployeeId
          : employees[0]?.id || null,
      });
    }
  };

  const moveEmployee = (index: number, direction: -1 | 1) => {
    const next = [...tier.employees];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...tier, employees: next.map((employee, position) => ({ ...employee, sequence: position + 1 })) });
  };

  const setFallback = (employeeId: string) => onChange({
    ...tier,
    fallbackBehavior: employeeId ? "fallback_employee" : "unassigned_notify",
    fallbackEmployeeId: employeeId || null,
  });

  const configuredFallback = tier.fallbackBehavior === "fallback_employee"
    ? tier.fallbackEmployeeId || ""
    : "";

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client tier</p>
          <CardTitle className="mt-1 text-lg">{tier.tier}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{activeCount} active in rotation · {tier.employees.length} configured</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`tier-enabled-${tier.tier}`} className="text-xs text-muted-foreground">
            {tier.enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id={`tier-enabled-${tier.tier}`}
            checked={tier.enabled}
            disabled={!canManage}
            onCheckedChange={(enabled) => onChange({ ...tier, enabled })}
            aria-label={`${tier.enabled ? "Disable" : "Enable"} ${tier.tier} assignment`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Eligible employees</h3>
            <span className="text-xs text-muted-foreground">From NIDO users</span>
          </div>
          {roster.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {roster.map((person) => {
                const checked = eligibleIds.has(person.id);
                const available = person.active && person.roleActive;
                return (
                  <label
                    key={person.id}
                    className={`flex min-w-0 items-start gap-3 rounded-md border p-3 ${
                      checked ? "border-primary/40 bg-primary/5" : "bg-background"
                    } ${canManage && (available || checked) ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!canManage || (!available && !checked)}
                      onCheckedChange={(value) => toggleEmployee(person, value === true)}
                      aria-label={`${checked ? "Remove" : "Add"} ${person.name} ${checked ? "from" : "to"} ${tier.tier}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{person.name}</span>
                        <span className={`shrink-0 text-[11px] ${available ? "text-emerald-700" : "text-muted-foreground"}`}>
                          {available ? "Active" : person.active ? "Role inactive" : "Inactive"}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {[person.employeeId, person.department, person.role].filter(Boolean).join(" · ") || "No department or role"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No NIDO users are available to configure.
            </p>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Round-robin sequence</h3>
            <span className="text-xs text-muted-foreground">Next: {currentEmployee?.name || "Not set"}</span>
          </div>
          {tier.employees.length ? (
            <ol className="space-y-2">
              {tier.employees.map((employee, index) => {
                const person = roster.find((candidate) => candidate.id === employee.id);
                const available = Boolean(person?.active && person.roleActive);
                return (
                  <li key={employee.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <span className="w-7 shrink-0 text-center font-mono text-xs text-muted-foreground">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{person?.name || employee.name || "Unavailable NIDO user"}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {person ? [person.department, person.role].filter(Boolean).join(" · ") || "No department or role" : "Not in current NIDO users"}
                        {!available && <span className="ml-2 text-amber-700">Inactive — remove before saving</span>}
                      </span>
                    </span>
                    <Button type="button" variant="ghost" size="icon" disabled={!canManage || index === 0} onClick={() => moveEmployee(index, -1)} aria-label={`Move ${employee.name} earlier`}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" disabled={!canManage || index === tier.employees.length - 1} onClick={() => moveEmployee(index, 1)} aria-label={`Move ${employee.name} later`}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No eligible employees are configured for this tier.
            </p>
          )}
        </section>

        <section className="border-t pt-4">
          <Label htmlFor={`fallback-${tier.tier}`} className="text-sm font-medium">Fallback when no eligible employee is available</Label>
          <select
            id={`fallback-${tier.tier}`}
            value={configuredFallback}
            disabled={!canManage}
            onChange={(event) => setFallback(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Leave unassigned and notify the team</option>
            {tier.fallbackEmployeeId && !roster.some((person) =>
              person.id === tier.fallbackEmployeeId && person.active && person.roleActive,
            ) && (
              <option value={tier.fallbackEmployeeId} disabled>
                {roster.find((person) => person.id === tier.fallbackEmployeeId)?.name
                  || tier.employees.find((employee) => employee.id === tier.fallbackEmployeeId)?.name
                  || "Unavailable user"} — inactive
              </option>
            )}
            {roster.filter((person) => person.active && person.roleActive).map((person) => (
              <option key={person.id} value={person.id}>{person.name} · {person.role || person.department || "NIDO user"}</option>
            ))}
          </select>
        </section>
      </CardContent>
    </Card>
  );
}

export default function AutoAssignmentWorkspace() {
  const { user, isNidoAdmin } = useAuth();
  const canManage = isNidoAdmin && MANAGER_ROLES.has(user?.role || "");
  const [roster, setRoster] = useState<LiveRosterEmployee[]>(currentRoster);
  const [config, setConfig] = useState<AssignmentConfig | null>(null);
  const [draft, setDraft] = useState<AssignmentConfig | null>(null);
  const [preview, setPreview] = useState<AssignmentPreview[]>([]);
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedOrder[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fatalError, setFatalError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<AssignmentTarget | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [assigning, setAssigning] = useState(false);

  const activeRoster = useMemo(
    () => roster.filter((employee) => employee.active && employee.roleActive),
    [roster],
  );
  const isDirty = Boolean(config && draft && JSON.stringify(config) !== JSON.stringify(draft));
  const enabledTierCount = draft?.tiers.filter((tier) => tier.enabled).length || 0;
  const activeConfiguredEmployeeCount = new Set(
    (draft?.tiers || [])
      .filter((tier) => tier.enabled)
      .flatMap((tier) => tier.employees
        .filter((employee) => {
          const live = roster.find((candidate) => candidate.id === employee.id);
          return live?.active && live.roleActive;
        })
        .map((employee) => employee.id)),
  ).size;

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setFatalError("");
    setPreviewError("");
    try {
      const saved = await autoAssignmentApi.getConfig();
      setConfig(saved);
      setDraft(cloneConfig(saved));
      try {
        setPreview(await autoAssignmentApi.preview());
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : "The live assignment preview could not be loaded.");
      }
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : "Auto Assignment settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (nextFilters: HistoryFilters) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const result = await autoAssignmentApi.history(nextFilters);
      setHistory(result.history);
      setUnassigned(result.unassigned);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Assignment history could not be loaded.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    void loadActivity(filters);
  }, [filters, loadActivity]);

  useEffect(() => {
    const refreshRoster = () => setRoster(currentRoster());
    window.addEventListener(NIDO_USERS_EVENT, refreshRoster);
    window.addEventListener(NIDO_ROLES_EVENT, refreshRoster);
    window.addEventListener("storage", refreshRoster);
    return () => {
      window.removeEventListener(NIDO_USERS_EVENT, refreshRoster);
      window.removeEventListener(NIDO_ROLES_EVENT, refreshRoster);
      window.removeEventListener("storage", refreshRoster);
    };
  }, []);

  const updateTier = (nextTier: AssignmentTierConfig) => {
    setDraft((current) => current
      ? { ...current, tiers: current.tiers.map((tier) => tier.tier === nextTier.tier ? nextTier : tier) }
      : current);
    setFatalError("");
    setNotice("");
  };

  const saveConfiguration = async () => {
    if (!draft) return;
    for (const tier of draft.tiers) {
      const seen = new Set<string>();
      for (const employee of tier.employees) {
        if (seen.has(employee.id)) {
          setFatalError(`${tier.tier} has the same employee more than once.`);
          return;
        }
        seen.add(employee.id);
        const live = roster.find((candidate) => candidate.id === employee.id);
        if (!live || !live.active || !live.roleActive) {
          setFatalError(`${tier.tier} includes an inactive or unavailable user. Remove that user before saving.`);
          return;
        }
      }
      if (tier.enabled && tier.employees.length === 0) {
        setFatalError(`${tier.tier} is enabled but has no eligible employees.`);
        return;
      }
    }

    setSaving(true);
    setFatalError("");
    setNotice("");
    try {
      const saved = await autoAssignmentApi.saveConfig({
        enabled: draft.enabled,
        tiers: draft.tiers.map((tier) => ({
          ...tier,
          employees: tier.employees.map((employee, index) => {
            const live = roster.find((candidate) => candidate.id === employee.id)!;
            return {
              ...employee,
              name: live.name,
              role: live.role,
              department: live.department,
              active: live.active && live.roleActive,
              sequence: index + 1,
            };
          }),
        })),
        employees: roster,
      });
      setConfig(saved);
      setDraft(cloneConfig(saved));
      try {
        setPreview(await autoAssignmentApi.preview());
        setPreviewError("");
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : "The assignment preview could not be refreshed.");
      }
      await loadActivity(filters);
      setNotice("Auto Assignment configuration saved to the live system.");
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : "Configuration could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const openAssignment = (assignment: AssignmentTarget) => {
    setTarget(assignment);
    setSelectedEmployeeId("");
    setReason("");
  };

  const submitManualAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!target || !selectedEmployeeId || !reason.trim()) return;
    setAssigning(true);
    setHistoryError("");
    setNotice("");
    try {
      await autoAssignmentApi.manuallyAssign(target.assignmentId, selectedEmployeeId, reason.trim());
      setTarget(null);
      setNotice(`Assignment for ${target.orderId} updated.`);
      await Promise.all([loadConfig(), loadActivity(filters)]);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "The order could not be reassigned.");
    } finally {
      setAssigning(false);
    }
  };

  const currentEmployeeName = (id: string | null, fallback: string | null) =>
    roster.find((employee) => employee.id === id)?.name || fallback || "Unassigned";
  const assignableEmployees = target
    ? activeRoster.filter((employee) =>
      config.tiers.find((tier) => tier.tier === target.tier)?.employees.some((eligible) => eligible.id === employee.id),
    )
    : [];
  const reassignmentChoices = assignableEmployees.filter((employee) => employee.id !== target?.currentEmployeeId);

  if (loading && !config) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading live assignment settings…
      </div>
    );
  }

  if (fatalError && !config) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p role="alert" className="max-w-2xl text-sm text-destructive">{fatalError}</p>
          <Button type="button" variant="outline" onClick={() => void loadConfig()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!config || !draft) return null;

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Users className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">Order assignment controls</h2>
                <Badge variant={draft.enabled ? "default" : "secondary"}>{draft.enabled ? "Enabled" : "Paused"}</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Live tier rules, employee rotation, order preview, and assignment activity.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Last saved {formatDate(config.updatedAt)} · {config.updatedBy}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-assignment-enabled">Automatic assignment</Label>
              <Switch
                id="auto-assignment-enabled"
                checked={draft.enabled}
                disabled={!canManage}
                onCheckedChange={(enabled) => {
                  setDraft((current) => current ? { ...current, enabled } : current);
                  setNotice("");
                }}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => { void loadConfig(); void loadActivity(filters); }} disabled={loading || historyLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading || historyLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            {canManage && (
              <Button type="button" onClick={() => void saveConfiguration()} disabled={saving || !isDirty}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            )}
            {canManage && isDirty && (
              <Button type="button" variant="ghost" onClick={() => { setDraft(cloneConfig(config)); setFatalError(""); setNotice(""); }}>
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {fatalError && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {fatalError}
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}
      {!canManage && (
        <div role="status" className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          You can view live configuration and history, but your role cannot change assignment settings.
        </div>
      )}

      <section aria-label="Live assignment summary" className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="rounded-md bg-primary/10 p-2 text-primary"><Users className="h-4 w-4" /></span>
          <div><p className="text-xs text-muted-foreground">Enabled tiers</p><p className="text-xl font-semibold">{enabledTierCount} / {TIERS.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-700"><Users className="h-4 w-4" /></span>
          <div><p className="text-xs text-muted-foreground">Active configured employees</p><p className="text-xl font-semibold">{activeConfiguredEmployeeCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="rounded-md bg-amber-50 p-2 text-amber-700"><Clock3 className="h-4 w-4" /></span>
          <div><p className="text-xs text-muted-foreground">Orders awaiting assignment</p><p className="text-xl font-semibold">{unassigned.length}</p></div>
        </CardContent></Card>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Tier-specific rules</h2>
          <p className="text-sm text-muted-foreground">Each client tier has its own saved sequence and server-side rotation pointer.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {TIERS.map((tierName) => {
            const tier = draft.tiers.find((candidate) => candidate.tier === tierName);
            return tier ? (
              <TierRuleCard key={tierName} tier={tier} roster={roster} canManage={canManage} onChange={updateTier} />
            ) : null;
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="h-4 w-4" /> Next assignment preview</CardTitle>
          <p className="text-sm text-muted-foreground">Read-only preview from the saved server rotation. It does not advance the rotation.</p>
        </CardHeader>
        <CardContent>
          {isDirty && <p className="mb-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Save your draft to refresh this preview with the updated rules.</p>}
          {previewError && <p role="alert" className="mb-3 text-sm text-destructive">{previewError}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tierName) => {
              const tierPreview = preview.find((item) => item.tier === tierName);
              return (
                <div key={tierName} className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">{tierName}</h3>
                    <Badge variant={tierPreview?.enabled ? "default" : "secondary"}>{tierPreview?.enabled ? "Active" : "Paused"}</Badge>
                  </div>
                  {tierPreview?.assignments?.length ? (
                    <ol className="space-y-2">
                      {tierPreview.assignments.map((assignment) => (
                        <li key={`${tierName}-${assignment.order}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Order {assignment.order}</span>
                          <span className="truncate text-right font-medium">
                            {assignment.employeeName}
                            {assignment.fallback && <span className="ml-1 text-xs text-muted-foreground">(fallback)</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">Preview unavailable.</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="h-4 w-4" /> Unassigned order queue</CardTitle>
          <p className="text-sm text-muted-foreground">Live orders that need an assignment because no eligible employee was available.</p>
        </CardHeader>
        <CardContent className="p-0">
          {historyError && <p role="alert" className="px-6 pb-4 text-sm text-destructive">{historyError}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-y bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Order</th><th className="px-3 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Tier</th><th className="px-3 py-3 font-medium">Reason</th><th className="px-5 py-3 text-right font-medium">Action</th>
              </tr></thead>
              <tbody>
                {unassigned.map((order) => (
                  <tr key={order.assignment_id} className="border-b last:border-0">
                    <td className="px-5 py-3"><span className="font-mono font-medium">{order.order_id}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.created_at)}</span></td>
                    <td className="px-3 py-3">{order.client_name || order.client_id || "—"}</td>
                    <td className="px-3 py-3"><Badge variant="outline">{tierLabel(order.client_tier)}</Badge></td>
                    <td className="max-w-sm px-3 py-3 text-muted-foreground">{order.message}</td>
                    <td className="px-5 py-3 text-right">
                      {canManage && (
                        <Button type="button" size="sm" variant="outline" onClick={() => openAssignment({
                          assignmentId: order.assignment_id,
                          orderId: order.order_id,
                          clientName: order.client_name,
                          tier: order.client_tier,
                          currentEmployeeId: order.assigned_employee_id,
                          currentEmployeeName: order.assigned_employee_name,
                        })}>Assign</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!historyLoading && unassigned.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No live orders are waiting for assignment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Assignment history</CardTitle>
          <p className="text-sm text-muted-foreground">Live assignment events recorded by the order assignment service.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select aria-label="Filter by client tier" value={filters.tier} onChange={(event) => setFilters((current) => ({ ...current, tier: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All tiers</option>{TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <select aria-label="Filter by employee" value={filters.employeeId} onChange={(event) => setFilters((current) => ({ ...current, employeeId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All employees</option>{roster.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <select aria-label="Filter by method" value={filters.method} onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All methods</option><option value="Automatic">Automatic</option><option value="Manual">Manual</option>
            </select>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All statuses</option><option value="assigned">Assigned</option><option value="reassigned">Reassigned</option><option value="unassigned">Unassigned</option><option value="disabled">Disabled</option>
            </select>
            <Input aria-label="Start date" type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
            <Input aria-label="End date" type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
          </div>
          {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order / date</th><th className="px-3 py-3 font-medium">Client / tier</th><th className="px-3 py-3 font-medium">Assignment</th><th className="px-3 py-3 font-medium">Method / status</th><th className="px-3 py-3 font-medium">Reason / actor</th><th className="px-4 py-3 text-right font-medium">Action</th>
              </tr></thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3"><span className="font-mono font-medium">{item.order_id}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDate(item.created_at)}</span></td>
                    <td className="px-3 py-3"><span className="block">{item.client_name || item.client_id || "—"}</span><span className="mt-1 block text-xs text-muted-foreground">{tierLabel(item.client_tier)}</span></td>
                    <td className="px-3 py-3">
                      {item.previous_employee_name && <span className="block text-xs text-muted-foreground">{item.previous_employee_name} →</span>}
                      <span>{currentEmployeeName(item.current_employee_id, item.current_employee_name || item.new_employee_name)}</span>
                    </td>
                    <td className="px-3 py-3"><span className="block">{item.assignment_method}</span><span className="mt-1 block"><StatusBadge status={item.status} /></span></td>
                    <td className="max-w-xs px-3 py-3"><span className="block truncate" title={item.reason}>{item.reason || "—"}</span><span className="mt-1 block text-xs text-muted-foreground">{item.actor_name || item.actor_role || "System"}</span></td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <Button type="button" size="sm" variant="outline" onClick={() => openAssignment({
                          assignmentId: item.assignment_id,
                          orderId: item.order_id,
                          clientName: item.client_name,
                          tier: item.client_tier,
                          currentEmployeeId: item.current_employee_id,
                          currentEmployeeName: item.current_employee_name,
                        })}>Reassign</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!historyLoading && history.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No live assignment history matches these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{historyLoading ? "Updating live history…" : `${history.length} history event${history.length === 1 ? "" : "s"} loaded (maximum 500)`}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void loadActivity(filters)} disabled={historyLoading}>
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} /> Refresh history
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) setTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign or reassign order</DialogTitle>
            <DialogDescription>
              {target ? `${target.orderId} · ${target.clientName || "Client"} · ${tierLabel(target.tier)}` : "Select an active NIDO user and provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submitManualAssignment(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-assignment-employee">Active employee</Label>
              <select id="manual-assignment-employee" required value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Choose employee</option>
                {reassignmentChoices.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.role || employee.department || "NIDO user"}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-assignment-reason">Reason</Label>
              <Input id="manual-assignment-reason" required maxLength={240} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for this assignment change" />
            </div>
            {target?.currentEmployeeName && (
              <p className="text-xs text-muted-foreground">Currently assigned to {target.currentEmployeeName}.</p>
            )}
            {target && reassignmentChoices.length === 0 && (
              <p role="alert" className="text-xs text-amber-700">
                There are no other active employees configured for the {tierLabel(target.tier)} tier. Update and save that tier’s sequence first.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTarget(null)} disabled={assigning}>Cancel</Button>
              <Button type="submit" disabled={assigning || !canManage || !reassignmentChoices.some((employee) => employee.id === selectedEmployeeId) || !reason.trim()}>
                {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
