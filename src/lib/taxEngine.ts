// ─── NIDO Tax Engine ─────────────────────────────────────────────────────────
// Single source of truth for all tax calculations across the platform.
// Every module must derive tax through this engine — never calculate separately.

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  TAX_CATEGORIES:        'nido_tax_categories',
  HSN_CODES:             'nido_hsn_codes',
  SAC_CODES:             'nido_sac_codes',
  PRODUCT_CAT_TAX_MAP:   'nido_product_category_tax_map',
  VENDOR_TAX_SETTINGS:   'nido_vendor_tax_settings',
  CLIENT_TAX_SETTINGS:   'nido_client_tax_settings',
  SERVICE_TAX_SETTINGS:  'nido_service_tax_settings',
  TAX_AUDIT_LOG:         'nido_tax_audit_log',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('taxEngineUpdated', { detail: { key } }));
}

// ─── Tax Category ─────────────────────────────────────────────────────────────
export interface TaxCategory {
  id: string;
  name: string;
  description: string;
  cgstPct: number;
  sgstPct: number;
  igstPct: number;
  utgstPct: number;
  isReverseCharge: boolean;
  isExempt: boolean;
  isZeroRated: boolean;
  applicableTo: 'Product' | 'Service' | 'Both';
  status: 'Active' | 'Inactive';
}

const DEFAULT_TAX_CATEGORIES: TaxCategory[] = [
  { id: 'tc-1', name: 'Standard GST 18%', description: 'Standard rate — electronics, most goods', cgstPct: 9, sgstPct: 9, igstPct: 18, utgstPct: 9, isReverseCharge: false, isExempt: false, isZeroRated: false, applicableTo: 'Both', status: 'Active' },
  { id: 'tc-2', name: 'Standard GST 12%', description: 'Processed foods, business class', cgstPct: 6, sgstPct: 6, igstPct: 12, utgstPct: 6, isReverseCharge: false, isExempt: false, isZeroRated: false, applicableTo: 'Product', status: 'Active' },
  { id: 'tc-3', name: 'Standard GST 5%', description: 'Essential goods, economy hotels', cgstPct: 2.5, sgstPct: 2.5, igstPct: 5, utgstPct: 2.5, isReverseCharge: false, isExempt: false, isZeroRated: false, applicableTo: 'Product', status: 'Active' },
  { id: 'tc-4', name: 'Zero Rated', description: 'Exports and supplies to SEZ', cgstPct: 0, sgstPct: 0, igstPct: 0, utgstPct: 0, isReverseCharge: false, isExempt: false, isZeroRated: true, applicableTo: 'Both', status: 'Active' },
  { id: 'tc-5', name: 'Exempt', description: 'Fresh food, healthcare, education', cgstPct: 0, sgstPct: 0, igstPct: 0, utgstPct: 0, isReverseCharge: false, isExempt: true, isZeroRated: false, applicableTo: 'Product', status: 'Active' },
  { id: 'tc-6', name: 'Reverse Charge', description: 'Supplies where recipient pays tax', cgstPct: 9, sgstPct: 9, igstPct: 18, utgstPct: 9, isReverseCharge: true, isExempt: false, isZeroRated: false, applicableTo: 'Both', status: 'Active' },
  { id: 'tc-7', name: 'SEZ', description: 'Special Economic Zone supplies', cgstPct: 0, sgstPct: 0, igstPct: 0, utgstPct: 0, isReverseCharge: false, isExempt: false, isZeroRated: true, applicableTo: 'Both', status: 'Active' },
  { id: 'tc-8', name: 'Government Exempt', description: 'Government entity exemptions', cgstPct: 0, sgstPct: 0, igstPct: 0, utgstPct: 0, isReverseCharge: false, isExempt: true, isZeroRated: false, applicableTo: 'Both', status: 'Active' },
  { id: 'tc-9', name: 'Service GST 18%', description: 'Standard service rate', cgstPct: 9, sgstPct: 9, igstPct: 18, utgstPct: 9, isReverseCharge: false, isExempt: false, isZeroRated: false, applicableTo: 'Service', status: 'Active' },
  { id: 'tc-10', name: 'Interstate GST', description: 'Cross-state supply — IGST applies', cgstPct: 0, sgstPct: 0, igstPct: 18, utgstPct: 0, isReverseCharge: false, isExempt: false, isZeroRated: false, applicableTo: 'Both', status: 'Active' },
];

export function getTaxCategories(): TaxCategory[] {
  return load(KEYS.TAX_CATEGORIES, DEFAULT_TAX_CATEGORIES);
}

export function saveTaxCategories(categories: TaxCategory[], auditUser = 'System'): void {
  const prev = getTaxCategories();
  recordAuditEntry({ user: auditUser, module: 'Tax Categories', prevValue: JSON.stringify(prev), newValue: JSON.stringify(categories) });
  save(KEYS.TAX_CATEGORIES, categories);
}

// ─── HSN Code ─────────────────────────────────────────────────────────────────
export interface HsnCode {
  id: string;
  code: string;
  description: string;
  gstRate: number;
  taxCategoryId: string;
  productCategory: string;
  status: 'Active' | 'Inactive';
}

const DEFAULT_HSN_CODES: HsnCode[] = [
  { id: 'hsn-1', code: '8471', description: 'Automatic data processing machines (computers)', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Computers & Laptops', status: 'Active' },
  { id: 'hsn-2', code: '8473', description: 'Parts and accessories for computers', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Computer Peripherals', status: 'Active' },
  { id: 'hsn-3', code: '8517', description: 'Telephones, smartphones, networking equipment', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Mobile & Networking', status: 'Active' },
  { id: 'hsn-4', code: '9403', description: 'Office furniture', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Furniture', status: 'Active' },
  { id: 'hsn-5', code: '4820', description: 'Office stationery — registers, notebooks', gstRate: 12, taxCategoryId: 'tc-2', productCategory: 'Stationery', status: 'Active' },
  { id: 'hsn-6', code: '8443', description: 'Printers and ink cartridges', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Printers', status: 'Active' },
  { id: 'hsn-7', code: '8516', description: 'Air conditioners, electrical heating equipment', gstRate: 28, taxCategoryId: 'tc-1', productCategory: 'Electrical Equipment', status: 'Active' },
  { id: 'hsn-8', code: '3926', description: 'Plastic office supplies', gstRate: 18, taxCategoryId: 'tc-1', productCategory: 'Office Supplies', status: 'Active' },
];

export function getHsnCodes(): HsnCode[] {
  return load(KEYS.HSN_CODES, DEFAULT_HSN_CODES);
}

export function saveHsnCodes(codes: HsnCode[], auditUser = 'System'): void {
  const prev = getHsnCodes();
  recordAuditEntry({ user: auditUser, module: 'HSN Codes', prevValue: JSON.stringify(prev), newValue: JSON.stringify(codes) });
  save(KEYS.HSN_CODES, codes);
}

// ─── SAC Code ─────────────────────────────────────────────────────────────────
export interface SacCode {
  id: string;
  code: string;
  description: string;
  gstRate: number;
  taxCategoryId: string;
  serviceCategory: string;
  status: 'Active' | 'Inactive';
}

const DEFAULT_SAC_CODES: SacCode[] = [
  { id: 'sac-1', code: '998313', description: 'Information technology consulting services', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'IT Consultancy', status: 'Active' },
  { id: 'sac-2', code: '998314', description: 'Software development and implementation', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'Software Development', status: 'Active' },
  { id: 'sac-3', code: '998352', description: 'Computer hardware installation services', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'Installation Services', status: 'Active' },
  { id: 'sac-4', code: '998711', description: 'Maintenance and repair of computers', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'Maintenance Services', status: 'Active' },
  { id: 'sac-5', code: '998315', description: 'Annual maintenance contract (AMC)', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'AMC Services', status: 'Active' },
  { id: 'sac-6', code: '998316', description: 'IT support and helpdesk services', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'Support Services', status: 'Active' },
  { id: 'sac-7', code: '999299', description: 'Professional consultancy services', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'Consultancy Services', status: 'Active' },
  { id: 'sac-8', code: '998719', description: 'General repair and maintenance services', gstRate: 18, taxCategoryId: 'tc-9', serviceCategory: 'General Maintenance', status: 'Active' },
];

export function getSacCodes(): SacCode[] {
  return load(KEYS.SAC_CODES, DEFAULT_SAC_CODES);
}

export function saveSacCodes(codes: SacCode[], auditUser = 'System'): void {
  const prev = getSacCodes();
  recordAuditEntry({ user: auditUser, module: 'SAC Codes', prevValue: JSON.stringify(prev), newValue: JSON.stringify(codes) });
  save(KEYS.SAC_CODES, codes);
}

// ─── Product Category Tax Mapping ─────────────────────────────────────────────
export interface ProductCategoryTaxMap {
  id: string;
  productCategory: string;
  defaultHsnCode: string;
  taxCategoryId: string;
  gstRate: number;
  cgstPct: number;
  sgstPct: number;
  igstPct: number;
  taxInclusive: boolean;
  isReverseCharge: boolean;
  isExempt: boolean;
  priority: number;
}

const DEFAULT_PRODUCT_CATEGORY_TAX_MAP: ProductCategoryTaxMap[] = [
  { id: 'pctm-1', productCategory: 'Computers & Laptops', defaultHsnCode: '8471', taxCategoryId: 'tc-1', gstRate: 18, cgstPct: 9, sgstPct: 9, igstPct: 18, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
  { id: 'pctm-2', productCategory: 'Computer Peripherals', defaultHsnCode: '8473', taxCategoryId: 'tc-1', gstRate: 18, cgstPct: 9, sgstPct: 9, igstPct: 18, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
  { id: 'pctm-3', productCategory: 'Stationery', defaultHsnCode: '4820', taxCategoryId: 'tc-2', gstRate: 12, cgstPct: 6, sgstPct: 6, igstPct: 12, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
  { id: 'pctm-4', productCategory: 'Office Supplies', defaultHsnCode: '3926', taxCategoryId: 'tc-1', gstRate: 18, cgstPct: 9, sgstPct: 9, igstPct: 18, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
  { id: 'pctm-5', productCategory: 'Furniture', defaultHsnCode: '9403', taxCategoryId: 'tc-1', gstRate: 18, cgstPct: 9, sgstPct: 9, igstPct: 18, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
  { id: 'pctm-6', productCategory: 'Electrical Equipment', defaultHsnCode: '8516', taxCategoryId: 'tc-1', gstRate: 28, cgstPct: 14, sgstPct: 14, igstPct: 28, taxInclusive: false, isReverseCharge: false, isExempt: false, priority: 1 },
];

export function getProductCategoryTaxMap(): ProductCategoryTaxMap[] {
  return load(KEYS.PRODUCT_CAT_TAX_MAP, DEFAULT_PRODUCT_CATEGORY_TAX_MAP);
}

export function saveProductCategoryTaxMap(maps: ProductCategoryTaxMap[], auditUser = 'System'): void {
  const prev = getProductCategoryTaxMap();
  recordAuditEntry({ user: auditUser, module: 'Product Category Tax Map', prevValue: JSON.stringify(prev), newValue: JSON.stringify(maps) });
  save(KEYS.PRODUCT_CAT_TAX_MAP, maps);
}

// ─── Vendor Tax Settings ──────────────────────────────────────────────────────
export interface VendorTaxSettings {
  enableVendorTax: boolean;
  defaultTaxRule: string;
  taxInclusive: boolean;
  defaultCurrency: string;
  productCategoryBasedMapping: boolean;
  gstApplicable: boolean;
  cgstPct: number;
  sgstPct: number;
  igstPct: number;
  utgstPct: number;
  gstCalcMethod: 'exclusive' | 'inclusive';
  defaultTaxCategory: string;
  taxExemption: boolean;
  reverseCharge: boolean;
  tdsApplicable: boolean;
  tdsPct: number;
  tcsApplicable: boolean;
  tcsPct: number;
  importTax: boolean;
  importTaxPct: number;
  exportTax: boolean;
  interstateRules: boolean;
  intrastateRules: boolean;
  mapTaxByCategory: boolean;
  mapTaxByHsn: boolean;
  categoryWiseExemption: boolean;
  categoryWiseReverseCharge: boolean;
}

const DEFAULT_VENDOR_TAX_SETTINGS: VendorTaxSettings = {
  enableVendorTax: true,
  defaultTaxRule: 'Standard GST 18%',
  taxInclusive: false,
  defaultCurrency: 'INR',
  productCategoryBasedMapping: true,
  gstApplicable: true,
  cgstPct: 9,
  sgstPct: 9,
  igstPct: 18,
  utgstPct: 9,
  gstCalcMethod: 'exclusive',
  defaultTaxCategory: 'tc-1',
  taxExemption: false,
  reverseCharge: false,
  tdsApplicable: true,
  tdsPct: 1,
  tcsApplicable: false,
  tcsPct: 0.1,
  importTax: false,
  importTaxPct: 10,
  exportTax: false,
  interstateRules: true,
  intrastateRules: true,
  mapTaxByCategory: true,
  mapTaxByHsn: true,
  categoryWiseExemption: false,
  categoryWiseReverseCharge: false,
};

export function getVendorTaxSettings(): VendorTaxSettings {
  return load(KEYS.VENDOR_TAX_SETTINGS, DEFAULT_VENDOR_TAX_SETTINGS);
}

export function saveVendorTaxSettings(settings: VendorTaxSettings, auditUser = 'System'): void {
  const prev = getVendorTaxSettings();
  recordAuditEntry({ user: auditUser, module: 'Vendor Tax Settings', prevValue: JSON.stringify(prev), newValue: JSON.stringify(settings) });
  save(KEYS.VENDOR_TAX_SETTINGS, settings);
}

// ─── Client Tax Settings ──────────────────────────────────────────────────────
export interface ClientTaxSettings {
  enableClientTax: boolean;
  taxInclusive: boolean;
  defaultTaxCategory: string;
  productCategoryBasedMapping: boolean;
  cgstPct: number;
  sgstPct: number;
  igstPct: number;
  gstCategory: string;
  hsnValidation: boolean;
  clientTaxExemption: boolean;
  governmentClientRules: boolean;
  sezClientRules: boolean;
  exportClientRules: boolean;
  applyTaxByCategory: boolean;
  applyTaxByHsn: boolean;
  categoryWiseTaxExemption: boolean;
  productWiseTaxOverride: boolean;
  clientSpecificCategoryOverride: boolean;
  showTaxBreakdown: boolean;
  roundOffRule: 'none' | 'nearest' | 'up' | 'down';
  taxDisplayFormat: 'inclusive' | 'exclusive' | 'breakdown';
  taxLabel: string;
}

const DEFAULT_CLIENT_TAX_SETTINGS: ClientTaxSettings = {
  enableClientTax: true,
  taxInclusive: false,
  defaultTaxCategory: 'tc-1',
  productCategoryBasedMapping: true,
  cgstPct: 9,
  sgstPct: 9,
  igstPct: 18,
  gstCategory: 'B2B',
  hsnValidation: true,
  clientTaxExemption: false,
  governmentClientRules: false,
  sezClientRules: false,
  exportClientRules: false,
  applyTaxByCategory: true,
  applyTaxByHsn: true,
  categoryWiseTaxExemption: false,
  productWiseTaxOverride: false,
  clientSpecificCategoryOverride: false,
  showTaxBreakdown: true,
  roundOffRule: 'nearest',
  taxDisplayFormat: 'breakdown',
  taxLabel: 'GST',
};

export function getClientTaxSettings(): ClientTaxSettings {
  return load(KEYS.CLIENT_TAX_SETTINGS, DEFAULT_CLIENT_TAX_SETTINGS);
}

export function saveClientTaxSettings(settings: ClientTaxSettings, auditUser = 'System'): void {
  const prev = getClientTaxSettings();
  recordAuditEntry({ user: auditUser, module: 'Client Tax Settings', prevValue: JSON.stringify(prev), newValue: JSON.stringify(settings) });
  save(KEYS.CLIENT_TAX_SETTINGS, settings);
}

// ─── Service Tax Settings ─────────────────────────────────────────────────────
export interface ServiceCategoryTaxRule {
  id: string;
  serviceCategory: string;
  sacCode: string;
  gstRate: number;
  taxCategoryId: string;
  isReverseCharge: boolean;
  isExempt: boolean;
  taxInclusive: boolean;
}

export interface ServiceTaxSettings {
  enableServiceTax: boolean;
  gstOnServices: boolean;
  taxInclusive: boolean;
  reverseCharge: boolean;
  defaultGstRate: number;
  defaultTaxCategoryId: string;
  professionalServices: boolean;
  amcServices: boolean;
  installationServices: boolean;
  maintenanceServices: boolean;
  supportServices: boolean;
  consultancyServices: boolean;
  serviceCategoryRules: ServiceCategoryTaxRule[];
}

const DEFAULT_SERVICE_TAX_SETTINGS: ServiceTaxSettings = {
  enableServiceTax: true,
  gstOnServices: true,
  taxInclusive: false,
  reverseCharge: false,
  defaultGstRate: 18,
  defaultTaxCategoryId: 'tc-9',
  professionalServices: true,
  amcServices: true,
  installationServices: true,
  maintenanceServices: true,
  supportServices: true,
  consultancyServices: true,
  serviceCategoryRules: [
    { id: 'scr-1', serviceCategory: 'AMC Services', sacCode: '998315', gstRate: 18, taxCategoryId: 'tc-9', isReverseCharge: false, isExempt: false, taxInclusive: false },
    { id: 'scr-2', serviceCategory: 'Installation Services', sacCode: '998352', gstRate: 18, taxCategoryId: 'tc-9', isReverseCharge: false, isExempt: false, taxInclusive: false },
    { id: 'scr-3', serviceCategory: 'Maintenance Services', sacCode: '998711', gstRate: 18, taxCategoryId: 'tc-9', isReverseCharge: false, isExempt: false, taxInclusive: false },
    { id: 'scr-4', serviceCategory: 'Support Services', sacCode: '998316', gstRate: 18, taxCategoryId: 'tc-9', isReverseCharge: false, isExempt: false, taxInclusive: false },
    { id: 'scr-5', serviceCategory: 'IT Consultancy', sacCode: '998313', gstRate: 18, taxCategoryId: 'tc-9', isReverseCharge: false, isExempt: false, taxInclusive: false },
  ],
};

export function getServiceTaxSettings(): ServiceTaxSettings {
  return load(KEYS.SERVICE_TAX_SETTINGS, DEFAULT_SERVICE_TAX_SETTINGS);
}

export function saveServiceTaxSettings(settings: ServiceTaxSettings, auditUser = 'System'): void {
  const prev = getServiceTaxSettings();
  recordAuditEntry({ user: auditUser, module: 'Service Tax Settings', prevValue: JSON.stringify(prev), newValue: JSON.stringify(settings) });
  save(KEYS.SERVICE_TAX_SETTINGS, settings);
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface TaxAuditEntry {
  id: string;
  user: string;
  timestamp: string;
  module: string;
  prevValue: string;
  newValue: string;
  reason?: string;
  clientIp?: string;
}

function recordAuditEntry(entry: Omit<TaxAuditEntry, 'id' | 'timestamp'>): void {
  const log = load<TaxAuditEntry[]>(KEYS.TAX_AUDIT_LOG, []);
  log.unshift({ ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
  // Keep last 500 entries
  if (log.length > 500) log.splice(500);
  localStorage.setItem(KEYS.TAX_AUDIT_LOG, JSON.stringify(log));
}

export function getTaxAuditLog(): TaxAuditEntry[] {
  return load<TaxAuditEntry[]>(KEYS.TAX_AUDIT_LOG, []);
}

// ─── Tax Calculation Engine ───────────────────────────────────────────────────
export interface TaxInput {
  basePrice: number;
  quantity?: number;
  productCategory?: string;
  hsnCode?: string;
  sacCode?: string;
  serviceCategory?: string;
  isInterstate?: boolean;
  isExport?: boolean;
  isSez?: boolean;
  isGovernment?: boolean;
  overrideTaxCategoryId?: string;
  context: 'vendor' | 'client' | 'service';
}

export interface TaxBreakdown {
  taxCategoryName: string;
  cgst: number;
  sgst: number;
  igst: number;
  utgst: number;
  tds: number;
  tcs: number;
  totalTax: number;
  taxRate: number;
  isReverseCharge: boolean;
  isExempt: boolean;
  hsnCode: string;
  sacCode: string;
}

export interface TaxResult {
  basePrice: number;
  preTaxPrice: number;
  breakdown: TaxBreakdown;
  finalPrice: number;
  taxInclusive: boolean;
}

/** Resolve the effective tax category for a given product/service context. */
function resolveTaxCategory(input: TaxInput): TaxCategory | null {
  const categories = getTaxCategories().filter(c => c.status === 'Active');

  // 1. Explicit override
  if (input.overrideTaxCategoryId) {
    return categories.find(c => c.id === input.overrideTaxCategoryId) || null;
  }

  // 2. HSN-code based lookup (for products)
  if (input.hsnCode) {
    const hsn = getHsnCodes().find(h => h.code === input.hsnCode && h.status === 'Active');
    if (hsn) {
      const cat = categories.find(c => c.id === hsn.taxCategoryId);
      if (cat) return cat;
    }
  }

  // 3. SAC-code based lookup (for services)
  if (input.sacCode) {
    const sac = getSacCodes().find(s => s.code === input.sacCode && s.status === 'Active');
    if (sac) {
      const cat = categories.find(c => c.id === sac.taxCategoryId);
      if (cat) return cat;
    }
  }

  // 4. Product category mapping
  if (input.productCategory) {
    const map = getProductCategoryTaxMap().find(
      m => m.productCategory.toLowerCase() === (input.productCategory || '').toLowerCase()
    );
    if (map) {
      const cat = categories.find(c => c.id === map.taxCategoryId);
      if (cat) return cat;
    }
  }

  // 5. Service category rules
  if (input.serviceCategory) {
    const svcSettings = getServiceTaxSettings();
    const rule = svcSettings.serviceCategoryRules.find(
      r => r.serviceCategory.toLowerCase() === (input.serviceCategory || '').toLowerCase()
    );
    if (rule) {
      const cat = categories.find(c => c.id === rule.taxCategoryId);
      if (cat) return cat;
    }
  }

  // 6. Context-based default
  if (input.context === 'vendor') {
    const vts = getVendorTaxSettings();
    return categories.find(c => c.id === vts.defaultTaxCategory) || categories[0] || null;
  }
  if (input.context === 'service') {
    const sts = getServiceTaxSettings();
    return categories.find(c => c.id === sts.defaultTaxCategoryId) || categories[0] || null;
  }
  // client
  const cts = getClientTaxSettings();
  return categories.find(c => c.id === cts.defaultTaxCategory) || categories[0] || null;
}

function getEffectiveTaxInclusive(input: TaxInput): boolean {
  if (input.context === 'vendor') return getVendorTaxSettings().taxInclusive;
  if (input.context === 'service') return getServiceTaxSettings().taxInclusive;
  return getClientTaxSettings().taxInclusive;
}

/** Main tax calculation function — every module calls this. */
export function calculateTax(input: TaxInput): TaxResult {
  const { basePrice, quantity = 1 } = input;
  const taxCat = resolveTaxCategory(input);
  const taxInclusive = getEffectiveTaxInclusive(input);
  const vts = getVendorTaxSettings();
  const cts = getClientTaxSettings();

  // Short-circuit for special cases
  const isExemptContext =
    (input.isExport && cts.exportClientRules) ||
    (input.isSez && cts.sezClientRules) ||
    (input.isGovernment && cts.governmentClientRules);

  const isExempt = !!(taxCat?.isExempt || taxCat?.isZeroRated || isExemptContext);

  let cgst = 0, sgst = 0, igst = 0, utgst = 0, tds = 0, tcs = 0;

  if (!isExempt && taxCat) {
    if (input.isInterstate) {
      // Interstate: only IGST
      igst = taxCat.igstPct;
    } else {
      // Intrastate: CGST + SGST (or UTGST for Union Territories)
      cgst = taxCat.cgstPct;
      sgst = taxCat.sgstPct;
    }
  }

  // TDS / TCS only on vendor context
  if (input.context === 'vendor' && vts.tdsApplicable) tds = vts.tdsPct;
  if (input.context === 'vendor' && vts.tcsApplicable) tcs = vts.tcsPct;

  const totalGstRate = igst > 0 ? igst : cgst + sgst;
  const preTaxPrice = basePrice * quantity;

  let taxAmount = 0;
  let finalPrice = 0;

  if (taxInclusive) {
    // Tax is included in the price — back-calculate
    taxAmount = preTaxPrice - (preTaxPrice / (1 + totalGstRate / 100));
    finalPrice = preTaxPrice;
  } else {
    taxAmount = (preTaxPrice * totalGstRate) / 100;
    finalPrice = preTaxPrice + taxAmount;
  }

  // Apply TDS deduction (reduces what vendor receives)
  if (tds > 0) {
    const tdsAmt = (finalPrice * tds) / 100;
    tds = tdsAmt;
  }
  if (tcs > 0) {
    const tcsAmt = (preTaxPrice * tcs) / 100;
    tcs = tcsAmt;
  }

  const cgstAmt = igst > 0 ? 0 : (preTaxPrice * cgst) / 100;
  const sgstAmt = igst > 0 ? 0 : (preTaxPrice * sgst) / 100;
  const igstAmt = igst > 0 ? (preTaxPrice * igst) / 100 : 0;

  // Resolve HSN / SAC for breakdown display
  const resolvedHsn = input.hsnCode || getProductCategoryTaxMap().find(
    m => m.productCategory.toLowerCase() === (input.productCategory || '').toLowerCase()
  )?.defaultHsnCode || '';
  const resolvedSac = input.sacCode || '';

  return {
    basePrice: preTaxPrice,
    preTaxPrice,
    breakdown: {
      taxCategoryName: taxCat?.name || 'No Tax',
      cgst: cgstAmt,
      sgst: sgstAmt,
      igst: igstAmt,
      utgst: 0,
      tds: typeof tds === 'number' ? tds : 0,
      tcs: typeof tcs === 'number' ? tcs : 0,
      totalTax: taxAmount,
      taxRate: totalGstRate,
      isReverseCharge: taxCat?.isReverseCharge || false,
      isExempt,
      hsnCode: resolvedHsn,
      sacCode: resolvedSac,
    },
    finalPrice,
    taxInclusive,
  };
}

/** Get the effective GST % for a product category (for backward compat with priceEngineStore). */
export function getEffectiveTaxPctForCategory(productCategory: string, isInterstate = false): number {
  const clientTax = getClientTaxSettings();
  if (!clientTax.enableClientTax) return 0;

  const map = getProductCategoryTaxMap().find(
    m => m.productCategory.toLowerCase() === productCategory.toLowerCase()
  );
  if (map) {
    return isInterstate ? map.igstPct : map.cgstPct + map.sgstPct;
  }

  // Fall back to default client tax
  return isInterstate ? clientTax.igstPct : clientTax.cgstPct + clientTax.sgstPct;
}

/** Get the effective vendor tax % for a product category. */
export function getEffectiveVendorTaxPct(productCategory: string, isInterstate = false): number {
  const vts = getVendorTaxSettings();
  if (!vts.enableVendorTax || !vts.gstApplicable) return 0;

  if (vts.mapTaxByCategory) {
    const map = getProductCategoryTaxMap().find(
      m => m.productCategory.toLowerCase() === productCategory.toLowerCase()
    );
    if (map) return isInterstate ? map.igstPct : map.cgstPct + map.sgstPct;
  }

  return isInterstate ? vts.igstPct : vts.cgstPct + vts.sgstPct;
}

/** Get the effective service tax % for a service category. */
export function getEffectiveServiceTaxPct(serviceCategory: string): number {
  const sts = getServiceTaxSettings();
  if (!sts.enableServiceTax || !sts.gstOnServices) return 0;

  const rule = sts.serviceCategoryRules.find(
    r => r.serviceCategory.toLowerCase() === serviceCategory.toLowerCase()
  );
  if (rule) return rule.gstRate;
  return sts.defaultGstRate;
}
