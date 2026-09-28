// ── NIDO Users Store ──────────────────────────────────────────────────────────
// Single source of truth for all NIDO internal platform users and their roles.
// Persists to localStorage.  Fires DOM events on every mutation so subscribers
// (ManageUsersPanel, PermissionsContext, LoginPage, etc.) stay in sync.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { importFrontendRbacData } from "./rbacFrontendImport";
import { importFrontendUsers } from "./usersFrontendImport";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NidoRole {
  id: string;
  department: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
}

export interface LoginHistoryEntry {
  timestamp: string;
  result: "success" | "invalid_password" | "inactive" | "suspended" | "locked";
  ip?: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
}

export interface NidoUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;           // must match a NidoRole.name
  jobTitle: string;
  designation: string;
  reportingManager: string;
  department: string;
  status: "Active" | "Inactive" | "Suspended";
  /** Calendar date the employee joined the organization. */
  dateOfJoining?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  forcePasswordChange?: boolean;
  locked?: boolean;
  failedLoginAttempts?: number;
  loginHistory?: LoginHistoryEntry[];
}

/** Number of consecutive failed logins before an account is auto-locked. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

// ── Storage keys ───────────────────────────────────────────────────────────────

const ROLES_KEY = "nido_config_roles";
const USERS_KEY = "nido_config_users";
export const SYSTEM_OWNER_ID = "user-1";
export const SYSTEM_OWNER_ROLE = "System Owner";

// ── DOM events fired on every mutation ────────────────────────────────────────

export const NIDO_ROLES_EVENT = "nidoConfigRolesUpdated";
export const NIDO_USERS_EVENT = "nidoConfigUsersUpdated";

export interface LoginContext {
  ip?: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
}

// ── Bootstrap data ────────────────────────────────────────────────────────────
// Roles and user records are live data persisted in localStorage. Do not seed
// demo roles or users into the configuration lists. The protected owner is the
// only bootstrap account because the local authentication flow needs an initial
// administrator.

const NOW = new Date().toISOString().split("T")[0];

const DEFAULT_ROLES: NidoRole[] = [
  { id: "role-system-owner",       department: "All Departments", name: "System Owner", description: "Full system access — all permissions always granted", status: "Active" },
];

// These identify only the seeded role records from the previous version.
// Roles created through the live form use generated IDs and are never removed.
const LEGACY_DEMO_ROLE_IDS = new Set([
  "role-system-admin",
  "role-procurement-manager",
  "role-accounts-payable",
  "role-vendor-admin",
  "role-finance",
  "role-operations",
  "role-viewer",
]);

function removeLegacyDemoRoles(roles: NidoRole[]): NidoRole[] {
  return roles.filter(role => !LEGACY_DEMO_ROLE_IDS.has(role.id));
}

const SYSTEM_OWNER_USER: NidoUser = {
  id: SYSTEM_OWNER_ID, employeeId: "EMP-001",
  name: "System Owner", email: "owner@nidotech.com", password: "Owner@123",
  phone: "+91-44-1234-5678", role: SYSTEM_OWNER_ROLE,
  jobTitle: "CEO", designation: "Chief Executive Officer", reportingManager: "", department: "Management",
  status: "Active", dateOfJoining: NOW, createdAt: NOW, updatedAt: NOW,
};

// These identify only the demo records from the previous version. Users added
// through the live form receive generated IDs and are never removed here.
const LEGACY_DEMO_USER_IDS = new Set(["user-2", "user-3", "user-4", "user-5"]);
const LEGACY_DEMO_USER_EMAILS = new Set([
  "admin@nidotech.com",
  "procurement@nidotech.com",
  "ap@nidotech.com",
  "vendor@apex.com",
]);

function removeLegacyDemoUsers(users: NidoUser[]): NidoUser[] {
  return users.filter((user) =>
    !LEGACY_DEMO_USER_IDS.has(user.id) &&
    !LEGACY_DEMO_USER_EMAILS.has(user.email.trim().toLowerCase())
  );
}

export function isSystemOwner(user: Pick<NidoUser, "id" | "role"> | null | undefined): boolean {
  return user?.id === SYSTEM_OWNER_ID || user?.role === SYSTEM_OWNER_ROLE;
}

/**
 * Keep the protected owner account in the users collection even if an older
 * UI or a stale browser tab tries to save a list without it. Authentication
 * metadata may still change, but identity, access, status, and credentials do
 * not.
 */
function preserveSystemOwner(users: NidoUser[]): NidoUser[] {
  const incomingOwner = users.find(isSystemOwner);
  const owner = {
    ...SYSTEM_OWNER_USER,
    lastLogin: incomingOwner?.lastLogin,
    failedLoginAttempts: incomingOwner?.failedLoginAttempts ?? 0,
    loginHistory: incomingOwner?.loginHistory ?? [],
    updatedAt: incomingOwner?.updatedAt ?? SYSTEM_OWNER_USER.updatedAt,
  };
  return [owner, ...users.filter(user => !isSystemOwner(user))];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fill any fields that may be missing in data stored before the schema extension. */
function migrateUser(raw: any): NidoUser {
  return {
    id:                  raw.id ?? genId("user"),
    employeeId:          raw.employeeId          ?? "",
    name:                raw.name                ?? "",
    email:               raw.email               ?? "",
    password:            raw.password            ?? "Password@123",
    phone:               raw.phone               ?? "",
    role:                raw.role                ?? "",
    jobTitle:            raw.jobTitle            ?? "",
    designation:         raw.designation         ?? raw.jobTitle ?? "",
    reportingManager:    raw.reportingManager    ?? "",
    department:          raw.department          ?? "",
    status:              raw.status              ?? "Active",
    dateOfJoining:       raw.dateOfJoining       ?? raw.createdAt ?? NOW,
    lastLogin:           raw.lastLogin,
    createdAt:           raw.createdAt           ?? NOW,
    updatedAt:           raw.updatedAt           ?? NOW,
    forcePasswordChange: raw.forcePasswordChange ?? false,
    locked:              raw.locked              ?? false,
    failedLoginAttempts: raw.failedLoginAttempts ?? 0,
    loginHistory:        raw.loginHistory         ?? [],
  };
}

// ── Roles CRUD ─────────────────────────────────────────────────────────────────

export function getRoles(): NidoRole[] {
  importFrontendRbacData();
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) {
      localStorage.setItem(ROLES_KEY, JSON.stringify(DEFAULT_ROLES));
      return DEFAULT_ROLES;
    }
    const storedRoles = removeLegacyDemoRoles(JSON.parse(raw)).map((role: NidoRole) => ({
      ...role,
      department: role.department ?? "",
      status: role.status === "Inactive" ? "Inactive" as const : "Active" as const,
    }));
    const roles = storedRoles.some(role => role.name === SYSTEM_OWNER_ROLE)
      ? storedRoles
      : [DEFAULT_ROLES[0], ...storedRoles];
    const normalized = JSON.stringify(roles);
    if (normalized !== raw) localStorage.setItem(ROLES_KEY, normalized);
    return roles;
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: NidoRole[]): void {
  const normalized = roles.some(role => role.name === SYSTEM_OWNER_ROLE)
    ? roles
    : [DEFAULT_ROLES[0], ...roles];
  localStorage.setItem(ROLES_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(NIDO_ROLES_EVENT));
}

export function addRole(role: Omit<NidoRole, "id">): NidoRole {
  const roles = getRoles();
  const newRole: NidoRole = { ...role, id: genId("role") };
  saveRoles([...roles, newRole]);
  return newRole;
}

export function updateRole(id: string, updates: Partial<NidoRole>): void {
  const roles = getRoles();
  const idx = roles.findIndex((r) => r.id === id);
  if (idx === -1) return;
  if (roles[idx].id === "role-system-owner" || roles[idx].name === SYSTEM_OWNER_ROLE) return;
  const oldName = roles[idx].name;
  roles[idx] = { ...roles[idx], ...updates };
  saveRoles(roles);
  // Keep users pointing at renamed roles in sync
  if (updates.name && updates.name !== oldName) {
    const users = getUsers().map((u) => (u.role === oldName ? { ...u, role: updates.name as string } : u));
    saveUsers(users);
  }
}

export function deleteRole(id: string): void {
  const roles = getRoles();
  const target = roles.find(role => role.id === id);
  if (target?.id === "role-system-owner" || target?.name === SYSTEM_OWNER_ROLE) return;
  saveRoles(roles.filter((r) => r.id !== id));
}

export function getRoleUserCount(roleName: string): number {
  return getUsers().filter((u) => u.role === roleName).length;
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

export function getUsers(): NidoUser[] {
  importFrontendUsers();
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const initialUsers = [SYSTEM_OWNER_USER];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed: any[] = JSON.parse(raw);
    const users = preserveSystemOwner(removeLegacyDemoUsers(parsed.map(migrateUser)));
    // Persist normalization so legacy demo rows do not return after refresh,
    // including when one removed demo row is replaced by the owner bootstrap.
    const normalized = JSON.stringify(users);
    if (normalized !== raw) localStorage.setItem(USERS_KEY, normalized);
    return users;
  } catch {
    return [SYSTEM_OWNER_USER];
  }
}

/** Returns the next sequential employee ID without mutating the users store. */
export function getNextEmployeeId(users: NidoUser[] = getUsers()): string {
  const highestSerial = users.reduce((highest, user) => {
    const match = String(user.employeeId || "").trim().match(/^EMP-(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `EMP-${String(highestSerial + 1).padStart(3, "0")}`;
}

export function saveUsers(users: NidoUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(preserveSystemOwner(users)));
  window.dispatchEvent(new Event(NIDO_USERS_EVENT));
}

export function addUser(user: Omit<NidoUser, "id">): NidoUser {
  if (user.role === SYSTEM_OWNER_ROLE) {
    throw new Error("The System Owner role is reserved and cannot be assigned to another user.");
  }
  const users = getUsers();
  const employeeId = getNextEmployeeId(users);
  const newUser: NidoUser = {
    ...user,
    employeeId,
    id: genId("user"),
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
  };
  saveUsers([...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<NidoUser>): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  if (isSystemOwner(users[idx])) {
    // Login metadata is updated by authentication, but the owner cannot be
    // edited through user management or disabled by another action.
    const metadata = (({
      lastLogin,
      failedLoginAttempts,
      loginHistory,
    }) => ({ lastLogin, failedLoginAttempts, loginHistory }))(updates);
    users[idx] = {
      ...users[idx],
      ...metadata,
      status: "Active",
      locked: false,
      forcePasswordChange: false,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    saveUsers(users);
    return;
  }
  if (updates.role === SYSTEM_OWNER_ROLE) return;
  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString().split("T")[0],
  };
  saveUsers(users);
}

export function deleteUser(id: string): void {
  const users = getUsers();
  const target = users.find(user => user.id === id);
  if (target && isSystemOwner(target)) return;
  saveUsers(users.filter((u) => u.id !== id));
}

// ── Authentication ─────────────────────────────────────────────────────────────

/**
 * Authenticate a NIDO platform user by email + password.
 * Returns the user if credentials are correct AND status is Active.
 * Returns null for wrong credentials; returns the user with a special
 * `status` field for Inactive/Suspended so the caller can show a message.
 */
export function authenticateNidoUser(
  email: string,
  password: string,
  context: LoginContext = {}
): { user: NidoUser; error?: never } | { user?: never; error: "invalid_credentials" | "inactive" | "suspended" | "locked" } {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { error: "invalid_credentials" };
  }

  const logAttempt = (result: LoginHistoryEntry["result"], extra?: Partial<NidoUser>) => {
    const entry: LoginHistoryEntry = {
      timestamp: new Date().toISOString(),
      result,
      ...context,
    };
    const history = [...(user.loginHistory ?? []), entry].slice(-50); // keep last 50
    updateUser(user.id, { loginHistory: history, ...extra });
  };

  if (user.locked) {
    logAttempt("locked");
    return { error: "locked" };
  }
  if (user.status === "Inactive") {
    logAttempt("inactive");
    return { error: "inactive" };
  }
  if (user.status === "Suspended") {
    logAttempt("suspended");
    return { error: "suspended" };
  }

  const assignedRole = getRoles().find(role => role.name === user.role);
  if (!assignedRole || assignedRole.status !== "Active") {
    logAttempt("inactive");
    return { error: "inactive" };
  }

  if (user.password !== password) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    logAttempt("invalid_password", {
      failedLoginAttempts: attempts,
      locked: shouldLock,
    });
    return { error: shouldLock ? "locked" : "invalid_credentials" };
  }

  // Successful login — reset failed attempts, update last login timestamp, log history
  logAttempt("success", {
    failedLoginAttempts: 0,
    lastLogin: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  });

  return { user: { ...user, failedLoginAttempts: 0 } };
}

/** Unlock a user account and reset their failed-login counter. */
export function unlockUser(id: string): void {
  updateUser(id, { locked: false, failedLoginAttempts: 0 });
}

// ── Export helpers ────────────────────────────────────────────────────────────

function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function exportRolesCsv(roles: NidoRole[]): void {
  const headers = ["Department", "Role Name", "Description", "Status", "Assigned Users"];
  const rows = roles.map((r) => [r.department, r.name, r.description, r.status, String(getRoleUserCount(r.name))]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(csv, `nido-user-roles-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

export function exportUsersCsv(users: NidoUser[]): void {
  const headers = ["Employee ID", "Name", "Email", "Phone", "Role", "Designation", "Department", "Status", "Last Login"];
  const rows = users.map((u) => [u.employeeId, u.name, u.email, u.phone, u.role, u.designation, u.department, u.status, u.lastLogin ?? "—"]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(csv, `nido-users-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

export function exportRolesPdf(roles: NidoRole[]): void {
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text("Nido Tech — User Roles", 14, 16);
  doc.setFontSize(9); doc.setTextColor(120); doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [["Department", "Role Name", "Description", "Status", "Assigned Users"]],
    body: roles.map((r) => [r.department, r.name, r.description, r.status, String(getRoleUserCount(r.name))]),
    styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`nido-user-roles-${Date.now()}.pdf`);
}

export function exportUsersPdf(users: NidoUser[]): void {
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text("Nido Tech — Platform Users", 14, 16);
  doc.setFontSize(9); doc.setTextColor(120); doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [["EMP ID", "Name", "Email", "Role", "Department", "Status"]],
    body: users.map((u) => [u.employeeId, u.name, u.email, u.role, u.department, u.status]),
    styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`nido-users-${Date.now()}.pdf`);
}
