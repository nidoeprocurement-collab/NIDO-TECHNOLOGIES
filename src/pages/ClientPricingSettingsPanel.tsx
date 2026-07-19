// Client Pricing Settings Panel
// Renders inside Client Details → Configuration → Price Setting.
// Divided into four sections:
//   1. Profit & Pricing Rules      — default %, guardrails, toggles
//   2. Product Category Profit     — per-client, 12 categories
//   3. Product Specific Profit     — per-product override for assigned products
//   4. Overhead & Charges          — existing overhead/charges/round-off

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Info } from 'lucide-react';
import {
  getClientCommonSettings,
  saveClientCommonSettings,
  getClientProfitSettings,
  saveClientProfitSettings,
  getClientCategoryProfitRules,
  saveClientCategoryProfitRules,
  getClientProductProfitRules,
  saveClientProductProfitRules,
  type ClientCommonSettings,
  type ChargeItem,
  type ClientProfitSettings,
  type ClientCategoryProfitRule,
  type ClientProductProfitRule,
} from '@/lib/priceEngineStore';
import { getClientCatalog } from '@/lib/clientCatalogStore';
import { getCatalogProducts } from '@/lib/catalogStore';

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ── Toggle row ──────────────────────────────────────────────────────────────
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

// ── Main component ──────────────────────────────────────────────────────────
export default function ClientPricingSettingsPanel({ clientId }: { clientId: string }) {
  // ── Section 1: base settings (overhead, discount, charges, round-off)
  const [settings, setSettings] = useState<ClientCommonSettings>(() => getClientCommonSettings(clientId));

  // ── Section 1 ext: guardrail / toggle fields
  const [profitSettings, setProfitSettings] = useState<ClientProfitSettings>(() => getClientProfitSettings(clientId));

  // ── Section 2: per-client category profit rules
  const [categoryRules, setCategoryRules] = useState<ClientCategoryProfitRule[]>(() => getClientCategoryProfitRules(clientId));

  // ── Section 3: per-product profit overrides (derived from client catalog)
  const [productRules, setProductRules] = useState<ClientProductProfitRule[]>([]);

  // Reload all state when clientId changes
  useEffect(() => {
    setSettings(getClientCommonSettings(clientId));
    setProfitSettings(getClientProfitSettings(clientId));
    setCategoryRules(getClientCategoryProfitRules(clientId));

    // Build product rules from the client's assigned catalog + master catalog names
    const catalog = getClientCatalog(clientId);
    const masterProducts = getCatalogProducts();
    const existingRules = getClientProductProfitRules(clientId);
    const rules: ClientProductProfitRule[] = catalog.map(entry => {
      const mp = masterProducts.find(p => p.masterProductCode === entry.productCode);
      const existing = existingRules.find(r => r.masterProductCode === entry.productCode);
      return {
        masterProductCode: entry.productCode,
        productName: mp?.productName || entry.name || entry.productCode,
        profitPct: existing?.profitPct ?? null,
      };
    });
    setProductRules(rules);
  }, [clientId]);

  // ── Persist helpers ─────────────────────────────────────────────────────
  const persistSettings = (next: ClientCommonSettings) => {
    setSettings(next);
    saveClientCommonSettings(clientId, next);
  };

  const persistProfitSettings = (next: ClientProfitSettings) => {
    setProfitSettings(next);
    saveClientProfitSettings(clientId, next);
  };

  const persistCategoryRules = (next: ClientCategoryProfitRule[]) => {
    setCategoryRules(next);
    saveClientCategoryProfitRules(clientId, next);
  };

  const persistProductRules = (next: ClientProductProfitRule[]) => {
    setProductRules(next);
    saveClientProductProfitRules(clientId, next);
  };

  // ── Section 1: base field helpers ──────────────────────────────────────
  const updateField = <K extends keyof ClientCommonSettings>(field: K, value: ClientCommonSettings[K]) =>
    persistSettings({ ...settings, [field]: value });

  const addCharge = () => {
    const charge: ChargeItem = { id: `chg-${Date.now()}`, name: '', value: 0 };
    persistSettings({ ...settings, perUnitCharges: [...settings.perUnitCharges, charge] });
  };
  const updateCharge = (id: string, patch: Partial<ChargeItem>) =>
    persistSettings({ ...settings, perUnitCharges: settings.perUnitCharges.map(c => c.id === id ? { ...c, ...patch } : c) });
  const removeCharge = (id: string) =>
    persistSettings({ ...settings, perUnitCharges: settings.perUnitCharges.filter(c => c.id !== id) });

  // ── Section 2: category rule helpers ───────────────────────────────────
  const updateCategoryRule = (category: string, patch: Partial<ClientCategoryProfitRule>) =>
    persistCategoryRules(categoryRules.map(r => r.category === category ? { ...r, ...patch } : r));

  // ── Section 3: product rule helpers ────────────────────────────────────
  const updateProductRule = (mpc: string, profitPct: number | null) =>
    persistProductRules(productRules.map(r => r.masterProductCode === mpc ? { ...r, profitPct } : r));

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Section 1: Profit & Pricing Rules ────────────────────────────── */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-5">
        <SectionHeader
          title="Profit & Pricing Rules"
          subtitle="Default profit % and guardrail settings for this client. Price resolution: Product-specific → Category → Default."
        />

        {/* Numeric fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600">Default Profit %</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number" min={0}
                value={settings.profitPct}
                onChange={e => updateField('profitPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white"
              />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Minimum Profit %</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number" min={0}
                value={profitSettings.minProfitPct}
                onChange={e => persistProfitSettings({ ...profitSettings, minProfitPct: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white"
              />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Minimum Profit ₹</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-gray-400 text-xs shrink-0">₹</span>
              <Input
                type="number" min={0}
                value={profitSettings.minProfitAmount}
                onChange={e => persistProfitSettings({ ...profitSettings, minProfitAmount: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Max Discount Allowed</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number" min={0} max={100}
                value={profitSettings.maxDiscountAllowed}
                onChange={e => persistProfitSettings({ ...profitSettings, maxDiscountAllowed: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs bg-white"
              />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
        </div>

        {/* Toggle fields */}
        <div className="bg-white border border-blue-100 rounded-lg px-4">
          <ToggleRow
            label="Enable Manual Override"
            description="Allow admins to manually set the selling price for this client"
            checked={profitSettings.enableManualOverride}
            onChange={v => persistProfitSettings({ ...profitSettings, enableManualOverride: v })}
          />
          <ToggleRow
            label="Enable Market Price Validation"
            description="Show warning when selling price exceeds retail market price"
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

      {/* ── Section 2: Product Category Profit ───────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Product Category Profit"
          subtitle="Set per-category profit % for this client. Used when no product-specific profit is configured. Disable a category to fall back to the client default."
        />

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-48">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-36">Profit %</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Priority</th>
              </tr>
            </thead>
            <tbody>
              {categoryRules.map((rule, idx) => (
                <tr key={rule.category} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-medium text-gray-800">{rule.category}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0} max={100}
                        value={rule.profitPct}
                        onChange={e => updateCategoryRule(rule.category, { profitPct: parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs w-20 bg-white"
                        disabled={!rule.enabled}
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={v => updateCategoryRule(rule.category, { enabled: v })}
                      />
                      <span className={`text-[11px] font-medium ${rule.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Priority 2</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
          <Info size={11} /> Changes apply immediately to this client's catalog prices.
        </p>
      </div>

      {/* ── Section 3: Product Specific Profit ───────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Product Specific Profit"
          subtitle="Optional per-product profit override. Overrides category and default profit % when set. Leave blank to use category or default."
        />

        {productRules.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center">
            <p className="text-xs text-gray-400">No products are assigned to this client yet.</p>
            <p className="text-[11px] text-gray-300 mt-1">Assign products via the client catalog to configure product-specific profit.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-40">Profit %</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Priority</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {productRules.map((rule, idx) => (
                  <tr key={rule.masterProductCode} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{rule.productName}</p>
                      <p className="text-[10px] text-gray-400">{rule.masterProductCode}</p>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min={0} max={100}
                          placeholder="—"
                          value={rule.profitPct !== null ? rule.profitPct : ''}
                          onChange={e => {
                            const v = e.target.value.trim();
                            updateProductRule(rule.masterProductCode, v === '' ? null : parseFloat(v) || 0);
                          }}
                          className="h-7 text-xs w-20 bg-white"
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      {rule.profitPct !== null ? (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Priority 1</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Category / Default</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {rule.profitPct !== null && (
                        <button
                          onClick={() => updateProductRule(rule.masterProductCode, null)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                          title="Clear — revert to category or default"
                        >
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
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
          <Info size={11} /> Product-specific profit overrides both category and default profit % (Priority 1).
        </p>
      </div>

      {/* ── Section 4: Overhead & Charges ────────────────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <SectionHeader
          title="Overhead & Charges"
          subtitle="Applied to the vendor landed cost. These are client-specific and do not affect the profit % calculation."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-600">Overhead (% of Landed Cost)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number" min={0}
                value={settings.overheadPct}
                onChange={e => updateField('overheadPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white"
              />
              <span className="text-gray-400 text-xs shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Standard Discount (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number" min={0} max={100}
                value={settings.discountPct}
                onChange={e => updateField('discountPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs bg-white"
              />
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

        {/* Additional per-unit charges */}
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
                  <Input
                    placeholder="Charge name" value={c.name}
                    onChange={e => updateCharge(c.id, { name: e.target.value })}
                    className="h-8 text-xs flex-1 bg-white"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number" value={c.value}
                      onChange={e => updateCharge(c.id, { value: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs w-24 bg-white"
                    />
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
