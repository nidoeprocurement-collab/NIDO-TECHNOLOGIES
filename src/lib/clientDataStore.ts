const ORDERS_KEY = "nido_client_orders_v1";
const SERVICES_KEY = "nido_client_services_v1";
const ACTIVITIES_KEY = "nido_client_activities_v1";
const DOCUMENTS_KEY = "nido_client_documents_v1";
const CONTRACTS_KEY = "nido_client_contracts_v1";

export interface ClientOrderRecord {
  id: string;
  clientId: string;
  date: string;
  items: number;
  amount: string;
  amountNum: number;
  client: string;
  status: string;
  notes?: string;
  requestedBy?: string;
  requestedById?: string;
  requestedByEmail?: string;
}

export interface ClientServiceRecord {
  id: string;
  clientId: string;
  name: string;
  provider: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: string;
  category: string;
  description?: string;
  requestedBy?: string;
  requestedById?: string;
  requestedByEmail?: string;
}

export type ClientActivityType = "Note" | "Comment" | "Update" | "Task" | "Mention";

export interface ClientActivityRecord {
  id: number;
  clientId: string;
  avatar: string;
  name: string;
  action: string;
  boldPart: string;
  type: ClientActivityType;
  completedBadge?: string;
  time: string;
  description: string;
  visibility: string;
  replies?: number;
  group: string;
  createdAt: string;
  actorId?: string;
  actorEmail?: string;
}

export interface ClientDocumentRecord {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedOn: string;
  archived?: boolean;
  /** Persisted data URL for browser-only document uploads. */
  fileData?: string;
}

export interface ClientContractRecord {
  clientId: string;
  contractId: string;
  contractTitle: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("nidoClientDataUpdated"));
}

function matchesClient(value: { clientId: string }, clientId: string): boolean {
  return value.clientId === clientId;
}

export function getClientOrders(clientId: string, clientName?: string): ClientOrderRecord[] {
  const saved = read<ClientOrderRecord[]>(ORDERS_KEY, []).filter((item) => matchesClient(item, clientId));
  try {
    const shared = JSON.parse(localStorage.getItem("nido_my_orders") || "[]") as Array<Record<string, any>>;
    const sharedOrders = shared
      .filter((order) =>
        order.cartItems?.some((item: Record<string, any>) => item.clientId === clientId) ||
        order.client === clientId ||
        (clientName && order.client === clientName)
      )
      .map((order) => ({
        id: order.id,
        clientId,
        date: order.orderDate || "",
        items: order.cartItems?.reduce((sum: number, item: Record<string, any>) => sum + Number(item.quantity || 0), 0) || order.cartItems?.length || 0,
        amount: order.totalAmount || `₹${Number(order.totalAmountNum || 0).toLocaleString("en-IN")}`,
        amountNum: Number(order.totalAmountNum || 0),
        client: order.client || clientName || clientId,
        status: order.status || "Processing",
        requestedBy: order.requester || order.requestedBy || "",
        requestedById: order.requesterId || order.requestedById || "",
        requestedByEmail: order.requesterEmail || order.requestedByEmail || "",
      }));
    const byId = new Map([...saved, ...sharedOrders].map((item) => [item.id, item]));
    return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return saved;
  }
}

export function saveClientOrder(order: ClientOrderRecord): void {
  const all = read<ClientOrderRecord[]>(ORDERS_KEY, []);
  write(ORDERS_KEY, [order, ...all.filter((item) => item.id !== order.id)]);
}

export function getClientServices(clientId: string): ClientServiceRecord[] {
  return read<ClientServiceRecord[]>(SERVICES_KEY, []).filter((item) => matchesClient(item, clientId));
}

export function saveClientService(service: ClientServiceRecord): void {
  const all = read<ClientServiceRecord[]>(SERVICES_KEY, []);
  write(SERVICES_KEY, [service, ...all.filter((item) => item.id !== service.id)]);
}

export function getClientActivities(clientId: string): ClientActivityRecord[] {
  return read<ClientActivityRecord[]>(ACTIVITIES_KEY, [])
    .filter((item) => matchesClient(item, clientId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveClientActivity(activity: ClientActivityRecord): void {
  const all = read<ClientActivityRecord[]>(ACTIVITIES_KEY, []);
  write(ACTIVITIES_KEY, [activity, ...all.filter((item) => item.id !== activity.id)]);
}

export function getClientDocuments(clientId: string): ClientDocumentRecord[] {
  return read<ClientDocumentRecord[]>(DOCUMENTS_KEY, []).filter((item) => matchesClient(item, clientId));
}

export function saveClientDocument(document: ClientDocumentRecord): void {
  const all = read<ClientDocumentRecord[]>(DOCUMENTS_KEY, []);
  write(DOCUMENTS_KEY, [document, ...all.filter((item) => item.id !== document.id)]);
}

export function getClientContract(clientId: string): ClientContractRecord | null {
  return read<ClientContractRecord[]>(CONTRACTS_KEY, []).find((item) => item.clientId === clientId) || null;
}

export function saveClientContract(contract: ClientContractRecord): void {
  const all = read<ClientContractRecord[]>(CONTRACTS_KEY, []);
  write(CONTRACTS_KEY, [contract, ...all.filter((item) => item.clientId !== contract.clientId)]);
}