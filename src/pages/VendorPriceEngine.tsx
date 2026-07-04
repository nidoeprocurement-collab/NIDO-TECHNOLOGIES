import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  getAllProductPricing,
  type ProductPricing,
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
  const [products, setProducts] = useState<ProductPricing[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refresh = () => setProducts(getAllProductPricing());

  useEffect(() => {
    refresh();
    const events = ['catalogUpdated', 'vendorProductsUpdated', 'nidoVendorsUpdated', 'priceEngineSettingsUpdated'];
    events.forEach(ev => window.addEventListener(ev, refresh));
    return () => events.forEach(ev => window.removeEventListener(ev, refresh));
  }, []);

  const toggle = (code: string) => setExpanded(e => ({ ...e, [code]: !e[code] }));

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">VENDOR PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically compares real vendor listings for every catalog product and picks the winning vendor.
            Logistics, handling, tax and extra charges are configured individually per vendor from that vendor's
            <span className="font-semibold"> Configuration </span> tab on their profile page.
          </p>
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
