const STORE_KEY = 'nido_vendors_v2';

export type VendorStatus = "Active" | "Inactive" | "On Hold" | "Pending";

export interface StoredVendor {
  id: string;
  name: string;
  category: string;
  primaryContact: string;
  email: string;
  phone: string;
  rating: number;
  region: string;
  status: VendorStatus;
  onboardedDate: string;
  monthSpend: number;
  score: number;
  address: string;
  totalSpend: number;
  complianceIssues: number;
  archived: boolean;
  // Extended detail fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  registrationNo?: string;
  taxId?: string;
  pan?: string;
  founded?: string;
  employees?: string;
  annualRevenue?: string;
  paymentMode?: string;
  paymentTerms?: string;
  bankAccount?: string;
  ifscCode?: string;
  bankName?: string;
  bankBranch?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  performanceQuality?: number;
  performanceDelivery?: number;
  performanceResponsiveness?: number;
  performanceCompliance?: number;
  createdByName?: string;
  createdByEmployeeId?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedByEmployeeId?: string;
  updatedByEmail?: string;
  updatedAt?: string;
  onboardingFormData?: Record<string, unknown>;
  lastUpdatedFormData?: Record<string, unknown>;
  [key: string]: any;
}

const LEGACY_DEMO_VENDORS: ReadonlyArray<{ id: string; name: string; email: string }> = [
  { id: "VND-1001", name: "InfoTech Pvt. Ltd.", email: "rahul@infotech.com" },
  { id: "VND-1002", name: "Logistics Express", email: "priya@logexp.com" },
  { id: "VND-1003", name: "GreenLeaf Supplies", email: "ankit@greenleaf.com" },
  { id: "VND-1004", name: "Cloud Systems India", email: "sneha@cloudsys.in" },
  { id: "VND-1005", name: "FastTrack Movers", email: "vikram@fasttrack.co" },
];

export function isLegacyDemoVendor(vendor: Partial<StoredVendor> | null | undefined): boolean {
  if (!vendor) return false;
  return LEGACY_DEMO_VENDORS.some(
    demo =>
      demo.id === vendor.id &&
      (vendor.name === demo.name || vendor.email === demo.email),
  );
}

export function getVendors(): StoredVendor[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const liveVendors = (parsed as StoredVendor[]).filter(vendor => !isLegacyDemoVendor(vendor));
    if (liveVendors.length !== parsed.length) {
      localStorage.setItem(STORE_KEY, JSON.stringify(liveVendors));
    }
    return liveVendors.map(vendor => ({ ...vendor }));
  } catch {
    return [];
  }
}

export function getVendorById(id: string): StoredVendor | undefined {
  const target = String(id ?? "").trim().toLowerCase();
  if (!target) return undefined;
  return getVendors().find(v => String(v.id ?? "").trim().toLowerCase() === target);
}

export function saveVendors(vendors: StoredVendor[]): void {
  const liveVendors = vendors.filter(vendor => !isLegacyDemoVendor(vendor));
  localStorage.setItem(STORE_KEY, JSON.stringify(liveVendors));
  window.dispatchEvent(new Event('nidoVendorsUpdated'));
}

export function updateVendor(id: string, updates: Partial<StoredVendor>): void {
  const vendors = getVendors();
  const idx = vendors.findIndex(v => v.id === id);
  if (idx > -1) {
    vendors[idx] = { ...vendors[idx], ...updates };
    saveVendors(vendors);
  }
}

export function addVendor(vendor: StoredVendor): void {
  const existing = getVendors();
  const idx = existing.findIndex(v => v.id === vendor.id);
  if (idx > -1) {
    existing[idx] = vendor;
  } else {
    existing.push(vendor);
  }
  saveVendors(existing);
}

export function archiveVendorById(
  id: string,
  auditFields: Record<string, unknown> = {},
): StoredVendor | undefined {
  const vendors = getVendors();
  const idx = vendors.findIndex(v => v.id === id);
  if (idx < 0) return undefined;
  const updated: StoredVendor = {
    ...vendors[idx],
    ...auditFields,
    archived: true,
    archivedOn: new Date().toISOString().split("T")[0],
  };
  vendors[idx] = updated;
  saveVendors(vendors);
  return updated;
}

export function restoreArchivedVendor(
  id: string,
  auditFields: Record<string, unknown> = {},
): StoredVendor | undefined {
  const vendors = getVendors();
  const idx = vendors.findIndex(v => v.id === id);
  if (idx < 0) return undefined;
  const { archivedOn: _archivedOn, ...rest } = vendors[idx];
  const restored: StoredVendor = {
    ...rest,
    ...auditFields,
    archived: false,
  };
  vendors[idx] = restored;
  saveVendors(vendors);
  return restored;
}

export function deleteVendorById(id: string): boolean {
  const vendors = getVendors();
  const next = vendors.filter(v => v.id !== id);
  if (next.length === vendors.length) return false;
  saveVendors(next);
  return true;
}
