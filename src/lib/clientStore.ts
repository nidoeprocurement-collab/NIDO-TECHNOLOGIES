const STORE_KEY = 'nido_clients_v2';

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

export function getClients(): StoredClient[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // First visit: seed with defaults and persist
  localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_CLIENTS));
  return DEFAULT_CLIENTS;
}

export function saveClients(clients: StoredClient[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(clients));
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
