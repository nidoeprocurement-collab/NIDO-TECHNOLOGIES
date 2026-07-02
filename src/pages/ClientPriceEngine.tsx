import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SelectedVendorData } from './VendorPriceEngine';
import { getClients } from '@/lib/clientStore';
import { updateClientCatalogProductPrice } from '@/lib/clientCatalogStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNos = (n: number) => n.toLocaleString('en-IN');

// ─── Types ────────────────────────────────────────────────────────────────────

type ChargeCategory = 'perUnit' | 'overhead' | 'profit' | 'discount' | 'tax';

interface ChargeRow {
  id: string;
  name: string;
  category: ChargeCategory;
  value: number;
}

interface OtherCharge {
  id: string;
  name: string;
  type: string;
  value: number;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INIT_CHARGES: ChargeRow[] = [
  { id: '1',  name: 'Additional Logistics',    category: 'perUnit',   value: 25 },
  { id: '2',  name: 'Packing Charges',         category: 'perUnit',   value: 10 },
  { id: '3',  name: 'Inspection Charges',      category: 'perUnit',   value: 15 },
  { id: '4',  name: 'Certification Charges',   category: 'perUnit',   value: 8  },
  { id: '5',  name: 'Finance Charges',         category: 'perUnit',   value: 12 },
  { id: '6',  name: 'Overheads',               category: 'overhead',  value: 20 },
  { id: '7',  name: 'Profit Margin',           category: 'profit',    value: 20 },
  { id: '8',  name: 'Discount',                category: 'discount',  value: 2  },
  { id: '9',  name: 'Client Tax (CGST + SGST)',category: 'tax',       value: 18 },
  { id: '10', name: 'Custom Charges',          category: 'perUnit',   value: 5  },
];

const INIT_OTHER: OtherCharge[] = [
  { id: '1', name: 'Warehousing',         type: 'Per Unit', value: 7 },
  { id: '2', name: 'Transit Insurance',   type: 'Per Unit', value: 4 },
  { id: '3', name: 'Loading / Unloading', type: 'Per Unit', value: 4 },
];

const MOQ_QTYS = [100, 250, 500, 1000, 2000];

const DEFAULT_VENDOR: SelectedVendorData = {
  name: 'Vendor B',
  landedCostPerUnit: 1123.54,
  moq: 500,
  leadTime: 10,
  paymentTerms: '15 Days Credit',
  rating: 4.7,
  stock: 800,
};

// ─── Stars ────────────────────────────────────────────────────────────────────

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

// ─── Category display helpers ─────────────────────────────────────────────────

function catLabel(cat: ChargeCategory) {
  if (cat === 'perUnit')   return 'Per Unit';
  if (cat === 'overhead')  return 'Per Unit';
  if (cat === 'profit')    return '%';
  if (cat === 'discount')  return '%';
  if (cat === 'tax')       return '%';
  return 'Per Unit';
}

function catBadge(cat: ChargeCategory) {
  const map: Record<ChargeCategory, string> = {
    perUnit:  'bg-blue-50 text-blue-700',
    overhead: 'bg-orange-50 text-orange-700',
    profit:   'bg-green-50 text-green-700',
    discount: 'bg-red-50 text-red-700',
    tax:      'bg-purple-50 text-purple-700',
  };
  return map[cat];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  vendorData: SelectedVendorData | null;
  productCode?: string;
}

export default function ClientPriceEngine({ vendorData, productCode }: Props) {
  const vendor = vendorData || DEFAULT_VENDOR;
  const allClients = useMemo(() => getClients(), []);
  const [pushClientId, setPushClientId] = useState('');

  const [charges, setCharges] = useState<ChargeRow[]>(INIT_CHARGES);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>(INIT_OTHER);
  const [roundOff, setRoundOff] = useState<'none' | 'nearest' | 'up' | 'down'>('none');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');

  // ── Core calculation ──
  const calc = useMemo(() => {
    const perUnitTotal  = charges.filter(c => c.category === 'perUnit').reduce((s, c) => s + c.value, 0);
    const overheadTotal = charges.filter(c => c.category === 'overhead').reduce((s, c) => s + c.value, 0);
    const profitPct     = charges.find(c => c.category === 'profit')?.value   ?? 20;
    const discountPct   = charges.find(c => c.category === 'discount')?.value ?? 2;
    const taxPct        = charges.find(c => c.category === 'tax')?.value      ?? 18;

    const subtotal  = vendor.landedCostPerUnit + perUnitTotal + overheadTotal;
    const profit    = subtotal * profitPct / 100;
    const discount  = (subtotal + profit) * discountPct / 100;
    const taxBase   = subtotal + profit - discount;
    const tax       = taxBase * taxPct / 100;

    let finalPrice = subtotal + profit - discount + tax;

    if (roundOff === 'nearest') finalPrice = Math.round(finalPrice);
    else if (roundOff === 'up') finalPrice = Math.ceil(finalPrice);
    else if (roundOff === 'down') finalPrice = Math.floor(finalPrice);

    return {
      perUnitTotal, overheadTotal, subtotal,
      profit, profitPct,
      discount, discountPct,
      tax, taxPct,
      finalPrice,
      finalTotal: finalPrice * vendor.moq,
    };
  }, [charges, vendor, roundOff]);

  // ── MOQ Impact ──
  const moqRows = MOQ_QTYS.map(qty => {
    const ratio = qty / (vendor.moq || 500);
    const factor = ratio >= 1
      ? 1 - Math.min(0.07, (ratio - 1) * 0.035)
      : 1 + Math.min(0.04, (1 - ratio) * 0.05);
    const adjLanded = vendor.landedCostPerUnit * factor;

    const perU  = charges.filter(c => c.category === 'perUnit').reduce((s, c) => s + c.value, 0);
    const ovh   = charges.filter(c => c.category === 'overhead').reduce((s, c) => s + c.value, 0);
    const pp    = charges.find(c => c.category === 'profit')?.value   ?? 20;
    const dp    = charges.find(c => c.category === 'discount')?.value ?? 2;
    const tp    = charges.find(c => c.category === 'tax')?.value      ?? 18;

    const sub  = adjLanded + perU + ovh;
    const pr   = sub * pp / 100;
    const dis  = (sub + pr) * dp / 100;
    const tx   = (sub + pr - dis) * tp / 100;
    let fp     = sub + pr - dis + tx;
    if (roundOff === 'nearest') fp = Math.round(fp);
    else if (roundOff === 'up') fp = Math.ceil(fp);
    else if (roundOff === 'down') fp = Math.floor(fp);

    return { qty, adjLanded, finalPrice: fp, finalTotal: fp * qty };
  });

  // ── Mutation helpers ──
  const updateCharge = (id: string, field: keyof ChargeRow, val: unknown) =>
    setCharges(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));

  const addCharge = () =>
    setCharges(cs => [...cs, { id: Date.now().toString(), name: 'New Charge', category: 'perUnit', value: 0 }]);

  const updateOther = (id: string, field: keyof OtherCharge, val: unknown) =>
    setOtherCharges(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));

  const handleSave = () => toast.success('Client Price Engine saved');

  // default profit bound to margin settings
  const defaultProfit = charges.find(c => c.category === 'profit')?.value ?? 20;
  const setDefaultProfit = (v: number) =>
    setCharges(cs => cs.map(c => c.category === 'profit' ? { ...c, value: v } : c));

  const handlePushToClientCatalog = () => {
    if (!pushClientId) { toast.error('Please select a client'); return; }
    if (!productCode) { toast.error('No product selected in Vendor Price Engine'); return; }
    const success = updateClientCatalogProductPrice(
      pushClientId, productCode, fmt(calc.finalPrice), calc.finalPrice
    );
    const clientName = allClients.find(c => c.id === pushClientId)?.name || pushClientId;
    if (success) {
      toast.success(`Selling price ${fmt(calc.finalPrice)} pushed to ${clientName}'s catalog`);
    } else {
      toast.error(`Product not found in ${clientName}'s catalog — add it there first`);
    }
  };

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">CLIENT PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add margins &amp; other costs to get final client price</p>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Currency</p>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                <SelectItem value="USD ($)">USD ($)</SelectItem>
                <SelectItem value="EUR (€)">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-4">Save</Button>
        </div>
      </div>

      {/* ── Section 1: Selected Vendor Details ── */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">1. Selected Vendor Details (Auto Imported)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-gray-500">Vendor</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{vendor.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Landed Cost (Per Unit)</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{fmt(vendor.landedCostPerUnit)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">MOQ</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{fmtNos(vendor.moq)} Nos</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Lead Time (Days)</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{vendor.leadTime} Days</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{vendor.paymentTerms}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vendor Rating</p>
            <div className="mt-1"><Stars r={vendor.rating} /></div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Client Pricing Calculation ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-4">
          2. Client Pricing Calculation (Based on Selected Vendor: {vendor.name})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* A: Cost from Vendor */}
          <div>
            <h3 className="text-xs font-bold text-blue-600 uppercase border-b border-gray-200 pb-1.5 mb-3">A. Cost From Vendor</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-500">Landed Cost (Per Unit)</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{fmt(vendor.landedCostPerUnit)}</p>
              </div>
              {[
                ['MOQ for Selected Vendor',    `${fmtNos(vendor.moq)} Nos`],
                ['Lead Time (Days)',           `${vendor.leadTime} Days`],
                ['Payment Terms',              vendor.paymentTerms],
                ['Stock Availability',         `${fmtNos(vendor.stock)} Nos`],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* B: Additional Charges & Margin */}
          <div>
            <h3 className="text-xs font-bold text-blue-600 uppercase border-b border-gray-200 pb-1.5 mb-3">B. Additional Charges &amp; Margin</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1.5 text-left text-gray-500 font-medium">Particulars</th>
                  <th className="py-1.5 text-center text-gray-500 font-medium w-20">Type</th>
                  <th className="py-1.5 text-center text-gray-500 font-medium w-24">Value</th>
                  <th className="py-1.5 text-center text-gray-500 font-medium w-8">Del</th>
                </tr>
              </thead>
              <tbody>
                {charges.map(c => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-1 pr-1">
                      <Input
                        value={c.name}
                        onChange={e => updateCharge(c.id, 'name', e.target.value)}
                        className="h-6 text-xs border-gray-200 w-full"
                      />
                    </td>
                    <td className="py-1 px-1 text-center">
                      <Select
                        value={c.category}
                        onValueChange={val => updateCharge(c.id, 'category', val as ChargeCategory)}
                      >
                        <SelectTrigger className={`h-6 text-xs border-0 px-1.5 ${catBadge(c.category)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perUnit">Per Unit</SelectItem>
                          <SelectItem value="overhead">Overhead</SelectItem>
                          <SelectItem value="profit">% Profit</SelectItem>
                          <SelectItem value="discount">% Discount</SelectItem>
                          <SelectItem value="tax">% Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1 px-1">
                      <div className="flex items-center justify-center gap-0.5">
                        {(c.category === 'perUnit' || c.category === 'overhead') && <span className="text-gray-400 text-xs">₹</span>}
                        <Input
                          type="number"
                          value={c.value}
                          onChange={e => updateCharge(c.id, 'value', parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs text-center border-gray-200 w-14"
                        />
                        {(c.category === 'profit' || c.category === 'discount' || c.category === 'tax') && <span className="text-gray-400 text-xs">%</span>}
                      </div>
                    </td>
                    <td className="py-1 text-center">
                      <button onClick={() => setCharges(cs => cs.filter(x => x.id !== c.id))} className="text-red-400 hover:text-red-600">
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCharge} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <Plus size={12} /> Add New Particular
            </button>
          </div>

          {/* C: Calculation Summary */}
          <div>
            <h3 className="text-xs font-bold text-blue-600 uppercase border-b border-gray-200 pb-1.5 mb-3">C. Calculation Summary (Per Unit)</h3>
            <div className="space-y-0 text-xs divide-y divide-gray-100">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Vendor Landed Cost</span>
                <span className="font-semibold">{fmt(vendor.landedCostPerUnit)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Additional Charges</span>
                <span className="font-semibold">{fmt(calc.perUnitTotal)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Overheads</span>
                <span className="font-semibold">{fmt(calc.overheadTotal)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold border-b border-gray-300">
                <span>Subtotal</span>
                <span>{fmt(calc.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Profit ({calc.profitPct}%)</span>
                <span className="font-semibold text-green-700">+ {fmt(calc.profit)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Discount ({calc.discountPct}%)</span>
                <span className="font-semibold text-red-600">- {fmt(calc.discount)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Tax ({calc.taxPct}%)</span>
                <span className="font-semibold">{fmt(calc.tax)}</span>
              </div>
            </div>

            {/* Final price boxes */}
            <div className="mt-3 space-y-2">
              <div className="bg-blue-600 text-white rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold opacity-80">FINAL CLIENT PRICE (Per Unit)</p>
                <p className="text-lg font-black mt-0.5">{fmt(calc.finalPrice)}</p>
              </div>
              <div className="bg-green-600 text-white rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold opacity-80">FINAL CLIENT PRICE (Total) — For {fmtNos(vendor.moq)} Nos</p>
                <p className="text-lg font-black mt-0.5">{fmt(calc.finalTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections 3 + 4 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Section 3: MOQ Impact on Client Price */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">3. MOQ Impact on Client Price</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1.5 text-left text-gray-500 font-medium">MOQ (Nos)</th>
                  <th className="py-1.5 text-right text-gray-500 font-medium">Vendor Landed Cost</th>
                  <th className="py-1.5 text-right text-gray-500 font-medium">Final Client Price (Per Unit)</th>
                  <th className="py-1.5 text-right text-gray-500 font-medium">Final Client Price (Total)</th>
                </tr>
              </thead>
              <tbody>
                {moqRows.map(row => (
                  <tr
                    key={row.qty}
                    className={`border-b border-gray-100 ${row.qty === vendor.moq ? 'bg-green-50 font-semibold' : ''}`}
                  >
                    <td className="py-1.5 text-gray-700">{fmtNos(row.qty)}</td>
                    <td className="py-1.5 text-right">{fmt(row.adjLanded)}</td>
                    <td className="py-1.5 text-right">{fmt(row.finalPrice)}</td>
                    <td className="py-1.5 text-right">{fmt(row.finalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Other Charges */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">4. Other Charges (Optional)</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1.5 text-left text-gray-500 font-medium">Particulars</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Type</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Value</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {otherCharges.map(c => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <Input value={c.name} onChange={e => updateOther(c.id, 'name', e.target.value)} className="h-6 text-xs border-gray-200 w-full" />
                  </td>
                  <td className="py-1.5 text-center text-gray-600">{c.type}</td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-gray-400">₹</span>
                      <Input type="number" value={c.value} onChange={e => updateOther(c.id, 'value', parseFloat(e.target.value) || 0)} className="h-6 text-xs w-14 text-center border-gray-200" />
                    </div>
                  </td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => setOtherCharges(cs => cs.filter(x => x.id !== c.id))} className="text-red-400 hover:text-red-600">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => setOtherCharges(cs => [...cs, { id: Date.now().toString(), name: 'New Charge', type: 'Per Unit', value: 0 }])}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus size={12} /> Add New Particular
          </button>
        </div>
      </div>

      {/* ── Sections 5, 6, 7 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Section 5: Margin Settings */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">5. Margin Settings</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600">Default Profit Margin (%)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={defaultProfit}
                  onChange={e => setDefaultProfit(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs w-24"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Round Off</Label>
              <Select value={roundOff} onValueChange={val => setRoundOff(val as typeof roundOff)}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Rounding</SelectItem>
                  <SelectItem value="nearest">Round to Nearest ₹</SelectItem>
                  <SelectItem value="up">Round Up</SelectItem>
                  <SelectItem value="down">Round Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 6: Price Summary */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">6. Price Summary</h2>
          <div className="space-y-0 text-xs divide-y divide-gray-100">
            {[
              ['Selected Vendor',             vendor.name],
              ['Landed Cost (Per Unit)',       fmt(vendor.landedCostPerUnit)],
              ['Final Client Price (Per Unit)',fmt(calc.finalPrice)],
              ['MOQ for Selected Vendor',     `${fmtNos(vendor.moq)} Nos`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5">
                <span className="text-gray-500">{label}</span>
                <span className={`font-semibold ${label === 'Final Client Price (Per Unit)' ? 'text-blue-700' : ''}`}>{val}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Estimated Total (Based on MOQ)</span>
              <span className="font-bold text-green-700">{fmt(calc.finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Section 7: Notes */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">7. Notes</h2>
          <Textarea
            placeholder="Add notes for client pricing…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs min-h-28 resize-none"
          />
        </div>
      </div>

      {/* ── Section 8: Push Final Price to Client Catalog ── */}
      <div className={`border rounded-lg p-4 ${productCode ? 'border-green-300 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
        <h2 className="text-xs font-bold text-green-700 uppercase mb-3">8. Push Final Price to Client Catalog</h2>
        {!productCode ? (
          <p className="text-xs text-gray-500">
            ← Go to the <strong>Vendor Price Engine</strong>, select a product from the catalog, then click "Proceed to Client Engine" — the product code will appear here and you can push the final price to any client's catalog.
          </p>
        ) : (
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Product Code</p>
              <p className="text-sm font-bold text-gray-800">{productCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Final Selling Price (Per Unit)</p>
              <p className="text-xl font-black text-blue-700">{fmt(calc.finalPrice)}</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-600">Select Client</Label>
              <Select value={pushClientId} onValueChange={setPushClientId}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Choose client…" /></SelectTrigger>
                <SelectContent>
                  {allClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handlePushToClientCatalog}
              className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-5"
            >
              Push to Client Catalog
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
