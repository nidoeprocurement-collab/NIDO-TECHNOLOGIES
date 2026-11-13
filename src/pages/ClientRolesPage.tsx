import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { MoreVertical, X } from "lucide-react";
import { toast } from "sonner";
import { ModuleMultiSelect } from "@/components/ModuleMultiSelect";
import {
  createPortalRolePermission,
  getPortalModuleDescription,
  getPortalRoles,
  getPortalUsersByClient,
  PORTAL_MODULES,
  savePortalRoles,
  updatePortalUser,
  type PortalRole,
  type PortalRolePermission,
  type PortalUser,
} from "@/lib/portalUserStore";

const CLIENT_ACTIONS: Array<keyof Omit<PortalRolePermission, "module">> = [
  "view", "create", "edit", "delete", "approve", "export", "import", "manage", "configure",
];

const CLIENT_PERMISSION_CSV_COLUMNS = [
  "role_name", "description", "status", "module", "module_description",
  ...CLIENT_ACTIONS,
] as const;

function csvEscape(value: string | boolean): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount > semiCount
    ? "\t"
    : semiCount > commaCount
      ? ";"
      : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quote.");
  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some(cell => cell.length > 0)) rows.push(row);
  }
  return rows;
}

function normalizeCsvHeader(cell: string): string {
  const cleaned = cell
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  switch (cleaned) {
    case "role":
    case "rolename":
    case "name":
    case "role_title":
      return "role_name";
    case "role_description":
    case "desc":
    case "details":
      return "description";
    case "role_status":
    case "state":
      return "status";
    case "module_name":
    case "modulename":
    case "module_key":
    case "page":
      return "module";
    case "moduledescription":
    case "module_details":
      return "module_description";
    default:
      return cleaned;
  }
}

const MODULE_ALIASES: Record<string, string> = {
  dashboard: "Dashboard",
  home: "Dashboard",
  catalog: "Catalog",
  catalogue: "Catalog",
  products: "Catalog",
  product_catalog: "Catalog",
  orders: "Orders",
  order: "Orders",
  my_orders: "Orders",
  approvals: "Approvals",
  approval: "Approvals",
  services: "Services",
  service: "Services",
  my_services: "Services",
  invoices: "Invoices",
  invoice: "Invoices",
  billing: "Invoices",
  reports: "Reports",
  report: "Reports",
  notifications: "Notifications",
  notification: "Notifications",
  addresses: "Addresses",
  address: "Addresses",
  contracts: "Contracts",
  contract: "Contracts",
  support: "Support",
  support_tickets: "Support",
  tickets: "Support",
  my_profile: "My Profile",
  profile: "My Profile",
};

function resolvePortalModule(rawModule: string): string {
  const trimmed = rawModule.trim();
  if (!trimmed) return "";
  const exact = PORTAL_MODULES.find(m => m.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const aliasKey = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return MODULE_ALIASES[aliasKey] || trimmed;
}

function parseCsvBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "t", "x", "✓", "✔", "enabled", "allow", "allowed", "active"].includes(normalized)) {
    return true;
  }
  return false;
}

function parseCsvStatus(value: string): "active" | "inactive" {
  const normalized = value.trim().toLowerCase();
  if (["inactive", "disabled", "false", "no", "0", "deactivated"].includes(normalized)) {
    return "inactive";
  }
  return "active";
}

function readCsvFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read CSV file."));
    reader.readAsText(file);
  });
}

function downloadCsv(filename: string, rows: string[][]): void {
  const content = `${rows.map(row => row.join(",")).join("\r\n")}\r\n`;
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ClientRolesPage() {
  const { id: routeClientId } = useParams<{ id: string }>();
  const clientId = routeClientId || localStorage.getItem("nido_shop_selected_client") || "";
  const [roles, setRoles] = useState<PortalRole[]>(() => getPortalRoles(clientId));
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>(() => getPortalUsersByClient(clientId));
  const [selectedId, setSelectedId] = useState(roles[0]?.id || "");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [modulesToAdd, setModulesToAdd] = useState<string[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [draftRole, setDraftRole] = useState<PortalRole | null>(null);

  useEffect(() => {
    const refresh = () => {
      const nextRoles = getPortalRoles(clientId);
      setRoles(nextRoles);
      setPortalUsers(getPortalUsersByClient(clientId));
      setSelectedId(current => nextRoles.some(role => role.id === current)
        ? current
        : nextRoles[0]?.id || "");
    };
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === "nido_portal_users" ||
        event.key === `nido_portal_roles_${clientId}`
      ) refresh();
    };

    refresh();
    window.addEventListener("nidoPortalRolesUpdated", refresh);
    window.addEventListener("nidoPortalUsersUpdated", refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("nidoPortalRolesUpdated", refresh);
      window.removeEventListener("nidoPortalUsersUpdated", refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [clientId]);

  const selected = roles.find(role => role.id === selectedId) || null;
  const displayedRole = draftRole || selected;
  const isEditing = Boolean(draftRole);

  const persist = (next: PortalRole[]) => {
    setRoles(next);
    savePortalRoles(clientId, next);
  };

  const togglePermission = (
    module: string,
    action: keyof Omit<PortalRolePermission, "module">,
  ) => {
    if (!draftRole) return;
    setDraftRole({
      ...draftRole,
      permissions: draftRole.permissions.map(permission =>
        permission.module === module
          ? { ...permission, [action]: !permission[action] }
          : permission,
      ),
    });
  };

  const addModules = () => {
    let currentDraft = draftRole;
    if (!currentDraft && displayedRole) {
      currentDraft = {
        ...displayedRole,
        permissions: displayedRole.permissions.map(permission => ({ ...permission })),
      };
      setDraftRole(currentDraft);
    }
    if (!currentDraft || modulesToAdd.length === 0) return;

    const existing = new Set(currentDraft.permissions.map(item => item.module));
    const toAdd = modulesToAdd.filter(name => !existing.has(name));
    if (toAdd.length > 0) {
      setDraftRole({
        ...currentDraft,
        permissions: [
          ...currentDraft.permissions,
          ...toAdd.map(name => createPortalRolePermission(name)),
        ],
      });
    }
    setModulesToAdd([]);
  };

  const addModule = () => addModules();

  const removeModule = (moduleName: string) => {
    let currentDraft = draftRole;
    if (!currentDraft && displayedRole) {
      currentDraft = {
        ...displayedRole,
        permissions: displayedRole.permissions.map(permission => ({ ...permission })),
      };
    }
    if (!currentDraft) return;
    setDraftRole({
      ...currentDraft,
      permissions: currentDraft.permissions.filter(item => item.module !== moduleName),
    });
  };

  const addRole = () => {
    const name = newRoleName.trim();
    if (!name || roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
      if (name) window.alert("A role with this name already exists for this client.");
      return;
    }
    const role: PortalRole = {
      id: `client-role-${Date.now()}`,
      name,
      description: newRoleDescription.trim(),
      status: "active",
      permissions: [],
    };
    persist([...roles, role]);
    setSelectedId(role.id);
    setNewRoleName("");
    setNewRoleDescription("");
    setShowAddRole(false);
  };

  const beginEditing = (role: PortalRole) => {
    setDraftRole({
      ...role,
      permissions: role.permissions.map(permission => ({ ...permission })),
    });
  };

  const saveDraftRole = () => {
    if (!draftRole || !draftRole.name.trim()) return;
    const normalizedDraft = {
      ...draftRole,
      name: draftRole.name.trim(),
      description: draftRole.description.trim(),
    };
    const duplicate = roles.some(role =>
      role.id !== normalizedDraft.id &&
      role.name.toLowerCase() === normalizedDraft.name.toLowerCase(),
    );
    if (duplicate) {
      window.alert("A role with this name already exists for this client.");
      return;
    }

    const previous = roles.find(role => role.id === normalizedDraft.id);
    if (!previous) return;
    persist(roles.map(role => role.id === normalizedDraft.id ? normalizedDraft : role));
    if (previous.name !== normalizedDraft.name) {
      portalUsers
        .filter(user => user.role === previous.name)
        .forEach(user => updatePortalUser(user.id, { role: normalizedDraft.name }));
    }
    setDraftRole(null);
  };

  const discardDraftRole = () => {
    setDraftRole(null);
    setModulesToAdd([]);
  };

  const downloadCsvTemplate = () => {
    setShowActionsMenu(false);
    const rows = [
      CLIENT_PERMISSION_CSV_COLUMNS.map(column => csvEscape(column)),
    ];
    downloadCsv("client-role-permissions-template.csv", rows);
  };

  const exportRolesCsv = () => {
    setShowActionsMenu(false);
    const rows = [CLIENT_PERMISSION_CSV_COLUMNS.map(column => csvEscape(column))];
    roles.forEach(role => {
      const permissions: Array<PortalRolePermission | null> = role.permissions.length
        ? role.permissions
        : [null];
      permissions.forEach(permission => {
        rows.push([
          role.name,
          role.description,
          role.status,
          permission?.module || "",
          permission ? getPortalModuleDescription(permission.module) : "",
          ...CLIENT_ACTIONS.map(action => Boolean(permission?.[action])),
        ].map(value => csvEscape(value)));
      });
    });
    downloadCsv("client-role-permissions.csv", rows);
  };

  const handleBulkUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setShowActionsMenu(false);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const rows = parseCsv(await readCsvFileText(file));
      if (rows.length < 2) {
        throw new Error("The CSV template is empty. Please add at least one role row below the header before uploading.");
      }

      const header = rows[0].map(normalizeCsvHeader);
      if (!header.includes("role_name")) {
        throw new Error("Missing required CSV column: role_name.");
      }

      const columnIndex = Object.fromEntries(header.map((column, index) => [column, index]));
      const imported = new Map<string, {
        name: string;
        description: string;
        status: "active" | "inactive";
        permissions: Map<string, PortalRolePermission>;
      }>();

      let lastRoleName = "";

      rows.slice(1).forEach((cells) => {
        if (!cells.some(cell => cell.trim().length > 0)) return;

        const explicitRoleName = columnIndex.role_name !== undefined
          ? (cells[columnIndex.role_name] || "").trim()
          : "";
        const roleName = explicitRoleName || lastRoleName;
        if (!roleName) return;
        lastRoleName = roleName;

        const rawModule = columnIndex.module !== undefined
          ? (cells[columnIndex.module] || "").trim()
          : "";
        const moduleName = resolvePortalModule(rawModule);

        const rawStatus = columnIndex.status !== undefined
          ? (cells[columnIndex.status] || "").trim()
          : "";
        const status = rawStatus ? parseCsvStatus(rawStatus) : undefined;

        const rawDescription = columnIndex.description !== undefined
          ? (cells[columnIndex.description] || "").trim()
          : "";

        const roleKey = roleName.toLowerCase();
        const current = imported.get(roleKey) || {
          name: roleName,
          description: rawDescription,
          status: status || "active",
          permissions: new Map<string, PortalRolePermission>(),
        };

        if (rawDescription) current.description = rawDescription;
        if (status) current.status = status;

        if (moduleName) {
          const permission = createPortalRolePermission(moduleName, Object.fromEntries(
            CLIENT_ACTIONS.map(action => [
              action,
              columnIndex[action] !== undefined
                ? parseCsvBoolean(cells[columnIndex[action]] || "")
                : false,
            ]),
          ) as Partial<PortalRolePermission>);
          current.permissions.set(moduleName, permission);
        }

        imported.set(roleKey, current);
      });

      if (imported.size === 0) {
        throw new Error("No valid role rows were found in the CSV file.");
      }

      const existingByName = new Map(roles.map(role => [role.name.toLowerCase(), role]));
      const importedRoles = Array.from(imported.values()).map((incoming, index) => {
        const existing = existingByName.get(incoming.name.toLowerCase());
        return {
          id: existing?.id || `client-role-${Date.now()}-${index}`,
          name: incoming.name,
          description: incoming.description,
          status: incoming.status,
          permissions: [...incoming.permissions.values()],
        };
      });

      const importedByName = new Map(importedRoles.map(role => [role.name.toLowerCase(), role]));
      const untouchedRoles = roles.filter(role => !importedByName.has(role.name.toLowerCase()));
      const nextRoles = [...untouchedRoles, ...importedRoles];
      persist(nextRoles);
      setSelectedId(importedRoles[0]?.id || selectedId);
      toast.success(`Imported ${importedRoles.length} role${importedRoles.length === 1 ? "" : "s"} successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import the CSV file.";
      toast.error(message);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Roles &amp; Permissions</h2>
          <p className="text-xs text-gray-500 mt-1">
            Saved roles and currently assigned users for this client account.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActionsMenu(open => !open)}
            aria-label="Role and permission actions"
            aria-expanded={showActionsMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <MoreVertical size={17} />
          </button>
          {showActionsMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => { setShowActionsMenu(false); setShowAddRole(true); }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Add Role
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Download Template
              </button>
              <button
                type="button"
                onClick={exportRolesCsv}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export CSV
              </button>
              <label className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                Bulk Upload CSV
                <input type="file" accept=".csv,text/csv" onChange={handleBulkUpload} className="sr-only" />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-5 max-[760px]:grid-cols-1">
        <div className="space-y-1">
          {roles.map(role => {
            const assigned = portalUsers.filter(user => user.role === role.name).length;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  if (isEditing) {
                    if (!window.confirm("Discard unsaved role changes?")) return;
                    discardDraftRole();
                  }
                  setSelectedId(role.id);
                }}
                disabled={isEditing && role.id !== selectedId}
                className={`w-full text-left px-3 py-2.5 rounded-lg border ${selectedId === role.id ? "border-blue-300 bg-blue-50" : "border-transparent hover:bg-gray-50"}`}
              >
                <div className="text-sm font-medium text-gray-800">{role.name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {assigned} assigned user{assigned === 1 ? "" : "s"}
                </div>
              </button>
            );
          })}
          {roles.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
              <p className="text-sm font-medium text-gray-700">No roles configured</p>
              <p className="mt-1 text-xs text-gray-500">
                This client has no saved roles yet.
              </p>
              <button
                type="button"
                onClick={() => setShowAddRole(true)}
                className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                Create first role
              </button>
            </div>
          )}
        </div>

        {displayedRole ? (
          <div className="min-w-0 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      value={displayedRole.name}
                      onChange={event => setDraftRole(current => current ? { ...current, name: event.target.value } : current)}
                      className="rounded-lg border border-blue-200 px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      aria-label="Role name"
                    />
                  ) : (
                    <h3 className="text-sm font-semibold text-gray-900">{displayedRole.name}</h3>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${displayedRole.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {displayedRole.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                {isEditing ? (
                  <textarea
                    value={displayedRole.description}
                    onChange={event => setDraftRole(current => current ? { ...current, description: event.target.value } : current)}
                    className="mt-1 w-full max-w-xl rounded-lg border border-blue-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    rows={2}
                    aria-label="Role description"
                  />
                ) : (
                  <p className="text-xs text-gray-500 mt-1">{displayedRole.description || "No description"}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <button type="button" onClick={discardDraftRole} className="text-xs text-gray-600 hover:underline">Cancel</button>
                    <button
                      type="button"
                      onClick={saveDraftRole}
                      disabled={!displayedRole.name.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => beginEditing(displayedRole)} className="text-xs text-blue-600 hover:underline">
                    Edit role
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50">
              <ModuleMultiSelect
                existingModules={displayedRole.permissions.map(item => item.module)}
                selectedModules={modulesToAdd}
                onSelectionChange={setModulesToAdd}
                onAddModules={addModules}
                onRemoveModule={removeModule}
                disabled={!isEditing}
                onEnableEdit={() => beginEditing(displayedRole)}
              />
              {!isEditing && (
                <button type="button" onClick={() => beginEditing(displayedRole)} className="text-xs text-blue-600 hover:underline font-medium">
                  Edit Role to Change Permissions
                </button>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setDraftRole(current => current ? {
                    ...current,
                    status: current.status === "active" ? "inactive" : "active",
                  } : current)}
                  className="text-xs text-gray-600 hover:underline"
                >
                  {displayedRole.status === "active" ? "Deactivate" : "Activate"}
                </button>
              )}
              <span className="text-[11px] text-gray-400 ml-auto">
                {displayedRole.permissions.length} configured module{displayedRole.permissions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500">MODULE</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500">DETAILS</th>
                    {CLIENT_ACTIONS.map(action => (
                      <th key={action} className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedRole.permissions.map((permission, index) => (
                    <tr key={permission.module} className={index % 2 ? "bg-gray-50/50" : "bg-white"}>
                      <td className="px-4 py-2.5 font-medium text-gray-700">{permission.module}</td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-400 min-w-[220px]">
                        {getPortalModuleDescription(permission.module)}
                      </td>
                      {CLIENT_ACTIONS.map(action => (
                        <td key={action} className="text-center px-3 py-2.5">
                          <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() => togglePermission(permission.module, action)}
                            aria-label={`${action} ${permission.module}`}
                            aria-pressed={Boolean(permission[action])}
                            className={`w-4 h-4 rounded-full border-2 inline-flex items-center justify-center ${permission[action] ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-300"} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {permission[action] && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {displayedRole.permissions.length === 0 && (
                    <tr>
                      <td colSpan={CLIENT_ACTIONS.length + 2} className="px-4 py-10 text-center text-sm text-gray-500">
                        No modules are configured for this role.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              {isEditing
                ? "Changes are staged locally. Press Save Changes to update this role, or Cancel to discard them."
                : "Select Edit role to stage permission, module, status, name, and description changes."}
            </p>
          </div>
        ) : null}
      </div>

      {showAddRole && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Add Client Role</h3>
              <button type="button" onClick={() => setShowAddRole(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <input
              value={newRoleName}
              onChange={event => setNewRoleName(event.target.value)}
              placeholder="Role name"
              aria-label="New role name"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
            <textarea
              value={newRoleDescription}
              onChange={event => setNewRoleDescription(event.target.value)}
              placeholder="Description (optional)"
              aria-label="New role description"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowAddRole(false)} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
              <button
                type="button"
                onClick={addRole}
                disabled={!newRoleName.trim()}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-40"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
