// Price Engine — fully automatic pricing pipeline.
// Reads real data from the Master Catalog, Vendor Product Lists and Vendor
// Master data, computes the winning vendor + landed cost per product, then
// computes the client selling price from per-client charge settings, and
// syncs the result into every client catalog that carries the product.
//
// Tax calculations are delegated to the centralised Tax Engine (taxEngine.ts).
// Never hardcode tax rates here — always read from the Tax Engine so that
// changes in Tax Settings flow through immediately to all price calculations.

import { getCatalogProducts } from './catalogStore';
import { getAllVendorProducts, updateVendorProduct, getAvailableStock } from './vendorStore';
import { getVendors } from './vendorDataStore';
import { getClients } from './clientStore';
import { getClientCatalog, saveClientCatalog, updateClientCatalogProductPrice } from './clientCatalogStore';
import { getEffectiveVendorTaxPct, getEffectiveTaxPctForCategory } from './taxEngine';

// ─── Per-vendor / per-client settings ──────────────────────────────────────
// Charges/margins aren't captured anywhere else in the real data sources
// (vendor product listings, master catalog, client catalog), so they're
// configured individually per vendor / per client and stored keyed by id.

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
  extraCharges: ChargeItem[];
}

const DEFAULT_VENDOR_SETTINGS: VendorCommonSettings = { logisticsPct: 0, handlingPct: 0, extraCharges: [] };

function getAllVendorSettings(): Record<string, VendorCommonSettings> {
  try {
    const raw = localStorage.getItem(VENDOR_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return {};
}

export function getVendorCommonSettings(vendorId: string): VendorCommonSettings {
  const all = getAllVendorSettings();
  return { ...DEFAULT_VENDOR_SETTINGS, ...(all[vendorId] || {}) };
}

export function saveVendorCommonSettings(vendorId: string, settings: VendorCommonSettings): void {
  const all = getAllVendorSettings();
  all[vendorId] = settings;
  localStorage.setItem(VENDOR_SETTINGS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

export interface ClientCommonSettings {
  perUnitCharges: ChargeItem[];
  overheadPct: number;
  profitPct: number;
  discountPct: number;
  roundOff: 'none' | 'nearest' | 'up' | 'down';
}

const DEFAULT_CLIENT_SETTINGS: ClientCommonSettings = {
  perUnitCharges: [],
  overheadPct: 0,
  profitPct: 20,
  discountPct: 0,
  roundOff: 'none',
};

function getAllClientSettings(): Record<string, ClientCommonSettings> {
  try {
    const raw = localStorage.getItem(CLIENT_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return {};
}

export function getClientCommonSettings(clientId: string): ClientCommonSettings {
  const all = getAllClientSettings();
  return { ...DEFAULT_CLIENT_SETTINGS, ...(all[clientId] || {}) };
}

export function saveClientCommonSettings(clientId: string, settings: ClientCommonSettings): void {
  const all = getAllClientSettings();
  all[clientId] = settings;
  localStorage.setItem(CLIENT_SETTINGS_KEY, JSON.stringify(all));
  // Immediately push recomputed prices into the client catalog so every
  // part of the app that reads the catalog reflects the new charges without
  // requiring the user to visit the Price Engine tab first.
  syncClientPrices(clientId);
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// ─── Client price slabs (volume-based discounts) ───────────────────────────
// Individually configured per client. Each slab defines a quantity range
// that applies an additional discount % on top of the client's standard
// pricing settings, either across all products or a specific category.

const CLIENT_SLABS_KEY = 'nido_price_engine_client_slabs';

export interface PriceSlab {
  id: string;
  name: string;
  minQty: number;
  maxQty: number;
  discountPct: number;
  applyTo: string; // "All Products" or a specific category name
  status: 'Active' | 'Inactive';
}

const DEFAULT_PRICE_SLABS: PriceSlab[] = [
  { id: 'slab-1', name: 'Bulk Order - Tier 1', minQty: 1, maxQty: 50, discountPct: 0, applyTo: 'All Products', status: 'Active' },
  { id: 'slab-2', name: 'Bulk Order - Tier 2', minQty: 51, maxQty: 100, discountPct: 5, applyTo: 'All Products', status: 'Active' },
  { id: 'slab-3', name: 'Bulk Order - Tier 3', minQty: 101, maxQty: 500, discountPct: 10, applyTo: 'All Products', status: 'Active' },
];

function getAllClientSlabs(): Record<string, PriceSlab[]> {
  try {
    const raw = localStorage.getItem(CLIENT_SLABS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return {};
}

export function getClientPriceSlabs(clientId: string): PriceSlab[] {
  const all = getAllClientSlabs();
  if (all[clientId]) return all[clientId];
  return DEFAULT_PRICE_SLABS;
}

export function saveClientPriceSlabs(clientId: string, slabs: PriceSlab[]): void {
  const all = getAllClientSlabs();
  all[clientId] = slabs;
  localStorage.setItem(CLIENT_SLABS_KEY, JSON.stringify(all));
  syncClientPrices(clientId);
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// Find the discount % that applies for a given client, product category and
// quantity. Category-specific slabs take priority over "All Products" slabs
// when both match the same quantity.
export function getSlabDiscountPct(clientId: string, category: string, qty: number): number {
  const slabs = getClientPriceSlabs(clientId).filter(s => s.status === 'Active' && qty >= s.minQty && qty <= s.maxQty);
  if (slabs.length === 0) return 0;
  const catMatch = slabs.find(s => s.applyTo !== 'All Products' && s.applyTo.toLowerCase() === (category || '').toLowerCase());
  if (catMatch) return catMatch.discountPct;
  const allMatch = slabs.find(s => s.applyTo === 'All Products');
  return allMatch ? allMatch.discountPct : 0;
}

// Apply a client's quantity-based price slab discount on top of an already
// computed final (per-unit) price for that client.
export function applySlabDiscount(finalPrice: number, clientId: string, category: string, qty: number): number {
  const discountPct = getSlabDiscountPct(clientId, category, qty);
  if (!discountPct) return finalPrice;
  return finalPrice * (1 - discountPct / 100);
}

// ─── Global category pricing rules ─────────────────────────────────────────
// Configured once in the Price Engine (Client Price Engine tab) and applied
// to every client — there is no per-client override anymore. When a category
// rule exists, its marginPct + bufferPct are ADDED on top of each client's
// own global profitPct for products in that category — the rule increases
// the margin for that category, it does not replace/reduce the client's
// existing margin.

const GLOBAL_CATEGORY_RULES_KEY = 'nido_price_engine_global_category_rules';

export interface CategoryPricingRule {
  id: string;
  category: string;
  marginPct: number;   // added on top of the client's global profitPct for this category
  bufferPct: number;   // additional % stacked on top of margin
}

export function getGlobalCategoryRules(): CategoryPricingRule[] {
  try {
    const raw = localStorage.getItem(GLOBAL_CATEGORY_RULES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return [];
}

export function saveGlobalCategoryRules(rules: CategoryPricingRule[]): void {
  localStorage.setItem(GLOBAL_CATEGORY_RULES_KEY, JSON.stringify(rules));
  // Rules apply to every client, so resync every client's catalog prices.
  getClients().forEach(c => syncClientPrices(c.id));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// Return the effective margin % for a given category: the client's own
// global profit % PLUS the category rule's margin/buffer % on top of it (a
// category rule is an additional markup for that category, not a
// replacement for the client's own margin). Falls back to the client's
// global profitPct unchanged when no category-specific rule is configured.
// Category rules are global (apply to all clients equally).
export function getCategoryMarginPct(category: string, globalProfitPct: number): number {
  const rules = getGlobalCategoryRules();
  const rule = rules.find(r => r.category.toLowerCase() === (category || '').toLowerCase());
  return rule ? globalProfitPct + rule.marginPct + rule.bufferPct : globalProfitPct;
}

// ─── Per-client extended profit settings ────────────────────────────────────
// Stores the extra guardrail/toggle fields that supplement the client's
// default profit %. The "Default Profit %" itself lives in
// ClientCommonSettings.profitPct for full backward compatibility.

const CLIENT_PROFIT_SETTINGS_KEY = 'nido_client_profit_settings';

export interface ClientProfitSettings {
  minProfitPct: number;
  minProfitAmount: number;
  maxDiscountAllowed: number;
  enableManualOverride: boolean;
  enableMarketPriceValidation: boolean;
  enableSmartPricing: boolean;
}

const DEFAULT_PROFIT_SETTINGS: ClientProfitSettings = {
  minProfitPct: 0,
  minProfitAmount: 0,
  maxDiscountAllowed: 0,
  enableManualOverride: false,
  enableMarketPriceValidation: false,
  enableSmartPricing: false,
};

function getAllClientProfitSettings(): Record<string, ClientProfitSettings> {
  try {
    const raw = localStorage.getItem(CLIENT_PROFIT_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function getClientProfitSettings(clientId: string): ClientProfitSettings {
  const all = getAllClientProfitSettings();
  return { ...DEFAULT_PROFIT_SETTINGS, ...(all[clientId] || {}) };
}

export function saveClientProfitSettings(clientId: string, settings: ClientProfitSettings): void {
  const all = getAllClientProfitSettings();
  all[clientId] = settings;
  localStorage.setItem(CLIENT_PROFIT_SETTINGS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// ─── Per-client category profit rules ───────────────────────────────────────
// Each client has its own category profit percentages. When a category rule
// is enabled, Priority 2 of the profit resolution picks it up.

const CLIENT_CATEGORY_PROFIT_KEY = 'nido_client_category_profit';

export const DEFAULT_PROFIT_CATEGORIES = [
  'Computers', 'Networking', 'Office Supplies', 'Furniture', 'Electrical',
  'Cloud', 'Software', 'Stationery', 'Pantry', 'Cleaning Supplies',
  'Medical Supplies', 'Services',
] as const;

const DEFAULT_CATEGORY_PROFIT_MAP: Record<string, number> = {
  Computers: 5, Networking: 7, 'Office Supplies': 10, Furniture: 12,
  Electrical: 8, Cloud: 20, Software: 18, Stationery: 15, Pantry: 12,
  'Cleaning Supplies': 15, 'Medical Supplies': 10, Services: 25,
};

export interface ClientCategoryProfitRule {
  category: string;
  profitPct: number;
  enabled: boolean;
}

function buildDefaultCategoryRules(): ClientCategoryProfitRule[] {
  return DEFAULT_PROFIT_CATEGORIES.map(cat => ({
    category: cat,
    profitPct: DEFAULT_CATEGORY_PROFIT_MAP[cat] ?? 10,
    enabled: true,
  }));
}

function getAllClientCategoryProfitRules(): Record<string, ClientCategoryProfitRule[]> {
  try {
    const raw = localStorage.getItem(CLIENT_CATEGORY_PROFIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function getClientCategoryProfitRules(clientId: string): ClientCategoryProfitRule[] {
  const all = getAllClientCategoryProfitRules();
  if (all[clientId]) {
    // Ensure all default categories are represented (in case new ones were added)
    const stored = all[clientId];
    const defaults = buildDefaultCategoryRules();
    const merged = defaults.map(d => stored.find(s => s.category === d.category) ?? d);
    return merged;
  }
  return buildDefaultCategoryRules();
}

export function saveClientCategoryProfitRules(clientId: string, rules: ClientCategoryProfitRule[]): void {
  const all = getAllClientCategoryProfitRules();
  all[clientId] = rules;
  localStorage.setItem(CLIENT_CATEGORY_PROFIT_KEY, JSON.stringify(all));
  syncClientPrices(clientId);
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// ─── Per-client product-specific profit rules ────────────────────────────────
// Priority 1 in the profit resolution. Setting profitPct to null means
// "fall through to category or default".

const CLIENT_PRODUCT_PROFIT_KEY = 'nido_client_product_profit';

export interface ClientProductProfitRule {
  masterProductCode: string;
  productName: string;
  profitPct: number | null;
}

function getAllClientProductProfitRules(): Record<string, ClientProductProfitRule[]> {
  try {
    const raw = localStorage.getItem(CLIENT_PRODUCT_PROFIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function getClientProductProfitRules(clientId: string): ClientProductProfitRule[] {
  const all = getAllClientProductProfitRules();
  return all[clientId] || [];
}

export function saveClientProductProfitRules(clientId: string, rules: ClientProductProfitRule[]): void {
  const all = getAllClientProductProfitRules();
  all[clientId] = rules;
  localStorage.setItem(CLIENT_PRODUCT_PROFIT_KEY, JSON.stringify(all));
  syncClientPrices(clientId);
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// Resolve effective profit % for a given client + product using the 3-tier hierarchy:
//   Priority 1 — product-specific profit % (if set and > 0)
//   Priority 2 — category profit % (per-client rule, if that category is enabled)
//   Priority 3 — client default profit % (ClientCommonSettings.profitPct)
export function resolveClientProfitPct(
  clientId: string,
  masterProductCode: string,
  category: string,
): number {
  // Priority 1: product-specific
  const productRules = getClientProductProfitRules(clientId);
  const productRule = productRules.find(r => r.masterProductCode === masterProductCode);
  if (productRule && productRule.profitPct !== null && productRule.profitPct > 0) {
    return productRule.profitPct;
  }

  // Priority 2: per-client category rule (if enabled)
  const catRules = getClientCategoryProfitRules(clientId);
  const catRule = catRules.find(
    r => r.category.toLowerCase() === (category || '').toLowerCase() && r.enabled,
  );
  if (catRule) return catRule.profitPct;

  // Priority 3: client default
  return getClientCommonSettings(clientId).profitPct;
}

// ─── Vendor-side computation ────────────────────────────────────────────────

const TERMS_MAP: Record<string, string> = {
  'NET 30': '30 Days Credit', 'NET 15': '15 Days Credit',
  'NET 45': '45 Days Credit', 'NET 60': '60 Days Credit', 'NET 7': '7 Days Credit',
};

export function getLandedCost(
  basePrice: number,
  settings: VendorCommonSettings,
  productCategory?: string,
): number {
  const extraPct = settings.extraCharges.reduce((sum, c) => sum + c.value, 0);
  const totalPct = settings.logisticsPct + settings.handlingPct + extraPct;
  const preTax = basePrice * (1 + totalPct / 100);
  // Use the Tax Engine when a product category is known; fall back to the
  // per-vendor override only when no category context is available.
  // Tax always comes from the Tax Settings engine — never a local override.
  const effectiveTaxPct = getEffectiveVendorTaxPct(productCategory || '');
  return preTax * (1 + effectiveTaxPct / 100);
}

export interface VendorComparisonRow {
  vendorId: string;
  vendorName: string;
  vendorProductCode: string;
  basePrice: number;
  moq: number;
  leadTime: number;
  stock: number;
  rating: number;
  paymentTerms: string;
  landedCostPerUnit: number;
  score: number;
}

export function computeVendorComparisons(masterProductCode: string, productCategory?: string): VendorComparisonRow[] {
  const storeMap = getAllVendorProducts();
  const allVendors = getVendors();
  const rows: VendorComparisonRow[] = [];

  Object.entries(storeMap).forEach(([vendorId, products]) => {
    const match = products.find(p => p.masterProductCode === masterProductCode && p.status === 'Active');
    if (!match) return;
    const info = allVendors.find(v => v.id === vendorId);
    const rawTerms = info?.paymentTerms || '';
    const basePrice = parseFloat(match.price) || 0;
    const vendorSettings = getVendorCommonSettings(vendorId);
    rows.push({
      vendorId,
      vendorName: info?.name || vendorId,
      vendorProductCode: match.vendorProductCode || '—',
      basePrice,
      moq: parseInt(match.moq) || 0,
      leadTime: parseInt(match.leadTime) || 0,
      stock: getAvailableStock(match),
      rating: info?.rating || 0,
      paymentTerms: TERMS_MAP[rawTerms] || rawTerms || '—',
      // Pass category to Tax Engine for accurate, category-specific vendor tax rates
      landedCostPerUnit: getLandedCost(basePrice, vendorSettings, productCategory),
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

  // Primary sort: lowest landed cost first.
  // Secondary sort: composite score (rating, lead time, stock) breaks ties.
  return rows.sort((a, b) =>
    a.landedCostPerUnit !== b.landedCostPerUnit
      ? a.landedCostPerUnit - b.landedCostPerUnit
      : b.score - a.score,
  );
}

// Update the MOQ on the winning vendor's product listing for a given master
// product. This is the single source of truth for MOQ, so any consumer
// (Shop page, Client Catalog, etc.) that edits it here will automatically
// flow through to the Price Engine and trigger a price recalculation via the
// 'vendorProductsUpdated' event.
export function updateWinningVendorMoq(masterProductCode: string, newMoq: number): boolean {
  const comparisons = computeVendorComparisons(masterProductCode);
  const winner = comparisons[0];
  if (!winner) return false;

  const vendorProducts = getAllVendorProducts()[winner.vendorId] || [];
  const match = vendorProducts.find(p => p.masterProductCode === masterProductCode && p.status === 'Active');
  if (!match) return false;

  updateVendorProduct(winner.vendorId, match.id, { moq: String(newMoq) });
  return true;
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

// ─── Stock info helpers ─────────────────────────────────────────────────────
// Aggregates vendor-level stock into a single product-level view and supports
// the cheapest-vendor-first allocation model the cart and shop pages use.

export interface VendorStockAllocation {
  vendorId: string;
  vendorName: string;
  stock: number;
  landedCostPerUnit: number;
  basePrice: number;
  moq: number;
}

export interface ProductStockInfo {
  /** Sum of stock across every active vendor for this product. */
  totalStock: number;
  /** Vendors sorted cheapest landed-cost first (same order as computeVendorComparisons). */
  allocations: VendorStockAllocation[];
}

/** Return the total available stock and per-vendor breakdown for a product. */
export function getProductStockInfo(masterProductCode: string, productCategory?: string): ProductStockInfo {
  const comparisons = computeVendorComparisons(masterProductCode, productCategory);
  const allocations: VendorStockAllocation[] = comparisons
    .filter(r => r.stock > 0)
    .map(r => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      stock: r.stock,
      landedCostPerUnit: r.landedCostPerUnit,
      basePrice: r.basePrice,
      moq: r.moq,
    }));
  return {
    totalStock: allocations.reduce((s, a) => s + a.stock, 0),
    allocations,
  };
}

/**
 * Given an ordered quantity and the cheapest-first vendor list, return which
 * vendors fulfill how much.  Fills cheapest vendor first until its stock runs
 * out, then spills into the next vendor, and so on.
 */
export function allocateQtyAcrossVendors(
  qty: number,
  allocations: VendorStockAllocation[],
): Array<VendorStockAllocation & { allocated: number }> {
  let remaining = qty;
  return allocations
    .map(a => {
      const allocated = Math.min(remaining, a.stock);
      remaining -= allocated;
      return { ...a, allocated };
    })
    .filter(a => a.allocated > 0);
}

export function getAllProductPricing(): ProductPricing[] {
  const catalog = getCatalogProducts();
  return catalog.map(p => {
    // Pass the product category so Tax Engine can apply category-specific vendor tax rates
    const comparisons = computeVendorComparisons(p.masterProductCode, p.category);
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
  settings: ClientCommonSettings,
  overrideProfitPct?: number,
  productCategory?: string,
): ClientPriceCalc {
  const s = settings;
  const effectiveProfitPct = overrideProfitPct ?? s.profitPct;
  const perUnitPct = s.perUnitCharges.reduce((sum, c) => sum + c.value, 0);
  const totalPct = s.overheadPct + perUnitPct;
  const perUnitTotal = (landedCostPerUnit * totalPct) / 100;
  const subtotal = landedCostPerUnit + perUnitTotal;
  const profit = (subtotal * effectiveProfitPct) / 100;
  const discount = ((subtotal + profit) * s.discountPct) / 100;
  const taxBase = subtotal + profit - discount;
  // Tax always comes from the Tax Settings engine — never a local override.
  const effectiveTaxPct = getEffectiveTaxPctForCategory(productCategory || '');
  const tax = (taxBase * effectiveTaxPct) / 100;
  let finalPrice = subtotal + profit - discount + tax;
  if (s.roundOff === 'nearest') finalPrice = Math.round(finalPrice);
  else if (s.roundOff === 'up') finalPrice = Math.ceil(finalPrice);
  else if (s.roundOff === 'down') finalPrice = Math.floor(finalPrice);
  return { perUnitTotal, subtotal, profit, discount, tax, finalPrice };
}

// Since pricing settings are now configured per-client, each row represents
// one (client, product-in-that-client's-catalog) pair with its own calc.
export interface ClientPricingRow {
  clientId: string;
  clientName: string;
  masterProductCode: string;
  productName: string;
  sku: string;
  category: string;
  clientProductCode: string;
  winningVendor: VendorComparisonRow | null;
  landedCostPerUnit: number;
  calc: ClientPriceCalc | null;
}

export function getAllClientPricing(): ClientPricingRow[] {
  const clients = getClients();
  const productPricing = getAllProductPricing();
  const pricingByCode = new Map(productPricing.map(p => [p.masterProductCode, p]));
  const rows: ClientPricingRow[] = [];

  clients.forEach(c => {
    const catalog = getClientCatalog(c.id);
    const settings = getClientCommonSettings(c.id);
    catalog.forEach(entry => {
      const pp = pricingByCode.get(entry.productCode);
      if (!pp) return;
      const calc = pp.winningVendor
        ? computeClientFinalPrice(
            pp.landedCostPerUnit,
            settings,
            resolveClientProfitPct(c.id, pp.masterProductCode, pp.category),
            pp.category,
          )
        : null;
      rows.push({
        clientId: c.id,
        clientName: c.name,
        masterProductCode: pp.masterProductCode,
        productName: pp.productName,
        sku: pp.sku,
        category: pp.category,
        clientProductCode: entry.cpc || '—',
        winningVendor: pp.winningVendor,
        landedCostPerUnit: pp.landedCostPerUnit,
        calc,
      });
    });
  });

  return rows;
}

// Push every computed final price into the corresponding client catalog
// entry. Returns the number of entries updated.
export function syncAllPricesToClientCatalogs(): number {
  const rows = getAllClientPricing();
  let updated = 0;

  rows.forEach(row => {
    if (!row.calc) return;
    const fmtPrice =
      '₹' + row.calc.finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const catalog = getClientCatalog(row.clientId);
    const entry = catalog.find(e => e.productCode === row.masterProductCode);
    if (entry && entry.priceNum !== row.calc.finalPrice) {
      updateClientCatalogProductPrice(row.clientId, row.masterProductCode, fmtPrice, row.calc.finalPrice);
      updated++;
    }
  });

  return updated;
}

// ─── Retail Market Prices ───────────────────────────────────────────────────
// Global per-product retail (market) prices used by Market Price Validation.
// Stored as a flat map: masterProductCode → retail price (number).

const RETAIL_MARKET_PRICES_KEY = 'nido_retail_market_prices';

export function getRetailMarketPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RETAIL_MARKET_PRICES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveRetailMarketPrices(prices: Record<string, number>): void {
  localStorage.setItem(RETAIL_MARKET_PRICES_KEY, JSON.stringify(prices));
  window.dispatchEvent(new Event('priceEngineSettingsUpdated'));
}

// Recompute and push selling prices for a single client only, using that
// client's own pricing settings. Called whenever a client's catalog is
// viewed or that client's Pricing Settings are changed, so the selling
// price shown always reflects the latest per-client charges — without
// touching any other client's catalog.
export function syncClientPrices(clientId: string): number {
  const productPricing = getAllProductPricing();
  const pricingByCode = new Map(productPricing.map(p => [p.masterProductCode, p]));
  const settings = getClientCommonSettings(clientId);
  const catalog = getClientCatalog(clientId);
  let updated = 0;

  // Mutate the catalog array in one pass, then write once to avoid firing
  // 'clientCatalogUpdated' for every individual product change.
  const updatedCatalog = catalog.map(entry => {
    const pp = pricingByCode.get(entry.productCode);
    if (!pp || !pp.winningVendor) return entry;
    const calc = computeClientFinalPrice(
      pp.landedCostPerUnit,
      settings,
      resolveClientProfitPct(clientId, pp.masterProductCode, pp.category),
      pp.category,
    );
    if (entry.priceNum === calc.finalPrice) return entry;
    updated++;
    const price =
      '₹' + calc.finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { ...entry, price, priceNum: calc.finalPrice };
  });

  if (updated > 0) {
    // Write the whole catalog in one shot → single 'clientCatalogUpdated' event
    // instead of one event per changed product.
    saveClientCatalog(clientId, updatedCatalog);
  }

  return updated;
}
