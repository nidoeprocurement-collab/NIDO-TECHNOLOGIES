import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  getAllClientPricing,
  getClientCommonSettings,
  saveClientCommonSettings,
  syncAllPricesToClientCatalogs,
  type ClientPricingRow,
  type ClientCommonSettings,
  type ChargeItem,
} from '@/lib/priceEngineStore';

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SYNC_EVENTS = [
  'catalogUpdated',
  'vendorProductsUpdated',
  'nidoVendorsUpdated',
  'clientCatalogUpdated',
  'nidoClientsUpdated',
  'priceEngineSettingsUpdated',
];

export default function ClientPriceEngine() {
  const [settings, setSettings] = useState<ClientCommonSettings>(getClientCommonSettings());
  const [rows, setRows] = useState<ClientPricingRow[]>([]);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = () => setRows(getAllClientPricing());

  const syncNow = () => {
    const updated = syncAllPricesToClientCatalogs();
    refresh();
    setLastSyncCount(updated);
    setLastSyncAt(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    // Compute + sync immediately whenever the page loads or any underlying
    // data (master catalog, vendor listings, client catalogs, settings) changes.
    const handle = () => {
      refresh();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(syncNow, 400);
    };
    handle();
    SYNC_EVENTS.forEach(ev => window.addEventListener(ev, handle));
    return () => {
      SYNC_EVENTS.forEach(ev => window.removeEventListener(ev, handle));
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const persistSettings = (next: ClientCommonSettings) => {
    setSettings(next);
    saveClientCommonSettings(next);
  };

  const updateField = <K extends keyof ClientCommonSettings>(field: K, value: ClientCommonSettings[K]) => {
    persistSettings({ ...settings, [field]: value });
  };

  const addCharge = () => {
    const charge: ChargeItem = { id: `chg-${Date.now()}`, name: '', value: 0 };
    persistSettings({ ...settings, perUnitCharges: [...settings.perUnitCharges, charge] });
  };

  const updateCharge = (id: string, patch: Partial<ChargeItem>) => {
    persistSettings({
      ...settings,
      perUnitCharges: settings.perUnitCharges.map(c => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCharge = (id: string) => {
    persistSettings({ ...settings, perUnitCharges: settings.perUnitCharges.filter(c => c.id !== id) });
  };

  const totalMatched = rows.reduce((sum, r) => sum + r.matchingClients.length, 0);

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">CLIENT PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically prices every product from its winning vendor's landed cost, and writes the result into
            each client's catalog Selling Price
          </p>
        </div>
        <Button onClick={syncNow} className="gap-2" size="sm">
          <RefreshCw size={14} /> Sync Now
        </Button>
      </div>

      {lastSyncAt && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          <CheckCircle2 size={14} />
          Last synced at {lastSyncAt} — {lastSyncCount} catalog price{lastSyncCount === 1 ? '' : 's'} updated. Auto-syncs whenever
          Master Catalog, Vendor Listings, or Client Catalogs change.
        </div>
      )}

      {/* ── Common Settings (the only manual inputs — applied to every product) ── */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-1">Common Pricing Settings (Applied to All Products)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Vendor landed cost is pulled automatically from the Vendor Price Engine. These margin/tax settings aren't
          captured elsewhere, so they're configured once and applied uniformly to every product.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mb-4">
          <div>
            <Label className="text-xs text-gray-600">Overhead (% of Landed Cost)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.overheadPct}
                onChange={e => updateField('overheadPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Profit Margin (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.profitPct}
                onChange={e => updateField('profitPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Discount (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.discountPct}
                onChange={e => updateField('discountPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Tax (%)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" value={settings.taxPct}
                onChange={e => updateField('taxPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              <span className="text-gray-400 text-xs">%</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-600">Additional Charges (% of Landed Cost)</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCharge}>
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

        <div className="mt-4 max-w-xs">
          <Label className="text-xs text-gray-600">Round Off Final Price</Label>
          <select
            value={settings.roundOff}
            onChange={e => updateField('roundOff', e.target.value as ClientCommonSettings['roundOff'])}
            className="w-full h-8 text-xs border border-gray-300 rounded mt-1 px-2"
          >
            <option value="none">No Rounding</option>
            <option value="nearest">Nearest Whole Number</option>
            <option value="up">Round Up</option>
            <option value="down">Round Down</option>
          </select>
        </div>
      </div>

      {/* ── Automatic Final Price for every product ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">
          Final Client Price by Product ({rows.length} product{rows.length !== 1 ? 's' : ''} · synced to {totalMatched} catalog entr{totalMatched === 1 ? 'y' : 'ies'})
        </h2>

        {rows.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No products found in the Master Catalog yet. Once products and vendor listings exist, their final
            client price is computed and pushed here automatically.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse min-w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-3 text-left font-semibold">Product</th>
                  <th className="py-2 px-3 text-left font-semibold">Winning Vendor</th>
                  <th className="py-2 px-3 text-right font-semibold">Landed Cost</th>
                  <th className="py-2 px-3 text-right font-semibold">Charges + Overhead</th>
                  <th className="py-2 px-3 text-right font-semibold">Profit</th>
                  <th className="py-2 px-3 text-right font-semibold">Discount</th>
                  <th className="py-2 px-3 text-right font-semibold">Tax</th>
                  <th className="py-2 px-3 text-right font-semibold">Final Selling Price</th>
                  <th className="py-2 px-3 text-left font-semibold">Synced Clients</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.masterProductCode} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-800">{r.productName}</div>
                      <div className="text-gray-400">{r.masterProductCode}{r.sku ? ` · ${r.sku}` : ''}</div>
                    </td>
                    {r.winningVendor ? (
                      <>
                        <td className="py-2 px-3 text-green-700 font-medium">{r.winningVendor.vendorName}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.landedCostPerUnit)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.perUnitTotal)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.profit)}</td>
                        <td className="py-2 px-3 text-right text-red-600">-{fmt(r.calc.discount)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.tax)}</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-800">{fmt(r.calc.finalPrice)}</td>
                        <td className="py-2 px-3">
                          {r.matchingClients.length === 0 ? (
                            <span className="text-gray-400">Not in any client catalog</span>
                          ) : (
                            <span className="text-gray-600">{r.matchingClients.map(c => c.clientName).join(', ')}</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <td colSpan={7} className="py-2 px-3 text-amber-600">No active vendor — final price pending</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
