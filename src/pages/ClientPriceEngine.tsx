import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Search } from 'lucide-react';
import {
  getAllClientPricing,
  syncAllPricesToClientCatalogs,
  type ClientPricingRow,
} from '@/lib/priceEngineStore';
import GlobalCategoryPricingPanel from './GlobalCategoryPricingPanel';

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
  const [rows, setRows] = useState<ClientPricingRow[]>([]);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = () => setRows(getAllClientPricing());

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      const haystack = [
        r.clientName,
        r.productName,
        r.masterProductCode,
        r.sku,
        r.winningVendor?.vendorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

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

  const syncedCount = rows.filter(r => r.calc).length;

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">CLIENT PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically prices every product from its winning vendor's landed cost using each client's own
            overhead/profit/discount/tax settings (configured on that client's Catalog page), and writes the result
            into that client's catalog Selling Price
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

      {/* ── Category Pricing Rules — global, applies to every client ── */}
      <GlobalCategoryPricingPanel />

      {/* ── Final price per client per product (settings are per-client, configured on Client Catalog page) ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">
          Final Client Price by Client &amp; Product ({filteredRows.length} of {rows.length} entr{rows.length !== 1 ? 'ies' : 'y'} · {syncedCount} priced)
        </h2>

        <div className="relative mb-3 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, product, code, SKU or vendor..."
            className="w-full text-xs pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {rows.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No client catalog entries found yet. Once clients have products in their catalog and vendor listings
            exist, the final client price is computed and pushed here automatically.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No entries match "{search}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse min-w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-3 text-left font-semibold">Client</th>
                  <th className="py-2 px-3 text-left font-semibold">Product</th>
                  <th className="py-2 px-3 text-left font-semibold">Winning Vendor</th>
                  <th className="py-2 px-3 text-right font-semibold">Landed Cost</th>
                  <th className="py-2 px-3 text-right font-semibold">Charges + Overhead</th>
                  <th className="py-2 px-3 text-right font-semibold">Profit</th>
                  <th className="py-2 px-3 text-right font-semibold">Discount</th>
                  <th className="py-2 px-3 text-right font-semibold">Tax</th>
                  <th className="py-2 px-3 text-right font-semibold">Final Selling Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={`${r.clientId}-${r.masterProductCode}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-700">{r.clientName}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-800">{r.productName}</div>
                      <div className="text-gray-400">{r.masterProductCode}{r.sku ? ` · ${r.sku}` : ''}</div>
                    </td>
                    {r.winningVendor && r.calc ? (
                      <>
                        <td className="py-2 px-3 text-green-700 font-medium">{r.winningVendor.vendorName}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.landedCostPerUnit)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.perUnitTotal)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.profit)}</td>
                        <td className="py-2 px-3 text-right text-red-600">-{fmt(r.calc.discount)}</td>
                        <td className="py-2 px-3 text-right">{fmt(r.calc.tax)}</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-800">{fmt(r.calc.finalPrice)}</td>
                      </>
                    ) : (
                      <td colSpan={6} className="py-2 px-3 text-amber-600">No active vendor — final price pending</td>
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
