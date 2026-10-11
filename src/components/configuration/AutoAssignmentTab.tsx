import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Check,
  ChevronDown,
  Info,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getRoles,
  NIDO_ROLES_EVENT,
  NIDO_USERS_EVENT,
  type NidoRole,
  type NidoUser,
} from "@/lib/nidoUsersStore";
import TierBasedAutoAssignmentPanel from "@/components/configuration/TierBasedAutoAssignmentPanel";

const FALLBACK_ROLES = ["Analyst", "Senior Analyst", "Lead Analyst"];
const DEPARTMENTS_PER_PAGE = 10;
const tableCellClass = "px-4 py-3 align-top";

type RuleGroup = {
  department: string;
  rules: AutoAssignmentRule[];
};

function assignmentSnapshot(enabled: boolean, rules: AutoAssignmentRule[]): string {
  return JSON.stringify({ enabled, rules });
}

function ruleKey(department: string, role: string): string {
  return `${department.trim().toLowerCase()}::${role.trim().toLowerCase()}`;
}

function buildLiveRules(users: NidoUser[], roles: NidoRole[]): AutoAssignmentRule[] {
  const activeUsers = users.filter((user) => user.status === "Active");
  const configuredRoles = roles.filter((role) => role.status === "Active" && role.name.trim());
  const liveRoleKeys = new Set<string>();
  const liveRules: AutoAssignmentRule[] = [];

  configuredRoles.forEach((role) => {
    const department = role.department.trim() || "Unassigned Department";
    const roleName = role.name.trim();
    const key = ruleKey(department, roleName);
    if (liveRoleKeys.has(key)) return;
    liveRoleKeys.add(key);

    const matchingUsers = activeUsers.filter(
      (user) => user.department.trim() === department && user.role.trim() === roleName,
    );
    liveRules.push({
      id: `live-rule-${key.replace(/[^a-z0-9]+/gi, "-")}`,
      department,
      role: roleName,
      assignedUserIds: matchingUsers.length > 0 ? [matchingUsers[0].id] : [],
      clientIds: [],
    });
  });

  // Keep users with a custom role/department visible until an administrator
  // adds that role to User Roles, rather than silently dropping live data.
  activeUsers.forEach((user) => {
    const department = user.department.trim() || "Unassigned Department";
    const role = user.role.trim() || "Unassigned Role";
    const key = ruleKey(department, role);
    if (liveRoleKeys.has(key)) return;
    liveRoleKeys.add(key);
    liveRules.push({
      id: `live-user-rule-${user.id}`,
      department,
      role,
      assignedUserIds: [user.id],
      clientIds: [],
    });
  });

  return liveRules.sort((left, right) =>
    ruleKey(left.department, left.role).localeCompare(ruleKey(right.department, right.role)),
  );
}

function reconcileRules(
  savedRules: AutoAssignmentRule[],
  users: NidoUser[],
  roles: NidoRole[],
  clients: StoredClient[],
): AutoAssignmentRule[] {
  const availableUserIds = new Set(
    users.filter((user) => user.status === "Active").map((user) => user.id),
  );
  const availableClientIds = new Set(clients.map((client) => client.id));
  const cleanedRules = savedRules.map((rule) => ({
    ...rule,
    assignedUserIds: rule.assignedUserIds.filter((id) => availableUserIds.has(id)),
    clientIds: rule.clientIds.filter((id) => availableClientIds.has(id)),
  }));
  const existingKeys = new Set(cleanedRules.map((rule) => ruleKey(rule.department, rule.role)));

  return [
    ...cleanedRules,
    ...buildLiveRules(users, roles).filter((rule) => !existingKeys.has(ruleKey(rule.department, rule.role))),
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
      <div
        className="flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-sm hover:border-primary/50"
        onClick={() => onOpenChange(!open)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedClients.length === 0 ? (
            <span className="px-0.5 py-1 text-muted-foreground">Select clients</span>
          ) : (
            selectedClients.map((client) => (
              <span
                key={client.id}
                className="inline-flex max-w-[190px] items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                <span className="truncate">{client.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`Remove ${client.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(client.id);
                  }}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded p-1 hover:bg-muted"
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!open);
          }}
          aria-expanded={open}
          aria-label="Select clients"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

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

function UserMultiSelect({
  users,
  selectedIds,
  open,
  onOpenChange,
  onToggle,
}: {
  users: NidoUser[];
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (userId: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedUsers = selectedIds
    .map((id) => users.find((user) => user.id === id))
    .filter((user): user is NidoUser => Boolean(user));

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative min-w-[230px]">
      <div
        className="flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-sm hover:border-primary/50"
        onClick={() => onOpenChange(!open)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedUsers.length === 0 ? (
            <span className="px-0.5 py-1 text-muted-foreground">Select users</span>
          ) : (
            selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex max-w-[190px] items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                <span className="truncate">{getUserLabel(user)}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`Remove ${getUserLabel(user)}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(user.id);
                  }}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded p-1 hover:bg-muted"
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!open);
          }}
          aria-expanded={open}
          aria-label="Select assigned users"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-[260px] overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
          <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select assigned users
          </div>
          {users.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No active users are available.</p>
          ) : (
            users.map((user) => {
              const checked = selectedIds.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox checked={checked} onCheckedChange={() => onToggle(user.id)} />
                  <span className="min-w-0 flex-1 truncate">{getUserLabel(user)}</span>
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
  const location = useLocation();
  const navigate = useNavigate();
  const [configurationView, setConfigurationView] = useState<"tiers" | "existing">("tiers");
  const [enabled, setEnabled] = useState(true);
  const [users, setUsers] = useState<NidoUser[]>([]);
  const [roles, setRoles] = useState<NidoRole[]>([]);
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [rules, setRules] = useState<AutoAssignmentRule[]>([]);
  const [openClientRuleId, setOpenClientRuleId] = useState<string | null>(null);
  const [openUserRuleId, setOpenUserRuleId] = useState<string | null>(null);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const savedSnapshotRef = useRef("");
  const currentPathRef = useRef(
    `${location.pathname}${location.search}${location.hash}`,
  );
  const bypassNavigationRef = useRef(false);
  const dirtyRef = useRef(false);

  const loadLiveSettings = () => {
    const nextUsers = getUsers();
    const nextRoles = getRoles();
    const nextClients = getClients();
    const settings = getAutoAssignmentSettings();
    const nextRules = reconcileRules(settings.rules, nextUsers, nextRoles, nextClients);
    setUsers(nextUsers);
    setRoles(nextRoles);
    setClients(nextClients);
    setEnabled(settings.enabled);
    setRules(nextRules);
    savedSnapshotRef.current = assignmentSnapshot(settings.enabled, nextRules);
  };

  useEffect(() => {
    loadLiveSettings();
    const handleUpdate = () => {
      if (!dirtyRef.current) loadLiveSettings();
    };
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

  const hasUnsavedChanges = useMemo(
    () => assignmentSnapshot(enabled, rules) !== savedSnapshotRef.current,
    [enabled, rules],
  );
  dirtyRef.current = hasUnsavedChanges;

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const previousPath = currentPathRef.current;

    if (bypassNavigationRef.current) {
      bypassNavigationRef.current = false;
      currentPathRef.current = currentPath;
      return;
    }

    if (hasUnsavedChanges && currentPath !== previousPath) {
      setPendingNavigation(currentPath);
      navigate(previousPath, { replace: true });
      return;
    }

    currentPathRef.current = currentPath;
  }, [hasUnsavedChanges, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (nextPath === currentPathRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(nextPath);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [hasUnsavedChanges]);

  const roleOptions = useMemo(() => {
    const names = [
      ...roles.filter((role) => role.status === "Active").map((role) => role.name.trim()),
      ...users.map((user) => user.role.trim()),
    ].filter(Boolean);
    return Array.from(new Set([...FALLBACK_ROLES, ...names]));
  }, [roles, users]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => user.department.trim()).filter(Boolean)),
      ).concat(
        roles.map((role) => role.department.trim()).filter(Boolean),
      ).filter((department, index, departments) => departments.indexOf(department) === index)
        .sort((left, right) => left.localeCompare(right)),
    [roles, users],
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

  const totalDepartmentPages = Math.max(
    1,
    Math.ceil(groupedRules.length / DEPARTMENTS_PER_PAGE),
  );
  const visibleGroups = useMemo(
    () =>
      groupedRules.slice(
        (departmentPage - 1) * DEPARTMENTS_PER_PAGE,
        departmentPage * DEPARTMENTS_PER_PAGE,
      ),
    [departmentPage, groupedRules],
  );

  useEffect(() => {
    setDepartmentPage((currentPage) => Math.min(currentPage, totalDepartmentPages));
  }, [totalDepartmentPages]);

  const usersForRule = (rule: AutoAssignmentRule) => {
    const departmentUsers = users.filter(
      (user) => user.status === "Active" && user.department === rule.department,
    );
    const roleUsers = departmentUsers.filter((user) => user.role === rule.role);
    const activeUsers = users.filter((user) => user.status === "Active");
    return roleUsers.length > 0 ? roleUsers : departmentUsers.length > 0 ? departmentUsers : activeUsers;
  };

  const updateRule = (ruleId: string, updates: Partial<AutoAssignmentRule>) => {
    setRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    );
  };

  const handleAddRole = (department: string) => {
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
    savedSnapshotRef.current = assignmentSnapshot(enabled, rules);
    toast({ title: "Saved", description: "Auto assignment rules have been saved." });
  };

  const handleLeaveWithoutSaving = () => {
    if (!pendingNavigation) return;
    const target = pendingNavigation;
    setPendingNavigation(null);
    bypassNavigationRef.current = true;
    currentPathRef.current = target;
    navigate(target);
  };

  return (
    <>
    <div className="w-full px-3 pt-4 sm:px-5 md:px-6">
      <div className="inline-flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <Button
          type="button"
          size="sm"
          variant={configurationView === "tiers" ? "default" : "ghost"}
          onClick={() => setConfigurationView("tiers")}
        >
          Tier-Based Configuration
        </Button>
        <Button
          type="button"
          size="sm"
          variant={configurationView === "existing" ? "default" : "ghost"}
          onClick={() => setConfigurationView("existing")}
        >
          Existing Department / Role Rules
        </Button>
      </div>
    </div>
    {configurationView === "tiers" ? (
      <TierBasedAutoAssignmentPanel />
    ) : (
      <>
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-5 px-3 py-4 sm:px-5 md:px-6 md:py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Assignment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure automatic assignment rules for orders, tickets and requests using live departments and roles from User Roles and live users from Add / Manage Users.
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
                    Assign orders and tickets to the right user based on the live department, role and selected client rules.
                  </p>
                </div>
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
                       visibleGroups.map((group) => (
                        <Fragment key={group.department}>
                          {group.rules.map((rule, ruleIndex) => {
                            const availableUsers = usersForRule(rule);
                            return (
                              <tr key={rule.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                                {ruleIndex === 0 && (
                                   <td rowSpan={group.rules.length + 1} className={`${tableCellClass} w-52 border-r border-border`}>
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
                                   <UserMultiSelect
                                     users={availableUsers}
                                     selectedIds={rule.assignedUserIds}
                                     open={openUserRuleId === rule.id}
                                     onOpenChange={(open) => setOpenUserRuleId(open ? rule.id : null)}
                                     onToggle={(userId) => {
                                       const nextAssignedUserIds = rule.assignedUserIds.includes(userId)
                                         ? rule.assignedUserIds.filter((id) => id !== userId)
                                         : [...rule.assignedUserIds, userId];
                                       updateRule(rule.id, { assignedUserIds: nextAssignedUserIds });
                                     }}
                                   />
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
                                   <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                           <tr className="border-b border-border">
                             <td className={tableCellClass}>
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 className="h-8 px-2 text-xs normal-case text-primary hover:text-primary"
                                 onClick={() => handleAddRole(group.department)}
                               >
                                 <Plus className="mr-1 h-3.5 w-3.5" /> Add Role
                               </Button>
                             </td>
                             <td colSpan={3} className={tableCellClass} />
                           </tr>
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {groupedRules.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing departments {(departmentPage - 1) * DEPARTMENTS_PER_PAGE + 1}–
                    {Math.min(departmentPage * DEPARTMENTS_PER_PAGE, groupedRules.length)} of{" "}
                    {groupedRules.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={departmentPage === 1}
                      onClick={() => setDepartmentPage((currentPage) => Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center text-xs text-muted-foreground">
                      Page {departmentPage} of {totalDepartmentPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={departmentPage === totalDepartmentPages}
                      onClick={() => setDepartmentPage((currentPage) => Math.min(totalDepartmentPages, currentPage + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

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
    <Dialog
      open={Boolean(pendingNavigation)}
      onOpenChange={(open) => !open && setPendingNavigation(null)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Unsaved Auto Assignment changes</DialogTitle>
          <DialogDescription>
            You have changes on this page that have not been saved. Leave without saving them?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPendingNavigation(null)}>
            Stay on page
          </Button>
          <Button variant="destructive" onClick={handleLeaveWithoutSaving}>
            Leave without saving
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      </>
    )}
    </>
  );
}