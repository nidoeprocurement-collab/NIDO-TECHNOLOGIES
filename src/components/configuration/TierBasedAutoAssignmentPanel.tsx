import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getUsers,
  NIDO_USERS_EVENT,
  NIDO_ROLES_EVENT,
  type NidoUser,
} from "@/lib/nidoUsersStore";
import { getClients, type StoredClient } from "@/lib/clientStore";

const TIERS = ["Premium", "Medium", "Standard"] as const;
type ClientTier = (typeof TIERS)[number];
type FallbackBehavior = "leave_unassigned_notify" | "leave_unassigned" | "backup_employee";

interface TierRuleDraft {
  enabled: boolean;
  employeeIds: string[];
  fallbackBehavior: FallbackBehavior;
  backupEmployeeId: string;
}

interface TierAssignmentDraft {
  enabled: boolean;
  rules: Record<ClientTier, TierRuleDraft>;
  savedAt?: string;
}

const STORAGE_KEY = "nido_tier_assignment_ui_draft_v1";
const UPDATED_EVENT = "nidoTierAssignmentDraftUpdated";

function defaultRule(): TierRuleDraft {
  return {
    enabled: false,
    employeeIds: [],
    fallbackBehavior: "leave_unassigned_notify",
    backupEmployeeId: "",
  };
}

function defaultDraft(): TierAssignmentDraft {
  return {
    enabled: false,
    rules: {
      Premium: defaultRule(),
      Medium: defaultRule(),
      Standard: defaultRule(),
    },
  };
}

function readDraft(): TierAssignmentDraft {
  if (typeof window === "undefined") return defaultDraft();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return defaultDraft();
    const raw = saved as Partial<TierAssignmentDraft>;
    const rawRules = raw.rules && typeof raw.rules === "object" ? raw.rules as Partial<Record<ClientTier, Partial<TierRuleDraft>>> : {};
    const rules = Object.fromEntries(TIERS.map((tier) => {
      const rule = rawRules[tier] ?? {};
      const fallback = rule.fallbackBehavior;
      return [tier, {
        enabled: rule.enabled === true,
        employeeIds: Array.isArray(rule.employeeIds) ? [...new Set(rule.employeeIds.map(String))] : [],
        fallbackBehavior: fallback === "leave_unassigned" || fallback === "backup_employee"
          ? fallback
          : "leave_unassigned_notify",
        backupEmployeeId: String(rule.backupEmployeeId ?? ""),
      }];
    })) as Record<ClientTier, TierRuleDraft>;
    return { enabled: raw.enabled === true, rules, savedAt: raw.savedAt };
  } catch {
    return defaultDraft();
  }
}

function clientTier(client: StoredClient): ClientTier | null {
  const savedTier = String(client.tier ?? client.client_tier ?? "").trim().toLowerCase();
  if (savedTier === "premium" || savedTier === "premium clients") return "Premium";
  if (savedTier === "medium" || savedTier === "medium clients") return "Medium";
  if (savedTier === "standard" || savedTier === "standard clients") return "Standard";
  return null;
}

function employeeLabel(user: NidoUser): string {
  return user.name || user.email || user.employeeId || user.id;
}

function snapshot(draft: TierAssignmentDraft): string {
  return JSON.stringify(draft);
}

function moveToPosition(ids: string[], userId: string, position: number): string[] {
  const current = [...ids];
  const oldIndex = current.indexOf(userId);
  if (oldIndex < 0) return current;
  const [selected] = current.splice(oldIndex, 1);
  const target = Math.max(0, Math.min(current.length, Math.floor(position) - 1));
  current.splice(target, 0, selected);
  return current;
}

function filterDescription(tier: string, employee: string, method: string, status: string, from: string, to: string): string {
  const active = [tier, employee, method, status].filter((value) => value !== "all").length + Number(Boolean(from || to));
  return active ? `${active} filter${active === 1 ? "" : "s"} applied` : "No filters applied";
}

export default function TierBasedAutoAssignmentPanel() {
  const [initialDraft] = useState(readDraft);
  const [draft, setDraft] = useState(initialDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialDraft));
  const [users, setUsers] = useState<NidoUser[]>(() => getUsers());
  const [clients, setClients] = useState<StoredClient[]>(() => getClients());
  const [tierFilter, setTierFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const dirtyRef = useRef(false);
  const isDirty = snapshot(draft) !== savedSnapshot;
  dirtyRef.current = isDirty;

  const activeUsers = useMemo(
    () => users.filter((user) => String(user.status).toLowerCase() === "active"),
    [users],
  );
  const clientsByTier = useMemo(() => {
    const counts: Record<ClientTier, number> = { Premium: 0, Medium: 0, Standard: 0 };
    clients.forEach((client) => {
      const tier = clientTier(client);
      if (tier) counts[tier] += 1;
    });
    return counts;
  }, [clients]);

  useEffect(() => {
    const refresh = () => {
      setUsers(getUsers());
      setClients(getClients());
      if (!dirtyRef.current) {
        const latest = readDraft();
        setDraft(latest);
        setSavedSnapshot(snapshot(latest));
      }
    };
    const handleStorage = (event: StorageEvent) => {
      const clientStoreKey = event.key === "nido_clients_v2"
        || event.key === "nido_clients_v3"
        || Boolean(event.key?.startsWith("nido_clients_v3:"));
      if (event.key === null || event.key === STORAGE_KEY || clientStoreKey) refresh();
    };
    window.addEventListener(NIDO_USERS_EVENT, refresh);
    window.addEventListener(NIDO_ROLES_EVENT, refresh);
    window.addEventListener("nidoClientsUpdated", refresh);
    window.addEventListener(UPDATED_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(NIDO_USERS_EVENT, refresh);
      window.removeEventListener(NIDO_ROLES_EVENT, refresh);
      window.removeEventListener("nidoClientsUpdated", refresh);
      window.removeEventListener(UPDATED_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateTier = (tier: ClientTier, updates: Partial<TierRuleDraft>) => {
    setDraft((current) => ({
      ...current,
      rules: {
        ...current.rules,
        [tier]: { ...current.rules[tier], ...updates },
      },
    }));
  };

  const handleSave = () => {
    const activeIds = new Set(activeUsers.map((user) => user.id));
    const validationErrors: string[] = [];
    const cleanRules = Object.fromEntries(TIERS.map((tier) => {
      const rule = draft.rules[tier];
      const employeeIds = [...new Set(rule.employeeIds)].filter((id) => activeIds.has(id));
      if (draft.enabled && rule.enabled && employeeIds.length === 0) {
        validationErrors.push(`${tier} is enabled but has no active eligible employees.`);
      }
      if (draft.enabled && rule.enabled && rule.fallbackBehavior === "backup_employee" && (!rule.backupEmployeeId || !activeIds.has(rule.backupEmployeeId))) {
        validationErrors.push(`${tier} requires an active backup employee.`);
      }
      return [tier, { ...rule, employeeIds }];
    })) as Record<ClientTier, TierRuleDraft>;

    if (validationErrors.length) {
      toast({ title: "Check the enabled tier rules", description: validationErrors.join(" ") });
      return;
    }

    try {
      const saved: TierAssignmentDraft = { ...draft, rules: cleanRules, savedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      window.dispatchEvent(new Event(UPDATED_EVENT));
      setDraft(saved);
      setSavedSnapshot(snapshot(saved));
      toast({ title: "Draft saved in this browser", description: "These tier settings do not affect orders until backend assignment is implemented." });
    } catch (error) {
      toast({
        title: "Could not save the draft",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const clearHistoryFilters = () => {
    setTierFilter("all");
    setEmployeeFilter("all");
    setMethodFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-5 px-3 py-4 sm:px-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auto Assignment Configuration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure Premium, Medium and Standard assignment sequences using existing NIDO users.
            </p>
          </div>
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center">
          <Badge variant="outline" className="w-fit border-amber-500 text-amber-800 dark:text-amber-200">UI ONLY</Badge>
          <span>Saved locally in this browser. It does not assign orders or connect to the database/API.</span>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <Label htmlFor="tier-auto-assignment" className="font-semibold">Enable tier-based auto assignment</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                This is a saved UI setting only; order processing remains unchanged.
              </p>
            </div>
            <Switch
              id="tier-auto-assignment"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((current) => ({ ...current, enabled }))}
              aria-label="Enable tier-based auto assignment draft"
            />
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Client tier assignment rules">
          {TIERS.map((tier) => {
            const rule = draft.rules[tier];
            const orderedUsers = rule.employeeIds
              .map((id) => activeUsers.find((user) => user.id === id))
              .filter((user): user is NidoUser => Boolean(user));
            const preview = orderedUsers.length
              ? Array.from({ length: 5 }, (_, index) => ({
                  user: orderedUsers[index % orderedUsers.length],
                  position: (index % orderedUsers.length) + 1,
                }))
              : [];
            return (
              <Card key={tier} className="overflow-hidden">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{tier}</h2>
                      <p className="text-xs text-muted-foreground">{clientsByTier[tier]} client{clientsByTier[tier] === 1 ? "" : "s"} have this tier set</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{rule.enabled ? "Active draft" : "Inactive"}</span>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateTier(tier, { enabled })}
                        aria-label={`Enable ${tier} tier assignment draft`}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                    <span className="font-medium">Current rotation position:</span>{" "}
                    <span className="text-muted-foreground">Not connected; backend pointer will be added later.</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Eligible active employees</Label>
                      <p className="text-xs text-muted-foreground">Select existing NIDO users. Role and department authorization still needs backend enforcement.</p>
                    </div>
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                      {activeUsers.length ? activeUsers.map((user) => {
                        const checked = rule.employeeIds.includes(user.id);
                        return (
                          <label key={user.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 hover:bg-muted/60">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => updateTier(tier, {
                                employeeIds: checked
                                  ? rule.employeeIds.filter((id) => id !== user.id)
                                  : [...rule.employeeIds, user.id],
                              })}
                              className="mt-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{employeeLabel(user)}</span>
                              <span className="block truncate text-xs text-muted-foreground">{[user.department, user.role].filter(Boolean).join(" · ") || "No department/role set"}</span>
                            </span>
                          </label>
                        );
                      }) : <p className="px-2 py-4 text-center text-xs text-muted-foreground">No active NIDO users are available.</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h3 className="text-sm font-medium">Assignment sequence</h3>
                      <p className="text-xs text-muted-foreground">Sequence numbers are unique within this tier. The same user can appear in another tier.</p>
                    </div>
                    {orderedUsers.length ? (
                      <div className="space-y-1">
                        {orderedUsers.map((user, index) => (
                          <div key={user.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                            <input
                              aria-label={`${tier} sequence position for ${employeeLabel(user)}`}
                              type="number"
                              min={1}
                              max={orderedUsers.length}
                              value={index + 1}
                              onChange={(event) => {
                                const position = Number(event.target.value);
                                if (position >= 1 && position <= orderedUsers.length) {
                                  updateTier(tier, { employeeIds: moveToPosition(rule.employeeIds, user.id, position) });
                                }
                              }}
                              className="h-8 w-14 rounded border border-border bg-background px-2 text-sm"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">{employeeLabel(user)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Move ${employeeLabel(user)} up`}
                              disabled={index === 0}
                              onClick={() => updateTier(tier, { employeeIds: moveToPosition(rule.employeeIds, user.id, index) })}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Move ${employeeLabel(user)} down`}
                              disabled={index === orderedUsers.length - 1}
                              onClick={() => updateTier(tier, { employeeIds: moveToPosition(rule.employeeIds, user.id, index + 2) })}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">Select active employees to define the order.</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`fallback-${tier}`}>Fallback when no eligible employee is available</Label>
                    <select
                      id={`fallback-${tier}`}
                      value={rule.fallbackBehavior}
                      onChange={(event) => updateTier(tier, { fallbackBehavior: event.target.value as FallbackBehavior })}
                      className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm"
                    >
                      <option value="leave_unassigned_notify">Leave unassigned and notify team (default)</option>
                      <option value="leave_unassigned">Leave unassigned without notification</option>
                      <option value="backup_employee">Use a backup employee</option>
                    </select>
                    {rule.fallbackBehavior === "backup_employee" && (
                      <select
                        aria-label={`${tier} backup employee`}
                        value={rule.backupEmployeeId}
                        onChange={(event) => updateTier(tier, { backupEmployeeId: event.target.value })}
                        className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm"
                      >
                        <option value="">Select active backup employee</option>
                        {activeUsers.map((user) => <option key={user.id} value={user.id}>{employeeLabel(user)}</option>)}
                      </select>
                    )}
                    <p className="text-xs text-muted-foreground">Fallback options are saved as UI settings only and are not executed yet.</p>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Preview next 5 assignments</h3>
                      <Badge variant="outline">No rotation change</Badge>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">Preview starts at sequence position 1; live pointer is unavailable until backend work.</p>
                    {preview.length ? (
                      <ol className="space-y-1">
                        {preview.map((item, index) => (
                          <li key={`${tier}-preview-${index}`} className="flex justify-between gap-3 text-xs">
                            <span>Order {index + 1}</span>
                            <span className="truncate font-medium">{employeeLabel(item.user)}</span>
                            <span className="text-muted-foreground">Seq {item.position}</span>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="text-xs text-muted-foreground">Add at least one active employee to preview this tier.</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Assignment History</h2>
                <p className="text-xs text-muted-foreground">History requires backend order integration; this UI-only draft does not create assignment records.</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {filterDescription(tierFilter, employeeFilter, methodFilter, statusFilter, dateFrom, dateTo)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <select aria-label="Filter by tier" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="all">All tiers</option>{TIERS.map((tier) => <option key={tier}>{tier}</option>)}
              </select>
              <select aria-label="Filter by employee" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="all">All employees</option>{activeUsers.map((user) => <option key={user.id} value={user.id}>{employeeLabel(user)}</option>)}
              </select>
              <select aria-label="Filter by assignment method" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="all">All methods</option><option>Automatic</option><option>Manual</option>
              </select>
              <select aria-label="Filter by assignment status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="all">All statuses</option><option>Assigned</option><option>Unassigned</option><option>Reassigned</option>
              </select>
              <input aria-label="History from date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs" />
              <input aria-label="History to date" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-xs" />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={clearHistoryFilters}>Clear filters</Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    {["Order ID", "Client", "Tier", "Assigned employee", "Method", "Assigned at", "Previous → new", "Reason", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No assignment history is stored in this UI-only draft. Records will appear after backend integration.</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
