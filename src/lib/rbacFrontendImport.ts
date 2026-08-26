/**
 * Frontend-only RBAC data import.
 *
 * The two attached RBAC reference documents are bundled as read-only source
 * data and parsed once into localStorage. Nothing in this module calls the
 * server, Supabase, or any backend endpoint.
 */
import catalogSource from "../../attached_assets/Pasted-Build-a-complete-enterprise-RBAC-Role-Based-Access-Cont_1787335981787.txt?raw";
import matrixSource from "../../attached_assets/Pasted-1-Super-Admin-Module-View-Create-Edit-Delete-Approve-Ex_1787336592581.txt?raw";

const CATALOG_KEY = "nido_rbac_imported_catalog";
const ROLES_KEY = "nido_config_roles";
const PERMISSIONS_KEY = "nido_role_permissions";
const CUSTOM_MODULES_KEY = "nido_custom_modules";
const IMPORT_VERSION = "rbac-reference-v1";

const ACTIONS = ["view", "create", "edit", "delete", "approve", "export", "import", "manage", "configure"] as const;

function keyFor(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseCatalog() {
  const groups: { key: string; name: string; displayOrder: number }[] = [];
  const modules: { key: string; name: string; groupKey: string; displayOrder: number }[] = [];
  const lines = catalogSource.split(/\r?\n/);
  let currentGroup: { key: string; name: string; displayOrder: number } | null = null;
  let inModules = false;

  for (const line of lines) {
    if (line.includes("2. NIDO ROLES")) break;
    const group = line.match(/^GROUP\s+(\d+)\s+—\s+(.+)$/);
    if (group) {
      currentGroup = { key: keyFor(group[2]), name: group[2].trim(), displayOrder: Number(group[1]) };
      groups.push(currentGroup);
      inModules = true;
      continue;
    }
    const module = line.match(/^(\d+)\.\s+(.+)$/);
    if (inModules && currentGroup && module) {
      modules.push({
        key: keyFor(module[2]),
        name: module[2].trim(),
        groupKey: currentGroup.key,
        displayOrder: Number(module[1]),
      });
    }
  }

  const roles: { id: string; name: string; description: string; status: "Active" }[] = [];
  const roleSection = catalogSource.split("2. NIDO ROLES")[1]?.split("3. PERMISSION ACTIONS")[0] || "";
  for (const line of roleSection.split(/\r?\n/)) {
    const role = line.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
    if (role) {
      roles.push({
        id: `imported-role-${keyFor(role[2])}`,
        name: role[2].trim(),
        description: "Imported NIDO RBAC role",
        status: "Active",
      });
    }
  }

  return { groups, modules, roles, actions: ACTIONS.map(key => ({ key, label: key[0].toUpperCase() + key.slice(1) })) };
}

function parsePermissionMatrix(): Record<string, Record<string, Record<string, boolean>>> {
  const result: Record<string, Record<string, Record<string, boolean>>> = {};
  let roleName = "";

  for (const rawLine of matrixSource.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = line.match(/^\d+\.\s+(.+)$/);
    if (heading && !line.startsWith("Module")) {
      roleName = heading[1].trim();
      result[roleName] = {};
      continue;
    }
    if (!roleName || !line || line.startsWith("Module")) continue;

    const columns = rawLine.split(/\t+/).map(value => value.trim());
    if (columns.length !== 10) continue;
    const moduleName = columns[0];
    const permissions: Record<string, boolean> = {};
    ACTIONS.forEach((action, index) => {
      if (columns[index + 1] === "✓") permissions[action] = true;
    });
    result[roleName][keyFor(moduleName)] = permissions;
  }

  return result;
}

/**
 * Imports the attached RBAC definitions into frontend localStorage once.
 * Existing roles and explicitly saved permissions are never overwritten.
 */
export function importFrontendRbacData(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(CATALOG_KEY) === IMPORT_VERSION) return;

  const catalog = parseCatalog();
  const matrix = parsePermissionMatrix();

  localStorage.setItem(CATALOG_KEY, IMPORT_VERSION);
  localStorage.setItem("nido_rbac_catalog", JSON.stringify(catalog));

  try {
    const existingRoles = JSON.parse(localStorage.getItem(ROLES_KEY) || "[]");
    const existingNames = new Set(existingRoles.map((role: { name: string }) => role.name));
    const mergedRoles = [
      ...existingRoles,
      ...catalog.roles.filter(role => !existingNames.has(role.name)),
    ];
    localStorage.setItem(ROLES_KEY, JSON.stringify(mergedRoles));
  } catch {
    localStorage.setItem(ROLES_KEY, JSON.stringify(catalog.roles));
  }

  try {
    const existingPermissions = JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "{}");
    for (const [roleName, permissions] of Object.entries(matrix)) {
      if (!Object.prototype.hasOwnProperty.call(existingPermissions, roleName)) {
        existingPermissions[roleName] = permissions;
      }
    }
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(existingPermissions));
  } catch {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(matrix));
  }

  // Keep the imported 63-module catalog available to the existing frontend
  // module picker without altering route behavior or creating backend data.
  try {
    const existingCustom = JSON.parse(localStorage.getItem(CUSTOM_MODULES_KEY) || "[]");
    const existingKeys = new Set(existingCustom.map((module: { key: string }) => module.key));
    const importedModules = catalog.modules
      .filter(module => !existingKeys.has(module.key))
      .map(module => ({ key: module.key, label: module.name }));
    localStorage.setItem(CUSTOM_MODULES_KEY, JSON.stringify([...existingCustom, ...importedModules]));
  } catch {
    localStorage.setItem(
      CUSTOM_MODULES_KEY,
      JSON.stringify(catalog.modules.map(module => ({ key: module.key, label: module.name }))),
    );
  }
}
