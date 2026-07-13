// Shared localStorage-backed store for Configuration → Nido-Users (roles + users).
// Keeps role/user data consistent between the "User Roles" and "Add/Manage Users" tabs.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface NidoRole {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
}

export interface NidoUser {
  id: string;
  name: string;
  email: string;
  role: string; // role name, must match a NidoRole.name
  jobTitle: string;
  department: string;
  status: "Active" | "Inactive";
}

const ROLES_KEY = "nido_config_roles";
const USERS_KEY = "nido_config_users";

const DEFAULT_ROLES: NidoRole[] = [
  { id: "role-system-owner", name: "System Owner", description: "Full system access with all permissions", status: "Active" },
  { id: "role-system-admin", name: "System Admin", description: "Manages platform configuration and users", status: "Active" },
  { id: "role-procurement-manager", name: "Procurement Manager", description: "Manages purchase orders and procurement", status: "Active" },
  { id: "role-accounts-payable", name: "Accounts Payable", description: "Manages invoices and payments", status: "Active" },
  { id: "role-vendor-admin", name: "Vendor Admin", description: "Manages vendor information", status: "Active" },
];

const DEFAULT_USERS: NidoUser[] = [
  { id: "user-1", name: "System Owner", email: "owner@nidotech.com", role: "System Owner", jobTitle: "CEO", department: "Management", status: "Active" },
  { id: "user-2", name: "Mark Adams", email: "admin@nidotech.com", role: "System Admin", jobTitle: "System Admin", department: "IT", status: "Active" },
  { id: "user-3", name: "Jane Smith", email: "procurement@nidotech.com", role: "Procurement Manager", jobTitle: "Procurement Manager", department: "Procurement", status: "Active" },
  { id: "user-4", name: "David Chen", email: "ap@nidotech.com", role: "Accounts Payable", jobTitle: "Accounts Payable", department: "Finance", status: "Active" },
  { id: "user-5", name: "Vendor User", email: "vendor@apex.com", role: "Vendor Admin", jobTitle: "Vendor Manager", department: "Sales", status: "Active" },
];

const ROLES_EVENT = "nidoConfigRolesUpdated";
const USERS_EVENT = "nidoConfigUsersUpdated";

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Roles ──────────────────────────────────────────────────────────────────

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
  window.dispatchEvent(new Event(ROLES_EVENT));
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
  const roles = getRoles().filter((r) => r.id !== id);
  saveRoles(roles);
}

// ── Users ──────────────────────────────────────────────────────────────────

export function getUsers(): NidoUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: NidoUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_EVENT));
}

export function addUser(user: Omit<NidoUser, "id">): NidoUser {
  const users = getUsers();
  const newUser: NidoUser = { ...user, id: genId("user") };
  saveUsers([...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<NidoUser>): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

export function getRoleUserCount(roleName: string): number {
  return getUsers().filter((u) => u.role === roleName).length;
}

export const NIDO_ROLES_EVENT = ROLES_EVENT;
export const NIDO_USERS_EVENT = USERS_EVENT;

// ── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRolesCsv(roles: NidoRole[]): void {
  const headers = ["Role Name", "Description", "Status", "Assigned Users"];
  const rows = roles.map((r) => [r.name, r.description, r.status, String(getRoleUserCount(r.name))]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(csv, `nido-user-roles-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

export function exportUsersCsv(users: NidoUser[]): void {
  const headers = ["Name", "Email", "Role", "Job Title", "Department", "Status"];
  const rows = users.map((u) => [u.name, u.email, u.role, u.jobTitle, u.department, u.status]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(csv, `nido-users-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

export function exportRolesPdf(roles: NidoRole[]): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Nido Tech — User Roles", 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [["Role Name", "Description", "Status", "Assigned Users"]],
    body: roles.map((r) => [r.name, r.description, r.status, String(getRoleUserCount(r.name))]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`nido-user-roles-${Date.now()}.pdf`);
}

export function exportUsersPdf(users: NidoUser[]): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Nido Tech — Platform Users", 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [["Name", "Email", "Role", "Job Title", "Department", "Status"]],
    body: users.map((u) => [u.name, u.email, u.role, u.jobTitle, u.department, u.status]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`nido-users-${Date.now()}.pdf`);
}
