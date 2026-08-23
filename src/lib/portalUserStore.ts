export type PortalUserType = 'client_admin' | 'client_user';

export interface PortalUser {
  id: string;
  email: string;
  password: string; // plain-text for demo; replace with hashing when backend is live
  name: string;
  userType: PortalUserType;
  clientId: string;
  clientName: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  provisionReason?: string;
  provisionedAt?: string;
}

const STORE_KEY = 'nido_portal_users';
const ROLE_STORE_PREFIX = 'nido_portal_roles_';

export interface PortalRolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface PortalRole {
  id: string;
  name: string;
  description: string;
  permissions: PortalRolePermission[];
}

export const PORTAL_MODULES = [
  'Dashboard', 'Catalog', 'Orders', 'Services', 'Invoices',
  'Reports', 'Notifications', 'Addresses', 'Contracts',
] as const;

const ROLE_BLUEPRINTS: Array<Pick<PortalRole, 'id' | 'name' | 'description'> & { view: string[]; create?: string[]; edit?: string[] }> = [
  { id: 'r1', name: 'Client Admin', description: 'Full access to all portal modules', view: [...PORTAL_MODULES], create: [...PORTAL_MODULES], edit: [...PORTAL_MODULES] },
  { id: 'r2', name: 'Procurement Manager', description: 'Can manage orders and catalog', view: [...PORTAL_MODULES], create: ['Catalog', 'Orders'], edit: ['Catalog', 'Orders'] },
  { id: 'r3', name: 'Purchase Executive', description: 'Can place and track orders', view: ['Dashboard', 'Catalog', 'Orders', 'Notifications'], create: ['Orders'], edit: ['Orders'] },
  { id: 'r4', name: 'Finance', description: 'Access to invoices and reports', view: ['Dashboard', 'Invoices', 'Reports'] },
  { id: 'r5', name: 'Store Manager', description: 'Manages catalog and services', view: ['Dashboard', 'Catalog', 'Services', 'Orders'], create: ['Catalog', 'Services'], edit: ['Catalog', 'Services'] },
  { id: 'r6', name: 'Approver', description: 'Reviews and approves orders', view: ['Dashboard', 'Orders', 'Services'], edit: ['Orders'] },
  { id: 'r7', name: 'Employee', description: 'Browse catalog and submit requests', view: ['Dashboard', 'Catalog', 'Orders', 'Services', 'Notifications'], create: ['Orders'] },
  { id: 'r8', name: 'Viewer', description: 'Read-only access across all modules', view: [...PORTAL_MODULES] },
];

function defaultPortalRoles(): PortalRole[] {
  return ROLE_BLUEPRINTS.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: PORTAL_MODULES.map(module => ({
      module,
      view: r.view.includes(module),
      create: r.create?.includes(module) ?? false,
      edit: r.edit?.includes(module) ?? false,
      delete: false,
    })),
  }));
}

export function getPortalRoles(clientId: string): PortalRole[] {
  try {
    const raw = localStorage.getItem(`${ROLE_STORE_PREFIX}${clientId}`);
    return raw ? JSON.parse(raw) : defaultPortalRoles();
  } catch {
    return defaultPortalRoles();
  }
}

export function savePortalRoles(clientId: string, roles: PortalRole[]): void {
  localStorage.setItem(`${ROLE_STORE_PREFIX}${clientId}`, JSON.stringify(roles));
  window.dispatchEvent(new Event('nidoPortalRolesUpdated'));
}

export function getPortalRoleNames(clientId: string): string[] {
  return getPortalRoles(clientId).map(role => role.name);
}

export function hasPortalPermission(
  clientId: string,
  roleName: string,
  module: string,
  action: keyof Omit<PortalRolePermission, 'module'> = 'view',
): boolean {
  if (roleName === 'Client Admin') return true;
  const role = getPortalRoles(clientId).find(item => item.name === roleName);
  return !!role?.permissions.find(permission => permission.module === module)?.[action];
}

export function getPortalUsers(): PortalUser[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Normalize records created by older versions of the portal user screen.
    // In particular, login must not fail because an email was saved with
    // accidental whitespace or status used a different casing.
    return parsed.map((user: Partial<PortalUser>) => ({
      ...user,
      email: String(user.email ?? '').trim(),
      name: String(user.name ?? '').trim(),
      status: String(user.status ?? 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
    })) as PortalUser[];
  } catch {
    return [];
  }
}

export function savePortalUsers(users: PortalUser[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('nidoPortalUsersUpdated'));
}

export function addPortalUser(user: PortalUser): void {
  const users = getPortalUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx > -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  savePortalUsers(users);
}

export function updatePortalUser(id: string, updates: Partial<PortalUser>): void {
  const users = getPortalUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...updates };
    savePortalUsers(users);
  }
}

export function deletePortalUser(id: string): void {
  const users = getPortalUsers().filter(u => u.id !== id);
  savePortalUsers(users);
}

export function findPortalUser(email: string, password: string): PortalUser | null {
  const users = getPortalUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return (
    users.find(
      u =>
        u.email.trim().toLowerCase() === normalizedEmail &&
        u.password === password &&
        String(u.status).toLowerCase() === 'active'
    ) ?? null
  );
}

export function getPortalUsersByClient(clientId: string): PortalUser[] {
  return getPortalUsers().filter(u => u.clientId === clientId);
}

export function isClientProvisioned(clientId: string): boolean {
  return getPortalUsers().some(u => u.clientId === clientId && u.userType === 'client_admin');
}

/** Generate a slug-safe segment from a client name */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);
}

/** Generate a random 4-digit suffix */
function randomSuffix(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export interface ProvisionResult {
  email: string;
  password: string;
  userId: string;
}

/** Generates credentials without granting portal access. */
export function generatePortalCredentials(
  clientId: string,
  clientName: string
): ProvisionResult {
  const slug = toSlug(clientName) || 'client';
  return {
    email: `admin@${slug}.portal`,
    password: `Admin@${randomSuffix()}!`,
    userId: `portal-${clientId}-admin`,
  };
}

/** Activates the prepared credentials after an owner confirms portal access. */
export function activateClientPortal(
  clientId: string,
  clientName: string,
  credentials: ProvisionResult,
  reason = ''
): void {
  const existing = getPortalUsers().find(
    (user) => user.clientId === clientId && user.userType === 'client_admin'
  );
  const user: PortalUser = {
    id: existing?.id || credentials.userId,
    email: credentials.email,
    password: credentials.password,
    name: `${clientName} Admin`,
    userType: 'client_admin',
    clientId,
    clientName,
    role: 'Client Admin',
    status: 'active',
    createdAt: existing?.createdAt || new Date().toISOString(),
    provisionReason: reason.trim() || undefined,
    provisionedAt: new Date().toISOString(),
  };
  addPortalUser(user);
}

/**
 * Provisions a Client Admin for the given client.
 * Returns the generated credentials.
 * If the client already has an admin, returns the existing admin's email
 * with a new reset password.
 */
export function provisionClientPortal(
  clientId: string,
  clientName: string
): ProvisionResult {
  const credentials = generatePortalCredentials(clientId, clientName);
  activateClientPortal(clientId, clientName, credentials);
  return credentials;
}

/** Creates an active portal login for an owner-managed client user. */
export function provisionPortalUser(
  clientId: string,
  clientName: string,
  details: { email: string; name: string; role?: string },
): ProvisionResult {
  const email = details.email.trim().toLowerCase();
  const password = `User@${randomSuffix()}!`;
  const existing = getPortalUsers().find(
    user => user.clientId === clientId && user.email.trim().toLowerCase() === email,
  );
  addPortalUser({
    id: existing?.id || `portal-${clientId}-${Date.now()}`,
    email,
    password,
    name: details.name.trim(),
    userType: existing?.userType || 'client_user',
    clientId,
    clientName,
    role: details.role || existing?.role || 'Employee',
    status: 'active',
    createdAt: existing?.createdAt || new Date().toISOString(),
    provisionedAt: new Date().toISOString(),
  });
  return { email, password, userId: existing?.id || `portal-${clientId}-${Date.now()}` };
}
