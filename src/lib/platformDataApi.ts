export interface PlatformDataSnapshot {
  clients: Record<string, unknown>[];
  archivedClients: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  cart: Record<string, unknown>[];
}

type OrderRecord = Record<string, unknown> & { id?: string };
type ClientPayload = {
  clients: Record<string, unknown>[];
  archivedClients: Record<string, unknown>[];
  archiveIds?: string[];
};

const ORDERS_KEY = "nido_my_orders";
const ordersInitialSnapshot: OrderRecord[] | null = null;
let initialOrders = ordersInitialSnapshot;
let activeUserId: string | null = null;
let orderBaseline = new Map<string, OrderRecord>();
let cartBaseline = "";
const queues = new Map<string, Promise<unknown>>();

function pendingKey(userId: string, entity: string): string {
  return `nido_platform_pending_v1:${encodeURIComponent(userId)}:${entity}`;
}

function emitSyncError(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nidoPersistenceError", { detail: { message } }),
  );
}

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) || Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(key, next);
  return next;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || `Platform data request failed (${response.status}).`);
  }
  return (body?.data ?? body) as T;
}

export function setInitialPlatformOrders(orders: OrderRecord[]): void {
  initialOrders = orders;
}

export function getInitialPlatformOrders(): OrderRecord[] | null {
  return initialOrders;
}

export function setPlatformDataSession(
  userId: string,
  snapshot: PlatformDataSnapshot,
): void {
  activeUserId = userId;
  initialOrders = snapshot.orders as OrderRecord[];
  orderBaseline = new Map(
    snapshot.orders
      .filter((order) => typeof order.id === "string")
      .map((order) => [String(order.id), order as OrderRecord]),
  );
  cartBaseline = JSON.stringify(snapshot.cart || []);
}

export function clearPlatformDataSession(): void {
  activeUserId = null;
  initialOrders = null;
  orderBaseline = new Map();
  cartBaseline = "";
}

export async function loadPlatformDataSnapshot(): Promise<PlatformDataSnapshot> {
  return request<PlatformDataSnapshot>("/api/platform-data/bootstrap");
}

export async function importPlatformDataBatch(input: {
  dataset: "orders" | "clients" | "cart";
  sourceId: string;
  batchId: string;
  records?: Record<string, unknown>[];
  clients?: Record<string, unknown>[];
  archivedClients?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
}): Promise<void> {
  await request("/api/platform-data/import", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function readPending<T>(userId: string, entity: string): T | null {
  try {
    const raw = localStorage.getItem(pendingKey(userId, entity));
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writePending(userId: string, entity: string, value: unknown): void {
  try {
    localStorage.setItem(pendingKey(userId, entity), JSON.stringify(value));
  } catch {
    emitSyncError(
      "A database update could not be queued. The current browser copy remains intact.",
    );
  }
}

function clearPending(userId: string, entity: string): void {
  try {
    localStorage.removeItem(pendingKey(userId, entity));
  } catch {
    // The successful server write is authoritative; a stale outbox is harmless.
  }
}

export async function flushPendingPlatformData(userId: string): Promise<void> {
  const pendingOrders = readPending<{
    upserts: OrderRecord[];
    deletedIds: string[];
  }>(userId, "orders");
  if (pendingOrders) {
    await request("/api/platform-data/orders", {
      method: "PUT",
      body: JSON.stringify(pendingOrders),
    });
    clearPending(userId, "orders");
  }

  const pendingClients = readPending<ClientPayload>(userId, "clients");
  if (pendingClients) {
    await request("/api/platform-data/clients", {
      method: "PUT",
      body: JSON.stringify(pendingClients),
    });
    clearPending(userId, "clients");
  }

  const pendingCart = readPending<Record<string, unknown>[]>(userId, "cart");
  if (pendingCart) {
    await request("/api/platform-data/cart", {
      method: "PUT",
      body: JSON.stringify({ items: pendingCart }),
    });
    clearPending(userId, "cart");
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export function syncOrdersToDatabase(orders: OrderRecord[]): void {
  const userId = activeUserId;
  if (!userId || !Array.isArray(orders)) return;

  const current = new Map<string, OrderRecord>();
  const upserts: OrderRecord[] = [];
  for (const order of orders) {
    const id = String(order?.id || "");
    if (!id) continue;
    current.set(id, order);
    const previous = orderBaseline.get(id);
    if (previous !== order && !sameJson(previous, order)) upserts.push(order);
  }
  const deletedIds = [...orderBaseline.keys()].filter((id) => !current.has(id));
  if (!upserts.length && !deletedIds.length) return;

  void enqueue("orders", async () => {
    try {
      await request("/api/platform-data/orders", {
        method: "PUT",
        body: JSON.stringify({ upserts, deletedIds }),
      });
      orderBaseline = current;
      clearPending(userId, "orders");
    } catch (error) {
      writePending(userId, "orders", mergePendingOrders(
        readPending<{ upserts: OrderRecord[]; deletedIds: string[] }>(
          userId,
          "orders",
        ),
        upserts,
        deletedIds,
      ));
      emitSyncError(
        error instanceof Error
          ? `Orders are saved in this browser but could not reach PostgreSQL: ${error.message}`
          : "Orders are saved in this browser but could not reach PostgreSQL.",
      );
    }
  });
}

function mergePendingOrders(
  existing: { upserts: OrderRecord[]; deletedIds: string[] } | null,
  newUpserts: OrderRecord[],
  newDeletedIds: string[],
): { upserts: OrderRecord[]; deletedIds: string[] } {
  const upserts = new Map(
    (existing?.upserts || []).map((order) => [String(order.id), order]),
  );
  const deleted = new Set(existing?.deletedIds || []);
  for (const id of newDeletedIds) {
    upserts.delete(id);
    deleted.add(id);
  }
  for (const order of newUpserts) {
    const id = String(order.id || "");
    if (!id) continue;
    deleted.delete(id);
    upserts.set(id, order);
  }
  return { upserts: [...upserts.values()], deletedIds: [...deleted] };
}

export function syncClientsToDatabase(payload: ClientPayload): void {
  const userId = activeUserId;
  if (!userId) return;
  void enqueue("clients", async () => {
    try {
      await request("/api/platform-data/clients", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      clearPending(userId, "clients");
    } catch (error) {
      writePending(userId, "clients", payload);
      emitSyncError(
        error instanceof Error
          ? `Client changes are saved in this browser but could not reach PostgreSQL: ${error.message}`
          : "Client changes are saved in this browser but could not reach PostgreSQL.",
      );
    }
  });
}

export function syncCartToDatabase(items: Record<string, unknown>[]): void {
  const userId = activeUserId;
  if (!userId || sameJson(cartBaseline, JSON.stringify(items))) return;
  void enqueue("cart", async () => {
    try {
      await request("/api/platform-data/cart", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      cartBaseline = JSON.stringify(items);
      clearPending(userId, "cart");
    } catch (error) {
      writePending(userId, "cart", items);
      emitSyncError(
        error instanceof Error
          ? `Your cart is saved in this browser but could not reach PostgreSQL: ${error.message}`
          : "Your cart is saved in this browser but could not reach PostgreSQL.",
      );
    }
  });
}
