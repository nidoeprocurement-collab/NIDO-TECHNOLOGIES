import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Info,
  MoreHorizontal,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AUTO_ASSIGNMENT_EVENT,
  createAutoAssignmentRule,
  getAutoAssignmentSettings,
  saveAutoAssignmentSettings,
  type AutoAssignmentRule,
} from "@/lib/autoAssignmentStore";
import { getClients, type StoredClient } from "@/lib/clientStore";
import {
  getUsers,
  NIDO_ROLES_EVENT,
  NIDO_USERS_EVENT,
  type NidoUser,
} from "@/lib/nidoUsersStore";

const FALLBACK_ROLES = ["Analyst", "Senior Analyst", "Lead Analyst"];
const tableCellClass = "px-4 py-3 align-top";

type RuleGroup = {
  department: string;
  rules: AutoAssignmentRule[];
};

function ruleKey(department: string, role: string): string {
  return `${department.trim().toLowerCase()}::${role.trim().toLowerCase()}`;
}

function buildLiveRules(users: NidoUser[]): AutoAssignmentRule[] {
  const groups = new Map<string, NidoUser[]>();

  users
    .filter((user) => user.status === "Active")
    .forEach((user) => {
      const department = user.department.trim() || "Unassigned Department";
      const role = user.role.trim() || "Unassigned Role";
      const key = ruleKey(department, role);
      groups.set(key, [...(groups.get(key) ?? []), user]);
    });

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group], index) => ({
      id: `live-rule-${index}-${group[0].id}`,
      department: group[0].department.trim() || "Unassigned Department",
      role: group[0].role.trim() || "Unassigned Role",
      assignedUserIds: [group[0].id],
      clientIds: [],
    }));
}

function reconcileRules(
  savedRules: AutoAssignmentRule[],
  users: NidoUser[],
  clients: StoredClient[],
): AutoAssignmentRule[] {
  const availableUserIds = new Set(users.map((user) => user.id));
  const availableClientIds = new Set(clients.map((client) => client.id));
  const cleanedRules = savedRules.map((rule) => ({
    ...rule,
    assignedUserIds: rule.assignedUserIds.filter((id) => availableUserIds.has(id)),
    clientIds: rule.clientIds.filter((id) => availableClientIds.has(id)),
  }));
  const existingKeys = new Set(cleanedRules.map((rule) => ruleKey(rule.department, rule.role)));

  return [
    ...cleanedRules,
    ...buildLiveRules(users).filter((rule) => !existingKeys.has(ruleKey(rule.department, rule.role))),
  ];
}

function getUserLabel(user: NidoUser): string {
  return user.name || user.email || user.employeeId || "Unnamed user";
}

function ClientMultiSelect({
  clients,
  selectedIds,
  open,
  onOpenChange,
  onToggle,
}: {
  clients: StoredClient[];
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (clientId: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedClients = selectedIds
    .map((id) => clients.find((client) => client.id === id))
    .filter((client): client is StoredClient => Boolean(client));

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative min-w-[260px]">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary/50"
        aria-expanded={open}
        aria-label="Select clients"
      >
        <span className="flex min-w-0 flex-wrap gap-1.5">
          {selectedClients.length === 0 ? (
            <span className="text-muted-foreground">Select clients</span>
          ) : (
            selectedClients.map((client) => (
              <span
                key={client.id}
                className="inline-flex max-w-[180px] items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                <span className="truncate">{client.name}</span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-[280px] overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
          <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select clients
          </div>
          {clients.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No clients are available.</p>
          ) : (
            clients.map((client) => {
              const checked = selectedIds.includes(client.id);
              return (
                <label
                  key={client.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox checked={checked} onCheckedChange={() => onToggle(client.id)} />
                  <span className="min-w-0 flex-1 truncate">{client.name}</span>
                  {checked && <Check className="h-4 w-4 text-primary" />}
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function AutoAssignmentTab() {
  const [enabled, setEnabled] = useState(true);
  const [users, setUsers] = useState<NidoUser[]>([]);
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [rules, setRules] = useState<AutoAssignmentRule[]>([]);
  const [openClientRuleId, setOpenClientRuleId] = useState<string | null>(null);

  const loadLiveSettings = () => {
    const nextUsers = getUsers();
    const nextClients = getClients();
    const settings = getAutoAssignmentSettings();
    setUsers(nextUsers);
    setClients(nextClients);
    setEnabled(settings.enabled);
    setRules(reconcileRules(settings.rules, nextUsers, nextClients));
  };

  useEffect(() => {
    loadLiveSettings();
    const handleUpdate = () => loadLiveSettings();
    window.addEventListener(AUTO_ASSIGNMENT_EVENT, handleUpdate);
    window.addEventListener(NIDO_USERS_EVENT, handleUpdate);
    window.addEventListener(NIDO_ROLES_EVENT, handleUpdate);
    window.addEventListener("nidoClientsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(AUTO_ASSIGNMENT_EVENT, handleUpdate);
      window.removeEventListener(NIDO_USERS_EVENT, handleUpdate);
      window.removeEventListener(NIDO_ROLES_EVENT, handleUpdate);
      window.removeEventListener("nidoClientsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const roleOptions = useMemo(() => {
    const names = users.map((user) => user.role.trim()).filter(Boolean);
    return Array.from(new Set([...FALLBACK_ROLES, ...names]));
  }, [users]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => user.department.trim()).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    [users],
  );

  const groupedRules = useMemo<RuleGroup[]>(() => {
    const groups = new Map<string, AutoAssignmentRule[]>();
    rules.forEach((rule) => {
      groups.set(rule.department, [...(groups.get(rule.department) ?? []), rule]);
    });
    return Array.from(groups.entries()).map(([department, groupRules]) => ({
      department,
      rules: groupRules,
    }));
  }, [rules]);

  const usersForRule = (rule: AutoAssignmentRule) => {
    const departmentUsers = users.filter(
      (user) => user.status === "Active" && user.department === rule.department,
    );
    const roleUsers = departmentUsers.filter((user) => user.role === rule.role);
    return roleUsers.length > 0 ? roleUsers : departmentUsers.length > 0 ? departmentUsers : users;
  };

  const updateRule = (ruleId: string, updates: Partial<AutoAssignmentRule>) => {
    setRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    );
  };

  const handleAddRule = () => {
    const department = departmentOptions[0] || "Unassigned Department";
    const role = roleOptions[0] || "Analyst";
    const availableUsers = users.filter(
      (user) => user.status === "Active" && user.department === department,
    );
    setRules((current) => [
      ...current,
      createAutoAssignmentRule({
        department,
        role,
        assignedUserIds: availableUsers.length > 0 ? [availableUsers[0].id] : [],
        clientIds: [],
      }),
    ]);
  };

  const handleSave = () => {
    saveAutoAssignmentSettings({ enabled, rules });
    toast({ title: "Saved", description: "Auto assignment rules have been saved." });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-5 px-3 py-4 sm:px-5 md:px-6 md:py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Assignment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure automatic assignment rules for orders, tickets and requests to analysts based on department, role and clients.
          </p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-border bg-blue-50/50 px-4 py-4 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <div>
                  <Label className="font-semibold">Enable Auto Assignment</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    New orders and tickets will be assigned using the rules below.
                  </p>
                </div>
              </div>
              <div className="flex max-w-md items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong>Priority Order</strong><br />Rules are evaluated in the order shown below. The first matching rule will be applied.</span>
              </div>
            </div>

            <div className="border-b border-border px-4 pt-3 sm:px-5">
              <div className="inline-flex items-center gap-2 border-b-2 border-primary px-4 pb-3 text-sm font-semibold text-primary">
                <Building2 className="h-4 w-4" /> By Department
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Department-wise Auto Assignment Rules</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assign orders and tickets to the right analyst based on department, role and selected clients.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddRule}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Rule
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned User(s)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clients</th>
                      <th className="w-12 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          Add active NIDO users to create live department assignment rules.
                        </td>
                      </tr>
                    ) : (
                      groupedRules.map((group, groupIndex) => (
                        <Fragment key={group.department}>
                          {group.rules.map((rule, ruleIndex) => {
                            const availableUsers = usersForRule(rule);
                            const selectedUserId = rule.assignedUserIds[0] || "";
                            return (
                              <tr key={rule.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                                {ruleIndex === 0 && (
                                  <td rowSpan={group.rules.length} className={`${tableCellClass} w-52 border-r border-border`}>
                                    <div className="flex items-start gap-2">
                                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <UsersRound className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-foreground">{group.department}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{group.rules.length} rule{group.rules.length === 1 ? "" : "s"}</div>
                                      </div>
                                    </div>
                                  </td>
                                )}
                                <td className={tableCellClass}>
                                  <select
                                    value={rule.role}
                                    onChange={(event) => updateRule(rule.id, { role: event.target.value })}
                                    className="h-9 min-w-[150px] rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                  >
                                    {!roleOptions.includes(rule.role) && <option value={rule.role}>{rule.role}</option>}
                                    {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                                  </select>
                                </td>
                                <td className={tableCellClass}>
                                  <select
                                    value={selectedUserId}
                                    onChange={(event) => updateRule(rule.id, { assignedUserIds: event.target.value ? [event.target.value] : [] })}
                                    className="h-9 min-w-[190px] rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                  >
                                    <option value="">Select user</option>
                                    {availableUsers.map((user) => (
                                      <option key={user.id} value={user.id}>{getUserLabel(user)}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className={tableCellClass}>
                                  <ClientMultiSelect
                                    clients={clients}
                                    selectedIds={rule.clientIds}
                                    open={openClientRuleId === rule.id}
                                    onOpenChange={(open) => setOpenClientRuleId(open ? rule.id : null)}
                                    onToggle={(clientId) => {
                                      const nextClientIds = rule.clientIds.includes(clientId)
                                        ? rule.clientIds.filter((id) => id !== clientId)
                                        : [...rule.clientIds, clientId];
                                      updateRule(rule.id, { clientIds: nextClientIds });
                                    }}
                                  />
                                </td>
                                <td className={`${tableCellClass} text-center`}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Remove rule"
                                    aria-label={`Remove ${rule.department} ${rule.role} rule`}
                                    onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {rules.length} live rule{rules.length === 1 ? "" : "s"} · {clients.length} client{clients.length === 1 ? "" : "s"} available
                </p>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}