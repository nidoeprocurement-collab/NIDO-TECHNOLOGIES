import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  getAllProductPricing,
  getVendorCommonSettings,
  saveVendorCommonSettings,
  type ProductPricing,
  type VendorCommonSettings,
  type ChargeItem,
} from '@/lib/priceEngineStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNos = (n: number) => n.toLocaleString('en-IN');

function Stars({ r }: { r: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(r) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
      <span className="text-xs ml-1 text-gray-600">{r.toFixed(1)} / 5</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorPriceEngine() {
  const [settings, setSettings] = useState<VendorCommonSettings>(getVendorCommonSettings());
  const [products, setProducts] = useState<ProductPricing[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refresh = () => setProducts(getAllProductPricing());

  useEffect(() => {
    refresh();
    const events = ['catalogUpdated', 'vendorProductsUpdated', 'nidoVendorsUpdated', 'priceEngineSettingsUpdated'];
    events.forEach(ev => window.addEventListener(ev, refresh));
    return () => events.forEach(ev => window.removeEventListener(ev, refresh));
  }, []);

  const updateSetting = (field: 'logisticsPct' | 'handlingPct' | 'taxPct', value: number) => {
    const next = { ...settings, [field]: value };
    setSettings(next);
    saveVendorCommonSettings(next);
    setProducts(getAllProductPricing());
  };

  const persistCharges = (extraCharges: ChargeItem[]) => {
    const next = { ...settings, extraCharges };
    setSettings(next);
    saveVendorCommonSettings(next);
    setProducts(getAllProductPricing());
  };

  const addCharge = () => {
    const charge: ChargeItem = { id: `chg-${Date.now()}`, name: '', value: 0 };
    persistCharges([...settings.extraCharges, charge]);
  };

  const updateCharge = (id: string, patch: Partial<ChargeItem>) => {
    persistCharges(settings.extraCharges.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCharge = (id: string) => {
    persistCharges(settings.extraCharges.filter(c => c.id !== id));
  };

  const toggle = (code: string) => setExpanded(e => ({ ...e, [code]: !e[code] }));

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">VENDOR PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically compares real vendor listings for every catalog product and picks the winning vendor
          </p>
        </div>
      </div>

      {/* ── Common Charges (the only manual inputs — applied to every product/vendor) ── */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-1">Common Charges (Applied to All Products)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Base price, MOQ, lead time and stock are pulled automatically from each vendor's product listing.
          These charges aren't captured anywhere else, so they're set once and applied uniformly.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
          <div>
            <Label className="text-xs text-gray-600">Logistics Cost (% of Base Price)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.logisticsPct}
                onChange={e => updateSetting('logisticsPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Handling Charges (% of Base Price)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.handlingPct}
                onChange={e => updateSetting('handlingPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Tax (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.taxPct}
                onChange={e => updateSetting('taxPct', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-600">Additional Charges (% of Base Price)</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCharge}>
              <Plus size={12} /> Add New
            </Button>
          </div>
          {settings.extraCharges.length === 0 ? (
            <p className="text-xs text-gray-400">No additional charges configured.</p>
          ) : (
            <div className="space-y-2 max-w-xl">
              {settings.extraCharges.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <Input placeholder="Charge name" value={c.name}
                    onChange={e => updateCharge(c.id, { name: e.target.value })} className="h-8 text-xs flex-1" />
                  <div className="flex items-center gap-1">
                    <Input type="number" value={c.value}
                      onChange={e => updateCharge(c.id, { value: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs w-28" />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                  <button onClick={() => removeCharge(c.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Automatic Vendor Comparison for every product ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">
          Winning Vendor by Product ({products.length} product{products.length !== 1 ? 's' : ''} in Master Catalog)
        </h2>

        {products.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No products found in the Master Catalog yet. Add products there and to vendors' listings to see
            automatic vendor comparisons here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse min-w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-3 w-6"></th>
                  <th className="py-2 px-3 text-left font-semibold">Product</th>
                  <th className="py-2 px-3 text-left font-semibold">Winning Vendor</th>
                  <th className="py-2 px-3 text-right font-semibold">Base Price</th>
                  <th className="py-2 px-3 text-right font-semibold">MOQ</th>
                  <th className="py-2 px-3 text-right font-semibold">Lead Time</th>
                  <th className="py-2 px-3 text-right font-semibold">Stock</th>
                  <th className="py-2 px-3 text-center font-semibold">Rating</th>
                  <th className="py-2 px-3 text-left font-semibold">Payment Terms</th>
                  <th className="py-2 px-3 text-right font-semibold">Landed Cost / Unit</th>
                  <th className="py-2 px-3 text-right font-semibold">Landed Cost (Total)</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <React.Fragment key={p.masterProductCode}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-center">
                        {p.vendorComparisons.length > 1 && (
                          <button onClick={() => toggle(p.masterProductCode)} className="text-gray-400 hover:text-gray-700">
                            {expanded[p.masterProductCode] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-gray-800">{p.productName}</div>
                        <div className="text-gray-400">{p.masterProductCode}{p.sku ? ` · ${p.sku}` : ''}</div>
                      </td>
                      {p.winningVendor ? (
                        <>
                          <td className="py-2 px-3">
                            <span className="text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded">⭐ {p.winningVendor.vendorName}</span>
                          </td>
                          <td className="py-2 px-3 text-right">{fmt(p.winningVendor.basePrice)}</td>
                          <td className="py-2 px-3 text-right">{fmtNos(p.winningVendor.moq)}</td>
                          <td className="py-2 px-3 text-right">{p.winningVendor.leadTime}d</td>
                          <td className="py-2 px-3 text-right">{fmtNos(p.winningVendor.stock)}</td>
                          <td className="py-2 px-3 text-center"><Stars r={p.winningVendor.rating} /></td>
                          <td className="py-2 px-3">{p.winningVendor.paymentTerms}</td>
                          <td className="py-2 px-3 text-right font-bold text-blue-800">{fmt(p.landedCostPerUnit)}</td>
                          <td className="py-2 px-3 text-right font-bold text-blue-800">{fmt(p.landedCostPerUnit * p.moq)}</td>
                        </>
                      ) : (
                        <td colSpan={9} className="py-2 px-3 text-amber-600">No active vendor carries this product yet</td>
                      )}
                    </tr>
                    {expanded[p.masterProductCode] && p.vendorComparisons.map(v => (
                      <tr key={v.vendorId} className={`border-b border-gray-50 bg-gray-50/50 ${v.vendorId === p.winningVendor?.vendorId ? 'bg-green-50/60' : ''}`}>
                        <td></td>
                        <td className="py-1.5 px-3 pl-8 text-gray-500">↳ {v.vendorId === p.winningVendor?.vendorId ? 'Winning' : 'Compared'}</td>
                        <td className="py-1.5 px-3 text-gray-700">{v.vendorName}</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{fmt(v.basePrice)}</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{fmtNos(v.moq)}</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{v.leadTime}d</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{fmtNos(v.stock)}</td>
                        <td className="py-1.5 px-3 text-center"><Stars r={v.rating} /></td>
                        <td className="py-1.5 px-3 text-gray-700">{v.paymentTerms}</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{fmt(v.landedCostPerUnit)}</td>
                        <td className="py-1.5 px-3 text-right text-gray-700">{fmt(v.landedCostPerUnit * v.moq)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
