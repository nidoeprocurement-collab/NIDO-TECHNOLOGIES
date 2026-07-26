import { useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  generateInvoiceNumber,
  getInvoiceById,
  saveInvoice,
  type InvoiceLineItem,
  type InvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoiceStore';
import { getActiveQuotes } from '@/lib/quoteStore';
import { getActiveOrders } from '@/lib/salesOrderStore';
import { useMyOrders } from '@/contexts/MyOrdersContext';
import { getEffectiveTaxPctForCategory } from '@/lib/taxEngine';

const today = () => new Date().toISOString().split('T')[0];

const blankItem = (): InvoiceLineItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  description: '',
  itemDetails: '',
  hsnSac: '',
  quantity: 1,
  rate: 0,
  discount: 0,
  taxPercent: 18,
  taxType: 'IGST',
});

function fmt(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {text}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
const textareaCls = `${inputCls} resize-none`;

type ImportSource = 'order' | 'quotation' | 'salesorder';

const SOURCE_TABS: { key: ImportSource; label: string }[] = [
  { key: 'order',      label: 'Order'        },
  { key: 'quotation',  label: 'Quotation'    },
  { key: 'salesorder', label: 'Sales Order'  },
];

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const existing = useMemo(() => (id ? getInvoiceById(id) : undefined), [id]);

  // ── Data sources ─────────────────────────────────────────────────────────
  const { orders: myOrders } = useMyOrders();
  const quotations  = useMemo(() => getActiveQuotes(),  []);
  const salesOrders = useMemo(() => getActiveOrders(),  []);

  // ── Import-panel state ───────────────────────────────────────────────────
  const [importSource,    setImportSource]    = useState<ImportSource>('order');
  const [selectedRef,     setSelectedRef]     = useState('');
  const [importedRefLabel, setImportedRefLabel] = useState('');

  // ── Header fields ────────────────────────────────────────────────────────
  const [invoiceNumber] = useState(existing?.invoiceNumber || generateInvoiceNumber());
  const [invoiceDate,   setInvoiceDate]   = useState(existing?.invoiceDate   || today());
  const [dueDate,       setDueDate]       = useState(existing?.dueDate       || today());
  const [poReference,   setPoReference]   = useState(existing?.poReference   || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(existing?.placeOfSupply || '');
  const [status,        setStatus]        = useState<InvoiceStatus>(existing?.status || 'Draft');

  // ── Client fields ────────────────────────────────────────────────────────
  const [clientName,       setClientName]       = useState(existing?.clientName       || '');
  const [contactPerson,    setContactPerson]    = useState(existing?.contactPerson    || '');
  const [clientGstin,      setClientGstin]      = useState(existing?.clientGstin      || '');
  const [clientContact,    setClientContact]    = useState(existing?.clientContact    || '');
  const [billingAddress,   setBillingAddress]   = useState(existing?.billingAddress   || '');
  const [shippingAddress,  setShippingAddress]  = useState(existing?.shippingAddress  || '');
  const [shippingStateCode,setShippingStateCode]= useState(existing?.shippingStateCode|| '');
  const [shippingAttn,     setShippingAttn]     = useState(existing?.shippingAttn     || '');

  // ── Line items ───────────────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(existing?.lineItems || [blankItem()]);

  // ── Totals & charges ─────────────────────────────────────────────────────
  const [shippingCharges, setShippingCharges] = useState(existing?.shippingCharges ?? 0);
  const [adjustment,      setAdjustment]      = useState(existing?.adjustment      ?? 0);

  // ── Text sections ────────────────────────────────────────────────────────
  const [notes,           setNotes]           = useState(existing?.notes           || '');
  const [termsConditions, setTermsConditions] = useState(existing?.termsConditions || '');

  // ── Bank details ─────────────────────────────────────────────────────────
  const [bankName,        setBankName]        = useState(existing?.bankName        || '');
  const [bankAccountName, setBankAccountName] = useState(existing?.bankAccountName || '');
  const [bankAccountNo,   setBankAccountNo]   = useState(existing?.bankAccountNo   || '');
  const [bankIfsc,        setBankIfsc]        = useState(existing?.bankIfsc        || '');
  const [bankBranch,      setBankBranch]      = useState(existing?.bankBranch      || '');

  // ── Helpers ───────────────────────────────────────────────────────────────
  function applyLineItems(
    items: Array<{ name: string; description?: string; hsnSac?: string; qty: number; rate: number; discount?: number; taxPercent?: number }>
  ) {
    if (!items || items.length === 0) return;
    setLineItems(
      items.map((li) => ({
        id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: li.name         || '',
        itemDetails: li.description  || '',
        hsnSac:      li.hsnSac       || '',
        quantity:    li.qty          || 1,
        rate:        li.rate         || 0,
        discount:    li.discount     || 0,
        taxPercent:  li.taxPercent   ?? 18,
        taxType:     'IGST' as const,
      }))
    );
  }

  function clearImport() {
    setSelectedRef('');
    setImportedRefLabel('');
  }

  // ── Switch source tab (also resets selection) ────────────────────────────
  function handleSourceChange(src: ImportSource) {
    setImportSource(src);
    clearImport();
  }

  // ── Import from Order ────────────────────────────────────────────────────
  function importFromOrder(refId: string) {
    const order = myOrders.find((o) => o.id === refId);
    if (!order) return;

    setClientName(order.client || '');
    setContactPerson(order.requester || '');
    setPoReference(order.id);          // use the Order ID (ORD-000001) as reference
    if (order.deliveryAddress) {
      setBillingAddress(order.deliveryAddress);
      setShippingAddress(order.deliveryAddress);
    }

    if (order.cartItems && order.cartItems.length > 0) {
      setLineItems(
        order.cartItems.map((ci) => {
          // priceNum is tax-inclusive; derive the correct GST rate from the
          // item category, then back-calculate the pre-tax unit rate.
          const gstRate    = getEffectiveTaxPctForCategory(ci.category || '');
          const preTaxRate = gstRate > 0
            ? Math.round((ci.priceNum * 100 / (100 + gstRate)) * 100) / 100
            : (ci.priceNum || 0);
          return {
            id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            description: ci.name         || '',
            itemDetails: ci.specs?.join(', ') || '',
            hsnSac:      '',
            quantity:    ci.quantity     || 1,
            rate:        preTaxRate,
            discount:    0,
            taxPercent:  gstRate,
            taxType:     'IGST' as const,
          };
        })
      );
    }

    setImportedRefLabel(order.id);
  }

  // ── Import from Quotation ────────────────────────────────────────────────
  function importFromQuotation(refId: string) {
    const quote = quotations.find((q) => q.id === refId);
    if (!quote) return;

    setClientName(quote.clientName       || '');
    setContactPerson(quote.contactPerson || '');
    setClientGstin(quote.clientGstin     || '');
    setBillingAddress(quote.billingAddress  || '');
    setShippingAddress(quote.shippingAddress || quote.billingAddress || '');
    setPlaceOfSupply(quote.placeOfSupply   || '');
    setPoReference(quote.quoteNumber);
    if (quote.shippingCharges) setShippingCharges(quote.shippingCharges);
    if (quote.adjustment)      setAdjustment(quote.adjustment);
    if (quote.customerNotes)   setNotes(quote.customerNotes);
    if (quote.termsConditions) setTermsConditions(quote.termsConditions);

    applyLineItems(
      (quote.lineItems || []).map((li) => ({
        name:        li.name,
        description: li.description,
        hsnSac:      li.hsnSac,
        qty:         li.qty,
        rate:        li.rate,
        discount:    li.discount,
        taxPercent:  li.taxPercent,
      }))
    );

    setImportedRefLabel(quote.quoteNumber);
  }

  // ── Import from Sales Order ──────────────────────────────────────────────
  function importFromSalesOrder(refId: string) {
    const order = salesOrders.find((o) => o.id === refId);
    if (!order) return;

    setClientName(order.clientName       || '');
    setContactPerson(order.contactPerson || '');
    setClientGstin(order.clientGstin     || '');
    setBillingAddress(order.billingAddress  || '');
    setShippingAddress(order.shippingAddress || order.billingAddress || '');
    setPlaceOfSupply(order.placeOfSupply   || '');
    setPoReference(order.orderNumber);
    if (order.shippingCharges) setShippingCharges(order.shippingCharges);
    if (order.adjustment)      setAdjustment(order.adjustment);
    if (order.customerNotes)   setNotes(order.customerNotes);
    if (order.termsConditions) setTermsConditions(order.termsConditions);

    applyLineItems(
      (order.lineItems || []).map((li) => ({
        name:        li.name,
        description: li.description,
        hsnSac:      li.hsnSac,
        qty:         li.qty,
        rate:        li.rate,
        discount:    li.discount,
        taxPercent:  li.taxPercent,
      }))
    );

    setImportedRefLabel(order.orderNumber);
  }

  // ── Unified reference select handler ─────────────────────────────────────
  function handleRefSelect(refId: string) {
    setSelectedRef(refId);
    if (!refId) { setImportedRefLabel(''); return; }
    if (importSource === 'order')      importFromOrder(refId);
    if (importSource === 'quotation')  importFromQuotation(refId);
    if (importSource === 'salesorder') importFromSalesOrder(refId);
  }

  // ── Dropdown options per source ──────────────────────────────────────────
  const refOptions = useMemo(() => {
    if (importSource === 'order') {
      return myOrders
        .filter((o) => o.status !== 'Cancelled')
        .map((o) => ({
          id:    o.id,
          label: `${o.id} — ${o.client} (${o.totalAmount})`,
        }));
    }
    if (importSource === 'quotation') {
      return quotations.map((q) => ({
        id:    q.id,
        label: `${q.quoteNumber} — ${q.clientName} (₹${q.grandTotal.toLocaleString('en-IN')})`,
      }));
    }
    // salesorder
    return salesOrders.map((o) => ({
      id:    o.id,
      label: `${o.orderNumber} — ${o.clientName} (₹${o.grandTotal.toLocaleString('en-IN')})`,
    }));
  }, [importSource, myOrders, quotations, salesOrders]);

  // ── Computed totals ───────────────────────────────────────────────────────
  const grossSubtotal     = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalDiscount     = lineItems.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  const totalTaxableValue = grossSubtotal - totalDiscount;

  // GST slab breakdown (grouped by tax rate, same as quotes page)
  const gstSlabs = useMemo(() => {
    const map: Record<number, { taxable: number; cgst: number; sgst: number }> = {};
    for (const item of lineItems) {
      const taxable = Math.max(0, item.quantity * item.rate - (item.discount ?? 0));
      const rate    = item.taxPercent;
      if (!map[rate]) map[rate] = { taxable: 0, cgst: 0, sgst: 0 };
      map[rate].taxable += taxable;
      map[rate].cgst    += taxable * (rate / 2) / 100;
      map[rate].sgst    += taxable * (rate / 2) / 100;
    }
    return Object.entries(map)
      .filter(([, v]) => v.taxable > 0)
      .map(([rate, v]) => ({ rate: Number(rate), ...v }))
      .sort((a, b) => a.rate - b.rate);
  }, [lineItems]);

  const totalGst   = gstSlabs.reduce((s, sl) => s + sl.cgst + sl.sgst, 0);
  const grandTotal = totalTaxableValue + totalGst + shippingCharges + adjustment;

  const updateItem = <K extends keyof InvoiceLineItem>(
    itemId: string, field: K, value: InvoiceLineItem[K]
  ) => {
    setLineItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = () => {
    if (!clientName.trim() || lineItems.every((item) => !item.description.trim())) return;
    const now = new Date().toISOString();
    const invoice: StoredInvoice = {
      id: existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      invoiceNumber,
      clientName: clientName.trim(),
      contactPerson,
      clientGstin:      clientGstin      || undefined,
      clientContact:    clientContact     || undefined,
      billingAddress,
      shippingAddress:  shippingAddress   || billingAddress,
      shippingStateCode:shippingStateCode || undefined,
      shippingAttn:     shippingAttn      || undefined,
      invoiceDate,
      dueDate,
      poReference:    poReference    || undefined,
      placeOfSupply:  placeOfSupply  || undefined,
      status,
      lineItems,
      grossSubtotal,
      totalDiscount,
      subtotal:   totalTaxableValue,
      totalTax:   totalGst,
      shippingCharges,
      adjustment,
      grandTotal,
      notes,
      termsConditions: termsConditions || undefined,
      bankName:        bankName        || undefined,
      bankAccountName: bankAccountName || undefined,
      bankAccountNo:   bankAccountNo   || undefined,
      bankIfsc:        bankIfsc        || undefined,
      bankBranch:      bankBranch      || undefined,
      payments: existing?.payments || [],
      activity: [
        ...(existing?.activity || []),
        {
          id: `${Date.now()}-activity`,
          date: today(),
          title:       existing ? 'Invoice updated' : 'Invoice created',
          description: existing ? 'Invoice details were updated.' : 'Invoice was created as a draft.',
        },
      ],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    saveInvoice(invoice);
    navigate(`/sales/invoices/${invoice.id}`);
  };

  const sectionHead = (title: string) => (
    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide pb-2 border-b border-gray-100">
      {title}
    </h2>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales/invoices')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Create and manage client invoices</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {existing ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
        </div>
      </div>

      {/* ── Import from ── */}
      {!existing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ClipboardList size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 mb-0.5">Import from</p>
              <p className="text-xs text-blue-700 mb-4">
                Pick a source type, then select the reference number — all details will auto-fill below.
              </p>

              {/* ── Source type tabs ── */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {SOURCE_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSourceChange(key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      importSource === key
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Reference number dropdown ── */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[260px]">
                  <select
                    value={selectedRef}
                    onChange={(e) => handleRefSelect(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      {importSource === 'order'
                        ? '— Select an Order —'
                        : importSource === 'quotation'
                        ? '— Select a Quotation —'
                        : '— Select a Sales Order —'}
                    </option>
                    {refOptions.length === 0 ? (
                      <option disabled>No records found</option>
                    ) : (
                      refOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {selectedRef && (
                  <button
                    type="button"
                    onClick={() => { clearImport(); }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* ── Status messages ── */}
              {importedRefLabel && (
                <p className="mt-3 text-xs text-blue-700 font-medium">
                  ✓ Data from <span className="font-bold">{importedRefLabel}</span> imported — review and edit below before saving.
                </p>
              )}
              {refOptions.length === 0 && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-block">
                  {importSource === 'order'
                    ? 'No orders found. Create orders from the Shop or Procure section.'
                    : importSource === 'quotation'
                    ? 'No quotations found. Create one under Transactions → Sales → Quotes.'
                    : 'No sales orders found. Create one under Transactions → Sales → Orders.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 space-y-7">

        {/* ── Invoice Details ── */}
        <section className="space-y-4">
          {sectionHead('Invoice Details')}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Label text="Invoice Number">
              <input
                value={invoiceNumber}
                readOnly
                tabIndex={-1}
                className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed select-none`}
              />
            </Label>
            <Label text="Invoice Date">
              <input
                type="date" value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={inputCls}
              />
            </Label>
            <Label text="Due Date">
              <input
                type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </Label>
            <Label text="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className={inputCls}
              >
                <option>Draft</option><option>Sent</option><option>Pending</option>
                <option>Paid</option><option>Overdue</option><option>Cancelled</option>
              </select>
            </Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label text="Order / Quote Reference">
              <input
                value={poReference}
                onChange={(e) => setPoReference(e.target.value)}
                placeholder="e.g. SO-000001 or EST-000001"
                className={inputCls}
              />
            </Label>
            <Label text="Place of Supply">
              <input
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                placeholder="e.g. Telangana (36)"
                className={inputCls}
              />
            </Label>
          </div>
        </section>

        {/* ── Client Info ── */}
        <section className="space-y-4">
          {sectionHead('Client Information')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label text="Client Name *">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                className={inputCls}
              />
            </Label>
            <Label text="Contact Person">
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact person"
                className={inputCls}
              />
            </Label>
            <Label text="Client GSTIN">
              <input
                value={clientGstin}
                onChange={(e) => setClientGstin(e.target.value)}
                placeholder="e.g. 36AAACE9876B1ZS"
                className={inputCls}
              />
            </Label>
            <Label text="Client Contact Email">
              <input
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="e.g. accounts@client.com"
                className={inputCls}
              />
            </Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label text="Billing Address">
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                rows={3}
                placeholder="Full billing address"
                className={textareaCls}
              />
            </Label>
            <div className="space-y-3">
              <Label text="Shipping Address">
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  placeholder="Full shipping address (leave blank to use billing)"
                  className={textareaCls}
                />
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Label text="State Code">
                  <input
                    value={shippingStateCode}
                    onChange={(e) => setShippingStateCode(e.target.value)}
                    placeholder="e.g. 36 (Telangana)"
                    className={inputCls}
                  />
                </Label>
                <Label text="Attn">
                  <input
                    value={shippingAttn}
                    onChange={(e) => setShippingAttn(e.target.value)}
                    placeholder="e.g. Operations Team"
                    className={inputCls}
                  />
                </Label>
              </div>
            </div>
          </div>
        </section>

        {/* ── Line Items ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            {sectionHead('Line Items')}
            <button
              onClick={() => setLineItems((items) => [...items, blankItem()])}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm min-w-[1040px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Sl.No', 'ITEM / DESCRIPTION', 'HSN/SAC', 'QTY', 'RATE (₹)', 'DISC (₹)', 'TAXABLE (₹)', 'GST RATE', 'GST (₹)', 'AMOUNT (₹)', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const disc    = item.discount ?? 0;
                  const taxable = Math.max(0, item.quantity * item.rate - disc);
                  const gst     = taxable * (item.taxPercent / 100);
                  const amt     = taxable + gst;
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top">
                      {/* Sl.No */}
                      <td className="px-3 py-2 text-sm text-gray-500 text-center pt-3">{idx + 1}</td>
                      {/* Item / Description */}
                      <td className="px-3 py-2 min-w-[200px]">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item name"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-1"
                        />
                        <input
                          value={item.itemDetails || ''}
                          onChange={(e) => updateItem(item.id, 'itemDetails', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-500"
                        />
                      </td>
                      {/* HSN/SAC */}
                      <td className="px-3 py-2">
                        <input
                          value={item.hsnSac || ''}
                          onChange={(e) => updateItem(item.id, 'hsnSac', e.target.value)}
                          placeholder="HSN/SAC"
                          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      {/* Qty */}
                      <td className="px-3 py-2">
                        <input
                          type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
                        />
                      </td>
                      {/* Rate (₹) */}
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value) || 0)}
                          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
                        />
                      </td>
                      {/* Disc (₹) */}
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} value={item.discount ?? 0}
                          onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value) || 0)}
                          className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
                        />
                      </td>
                      {/* Taxable (₹) — computed */}
                      <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap pt-3">{fmt(taxable)}</td>
                      {/* GST Rate */}
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} max={100} value={item.taxPercent}
                          onChange={(e) => updateItem(item.id, 'taxPercent', Number(e.target.value) || 0)}
                          className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center"
                        />
                      </td>
                      {/* GST (₹) — computed */}
                      <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap pt-3">{fmt(gst)}</td>
                      {/* Amount (₹) */}
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right whitespace-nowrap pt-3">{fmt(amt)}</td>
                      {/* Delete */}
                      <td className="px-3 py-2 text-center pt-2.5">
                        <button
                          onClick={() =>
                            setLineItems((items) =>
                              items.length === 1 ? items : items.filter((l) => l.id !== item.id)
                            )
                          }
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Summary ── */}
        <section className="space-y-4">
          {/* Summary table — right-aligned, matches quotes page */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: additional notes placeholder (editable inline) */}
            <div />
            {/* Right: summary table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 text-gray-600">Gross Subtotal</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">₹{fmt(grossSubtotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-900">Item Level Discounts (-)</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">₹ - {fmt(totalDiscount)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-900">Total Taxable Value</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">₹{fmt(totalTaxableValue)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 text-gray-600">
                      Total GST{gstSlabs.length > 0 ? ` (${gstSlabs.map(s => `${s.rate}%`).join(', ')})` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900">₹{fmt(totalGst)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 text-gray-600">Shipping &amp; Handling Charges</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">₹{fmt(shippingCharges)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 text-gray-600">Round Off Adjustment</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">
                      {adjustment < 0 ? '-' : ''}₹{fmt(Math.abs(adjustment))}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-4 py-3 font-bold text-gray-900">Total Payable</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping + Round Off inputs below the table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <Label text="Shipping & Handling Charges (₹)">
              <input
                type="number" min={0} value={shippingCharges}
                onChange={(e) => setShippingCharges(Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Label>
            <Label text="Round Off Adjustment (₹)">
              <input
                type="number" value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value) || 0)}
                placeholder="e.g. -0.50 or 0.50"
                className={inputCls}
              />
            </Label>
          </div>
        </section>

        {/* ── Terms & Notes ── */}
        <section className="space-y-4">
          {sectionHead('Terms & Notes')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label text="Terms & Conditions">
              <textarea
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                rows={5}
                placeholder={"1. Payment due within 15 days.\n2. Late payments attract 1.5% monthly interest."}
                className={textareaCls}
              />
            </Label>
            <Label text="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Additional notes visible on the invoice..."
                className={textareaCls}
              />
            </Label>
          </div>
        </section>

        {/* ── Bank Remittance ── */}
        <section className="space-y-4">
          {sectionHead('Bank Remittance Details')}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Label text="Bank Name">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank Ltd"
                className={inputCls}
              />
            </Label>
            <Label text="Account Name">
              <input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Account holder name"
                className={inputCls}
              />
            </Label>
            <Label text="Account Number">
              <input
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="e.g. 50200012345678"
                className={inputCls}
              />
            </Label>
            <Label text="IFSC Code">
              <input
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                placeholder="e.g. HDFC0001234"
                className={inputCls}
              />
            </Label>
            <Label text="Branch">
              <input
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="e.g. Guindy Branch, Chennai"
                className={inputCls}
              />
            </Label>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
          <div className="flex-1" />
          <button
            onClick={() => navigate('/sales/invoices')}
            className="px-5 py-2 text-gray-600 font-medium hover:text-gray-900 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!clientName.trim() || lineItems.every((item) => !item.description.trim())}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} /> Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
