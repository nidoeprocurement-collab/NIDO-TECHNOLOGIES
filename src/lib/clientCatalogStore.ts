// Client Catalog Store — persists each client's catalog products to localStorage
// keyed by clientId so ShopPage can read them per-client.

export interface ClientCatalogEntry {
  productCode: string;
  sku: string;
  name: string;
  category: string;
  roles: string[];
  price: string;
  availability: string;
  img: string;
  // enriched from master catalog for Shop display
  description?: string;
  specs?: string[];        // "Key: Value" formatted
  leadTime?: string;
  moq?: number;
  priceNum?: number;
  generalSpecs?: { label: string; value: string }[];
}

const STORE_KEY = 'nido_client_catalogs';

type ClientStore = Record<string, ClientCatalogEntry[]>;

function read(): ClientStore {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function write(store: ClientStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('clientCatalogUpdated'));
}

export function getClientCatalog(clientId: string): ClientCatalogEntry[] {
  return read()[clientId] || [];
}

export function saveClientCatalog(clientId: string, entries: ClientCatalogEntry[]): void {
  const store = read();
  store[clientId] = entries;
  write(store);
}

export function addToClientCatalog(clientId: string, newEntries: ClientCatalogEntry[]): void {
  const existing = getClientCatalog(clientId);
  const existingCodes = new Set(existing.map(e => e.productCode));
  const toAdd = newEntries.filter(e => !existingCodes.has(e.productCode));
  saveClientCatalog(clientId, [...existing, ...toAdd]);
}

export function removeFromClientCatalog(clientId: string, productCode: string): void {
  const entries = getClientCatalog(clientId).filter(e => e.productCode !== productCode);
  saveClientCatalog(clientId, entries);
}
