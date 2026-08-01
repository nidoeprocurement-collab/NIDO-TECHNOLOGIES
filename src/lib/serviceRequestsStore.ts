/**
 * Shared localStorage store for user-submitted service requests.
 * MyRequestsPage merges these with the static sample data so submitted
 * requests appear in the list immediately.
 */

const STORE_KEY = "nido_service_requests";
const SEQ_KEY   = "nido_service_requests_seq";

export interface StoredServiceRequest {
  id: string;
  requestType: string;
  itemAsset: string;
  assetTag: string;
  location: string;
  requestDate: string;       // "DD Mon YYYY"
  requestDateTs: number;
  status: string;
  priority: string;
  nextAppointment: string;
  requestedBy: string;
  /** Full form payload stored so the detail page can show it */
  payload?: Record<string, unknown>;
}

function load(): StoredServiceRequest[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(requests: StoredServiceRequest[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(requests));
}

function nextSeq(prefix: string): number {
  const raw = JSON.parse(localStorage.getItem(SEQ_KEY) || "{}") as Record<string, number>;
  const next = (raw[prefix] ?? 200) + 1;
  raw[prefix] = next;
  localStorage.setItem(SEQ_KEY, JSON.stringify(raw));
  return next;
}

export function addServiceRequest(req: Omit<StoredServiceRequest, "id" | "requestDateTs">, prefix: string): StoredServiceRequest {
  const seq = nextSeq(prefix);
  const year = new Date().getFullYear();
  const id = `${prefix}-${year}-${String(seq).padStart(5, "0")}`;

  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const requestDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const full: StoredServiceRequest = {
    ...req,
    id,
    requestDate,
    requestDateTs: now.getTime(),
  };

  const existing = load();
  save([full, ...existing]);
  return full;
}

export function getServiceRequests(): StoredServiceRequest[] {
  return load();
}
