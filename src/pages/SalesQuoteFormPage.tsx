import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, Save, Send } from 'lucide-react';
import { getClients, type StoredClient } from '@/lib/clientStore';
import { getCatalogProducts, type CatalogProduct } from '@/lib/catalogStore';
import { getProductCategoryTaxMap } from '@/lib/taxEngine';

// ── Quote number generation ───────────────────────────────────────────────────
const QUOTE_COUNTER_KEY = 'nido_quote_counter';

function generateQuoteNumber(): string {
  const counter = parseInt(localStorage.getItem(QUOTE_COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(QUOTE_COUNTER_KEY, String(counter));
  return `EST-${String(counter).padStart(6, '0')}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Line item type + calculations ─────────────────────────────────────────────
interface LineItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  discount: number; // percentage
  taxPercent: number;
}

function lineAmount(item: LineItem): number {
  const base = item.qty * item.rate;
  return base - base * (item.discount / 100);
}

function makeBlankItem(): LineItem {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    productId: '',
    name: '',
    description: '',
    hsnSac: '',
    qty: 1,
    rate: 0,
    discount: 0,
    taxPercent: 18,
  };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const tdInputCls =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function SalesQuoteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // ── Data sources ────────────────────────────────────────────────────────────
  const clients = useMemo(() => getClients().filter(c => !c.status || c.status === 'active'), []);
  const products = useMemo(() => getCatalogProducts(), []);
  const taxMap = useMemo(() => getProductCategoryTaxMap(), []);

  // ── Quote Information ───────────────────────────────────────────────────────
  const [quoteNumber] = useState<string>(() => isEdit ? (id || '') : generateQuoteNumber());
  const [quoteDate, setQuoteDate] = useState<string>(todayISO());
  const [validTill, setValidTill] = useState<string>(() => addDays(todayISO(), 7));

  // Recalculate Valid Till when Quote Date changes (user can still override)
  const prevQuoteDate = useRef(quoteDate);
  useEffect(() => {
    if (quoteDate !== prevQuoteDate.current) {
      setValidTill(addDays(quoteDate, 7));
      prevQuoteDate.current = quoteDate;
    }
  }, [quoteDate]);

  // ── Customer Details ────────────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [contactPerson, setContactPerson] = useState('');
  const clientRef = useRef<HTMLDivElement>(null);

  // ── Addresses ───────────────────────────────────────────────────────────────
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  useEffect(() => {
    if (sameAsBilling) setShippingAddress(billingAddress);
  }, [sameAsBilling, billingAddress]);

  // ── Email Recipients ────────────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  // ── Line Items ──────────────────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItem[]>([makeBlankItem()]);
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});
  const [showProductDd, setShowProductDd] = useState<Record<string, boolean>>({});
  const productRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Summary ─────────────────────────────────────────────────────────────────
  const [adjustment, setAdjustment] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // ── Additional Information ───────────────────────────────────────────────────
  const [bankDetails, setBankDetails] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // ── Close dropdowns on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
      // Close all product dropdowns whose refs don't contain the click
      setShowProductDd(prev => {
        const next = { ...prev };
        let changed = false;
        for (const itemId of Object.keys(prev)) {
          if (prev[itemId] && productRefs.current[itemId] && !productRefs.current[itemId]!.contains(e.target as Node)) {
            next[itemId] = false;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Client selection handler ─────────────────────────────────────────────────
  const handleSelectClient = (client: StoredClient) => {
    setClientSearch(client.name);
    setShowClientDropdown(false);
    setContactPerson(client.rep || '');

    const parts = [
      client.billingAddress,
      client.billingCity,
      client.billingState,
      client.billingPincode,
    ].filter(Boolean);
    const addr = parts.join(', ');
    setBillingAddress(addr);
    if (sameAsBilling) setShippingAddress(addr);

    if (client.email && !emails.includes(client.email)) {
      setEmails(prev => [...prev, client.email!]);
    }
  };

  // ── Product selection handler ────────────────────────────────────────────────
  const handleSelectProduct = (itemId: string, product: CatalogProduct) => {
    const taxEntry = taxMap.find(t => t.productCategory === product.category);
    const taxPercent = taxEntry?.gstRate ?? 18;
    const hsnSac = taxEntry?.defaultHsnCode ?? '';

    setLineItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, productId: product.id, name: product.productName, description: product.description || '', hsnSac, rate: product.price || 0, taxPercent }
          : item
      )
    );
    setProductSearch(prev => ({ ...prev, [itemId]: product.productName }));
    setShowProductDd(prev => ({ ...prev, [itemId]: false }));
  };

  const updateLineItem = <K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) => {
    setLineItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addLineItem = () => {
    const item = makeBlankItem();
    setLineItems(prev => [...prev, item]);
    setProductSearch(prev => ({ ...prev, [item.id]: '' }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const addEmail = () => {
    const e = emailInput.trim();
    if (e && !emails.includes(e)) {
      setEmails(prev => [...prev, e]);
      setEmailInput('');
    }
  };

  // ── Filtered lists ───────────────────────────────────────────────────────────
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const getFilteredProducts = (itemId: string) => {
    const q = (productSearch[itemId] ?? '').toLowerCase();
    return products
      .filter(p => p.productName.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      .slice(0, 25);
  };

  // ── Totals ────────────────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, item) => s + lineAmount(item), 0);

  const gstSlabs = useMemo(() => {
    const map: Record<number, { taxable: number; cgst: number; sgst: number }> = {};
    for (const item of lineItems) {
      const amt = lineAmount(item);
      const rate = item.taxPercent;
      if (!map[rate]) map[rate] = { taxable: 0, cgst: 0, sgst: 0 };
      map[rate].taxable += amt;
      map[rate].cgst += amt * (rate / 2) / 100;
      map[rate].sgst += amt * (rate / 2) / 100;
    }
    return Object.entries(map)
      .filter(([, v]) => v.taxable > 0)
      .map(([rate, v]) => ({ rate: Number(rate), ...v }))
      .sort((a, b) => b.rate - a.rate);
  }, [lineItems]);

  const totalTax = gstSlabs.reduce((s, sl) => s + sl.cgst + sl.sgst, 0);
  const grandTotal = subtotal + totalTax + adjustment;

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6" onClick={() => { setShowClientDropdown(false); }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sales/quotes')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Quote' : 'Create New Quote'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* ── Quote Information ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className={labelCls}>Quote Number</label>
              <input
                type="text"
                value={quoteNumber}
                readOnly
                className={`${inputCls} bg-gray-50 dark:bg-gray-600 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelCls}>Quote Date</label>
              <input
                type="date"
                value={quoteDate}
                onChange={e => setQuoteDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Valid Till Date</label>
              <input
                type="date"
                value={validTill}
                onChange={e => setValidTill(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Customer Details ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {/* Client Name — searchable dropdown */}
            <div>
              <label className={labelCls}>Client Name *</label>
              <div className="relative" ref={clientRef} onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Select customer"
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                  onFocus={() => setShowClientDropdown(true)}
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
                {showClientDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No clients found</div>
                    ) : (
                      filteredClients.map(c => (
                        <button
                          key={c.id}
                          onMouseDown={e => { e.preventDefault(); handleSelectClient(c); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          {c.name}
                          {c.category && <span className="ml-2 text-xs text-gray-400">{c.category}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className={labelCls}>Contact Person</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select Contact Person"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Addresses ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className={labelCls}>Billing Address</label>
              <textarea
                rows={4}
                value={billingAddress}
                onChange={e => setBillingAddress(e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Shipping Address</label>
              <textarea
                rows={4}
                value={shippingAddress}
                readOnly={sameAsBilling}
                onChange={e => { if (!sameAsBilling) setShippingAddress(e.target.value); }}
                className={`${inputCls} resize-none ${sameAsBilling ? 'bg-gray-50 dark:bg-gray-600' : ''}`}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={e => setSameAsBilling(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Same as billing address</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Email Recipients ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Recipients</h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              className={inputCls}
            />
            <button
              onClick={addEmail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
            >
              Add
            </button>
          </div>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {emails.map((email, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-700"
                >
                  {email}
                  <button
                    onClick={() => setEmails(prev => prev.filter((_, j) => j !== i))}
                    className="ml-1 text-blue-400 hover:text-blue-700 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Line Items ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
            <button
              onClick={addLineItem}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  {['ITEM NAME', 'DESCRIPTION', 'HSN/SAC', 'QTY', 'RATE', 'DISCOUNT', 'TAX %', 'AMOUNT', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => {
                  const amt = lineAmount(item);
                  const filteredProds = getFilteredProducts(item.id);
                  const displayName = productSearch[item.id] !== undefined ? productSearch[item.id] : item.name;

                  return (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      {/* Item Name */}
                      <td className="px-3 py-2" style={{ minWidth: 170 }}>
                        <div
                          className="relative"
                          ref={el => { productRefs.current[item.id] = el; }}
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder="Select item"
                            value={displayName}
                            onChange={e => {
                              setProductSearch(prev => ({ ...prev, [item.id]: e.target.value }));
                              setShowProductDd(prev => ({ ...prev, [item.id]: true }));
                            }}
                            onFocus={() => setShowProductDd(prev => ({ ...prev, [item.id]: true }))}
                            className={`${tdInputCls} pr-6`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
                          {showProductDd[item.id] && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                              {filteredProds.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-gray-500 text-center">
                                  {products.length === 0 ? 'No products in catalogue' : 'No matches found'}
                                </div>
                              ) : (
                                filteredProds.map(p => (
                                  <button
                                    key={p.id}
                                    onMouseDown={e => { e.preventDefault(); handleSelectProduct(item.id, p); }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                  >
                                    <div className="text-xs font-medium text-gray-900 dark:text-white">{p.productName}</div>
                                    {p.category && <div className="text-xs text-gray-400 mt-0.5">{p.category}</div>}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2" style={{ minWidth: 140 }}>
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                          className={tdInputCls}
                        />
                      </td>

                      {/* HSN/SAC */}
                      <td className="px-3 py-2" style={{ minWidth: 90 }}>
                        <input
                          type="text"
                          placeholder="HSN/SAC"
                          value={item.hsnSac}
                          onChange={e => updateLineItem(item.id, 'hsnSac', e.target.value)}
                          className={tdInputCls}
                        />
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.qty}
                          min={1}
                          onChange={e => updateLineItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                          className={`${tdInputCls} w-16 text-center`}
                        />
                      </td>

                      {/* Rate */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          min={0}
                          onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className={`${tdInputCls} w-24 text-center`}
                        />
                      </td>

                      {/* Discount */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.discount}
                          min={0}
                          max={100}
                          onChange={e => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className={`${tdInputCls} w-16 text-center`}
                        />
                      </td>

                      {/* Tax % */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.taxPercent}
                          min={0}
                          onChange={e => updateLineItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)}
                          className={`${tdInputCls} w-16 text-center`}
                        />
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white text-right whitespace-nowrap">
                        {fmt(amt)}
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Notes + GST Summary ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: notes textarea */}
            <textarea
              rows={7}
              placeholder="Additional notes..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className={`${inputCls} resize-none`}
            />

            {/* Right: GST summary table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">Subtotal</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">{fmt(subtotal)}</td>
                  </tr>

                  {gstSlabs.length > 0 ? (
                    gstSlabs.map(slab => (
                      <Fragment key={slab.rate}>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">CGST ({slab.rate / 2}%)</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">{fmt(slab.cgst)}</td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">SGST ({slab.rate / 2}%)</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">{fmt(slab.sgst)}</td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">CGST (9%)</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">0</td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">SGST (9%)</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">0</td>
                      </tr>
                    </>
                  )}

                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">Adjustment</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">{fmt(adjustment)}</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white uppercase tracking-wide">TOTAL</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustment input */}
          <div className="mt-5 max-w-xs">
            <label className={labelCls}>Adjustment</label>
            <input
              type="number"
              value={adjustment}
              onChange={e => setAdjustment(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        </div>

        {/* ── Additional Information ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h2>
          <div>
            <label className={labelCls}>Bank Details</label>
            <textarea
              rows={3}
              placeholder="Enter bank details..."
              value={bankDetails}
              onChange={e => setBankDetails(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Terms & Conditions</label>
            <textarea
              rows={3}
              placeholder="Validity: 7 days"
              value={termsConditions}
              onChange={e => setTermsConditions(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Customer Notes</label>
            <textarea
              rows={3}
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-6">
          <button className="flex items-center gap-2 px-5 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm">
            <Save size={16} />
            Save as Draft
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
            <Send size={16} />
            Save & Send
          </button>
          <button
            onClick={() => navigate('/sales/quotes')}
            className="px-5 py-2 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
