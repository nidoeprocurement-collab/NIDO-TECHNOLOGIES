import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  generateInvoiceNumber,
  getInvoiceById,
  saveInvoice,
  type InvoiceLineItem,
  type InvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoiceStore';

const today = () => new Date().toISOString().split('T')[0];
const blankItem = (): InvoiceLineItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  description: '',
  quantity: 1,
  rate: 0,
  taxPercent: 18,
});

function fmt(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const existing = useMemo(() => (id ? getInvoiceById(id) : undefined), [id]);
  const [invoiceNumber] = useState(existing?.invoiceNumber || generateInvoiceNumber());
  const [clientName, setClientName] = useState(existing?.clientName || '');
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson || '');
  const [billingAddress, setBillingAddress] = useState(existing?.billingAddress || '');
  const [shippingAddress, setShippingAddress] = useState(existing?.shippingAddress || '');
  const [invoiceDate, setInvoiceDate] = useState(existing?.invoiceDate || today());
  const [dueDate, setDueDate] = useState(existing?.dueDate || today());
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status || 'Draft');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(existing?.lineItems || [blankItem()]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalTax = lineItems.reduce((sum, item) => sum + item.quantity * item.rate * item.taxPercent / 100, 0);
  const grandTotal = subtotal + totalTax;

  const updateItem = <K extends keyof InvoiceLineItem>(itemId: string, field: K, value: InvoiceLineItem[K]) => {
    setLineItems((items) => items.map((item) => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    if (!clientName.trim() || lineItems.every((item) => !item.description.trim())) return;
    const now = new Date().toISOString();
    const invoice: StoredInvoice = {
      id: existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      invoiceNumber,
      clientName: clientName.trim(),
      contactPerson,
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      invoiceDate,
      dueDate,
      status,
      lineItems,
      subtotal,
      totalTax,
      grandTotal,
      notes,
      payments: existing?.payments || [],
      activity: [
        ...(existing?.activity || []),
        { id: `${Date.now()}-activity`, date: today(), title: existing ? 'Invoice updated' : 'Invoice created', description: existing ? 'Invoice details were updated.' : 'Invoice was created as a draft.' },
      ],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    saveInvoice(invoice);
    navigate(`/sales/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales/invoices')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="text-sm text-gray-500 mb-1">Create and manage client invoices</p>
          <h1 className="text-2xl font-bold text-gray-900">{existing ? 'Edit Invoice' : 'Create New Invoice'}</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">Invoice Number<input value={invoiceNumber} readOnly className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900" /></label>
          <label className="text-sm text-gray-700">Invoice Date<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm text-gray-700">Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
          <label className="text-sm text-gray-700">Client Name *<input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm text-gray-700">Contact Person<input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm text-gray-700">Billing Address<textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm text-gray-700">Shipping Address<textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button onClick={() => setLineItems((items) => [...items, blankItem()])} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><Plus size={16} /> Add Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{['ITEM / DESCRIPTION', 'QTY', 'RATE (₹)', 'GST RATE', 'TAX (₹)', 'AMOUNT (₹)', ''].map((heading) => <th key={heading} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">{heading}</th>)}</tr></thead>
              <tbody>
                {lineItems.map((item) => {
                  const taxable = item.quantity * item.rate;
                  const tax = taxable * item.taxPercent / 100;
                  return <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2"><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Item description" className="w-full min-w-56 rounded border border-gray-300 px-2 py-1.5" /></td>
                    <td className="px-3 py-2"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value) || 1))} className="w-16 rounded border border-gray-300 px-2 py-1.5" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={item.rate} onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value) || 0)} className="w-24 rounded border border-gray-300 px-2 py-1.5" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={item.taxPercent} onChange={(e) => updateItem(item.id, 'taxPercent', Number(e.target.value) || 0)} className="w-20 rounded border border-gray-300 px-2 py-1.5" /></td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">₹{fmt(tax)}</td>
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">₹{fmt(taxable + tax)}</td>
                    <td className="px-3 py-2 text-center"><button onClick={() => setLineItems((items) => items.length === 1 ? items : items.filter((line) => line.id !== item.id))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
          <div><label className="text-sm text-gray-700">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Additional notes..." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label></div>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm"><tbody>
              <tr className="border-b border-gray-200"><td className="px-4 py-3 text-gray-600">Sub Total</td><td className="px-4 py-3 text-right">₹{fmt(subtotal)}</td></tr>
              <tr className="border-b border-gray-200"><td className="px-4 py-3 text-gray-600">Total GST</td><td className="px-4 py-3 text-right">₹{fmt(totalTax)}</td></tr>
              <tr><td className="px-4 py-3 font-bold text-gray-900">Total Payable</td><td className="px-4 py-3 text-right font-bold text-gray-900">₹{fmt(grandTotal)}</td></tr>
            </tbody></table>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <label className="text-sm text-gray-700">Status<select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="ml-2 rounded-lg border border-gray-300 px-3 py-2"><option>Draft</option><option>Sent</option><option>Pending</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></label>
          <div className="flex-1" />
          <button onClick={() => navigate('/sales/invoices')} className="px-5 py-2 text-gray-600 font-medium hover:text-gray-900">Cancel</button>
          <button onClick={handleSave} disabled={!clientName.trim() || lineItems.every((item) => !item.description.trim())} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"><Save size={16} /> Save Invoice</button>
        </div>
      </div>
    </div>
  );
}