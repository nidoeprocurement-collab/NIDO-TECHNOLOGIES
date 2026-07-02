// Price Engine — fully automatic pricing pipeline.
// Reads real data from the Master Catalog, Vendor Product Lists and Vendor
// Master data, computes the winning vendor + landed cost per product, then
// computes the client selling price from a small set of common (global)
// charge settings, and syncs the result into every client catalog that
// carries the product.

import { getCatalogProducts } from './catalogStore';
import { getAllVendorProducts } from './vendorStore';
import { getVendors } from './vendorDataStore';
import { getClients } from './clientStore';
import { getClientCatalog, updateClientCatalogProductPrice } from './clientCatalogStore';

// ─── Common (global) settings — the only manually entered inputs ──────────────
// These apply uniformly to every product/vendor because the real data sources
// (vendor product listings, master catalog, client catalog) don't carry
// logistics/handling/margin information themselves.

const VENDOR_SETTINGS_KEY = 'nido_price_engine_vendor_settings';
const CLIENT_SETTINGS_KEY = 'nido_price_engine_client_settings';

export interface ChargeItem {
  id: string;
  name: string;
  value: number;
}

export interface VendorCommonSettings {
  logisticsPct: number;
  handlingPct: number;
  taxPct: number;
  extraCharges: ChargeItem[];
}

const DEFAULT_VENDOR_SETTINGS: VendorCommonSettings = { logisticsPct: 0, handlingPct: 0, taxPct: 18, extraCharges: [] };

export function getVendorCommonSettings(): VendorCommonSettings {
  try {
    const raw = localStorage.getItem(VENDOR_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_VENDOR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_VENDOR_SETTINGS;
}

export function saveVendorCommonSettings(settings: VendorCommonSettings): void {
  localStorage.setItem(VENDOR_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

export interface ClientCommonSettings {
  perUnitCharges: ChargeItem[];
  overheadPct: number;
  profitPct: number;
  discountPct: number;
  taxPct: number;
  roundOff: 'none' | 'nearest' | 'up' | 'down';
}

const DEFAULT_CLIENT_SETTINGS: ClientCommonSettings = {
  perUnitCharges: [],
  overheadPct: 0,
  profitPct: 20,
  discountPct: 0,
  taxPct: 18,
  roundOff: 'none',
};

export function getClientCommonSettings(): ClientCommonSettings {
  try {
    const raw = localStorage.getItem(CLIENT_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_CLIENT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_CLIENT_SETTINGS;
}

export function saveClientCommonSettings(settings: ClientCommonSettings): void {
  localStorage.setItem(CLIENT_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// ─── Vendor-side computation ────────────────────────────────────────────────

const TERMS_MAP: Record<string, string> = {
  'NET 30': '30 Days Credit', 'NET 15': '15 Days Credit',
  'NET 45': '45 Days Credit', 'NET 60': '60 Days Credit', 'NET 7': '7 Days Credit',
};

export function getLandedCost(basePrice: number, settings: VendorCommonSettings): number {
  const extraPct = settings.extraCharges.reduce((sum, c) => sum + c.value, 0);
  const totalPct = settings.logisticsPct + settings.handlingPct + extraPct;
  const preTax = basePrice * (1 + totalPct / 100);
  return preTax * (1 + settings.taxPct / 100);
}

export interface VendorComparisonRow {
  vendorId: string;
  vendorName: string;
  basePrice: number;
  moq: number;
  leadTime: number;
  stock: number;
  rating: number;
  paymentTerms: string;
  landedCostPerUnit: number;
  score: number;
}

export function computeVendorComparisons(
  masterProductCode: string,
  settings?: VendorCommonSettings,
): VendorComparisonRow[] {
  const s = settings || getVendorCommonSettings();
  const storeMap = getAllVendorProducts();
  const allVendors = getVendors();
  const rows: VendorComparisonRow[] = [];

  Object.entries(storeMap).forEach(([vendorId, products]) => {
    const match = products.find(p => p.masterProductCode === masterProductCode && p.status === 'Active');
    if (!match) return;
    const info = allVendors.find(v => v.id === vendorId);
    const rawTerms = info?.paymentTerms || '';
    const basePrice = parseFloat(match.price) || 0;
    rows.push({
      vendorId,
      vendorName: info?.name || vendorId,
      basePrice,
      moq: parseInt(match.moq) || 0,
      leadTime: parseInt(match.leadTime) || 0,
      stock: parseInt(match.stock) || 0,
      rating: info?.rating || 0,
      paymentTerms: TERMS_MAP[rawTerms] || rawTerms || '—',
      landedCostPerUnit: getLandedCost(basePrice, s),
      score: 0,
    });
  });

  if (!rows.length) return rows;

  const minL = Math.min(...rows.map(r => r.landedCostPerUnit));
  const maxR = Math.max(...rows.map(r => r.rating));
  const minLT = Math.min(...rows.map(r => r.leadTime));
  const maxLT = Math.max(...rows.map(r => r.leadTime));
  const maxS = Math.max(...rows.map(r => r.stock));

  rows.forEach(r => {
    r.score =
      (1 - (r.landedCostPerUnit - minL) / (minL || 1)) * 40 +
      (r.rating / (maxR || 1)) * 30 +
      (1 - (r.leadTime - minLT) / ((maxLT - minLT) || 1)) * 15 +
      (r.stock / (maxS || 1)) * 15;
  });

  return rows.sort((a, b) => b.score - a.score);
}

export interface ProductPricing {
  masterProductCode: string;
  productName: string;
  sku: string;
  category: string;
  vendorComparisons: VendorComparisonRow[];
  winningVendor: VendorComparisonRow | null;
  landedCostPerUnit: number;
  moq: number;
}

export function getAllProductPricing(): ProductPricing[] {
  const settings = getVendorCommonSettings();
  const catalog = getCatalogProducts();
  return catalog.map(p => {
    const comparisons = computeVendorComparisons(p.masterProductCode, settings);
    const winner = comparisons[0] || null;
    return {
      masterProductCode: p.masterProductCode,
      productName: p.productName,
      sku: p.skuCode,
      category: p.category,
      vendorComparisons: comparisons,
      winningVendor: winner,
      landedCostPerUnit: winner ? winner.landedCostPerUnit : 0,
      moq: winner ? winner.moq : 0,
    };
  });
}

// ─── Client-side computation ────────────────────────────────────────────────

export interface ClientPriceCalc {
  perUnitTotal: number;
  subtotal: number;
  profit: number;
  discount: number;
  tax: number;
  finalPrice: number;
}

export function computeClientFinalPrice(
  landedCostPerUnit: number,
  settings?: ClientCommonSettings,
): ClientPriceCalc {
  const s = settings || getClientCommonSettings();
  const perUnitPct = s.perUnitCharges.reduce((sum, c) => sum + c.value, 0);
  const totalPct = s.overheadPct + perUnitPct;
  const perUnitTotal = (landedCostPerUnit * totalPct) / 100;
  const subtotal = landedCostPerUnit + perUnitTotal;
  const profit = (subtotal * s.profitPct) / 100;
  const discount = ((subtotal + profit) * s.discountPct) / 100;
  const taxBase = subtotal + profit - discount;
  const tax = (taxBase * s.taxPct) / 100;
  let finalPrice = subtotal + profit - discount + tax;
  if (s.roundOff === 'nearest') finalPrice = Math.round(finalPrice);
  else if (s.roundOff === 'up') finalPrice = Math.ceil(finalPrice);
  else if (s.roundOff === 'down') finalPrice = Math.floor(finalPrice);
  return { perUnitTotal, subtotal, profit, discount, tax, finalPrice };
}

export interface ClientPricingRow extends ProductPricing {
  calc: ClientPriceCalc;
  matchingClients: { clientId: string; clientName: string }[];
}

export function getAllClientPricing(): ClientPricingRow[] {
  const clientSettings = getClientCommonSettings();
  const clients = getClients();
  const productPricing = getAllProductPricing();

  return productPricing.map(pp => {
    const calc = computeClientFinalPrice(pp.landedCostPerUnit, clientSettings);
    const matchingClients = clients
      .filter(c => getClientCatalog(c.id).some(e => e.productCode === pp.masterProductCode))
      .map(c => ({ clientId: c.id, clientName: c.name }));
    return { ...pp, calc, matchingClients };
  });
}

// Push every computed final price into every client catalog entry that
// carries the corresponding product. Returns the number of entries updated.
export function syncAllPricesToClientCatalogs(): number {
  const rows = getAllClientPricing();
  const clients = getClients();
  let updated = 0;

  rows.forEach(row => {
    if (!row.winningVendor) return;
    const fmtPrice =
      '₹' + row.calc.finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    clients.forEach(c => {
      const catalog = getClientCatalog(c.id);
      const entry = catalog.find(e => e.productCode === row.masterProductCode);
      if (entry && entry.priceNum !== row.calc.finalPrice) {
        updateClientCatalogProductPrice(c.id, row.masterProductCode, fmtPrice, row.calc.finalPrice);
        updated++;
      }
    });
  });

  return updated;
}
