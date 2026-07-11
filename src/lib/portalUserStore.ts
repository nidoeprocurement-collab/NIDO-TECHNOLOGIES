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
}

const STORE_KEY = 'nido_portal_users';

export function getPortalUsers(): PortalUser[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
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
  return (
    users.find(
      u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.status === 'active'
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
  const slug = toSlug(clientName) || 'client';
  const email = `admin@${slug}.portal`;
  const password = `Admin@${randomSuffix()}!`;
  const userId = `portal-${clientId}-admin`;

  const user: PortalUser = {
    id: userId,
    email,
    password,
    name: `${clientName} Admin`,
    userType: 'client_admin',
    clientId,
    clientName,
    role: 'Client Admin',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  addPortalUser(user);
  return { email, password, userId };
}
