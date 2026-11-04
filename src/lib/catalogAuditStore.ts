// ── NIDO Master Catalog Audit & Approval Store ──────────────────────────────
// Manages real, persistent audit logs and approval events for catalog items.
// Persists in localStorage and broadcasts DOM events on updates.

export type CatalogAuditEventType =
  | 'New Item Added'
  | 'Item Edited'
  | 'Price Changed'
  | 'Item Approved'
  | 'Item Rejected'
  | 'Status Changed'
  | 'Item Archived'
  | 'Item Restored'
  | 'Item Deleted'
  | 'Bulk Status Update'
  | 'Bulk Import';

export interface CatalogAuditLog {
  id: string;
  event: CatalogAuditEventType | string;
  detail: string;
  itemId?: string;
  itemName?: string;
  sku?: string;
  user: string;
  date: string;
  timestamp: number;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Draft' | 'Archived' | 'Updated' | 'Deleted';
  previousValue?: string;
  newValue?: string;
}

const AUDIT_STORE_KEY = 'nido_catalog_audit_logs';
export const CATALOG_AUDIT_EVENT = 'catalogAuditUpdated';

export function getCurrentAuditUser(): string {
  try {
    const raw = localStorage.getItem('nido_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name && typeof parsed.name === 'string') return parsed.name;
      if (parsed.email && typeof parsed.email === 'string') return parsed.email;
    }
  } catch {
    // fallback
  }
  return 'System Owner';
}

export function formatAuditDate(d: Date = new Date()): string {
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} ${timeStr}`;
}

export function getCatalogAuditLogs(): CatalogAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((log): log is Record<string, any> => Boolean(log && typeof log === 'object'))
      .map((log, index) => ({
        id: typeof log.id === 'string' && log.id ? log.id : `cal-legacy-${index}`,
        event: typeof log.event === 'string' ? log.event : String(log.event || 'Updated'),
        detail: typeof log.detail === 'string' ? log.detail : String(log.detail || ''),
        itemId: typeof log.itemId === 'string' ? log.itemId : undefined,
        itemName: typeof log.itemName === 'string' ? log.itemName : undefined,
        sku: typeof log.sku === 'string' ? log.sku : undefined,
        user: typeof log.user === 'string' && log.user ? log.user : 'System Owner',
        date: typeof log.date === 'string' ? log.date : '',
        timestamp: Number(log.timestamp) || 0,
        status:
          log.status === 'Approved' ||
          log.status === 'Pending' ||
          log.status === 'Rejected' ||
          log.status === 'Draft' ||
          log.status === 'Archived' ||
          log.status === 'Updated' ||
          log.status === 'Deleted'
            ? log.status
            : 'Updated',
        previousValue: typeof log.previousValue === 'string' ? log.previousValue : undefined,
        newValue: typeof log.newValue === 'string' ? log.newValue : undefined,
      }));
  } catch {
    return [];
  }
}

export function addCatalogAuditLog(entry: {
  event: string;
  detail: string;
  itemId?: string;
  itemName?: string;
  sku?: string;
  user?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Draft' | 'Archived' | 'Updated' | 'Deleted';
  previousValue?: string;
  newValue?: string;
  date?: string;
  timestamp?: number;
}): CatalogAuditLog {
  const now = new Date();
  const newEntry: CatalogAuditLog = {
    id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event: entry.event,
    detail: entry.detail,
    itemId: entry.itemId,
    itemName: entry.itemName,
    sku: entry.sku,
    user: entry.user || getCurrentAuditUser(),
    date: entry.date || formatAuditDate(now),
    timestamp: entry.timestamp || now.getTime(),
    status: entry.status,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
  };

  try {
    const current = getCatalogAuditLogs();
    const updated = [newEntry, ...current].slice(0, 1000);
    localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(CATALOG_AUDIT_EVENT));
  } catch (err) {
    console.error('Failed to save catalog audit log:', err);
  }

  return newEntry;
}

export function clearCatalogAuditLogs(): void {
  try {
    localStorage.removeItem(AUDIT_STORE_KEY);
    window.dispatchEvent(new Event(CATALOG_AUDIT_EVENT));
  } catch {
    // ignore
  }
}

export function deleteCatalogAuditLog(id: string): void {
  try {
    const current = getCatalogAuditLogs();
    const filtered = current.filter(log => log.id !== id);
    localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event(CATALOG_AUDIT_EVENT));
  } catch {
    // ignore
  }
}

