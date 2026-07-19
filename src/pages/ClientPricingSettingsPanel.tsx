// Client Pricing Settings Panel
// Renders inside Client Details → Configuration → Price Setting.
// Five sections:
//   1. Profit & Pricing Rules      — default %, guardrails, toggles
//   2. Product Category Profit     — per-client, 12 default + custom categories
//   3. Product Specific Profit     — per-product override for assigned products
//   4. Market Price Comparison     — retail price input + live comparison metrics
//   5. Overhead & Charges          — overhead / discount / additional charges / round-off

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  getClientCommonSettings,
  saveClientCommonSettings,
  getClientProfitSettings,
  saveClientProfitSettings,
  getClientCategoryProfitRules,
  saveClientCategoryProfitRules,
  getClientProductProfitRules,
  saveClientProductProfitRules,
  getRetailMarketPrices,
  saveRetailMarketPrices,
  getAllProductPricing,
  computeClientFinalPrice,
  resolveClientProfitPct,
  DEFAULT_PROFIT_CATEGORIES,
  type ClientCommonSettings,
  type ChargeItem,
  type ClientProfitSettings,
  type ClientCategoryProfitRule,
  type ClientProductProfitRule,
} from '@/lib/priceEngineStore';
import { getClientCatalog } from '@/lib/clientCatalogStore';
import { getCatalogProducts } from '@/lib/catalogStore';

// ── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_CAT_SET = new Set<string>(DEFAULT_PROFIT_CATEGORIES);

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {description && <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ClientPricingSettingsPanel({ clientId }: { clientId: string }) {
  const [settings, setSettings] = useState<ClientCommonSettings>(() => getClientCommonSettings(clientId));
  const [profitSettings, setProfitSettings] = useState<ClientProfitSettings>(() => getClientProfitSettings(clientId));
  const [categoryRules, setCategoryRules] = useState<ClientCategoryProfitRule[]>(() => getClientCategoryProfitRules(clientId));
  const [productRules, setProductRules] = useState<ClientProductProfitRule[]>([]);
  const [retailPrices, setRetailPrices] = useState<Record<string, number>>(() => getRetailMarketPrices());

  // "Add custom category" input state
  const [newCatName, setNewCatName] = useState('');
  const [newCatPct, setNewCatPct] = useState<number>(10);

  // Assigned products (code → name + category) built from client catalog
  const [assignedProducts, setAssignedProducts] = useState<{ code: string; name: string; category: string }[]>([]);

  useEffect(() => {
    setSettings(getClientCommonSettings(clientId));
    setProfitSettings(getClientProfitSettings(clientId));
    setCategoryRules(getClientCategoryProfitRules(clientId));
    setRetailPrices(getRetailMarketPrices());

    const catalog = getClientCatalog(clientId);
    const masterProducts = getCatalogProducts();
    const existingRules = getClientProductProfitRules(clientId);

    const products = catalog.map(entry => {
      const mp = masterProducts.find(p => p.masterProductCode === entry.productCode);
      return {
        code: entry.productCode,
        name: mp?.productName || entry.name || entry.productCode,
        category: mp?.category || entry.category || '',
      };
    });
    setAssignedProducts(products);

    const rules: ClientProductProfitRule[] = products.map(p => {
      const existing = existingRules.find(r => r.masterProductCode === p.code);
      return { masterProductCode: p.code, productName: p.name, profitPct: existing?.profitPct ?? null };
    });
    setProductRules(rules);
  }, [clientId]);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persistSettings = (next: ClientCommonSettings) => { setSettings(next); saveClientCommonSettings(clientId, next); };
  const persistProfitSettings = (next: ClientProfitSettings) => { setProfitSettings(next); saveClientProfitSettings(clientId, next); };
  const persistCategoryRules = (next: ClientCategoryProfitRule[]) => { setCategoryRules(next); saveClientCategoryProfitRules(clientId, next); };
  const persistProductRules = (next: ClientProductProfitRule[]) => { setProductRules(next); saveClientProductProfitRules(clientId, next); };
  const persistRetailPrices = (next: Record<string, number>) => { setRetailPrices(next); saveRetailMarketPrices(next); };

  // ── Overhead/charges helpers ──────────────────────────────────────────────
  const updateField = <K extends keyof ClientCommonSettings>(field: K, val: ClientCommonSettings[K]) =>
    persistSettings({ ...settings, [field]: val });
  const addCharge = () =>
    persistSettings({ ...settings, perUnitCharges: [...settings.perUnitCharges, { id: `chg-${Date.now()}`, name: '', value: 0 }] });
  const updateCharge = (id: string, patch: Partial<ChargeItem>) =>
    persistSettings({ ...settings, perUnitCharges: settings.perUnitCharges.map(c => c.id === id ? { ...c, ...patch } : c) });
  const removeCharge = (id: string) =>
    persistSettings({ ...settings, perUnitCharges: settings.perUnitCharges.filter(c => c.id !== id) });

  // ── Category helpers ──────────────────────────────────────────────────────
  const updateCategoryRule = (category: string, patch: Partial<ClientCategoryProfitRule>) =>
    persistCategoryRules(categoryRules.map(r => r.category === category ? { ...r, ...patch } : r));
  const removeCategoryRule = (category: string) =>
    persistCategoryRules(categoryRules.filter(r => r.category !== category));
  const addCustomCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categoryRules.some(r => r.category.toLowerCase() === name.toLowerCase())) return;
    persistCategoryRules([...categoryRules, { category: name, profitPct: newCatPct, enabled: true }]);
    setNewCatName('');
    setNewCatPct(10);
  };

  // ── Product rule helpers ──────────────────────────────────────────────────
  const updateProductRule = (mpc: string, profitPct: number | null) =>
    persistProductRules(productRules.map(r => r.masterProductCode === mpc ? { ...r, profitPct } : r));

  // ── Market price computed rows ─────────────────────────────────────────────
  interface MarketRow {
    code: string; name: string; category: string;
    retailPrice: number; vendorCost: number; clientPrice: number;
    profitPct: number; profitAmount: number;
    savingsPct: number; diffPct: number;
    isAboveMarket: boolean; suggestedPrice: number; requiredVendorCost: number;
  }

  const marketRows = useMemo<MarketRow[]>(() => {
    if (assignedProducts.length === 0) return [];
    const allPricing = getAllProductPricing();
    const pricingMap = new Map(allPricing.map(p => [p.masterProductCode, p]));

    return assignedProducts.map(prod => {
      const pp = pricingMap.get(prod.code);
      const vendorCost = pp?.landedCostPerUnit ?? 0;
      const retailPrice = retailPrices[prod.code] ?? 0;
      const effectiveProfitPct = resolveClientProfitPct(clientId, prod.code, prod.category);
      const calc = pp?.winningVendor
        ? computeClientFinalPrice(vendorCost, settings, effectiveProfitPct, prod.category)
        : null;
      const clientPrice = calc?.finalPrice ?? 0;
      const profitAmount = clientPrice - vendorCost;
      const profitPct = vendorCost > 0 ? (profitAmount / vendorCost) * 100 : 0;
      const savingsPct = retailPrice > 0 ? ((retailPrice - clientPrice) / retailPrice) * 100 : 0;
      const diffPct = retailPrice > 0 ? ((clientPrice - retailPrice) / retailPrice) * 100 : 0;
      const isAboveMarket = retailPrice > 0 && clientPrice > retailPrice;
      // Required vendor cost: reverse-calc using multiplier = computeClientFinalPrice(1, ...).finalPrice
      const multiplier = pp?.winningVendor
        ? computeClientFinalPrice(1, settings, effectiveProfitPct, prod.category).finalPrice
        : 0;
      const requiredVendorCost = multiplier > 0 && retailPrice > 0 ? retailPrice / multiplier : 0;
      return {
        code: prod.code, name: prod.name, category: prod.category,
        retailPrice, vendorCost, clientPrice,
        profitPct, profitAmount, savingsPct, diffPct,
        isAboveMarket, suggestedPrice: retailPrice, requiredVendorCost,
      };
    });
  }, [assignedProducts, settings, retailPrices, categoryRules, productRules, clientId]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── 1. Profit & Pricing Rules ─────────────────────────────────────── */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-5">
        <SectionHeader
          title="Profit & Pricing Rules"
          subtitle="Default profit % and guardrail settings for this client. Resolution: Product-specific → Category → Default."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600">Default Profit %</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} value={settings.profitPct}
                onChange={e => updateField('profitPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white" />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Minimum Profit %</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} value={profitSettings.minProfitPct}
                onChange={e => persistProfitSettings({ ...profitSettings, minProfitPct: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white" />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Minimum Profit ₹</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-gray-400 text-xs shrink-0">₹</span>
              <Input type="number" min={0} value={profitSettings.minProfitAmount}
                onChange={e => persistProfitSettings({ ...profitSettings, minProfitAmount: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Max Discount Allowed</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} max={100} value={profitSettings.maxDiscountAllowed}
                onChange={e => persistProfitSettings({ ...profitSettings, maxDiscountAllowed: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white" />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-blue-100 rounded-lg px-4">
          <ToggleRow
            label="Enable Manual Override"
            description="Allow admins to manually set the selling price for this client"
            checked={profitSettings.enableManualOverride}
            onChange={v => persistProfitSettings({ ...profitSettings, enableManualOverride: v })}
          />
          <ToggleRow
            label="Enable Market Price Validation"
            description="Show warnings and comparison metrics when selling price exceeds retail market price"
            checked={profitSettings.enableMarketPriceValidation}
            onChange={v => persistProfitSettings({ ...profitSettings, enableMarketPriceValidation: v })}
          />
          <ToggleRow
            label="Enable Smart Pricing"
            description="Automatically adjust pricing based on market conditions"
            checked={profitSettings.enableSmartPricing}
            onChange={v => persistProfitSettings({ ...profitSettings, enableSmartPricing: v })}
          />
        </div>
      </div>

      {/* ── 2. Product Category Profit ────────────────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Product Category Profit"
          subtitle="Per-category profit % for this client (Priority 2). Disable a category to fall back to the client default. Add custom categories as needed."
        />

        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-36">Profit %</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-36">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {categoryRules.map((rule, idx) => {
                const isDefault = DEFAULT_CAT_SET.has(rule.category);
                return (
                  <tr key={rule.category} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-gray-800">{rule.category}</span>
                      {!isDefault && (
                        <span className="ml-2 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Custom</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} max={100} value={rule.profitPct}
                          onChange={e => updateCategoryRule(rule.category, { profitPct: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs w-20 bg-white" disabled={!rule.enabled} />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.enabled} onCheckedChange={v => updateCategoryRule(rule.category, { enabled: v })} />
                        <span className={`text-[11px] font-medium ${rule.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {!isDefault && (
                        <button onClick={() => removeCategoryRule(rule.category)}
                          className="text-gray-300 hover:text-red-400 transition-colors" title="Remove custom category">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add custom category row */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <Plus size={14} className="text-gray-400 shrink-0" />
          <Input
            placeholder="New category name…"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
            className="h-8 text-xs flex-1 bg-white"
          />
          <div className="flex items-center gap-1 shrink-0">
            <Input type="number" min={0} max={100} value={newCatPct}
              onChange={e => setNewCatPct(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs w-20 bg-white" placeholder="%" />
            <span className="text-gray-400 text-xs">%</span>
          </div>
          <Button size="sm" variant="outline"
            className="h-8 text-xs gap-1 bg-white shrink-0"
            onClick={addCustomCategory}
            disabled={!newCatName.trim()}>
            <Plus size={12} /> Add Category
          </Button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
          <Info size={11} /> Default categories cannot be removed. Custom categories can be deleted any time.
        </p>
      </div>

      {/* ── 3. Product Specific Profit ────────────────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Product Specific Profit"
          subtitle="Optional per-product profit override (Priority 1 — beats category and default). Leave blank to fall through."
        />

        {productRules.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center">
            <p className="text-xs text-gray-400">No products assigned to this client yet.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-40">Profit %</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell w-36">Resolution</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {productRules.map((rule, idx) => (
                  <tr key={rule.masterProductCode} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{rule.productName}</p>
                      <p className="text-[10px] text-gray-400">{rule.masterProductCode}</p>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} max={100} placeholder="—"
                          value={rule.profitPct !== null ? rule.profitPct : ''}
                          onChange={e => {
                            const v = e.target.value.trim();
                            updateProductRule(rule.masterProductCode, v === '' ? null : parseFloat(v) || 0);
                          }}
                          className="h-7 text-xs w-20 bg-white" />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      {rule.profitPct !== null
                        ? <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Priority 1</span>
                        : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Category / Default</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {rule.profitPct !== null && (
                        <button onClick={() => updateProductRule(rule.masterProductCode, null)}
                          className="text-gray-300 hover:text-red-400 transition-colors" title="Clear override">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. Market Price Comparison ────────────────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Market Price Comparison</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Set the retail market price per product. The engine compares it against the computed client selling price.
              {!profitSettings.enableMarketPriceValidation && (
                <span className="ml-1 text-amber-600 font-medium">Enable Market Price Validation (above) to activate warnings.</span>
              )}
            </p>
          </div>
          {profitSettings.enableMarketPriceValidation && marketRows.some(r => r.isAboveMarket) && (
            <span className="flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200 shrink-0 ml-3">
              <AlertTriangle size={11} />
              {marketRows.filter(r => r.isAboveMarket).length} above market
            </span>
          )}
        </div>

        {assignedProducts.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center mt-3">
            <p className="text-xs text-gray-400">No products assigned to this client yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[900px] w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[160px]">Product</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-36">Retail Market Price</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Best Vendor Cost</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Client Price</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-20">Profit %</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Profit ₹</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">Client Savings %</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">vs Market %</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {marketRows.map((row, idx) => (
                  <Fragment key={row.code}>
                    <tr
                      className={`border-b border-gray-100 ${
                        row.isAboveMarket && profitSettings.enableMarketPriceValidation
                          ? 'bg-red-50/40'
                          : idx % 2 === 0 ? '' : 'bg-gray-50/30'
                      }`}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800 truncate max-w-[155px]">{row.name}</p>
                        <p className="text-[10px] text-gray-400">{row.category}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 shrink-0">₹</span>
                          <Input type="number" min={0} placeholder="0"
                            value={row.retailPrice > 0 ? row.retailPrice : ''}
                            onChange={e => {
                              const v = parseFloat(e.target.value) || 0;
                              persistRetailPrices({ ...retailPrices, [row.code]: v });
                            }}
                            className="h-7 text-xs w-24 bg-white" />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                        {row.vendorCost > 0 ? fmt(row.vendorCost) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-800">
                        {row.clientPrice > 0 ? fmt(row.clientPrice) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-semibold ${row.profitPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {row.vendorCost > 0 ? `${row.profitPct.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                        {row.vendorCost > 0 ? fmt(row.profitAmount) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.retailPrice > 0 ? (
                          <span className={`font-semibold ${row.savingsPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {row.savingsPct.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.retailPrice > 0 ? (
                          <span className={`font-semibold ${row.diffPct <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {row.diffPct > 0 ? '+' : ''}{row.diffPct.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.retailPrice === 0 ? (
                          <span className="text-[10px] text-gray-400">No price set</span>
                        ) : row.isAboveMarket ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full font-medium">
                            <AlertTriangle size={9} /> Above
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
                            <CheckCircle2 size={9} /> OK
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Above-market warning row */}
                    {row.isAboveMarket && profitSettings.enableMarketPriceValidation && (
                      <tr key={`${row.code}-warn`} className="bg-amber-50 border-b border-amber-100">
                        <td colSpan={9} className="px-4 py-2">
                          <div className="flex flex-wrap items-center gap-4 text-[11px]">
                            <span className="flex items-center gap-1 text-amber-700 font-medium">
                              <AlertTriangle size={11} /> Current vendor cost is not competitive with the market.
                            </span>
                            <span className="text-gray-600">
                              Above market by: <strong className="text-red-600">{fmt(row.clientPrice - row.retailPrice)}</strong>
                              &nbsp;({row.diffPct.toFixed(1)}%)
                            </span>
                            <span className="text-gray-600">
                              Suggested selling price: <strong className="text-green-700">{fmt(row.suggestedPrice)}</strong>
                            </span>
                            {row.requiredVendorCost > 0 && (
                              <span className="text-gray-600">
                                Required vendor cost: <strong className="text-blue-700">{fmt(row.requiredVendorCost)}</strong>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
          <Info size={11} /> Retail market prices are shared across all clients. Warnings appear only when Market Price Validation is enabled.
        </p>
      </div>

      {/* ── 5. Overhead & Charges ──────────────────────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Overhead & Charges"
          subtitle="Applied to the vendor landed cost. Client-specific — does not affect the profit % resolution."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600">Overhead (% of Landed Cost)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} value={settings.overheadPct}
                onChange={e => updateField('overheadPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white" />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Standard Discount (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} max={100} value={settings.discountPct}
                onChange={e => updateField('discountPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white" />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Round Off Final Price</Label>
            <select
              value={settings.roundOff}
              onChange={e => updateField('roundOff', e.target.value as ClientCommonSettings['roundOff'])}
              className="w-full h-8 text-xs border border-gray-300 rounded mt-1 px-2 bg-white"
            >
              <option value="none">No Rounding</option>
              <option value="nearest">Nearest Whole Number</option>
              <option value="up">Round Up</option>
              <option value="down">Round Down</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-600">Additional Charges (% of Landed Cost)</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-white" onClick={addCharge}>
              <Plus size={12} /> Add Charge
            </Button>
          </div>
          {settings.perUnitCharges.length === 0 ? (
            <p className="text-xs text-gray-400">No additional charges configured.</p>
          ) : (
            <div className="space-y-2">
              {settings.perUnitCharges.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <Input placeholder="Charge name" value={c.name}
                    onChange={e => updateCharge(c.id, { name: e.target.value })}
                    className="h-8 text-xs flex-1 bg-white" />
                  <div className="flex items-center gap-1">
                    <Input type="number" value={c.value}
                      onChange={e => updateCharge(c.id, { value: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs w-24 bg-white" />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                  <button onClick={() => removeCharge(c.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
