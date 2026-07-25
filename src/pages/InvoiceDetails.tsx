import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Edit, Plus, Receipt, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoiceById, saveInvoice, type StoredInvoice } from '@/lib/invoiceStore';
import { downloadInvoicePdf } from '@/lib/invoicePdf';

function fmt(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const statusStyles: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<StoredInvoice | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'payments' | 'activity'>('overview');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    if (id) setInvoice(getInvoiceById(id) || null);
  }, [id]);

  if (!invoice) return <div className="space-y-6"><button onClick={() => navigate('/sales/invoices')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={16} /> Back to Invoices</button><h1 className="text-xl font-bold text-gray-900">Invoice not found</h1></div>;

  const recordPayment = () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    const paymentDate = new Date().toISOString().split('T')[0];
    const nextPaid = [...invoice.payments, { id: `${Date.now()}-payment`, date: paymentDate, amount, method: paymentMethod, reference: paymentReference || '—' }];
    const paidTotal = nextPaid.reduce((sum, payment) => sum + payment.amount, 0);
    const updated: StoredInvoice = {
      ...invoice,
      payments: nextPaid,
      status: paidTotal >= invoice.grandTotal ? 'Paid' : 'Pending',
      activity: [...invoice.activity, { id: `${Date.now()}-activity`, date: paymentDate, title: 'Payment received', description: `${fmt(amount)} received by ${paymentMethod}.` }],
      updatedAt: new Date().toISOString(),
    };
    saveInvoice(updated);
    setInvoice(updated);
    setPaymentAmount('');
    setPaymentReference('');
    setShowPaymentForm(false);
  };

  const tabs = [
    ['overview', 'Overview'],
    ['items', `Line Items (${invoice.lineItems.length})`],
    ['payments', `Payments (${invoice.payments.length})`],
    ['activity', 'Activity'],
  ] as const;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-start justify-between gap-3 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2 hover:bg-gray-100 rounded-lg mt-1"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><div className="flex items-center gap-3 mb-2"><h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}>{invoice.status}</span></div><p className="text-sm text-gray-600">Customer: {invoice.clientName}</p><p className="text-sm text-gray-600">Total: ₹{fmt(invoice.grandTotal)}</p></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => navigate(`/sales/invoices/${invoice.id}/edit`)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"><Edit size={16} /> Edit</button>
          <button onClick={() => downloadInvoicePdf(invoice)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Download size={16} /> Download PDF</button>
          <button onClick={() => { const updated = { ...invoice, status: 'Sent' as const, activity: [...invoice.activity, { id: `${Date.now()}-activity`, date: new Date().toISOString().split('T')[0], title: 'Invoice sent', description: 'Invoice marked as sent to the client.' }] }; saveInvoice(updated); setInvoice(updated); }} className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"><Send size={16} /> Mark Sent</button>
        </div>
      </div>

      <div className="flex gap-5 border-b border-gray-200 overflow-x-auto">
        {tabs.map(([value, label]) => <button key={value} onClick={() => setActiveTab(value)} className={`pb-3 px-1 font-medium text-sm whitespace-nowrap ${activeTab === value ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>)}
      </div>

      {activeTab === 'overview' && <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 tracking-wide mb-2">CUSTOMER</p><p className="text-lg font-bold text-gray-900">{invoice.clientName}</p><p className="text-sm text-gray-500 mt-1">{invoice.contactPerson || 'No contact person'}</p></div>
          <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 tracking-wide mb-2">INVOICE WINDOW</p><p className="text-lg font-bold text-gray-900">{invoice.invoiceDate}</p><p className="text-sm text-gray-500">Due {invoice.dueDate}</p></div>
          <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 tracking-wide mb-2">LINE ITEMS</p><p className="text-lg font-bold text-gray-900">{invoice.lineItems.length}</p><p className="text-sm text-gray-500">₹{fmt(invoice.grandTotal)} total</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white rounded-lg border border-gray-200 p-6"><p className="text-xs uppercase text-gray-500 tracking-wide font-semibold mb-3">BILL TO</p><p className="font-bold text-gray-900 mb-1">{invoice.clientName}</p><p className="text-sm text-gray-600 whitespace-pre-line">{invoice.billingAddress || 'No billing address'}</p></div><div className="bg-white rounded-lg border border-gray-200 p-6"><p className="text-xs uppercase text-gray-500 tracking-wide font-semibold mb-3">SHIP TO</p><p className="font-bold text-gray-900 mb-1">{invoice.clientName}</p><p className="text-sm text-gray-600 whitespace-pre-line">{invoice.shippingAddress || invoice.billingAddress || 'No shipping address'}</p></div></div>
        {invoice.notes && <div className="bg-white rounded-lg border border-gray-200 p-6"><p className="text-xs uppercase text-gray-500 tracking-wide font-semibold mb-3">NOTES</p><p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p></div>}
      </div>}

      {activeTab === 'items' && <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">{['SL.NO', 'ITEM / DESCRIPTION', 'QTY', 'RATE (₹)', 'TAXABLE (₹)', 'GST', 'TAX (₹)', 'AMOUNT (₹)'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">{heading}</th>)}</tr></thead><tbody>{invoice.lineItems.map((item, index) => { const taxable = item.quantity * item.rate; const tax = taxable * item.taxPercent / 100; return <tr key={item.id} className="border-b border-gray-100"><td className="px-4 py-3 text-gray-500">{index + 1}</td><td className="px-4 py-3 font-medium text-gray-900">{item.description}</td><td className="px-4 py-3 text-center">{item.quantity}</td><td className="px-4 py-3 text-right">{fmt(item.rate)}</td><td className="px-4 py-3 text-right">{fmt(taxable)}</td><td className="px-4 py-3 text-center">{item.taxPercent}%</td><td className="px-4 py-3 text-right">{fmt(tax)}</td><td className="px-4 py-3 text-right font-medium">{fmt(taxable + tax)}</td></tr>; })}</tbody></table></div></div>
        <div className="flex justify-end"><div className="w-full sm:w-96 bg-white rounded-lg border border-gray-200 overflow-hidden"><table className="w-full text-sm"><tbody><tr className="border-b border-gray-200"><td className="px-4 py-3 text-gray-600">Sub Total</td><td className="px-4 py-3 text-right">₹{fmt(invoice.subtotal)}</td></tr><tr className="border-b border-gray-200"><td className="px-4 py-3 text-gray-600">Total GST</td><td className="px-4 py-3 text-right">₹{fmt(invoice.totalTax)}</td></tr><tr><td className="px-4 py-3 font-bold text-gray-900">Total Payable</td><td className="px-4 py-3 text-right font-bold text-gray-900">₹{fmt(invoice.grandTotal)}</td></tr></tbody></table></div></div>
      </div>}

      {activeTab === 'payments' && <div className="space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-gray-900">Payment history</h2><p className="text-sm text-gray-500">Track payments received against this invoice.</p></div><button onClick={() => setShowPaymentForm((value) => !value)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Record Payment</button></div>
        {showPaymentForm && <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"><input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Amount" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Card</option><option>Cheque</option></select><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Reference" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /><button onClick={recordPayment} className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium">Save Payment</button></div>}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">{invoice.payments.length === 0 ? <div className="py-14 text-center text-gray-500"><Receipt size={28} className="mx-auto mb-2 text-gray-300" />No payments recorded yet.</div> : <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">DATE</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">METHOD</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">REFERENCE</th><th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">AMOUNT</th></tr></thead><tbody>{invoice.payments.map((payment) => <tr key={payment.id} className="border-b border-gray-100"><td className="px-4 py-3 text-gray-600">{payment.date}</td><td className="px-4 py-3 text-gray-900">{payment.method}</td><td className="px-4 py-3 text-gray-600">{payment.reference}</td><td className="px-4 py-3 text-right font-medium">₹{fmt(payment.amount)}</td></tr>)}</tbody></table>}</div>
      </div>}

      {activeTab === 'activity' && <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">{invoice.activity.length === 0 ? <div className="py-14 text-center text-gray-500">No activity recorded yet.</div> : invoice.activity.slice().reverse().map((event) => <div key={event.id} className="px-6 py-4 flex gap-4"><div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Receipt size={16} /></div><div><p className="font-medium text-gray-900">{event.title}</p><p className="text-sm text-gray-600 mt-1">{event.description}</p><p className="text-xs text-gray-400 mt-1">{event.date}</p></div></div>)}</div>}
    </div>
  );
}