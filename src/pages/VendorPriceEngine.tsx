import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNos = (n: number) => n.toLocaleString('en-IN');

function payDays(terms: string) {
  const m = terms.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedVendorData {
  name: string;
  landedCostPerUnit: number;
  moq: number;
  leadTime: number;
  paymentTerms: string;
  rating: number;
  stock: number;
}

interface VendorCol {
  id: string;
  name: string;
  basePrice: number;
  moq: number;
  leadTime: number;
  paymentTerms: string;
  logistics: number;
  handling: number;
  taxPct: number;
  stock: number;
  rating: number;
  extras: Record<string, string>;
}

interface ExtraRow { id: string; label: string; }
interface TaxRow { id: string; name: string; pct: number; type: string; }
interface AddlPart { id: string; name: string; type: string; value: number; }

// ─── Computed helpers ─────────────────────────────────────────────────────────

function getPreTax(v: VendorCol) { return v.basePrice + v.logistics + v.handling; }
function getTaxAmt(v: VendorCol) { return getPreTax(v) * v.taxPct / 100; }
function getLanded(v: VendorCol) { return getPreTax(v) + getTaxAmt(v); }

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_OPTS = [
  '7 Days Credit', '15 Days Credit', '30 Days Credit',
  '45 Days Credit', '60 Days Credit', 'Advance Payment',
];

const INIT_VENDORS: VendorCol[] = [
  { id: 'A', name: 'Vendor A', basePrice: 950, moq: 250, leadTime: 7,  paymentTerms: '30 Days Credit', logistics: 20, handling: 5, taxPct: 18, stock: 1200, rating: 4.3, extras: {} },
  { id: 'B', name: 'Vendor B', basePrice: 930, moq: 500, leadTime: 10, paymentTerms: '15 Days Credit', logistics: 18, handling: 4, taxPct: 18, stock: 800,  rating: 4.7, extras: {} },
  { id: 'C', name: 'Vendor C', basePrice: 970, moq: 100, leadTime: 5,  paymentTerms: '30 Days Credit', logistics: 22, handling: 6, taxPct: 18, stock: 600,  rating: 4.2, extras: {} },
  { id: 'D', name: 'Vendor D', basePrice: 990, moq: 300, leadTime: 8,  paymentTerms: '60 Days Credit', logistics: 25, handling: 5, taxPct: 18, stock: 1500, rating: 4.0, extras: {} },
];

const MOQ_QTYS = [100, 250, 500, 1000, 2000];

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onVendorSelect: (data: SelectedVendorData) => void;
  onProceedToClient: () => void;
}

export default function VendorPriceEngine({ onVendorSelect, onProceedToClient }: Props) {
  const [product, setProduct] = useState({
    name: 'Industrial Valve 2 inch', sku: 'VALV-2002',
    category: 'Industrial Equipment', reqQty: 500, reqDate: '2025-07-30',
  });
  const [vendors, setVendors] = useState<VendorCol[]>(INIT_VENDORS);
  const [selectedId, setSelectedId] = useState('B');
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([]);
  const [newExtraLabel, setNewExtraLabel] = useState('');
  const [taxes, setTaxes] = useState<TaxRow[]>([
    { id: '1', name: 'CGST', pct: 9,  type: 'Percentage' },
    { id: '2', name: 'SGST', pct: 9,  type: 'Percentage' },
    { id: '3', name: 'IGST', pct: 18, type: 'Percentage' },
  ]);
  const [addlParts, setAddlParts] = useState<AddlPart[]>([
    { id: '1', name: 'Quality Inspection',    type: 'Per Unit', value: 10 },
    { id: '2', name: 'Certification Cost',    type: 'Per Unit', value: 8 },
    { id: '3', name: 'Documentation Charges', type: 'Per Unit', value: 5 },
  ]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [lastSaved, setLastSaved] = useState('25/06/2025 11:30 AM');

  // Auto-recommend
  const recommendedId = useMemo(() => {
    if (!vendors.length) return '';
    const minL = Math.min(...vendors.map(getLanded));
    const maxR = Math.max(...vendors.map(v => v.rating));
    const minLT = Math.min(...vendors.map(v => v.leadTime));
    const maxLT = Math.max(...vendors.map(v => v.leadTime));
    const maxS = Math.max(...vendors.map(v => v.stock));
    const scored = vendors.map(v => {
      const s =
        (1 - (getLanded(v) - minL) / (minL || 1)) * 40 +
        (v.rating / (maxR || 1)) * 30 +
        (1 - (v.leadTime - minLT) / ((maxLT - minLT) || 1)) * 15 +
        (v.stock / (maxS || 1)) * 15;
      return { id: v.id, s };
    });
    return scored.sort((a, b) => b.s - a.s)[0].id;
  }, [vendors]);

  const selectedVendor = vendors.find(v => v.id === selectedId) || vendors[0];

  // Notify parent whenever selection or vendor data changes
  useEffect(() => {
    if (selectedVendor) {
      onVendorSelect({
        name: selectedVendor.name,
        landedCostPerUnit: getLanded(selectedVendor),
        moq: selectedVendor.moq,
        leadTime: selectedVendor.leadTime,
        paymentTerms: selectedVendor.paymentTerms,
        rating: selectedVendor.rating,
        stock: selectedVendor.stock,
      });
    }
  }, [selectedId, vendors]);

  const updateVendor = (id: string, field: keyof VendorCol, val: unknown) =>
    setVendors(vs => vs.map(v => v.id === id ? { ...v, [field]: val } : v));

  const updateExtra = (vendorId: string, key: string, val: string) =>
    setVendors(vs => vs.map(v => v.id === vendorId ? { ...v, extras: { ...v.extras, [key]: val } } : v));

  const addVendor = () => {
    const letters = 'EFGHIJ'.split('').filter(l => !vendors.find(v => v.id === l));
    const nextId = letters[0] || `V${vendors.length + 1}`;
    setVendors([...vendors, {
      id: nextId, name: `Vendor ${nextId}`, basePrice: 0, moq: 0, leadTime: 0,
      paymentTerms: '30 Days Credit', logistics: 0, handling: 0, taxPct: 18, stock: 0, rating: 0, extras: {},
    }]);
  };

  const removeVendor = (id: string) => {
    setVendors(vs => vs.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(vendors.find(v => v.id !== id)?.id || '');
  };

  const addExtraRow = () => {
    if (!newExtraLabel.trim()) return;
    setExtraRows([...extraRows, { id: Date.now().toString(), label: newExtraLabel.trim() }]);
    setNewExtraLabel('');
  };

  // MOQ impact for selected vendor
  const moqImpact = MOQ_QTYS.map(qty => {
    const std = getLanded(selectedVendor || vendors[0]);
    const ratio = qty / ((selectedVendor?.moq || 500));
    const factor = ratio >= 1
      ? 1 - Math.min(0.07, (ratio - 1) * 0.035)
      : 1 + Math.min(0.04, (1 - ratio) * 0.05);
    const lp = std * factor;
    return { qty, lp, lt: lp * qty };
  });

  const handleSave = () => {
    const now = new Date();
    const d = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
    const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLastSaved(`${d} ${t}`);
    toast.success('Vendor Price Engine saved');
  };

  // Summary vendors
  const minLV = vendors.length ? vendors.reduce((a, b) => getLanded(a) < getLanded(b) ? a : b) : null;
  const bestRV = vendors.length ? vendors.reduce((a, b) => a.rating > b.rating ? a : b) : null;
  const fastV  = vendors.length ? vendors.reduce((a, b) => a.leadTime < b.leadTime ? a : b) : null;
  const stockV = vendors.length ? vendors.reduce((a, b) => a.stock > b.stock ? a : b) : null;
  const termsV = vendors.length ? vendors.reduce((a, b) => payDays(a.paymentTerms) > payDays(b.paymentTerms) ? a : b) : null;
  const overallV = vendors.find(v => v.id === recommendedId);

  // ── Table cell helpers ──
  const numInput = (v: VendorCol, field: keyof VendorCol, w = 'w-20') => (
    <Input
      type="number"
      value={v[field] as number}
      onChange={e => updateVendor(v.id, field, parseFloat(e.target.value) || 0)}
      className={`h-7 text-xs text-center border-gray-200 ${w} mx-auto`}
    />
  );

  const isRec = (id: string) => id === recommendedId;

  return (
    <div className="max-w-full space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">VENDOR PRICE ENGINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compare vendors and select best option</p>
        </div>
        <div className="flex items-end gap-4 flex-wrap">
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
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Saved</p>
            <p className="text-xs font-medium text-gray-700 h-8 flex items-center">{lastSaved}</p>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-4">Save</Button>
        </div>
      </div>

      {/* ── Section 1: Product Details ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">1. Product / Item Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Product / Item Name *</Label>
            <Input value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} className="mt-1 text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">SKU / Code</Label>
            <Input value={product.sku} onChange={e => setProduct({ ...product, sku: e.target.value })} className="mt-1 text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Category</Label>
            <Input value={product.category} onChange={e => setProduct({ ...product, category: e.target.value })} className="mt-1 text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Required Quantity (MOQ Based) *</Label>
            <div className="flex gap-1 mt-1">
              <Input type="number" value={product.reqQty} onChange={e => setProduct({ ...product, reqQty: parseInt(e.target.value) || 0 })} className="text-xs h-8 flex-1" />
              <span className="text-xs flex items-center text-gray-500 whitespace-nowrap">Nos</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Required Date</Label>
            <Input type="date" value={product.reqDate} onChange={e => setProduct({ ...product, reqDate: e.target.value })} className="mt-1 text-xs h-8" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Vendor Comparison ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">2. Vendor Comparison</h2>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 py-2 px-3 bg-blue-600 text-white font-semibold text-left min-w-[190px] rounded-tl-md">Particulars</th>
                {vendors.map(v => (
                  <th key={v.id} className={`py-2 px-3 font-semibold text-center min-w-[150px] ${isRec(v.id) ? 'bg-green-600 text-white' : 'bg-blue-50 text-blue-800'}`}>
                    <div className="flex flex-col items-center gap-1">
                      {isRec(v.id) ? (
                        <span className="text-xs">⭐ RECOMMENDED</span>
                      ) : (
                        <>
                          <span>{v.name}</span>
                          <button onClick={() => removeVendor(v.id)} className="text-red-400 hover:text-red-600 text-xs leading-none">✕ remove</button>
                        </>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-2 px-3 bg-blue-50 text-blue-600 font-semibold text-center min-w-[100px]">
                  <button onClick={addVendor} className="flex items-center gap-1 text-xs mx-auto hover:text-blue-800">
                    <Plus size={12} /> Add Vendor
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Vendor Name */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-gray-50">Vendor Name</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <Input value={v.name} onChange={e => updateVendor(v.id, 'name', e.target.value)} className="h-7 text-xs text-center border-gray-200 w-32 mx-auto" />
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Base Price */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">Base Price (Per Unit)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-center gap-1"><span className="text-gray-400">₹</span>{numInput(v, 'basePrice')}</div>
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* MOQ */}
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-gray-50/60">MOQ (Minimum Order Qty)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>{numInput(v, 'moq', 'w-24')}</td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Lead Time */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">Lead Time (Days)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>{numInput(v, 'leadTime', 'w-16')}</td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Payment Terms */}
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-gray-50/60">Payment Terms</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <Select value={v.paymentTerms} onValueChange={val => updateVendor(v.id, 'paymentTerms', val)}>
                      <SelectTrigger className="h-7 text-xs border-gray-200 w-36 mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_OPTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Logistics */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">Logistics Cost (Per Unit)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-center gap-1"><span className="text-gray-400">₹</span>{numInput(v, 'logistics', 'w-16')}</div>
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Handling */}
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-gray-50/60">Handling Charges (Per Unit)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-center gap-1"><span className="text-gray-400">₹</span>{numInput(v, 'handling', 'w-16')}</div>
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Tax % */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">Tax (%) *</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-center gap-1">{numInput(v, 'taxPct', 'w-14')}<span className="text-gray-400">%</span></div>
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Tax Amount — computed */}
              <tr className="border-b border-gray-100 bg-amber-50/40">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-amber-50/60">Tax Amount (Per Unit)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-2 px-3 text-center font-semibold text-gray-800 ${isRec(v.id) ? 'bg-green-50' : ''}`}>{fmt(getTaxAmt(v))}</td>
                ))}
                <td className="py-2 px-3 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Stock */}
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-gray-50/60">Stock Availability</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>{numInput(v, 'stock', 'w-24')}</td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Rating */}
              <tr className="border-b border-gray-100">
                <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">Vendor Rating (★ / 5) *</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                    <Input type="number" step="0.1" min="0" max="5" value={v.rating}
                      onChange={e => updateVendor(v.id, 'rating', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-center border-gray-200 w-14 mx-auto" />
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Dynamic extra rows */}
              {extraRows.map(row => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="sticky left-0 z-10 py-2 px-3 font-medium text-gray-700 bg-white">{row.label}</td>
                  {vendors.map(v => (
                    <td key={v.id} className={`py-1.5 px-2 text-center ${isRec(v.id) ? 'bg-green-50' : ''}`}>
                      <Input value={v.extras[row.id] || ''} onChange={e => updateExtra(v.id, row.id, e.target.value)}
                        className="h-7 text-xs text-center border-gray-200 w-28 mx-auto" />
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-center">
                    <button onClick={() => setExtraRows(rs => rs.filter(r => r.id !== row.id))} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}

              {/* Landed Cost Per Unit — computed */}
              <tr className="border-b border-blue-200 bg-blue-50">
                <td className="sticky left-0 z-10 py-2 px-3 font-bold text-blue-800 bg-blue-50">Landed Cost (Per Unit)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-2 px-3 text-center font-bold text-blue-800 ${isRec(v.id) ? 'bg-green-100' : ''}`}>{fmt(getLanded(v))}</td>
                ))}
                <td className="py-2 px-3 text-center text-blue-500 text-xs">+ Add</td>
              </tr>

              {/* Landed Cost Total — computed */}
              <tr className="bg-blue-50">
                <td className="sticky left-0 z-10 py-2 px-3 font-bold text-blue-800 bg-blue-50">Landed Cost (Total for Qty)</td>
                {vendors.map(v => (
                  <td key={v.id} className={`py-2 px-3 text-center font-bold text-blue-800 ${isRec(v.id) ? 'bg-green-100' : ''}`}>{fmt(getLanded(v) * product.reqQty)}</td>
                ))}
                <td className="py-2 px-3 text-center text-blue-500 text-xs">+ Add</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add Particular */}
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="New row label…" value={newExtraLabel} onChange={e => setNewExtraLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExtraRow()} className="h-7 text-xs w-44" />
          <Button variant="outline" size="sm" onClick={addExtraRow} className="text-xs h-7 px-3">
            <Plus size={12} className="mr-1" /> Add Particular
          </Button>
        </div>
      </div>

      {/* ── Sections 3, 4, 5 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Section 3: Select Winning Vendor */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">3. Select Winning Vendor</h2>
          <Label className="text-xs text-gray-600">Recommended Vendor (Auto Selected)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedId === recommendedId && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium whitespace-nowrap">Recommended</span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Reason</p>
            <ul className="space-y-0.5 text-xs text-gray-600">
              {selectedVendor && getLanded(selectedVendor) === Math.min(...vendors.map(getLanded)) && <li>• Lowest Landed Cost</li>}
              {selectedVendor && selectedVendor.rating >= Math.max(...vendors.map(v => v.rating)) - 0.2 && <li>• Good Rating ({selectedVendor.rating})</li>}
              {selectedVendor && selectedVendor.leadTime <= Math.min(...vendors.map(v => v.leadTime)) + 4 && <li>• Acceptable Lead Time</li>}
              {selectedVendor && selectedVendor.stock >= product.reqQty && <li>• Adequate Stock Availability</li>}
            </ul>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 text-xs h-8"
            onClick={() => { onVendorSelect({ name: selectedVendor.name, landedCostPerUnit: getLanded(selectedVendor), moq: selectedVendor.moq, leadTime: selectedVendor.leadTime, paymentTerms: selectedVendor.paymentTerms, rating: selectedVendor.rating, stock: selectedVendor.stock }); onProceedToClient(); }}
          >
            Proceed to Client Engine →
          </Button>
        </div>

        {/* Section 4: Vendor Summary */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">4. Vendor Summary (Selected)</h2>
          {selectedVendor && (
            <div className="space-y-0 text-xs divide-y divide-gray-100">
              {[
                ['Vendor',              selectedVendor.name],
                ['Landed Cost (Per Unit)', fmt(getLanded(selectedVendor))],
                ['Landed Cost (Total)',    fmt(getLanded(selectedVendor) * product.reqQty)],
                ['MOQ',                `${fmtNos(selectedVendor.moq)} Nos`],
                ['Lead Time',          `${selectedVendor.leadTime} Days`],
                ['Payment Terms',       selectedVendor.paymentTerms],
                ['Stock Availability', `${fmtNos(selectedVendor.stock)} Nos`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-right">{val}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 items-center">
                <span className="text-gray-500">Vendor Rating</span>
                <Stars r={selectedVendor.rating} />
              </div>
            </div>
          )}
        </div>

        {/* Section 5: MOQ Impact Simulator */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">5. MOQ Impact Simulator ({selectedVendor?.name})</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1.5 text-left text-gray-500 font-medium">Qty (Nos)</th>
                <th className="py-1.5 text-right text-gray-500 font-medium">Landed Cost (Per Unit)</th>
                <th className="py-1.5 text-right text-gray-500 font-medium">Landed Cost (Total)</th>
              </tr>
            </thead>
            <tbody>
              {moqImpact.map(row => (
                <tr key={row.qty} className={`border-b border-gray-100 ${row.qty === product.reqQty ? 'bg-green-50 font-semibold' : ''}`}>
                  <td className="py-1.5 text-gray-700">{fmtNos(row.qty)}</td>
                  <td className="py-1.5 text-right text-gray-800">{fmt(row.lp)}</td>
                  <td className="py-1.5 text-right text-gray-800">{fmt(row.lt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sections 6, 7, 8 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Section 6: Tax Management */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">6. Tax Management</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1.5 text-left text-gray-500 font-medium">Tax Name</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Tax (%)</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Type</th>
                <th className="py-1.5 text-center text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map(t => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <Input value={t.name} onChange={e => setTaxes(ts => ts.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} className="h-6 text-xs w-16 border-gray-200" />
                  </td>
                  <td className="py-1.5 text-center">
                    <Input type="number" value={t.pct} onChange={e => setTaxes(ts => ts.map(x => x.id === t.id ? { ...x, pct: parseFloat(e.target.value) || 0 } : x))} className="h-6 text-xs w-12 mx-auto text-center border-gray-200" />
                  </td>
                  <td className="py-1.5 text-center text-gray-600">{t.type}</td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => setTaxes(ts => ts.filter(x => x.id !== t.id))} className="text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setTaxes([...taxes, { id: Date.now().toString(), name: 'Tax', pct: 0, type: 'Percentage' }])}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
            <Plus size={12} /> Add New Tax
          </button>
        </div>

        {/* Section 7: Additional Particulars */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">7. Additional Particulars (Optional)</h2>
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
              {addlParts.map(p => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <Input value={p.name} onChange={e => setAddlParts(ps => ps.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} className="h-6 text-xs w-28 border-gray-200" />
                  </td>
                  <td className="py-1.5 text-center text-gray-600">{p.type}</td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-gray-400">₹</span>
                      <Input type="number" value={p.value} onChange={e => setAddlParts(ps => ps.map(x => x.id === p.id ? { ...x, value: parseFloat(e.target.value) || 0 } : x))} className="h-6 text-xs w-14 text-center border-gray-200" />
                    </div>
                  </td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => setAddlParts(ps => ps.filter(x => x.id !== p.id))} className="text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setAddlParts([...addlParts, { id: Date.now().toString(), name: 'New Charge', type: 'Per Unit', value: 0 }])}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
            <Plus size={12} /> Add New Particular
          </button>
        </div>

        {/* Section 8: Recommendation Summary */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">8. Recommendation Summary</h2>
          <div className="space-y-0 text-xs divide-y divide-gray-100">
            {[
              ['Lowest Cost',         minLV?.name],
              ['Best Rating',         bestRV?.name],
              ['Fastest Delivery',    fastV?.name],
              ['Highest Stock',       stockV?.name],
              ['Best Payment Terms',  termsV?.name],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-blue-700">{val}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 bg-green-50 px-2 rounded mt-1 items-center">
              <span className="font-semibold text-gray-700">Overall Recommended Vendor</span>
              <span className="font-bold text-green-700">{overallV?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 9: Notes ── */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">9. Notes</h2>
        <Textarea placeholder="Internal notes for vendor comparison…" value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-16 resize-none" />
      </div>
    </div>
  );
}
