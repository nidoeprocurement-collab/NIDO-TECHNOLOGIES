// The five entries below are intentionally shared demo data. User-created
// clients are stored separately for each signed-in account so one account
// cannot see another account's additions.
const STORE_KEY = 'nido_clients_v2';
const ARCHIVED_STORE_KEY = 'nido_clients_archived_v1';
const SCOPED_STORE_KEY = 'nido_clients_v3';
const SCOPED_ARCHIVED_STORE_KEY = 'nido_clients_archived_v2';
const LEGACY_MIGRATION_KEY = 'nido_clients_scoped_migration_v1';

export interface StoredClient {
  id: string;
  name: string;
  category?: string;
  tier?: string;
  rep?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  status?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  [key: string]: any;
}

const DEFAULT_CLIENTS: StoredClient[] = [
  { id: "CI-00019", name: "Raj Manufacturing", category: "IT Hardware", tier: "Premium", rep: "Rajesh Kumar", email: "rajesh@gmail.com", phone: "+91 98765 43210", mobile: "+91 99876 54321", website: "www.rajmfg.com", contractStartDate: "2024-01-01", contractEndDate: "2025-01-01", status: "active", billingAddress: "123 Tech Street", billingCity: "Mumbai", billingState: "Maharashtra", billingPincode: "400001" },
  { id: "CI-00018", name: "Tech Solutions Ltd", category: "Cloud Servers", tier: "Standard", rep: "Amit Singh", email: "amit@gmail.com", phone: "+91 87654 32109", mobile: "+91 88765 43210", website: "www.techsol.com", contractStartDate: "2024-02-01", contractEndDate: "2025-02-01", status: "active", billingAddress: "456 IT Park", billingCity: "Bangalore", billingState: "Karnataka", billingPincode: "560001" },
  { id: "CI-00017", name: "Global Exports", category: "Office Supplies", tier: "Basic", rep: "Priya Sharma", email: "priya@gmail.com", phone: "+91 76543 21098", mobile: "+91 77654 32109", website: "www.globalexp.com", contractStartDate: "2024-03-01", contractEndDate: "2025-03-01", status: "pending", billingAddress: "789 Export Plaza", billingCity: "Delhi", billingState: "Delhi", billingPincode: "110001" },
  { id: "CI-00016", name: "Express IT Services", category: "IT Hardware", tier: "Premium", rep: "Vikram Patel", email: "vikram@gmail.com", phone: "+91 65432 10987", mobile: "+91 66543 21098", website: "www.expressit.com", contractStartDate: "2024-04-01", contractEndDate: "2025-04-01", status: "active", billingAddress: "321 Tech Hub", billingCity: "Hyderabad", billingState: "Telangana", billingPincode: "500001" },
  { id: "CI-00015", name: "Digital Innovations", category: "Cloud Servers", tier: "Standard", rep: "Anita Desai", email: "anita@gmail.com", phone: "+91 54321 09876", mobile: "+91 55432 10987", website: "www.diginnovate.com", contractStartDate: "2024-05-01", contractEndDate: "2025-05-01", status: "active", billingAddress: "654 Innovation Drive", billingCity: "Pune", billingState: "Maharashtra", billingPincode: "411001" },
];
const DEFAULT_CLIENT_IDS = new Set(DEFAULT_CLIENTS.map(client => client.id));

export function isSharedClient(clientId: string): boolean {
  return DEFAULT_CLIENT_IDS.has(clientId);
}

function currentUserScope(): string {
  try {
    const rawUser = localStorage.getItem('nido_user');
    if (rawUser) {
      const user = JSON.parse(rawUser) as { id?: string; email?: string };
      const identity = user.id || user.email;
      if (identity) return identity;
    }
  } catch {
    // Fall back to the anonymous scope when the session is unavailable.
  }
  return 'anonymous';
}

function scopedKey(baseKey: string): string {
  return `${baseKey}:${encodeURIComponent(currentUserScope())}`;
}

function readList<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * One-time migration for an existing imported app. The old store was shared
 * by every account, so its data is assigned to the first authenticated user
 * who opens the clients page. Later users start with the five demo clients.
 * This prevents legacy custom data from leaking between accounts.
 */
function initialClientsForScope(): StoredClient[] {
  const scope = currentUserScope();

  if (scope === 'anonymous' || localStorage.getItem(LEGACY_MIGRATION_KEY)) {
    return [];
  }

  const legacy = readList<StoredClient>(STORE_KEY);
  if (legacy) {
    localStorage.setItem(LEGACY_MIGRATION_KEY, scope);
    // Keep the original five demo rows in the shared seed. Only migrate
    // records that were added by a user from the old shared store.
    return legacy.filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
  }

  localStorage.setItem(LEGACY_MIGRATION_KEY, scope);
  return [];
}

export function getClients(): StoredClient[] {
  const key = scopedKey(SCOPED_STORE_KEY);
  const stored = readList<StoredClient>(key);
  if (stored) {
    // v3 initially stored the full list. Normalize it to custom rows so the
    // five shared demo clients cannot be edited or removed for an account.
    const custom = stored.filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
    if (custom.length !== stored.length) {
      localStorage.setItem(key, JSON.stringify(custom));
    }
    return [...DEFAULT_CLIENTS.map(client => ({ ...client })), ...custom];
  }

  const custom = initialClientsForScope();
  localStorage.setItem(key, JSON.stringify(custom));
  return [...DEFAULT_CLIENTS.map(client => ({ ...client })), ...custom];
}

export function saveClients(clients: StoredClient[]): void {
  const custom = clients.filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
  localStorage.setItem(scopedKey(SCOPED_STORE_KEY), JSON.stringify(custom));
  window.dispatchEvent(new Event('nidoClientsUpdated'));
}

export function addClient(client: StoredClient): void {
  const existing = getClients();
  const idx = existing.findIndex(c => c.id === client.id);
  if (idx > -1) {
    existing[idx] = client;
  } else {
    existing.push(client);
  }
  saveClients(existing);
}

export interface ArchivedClient extends StoredClient {
  archivedOn: string;
}

export function getArchivedClients(): ArchivedClient[] {
  const key = scopedKey(SCOPED_ARCHIVED_STORE_KEY);
  const stored = readList<ArchivedClient>(key);
  if (stored) {
    const custom = stored.filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
    if (custom.length !== stored.length) {
      localStorage.setItem(key, JSON.stringify(custom));
    }
    return custom;
  }

  // Migrate archived records for the same first account as the client list.
  const scope = currentUserScope();
  const legacy = scope !== 'anonymous' && localStorage.getItem(LEGACY_MIGRATION_KEY) === scope
    ? readList<ArchivedClient>(ARCHIVED_STORE_KEY)
    : null;
  const initial = (legacy || []).filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

export function saveArchivedClients(clients: ArchivedClient[]): void {
  const custom = clients.filter(client => !DEFAULT_CLIENT_IDS.has(client.id));
  localStorage.setItem(scopedKey(SCOPED_ARCHIVED_STORE_KEY), JSON.stringify(custom));
  window.dispatchEvent(new Event('nidoClientsUpdated'));
}
