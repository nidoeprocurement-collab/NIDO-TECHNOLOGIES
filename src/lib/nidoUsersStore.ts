// ── NIDO Users Store ──────────────────────────────────────────────────────────
// Single source of truth for all NIDO internal platform users and their roles.
// Persists to localStorage.  Fires DOM events on every mutation so subscribers
// (ManageUsersPanel, PermissionsContext, LoginPage, etc.) stay in sync.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NidoRole {
  id: string;
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
  department: string;
  status: "Active" | "Inactive" | "Suspended";
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

// ── Seed data ─────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString().split("T")[0];

const DEFAULT_ROLES: NidoRole[] = [
  { id: "role-system-owner",       name: "System Owner",       description: "Full system access — all permissions always granted",        status: "Active" },
  { id: "role-system-admin",       name: "System Admin",       description: "Manages platform configuration and users",                   status: "Active" },
  { id: "role-procurement-manager",name: "Procurement Manager",description: "Manages purchase orders and procurement workflows",           status: "Active" },
  { id: "role-accounts-payable",   name: "Accounts Payable",   description: "Manages invoices, bills, and vendor payments",               status: "Active" },
  { id: "role-vendor-admin",       name: "Vendor Admin",       description: "Manages vendor information and related orders",               status: "Active" },
  { id: "role-finance",            name: "Finance",            description: "Full access to financial modules",                           status: "Active" },
  { id: "role-operations",         name: "Operations Manager", description: "Oversees day-to-day operations and fulfilment",              status: "Active" },
  { id: "role-viewer",             name: "Viewer",             description: "Read-only access to all allowed modules",                   status: "Active" },
];

const DEFAULT_USERS: NidoUser[] = [
  {
    id: "user-1", employeeId: "EMP-001",
    name: "System Owner", email: "owner@nidotech.com", password: "Owner@123",
    phone: "+91-44-1234-5678", role: "System Owner",
    jobTitle: "CEO", designation: "Chief Executive Officer", department: "Management",
    status: "Active", createdAt: NOW, updatedAt: NOW,
  },
  {
    id: "user-2", employeeId: "EMP-002",
    name: "Mark Adams", email: "admin@nidotech.com", password: "Admin@123",
    phone: "+91-44-1234-5679", role: "System Admin",
    jobTitle: "System Admin", designation: "Platform Administrator", department: "IT",
    status: "Active", createdAt: NOW, updatedAt: NOW,
  },
  {
    id: "user-3", employeeId: "EMP-003",
    name: "Jane Smith", email: "procurement@nidotech.com", password: "Procure@123",
    phone: "+91-44-1234-5680", role: "Procurement Manager",
    jobTitle: "Procurement Manager", designation: "Senior Procurement Manager", department: "Procurement",
    status: "Active", createdAt: NOW, updatedAt: NOW,
  },
  {
    id: "user-4", employeeId: "EMP-004",
    name: "David Chen", email: "ap@nidotech.com", password: "Accounts@123",
    phone: "+91-44-1234-5681", role: "Accounts Payable",
    jobTitle: "Accounts Payable", designation: "Finance Executive", department: "Finance",
    status: "Active", createdAt: NOW, updatedAt: NOW,
  },
  {
    id: "user-5", employeeId: "EMP-005",
    name: "Vendor User", email: "vendor@apex.com", password: "Vendor@123",
    phone: "+91-44-1234-5682", role: "Vendor Admin",
    jobTitle: "Vendor Manager", designation: "Vendor Relations Manager", department: "Sales",
    status: "Active", createdAt: NOW, updatedAt: NOW,
  },
];

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
    department:          raw.department          ?? "",
    status:              raw.status              ?? "Active",
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
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) {
      localStorage.setItem(ROLES_KEY, JSON.stringify(DEFAULT_ROLES));
      return DEFAULT_ROLES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: NidoRole[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
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
  saveRoles(getRoles().filter((r) => r.id !== id));
}

export function getRoleUserCount(roleName: string): number {
  return getUsers().filter((u) => u.role === roleName).length;
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

export function getUsers(): NidoUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: any[] = JSON.parse(raw);
    return parsed.map(migrateUser);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: NidoUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(NIDO_USERS_EVENT));
}

export function addUser(user: Omit<NidoUser, "id">): NidoUser {
  const users = getUsers();
  const newUser: NidoUser = {
    ...user,
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
  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString().split("T")[0],
  };
  saveUsers(users);
}

export function deleteUser(id: string): void {
  saveUsers(getUsers().filter((u) => u.id !== id));
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
  const headers = ["Role Name", "Description", "Status", "Assigned Users"];
  const rows = roles.map((r) => [r.name, r.description, r.status, String(getRoleUserCount(r.name))]);
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
    head: [["Role Name", "Description", "Status", "Assigned Users"]],
    body: roles.map((r) => [r.name, r.description, r.status, String(getRoleUserCount(r.name))]),
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
