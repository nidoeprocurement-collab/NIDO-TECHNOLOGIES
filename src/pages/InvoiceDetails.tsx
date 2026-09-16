import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Edit, Plus, Receipt, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoiceById, saveInvoice, type StoredInvoice } from '@/lib/invoiceStore';
import { downloadInvoicePdf, generateInvoicePdfBase64 } from '@/lib/invoicePdf';
import { sendEmail } from '@/lib/emailApi';
import { useI18n } from '@/i18n/I18nProvider';
import { formatCurrency } from '@/lib/formatters';
import { getAvailabilityLabel } from '@/lib/productCommercialTerms';

function fmt(value: number) {
  return formatCurrency(value);
}

const statusStyles: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  'Proforma Invoice': 'bg-purple-100 text-purple-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
};

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function InvoiceDetails() {
  const { currencySymbol } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<StoredInvoice | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'payments' | 'activity'>('overview');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState('');

  useEffect(() => {
    if (id) setInvoice(getInvoiceById(id) || null);
  }, [id]);

  if (!invoice) return (
    <div className="space-y-6">
      <button onClick={() => navigate('/sales/invoices')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to Invoices
      </button>
      <h1 className="text-xl font-bold text-gray-900">Invoice not found</h1>
    </div>
  );

  const recordPayment = () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    const paymentDate = new Date().toISOString().split('T')[0];
    const nextPaid = [...invoice.payments, { id: `${Date.now()}-payment`, date: paymentDate, amount, method: paymentMethod, reference: paymentReference || '—' }];
    const paidTotal = nextPaid.reduce((sum, p) => sum + p.amount, 0);
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

  const markSentAndEmail = async () => {
    if (sending) return;
    setSending(true);
    setSendMessage('');
    const recipients = Array.from(new Set(
      (invoice.clientContacts?.length
        ? invoice.clientContacts
        : (invoice.clientContact || '').split(','))
        .map((email) => email.trim())
        .filter(Boolean),
    ));
    const today = new Date().toISOString().split('T')[0];
    try {
      let sentCount = 0;
      if (recipients.length > 0) {
        const pdfDataUri = await generateInvoicePdfBase64(invoice);
        const pdfBase64 = pdfDataUri.includes(',')
          ? pdfDataUri.slice(pdfDataUri.indexOf(',') + 1)
          : pdfDataUri;
        const results = await Promise.all(recipients.map((to) => sendEmail({
          templateKey: 'invoice_generated',
          to,
          variables: {
            client_name: invoice.clientName,
            invoice_number: invoice.invoiceNumber,
            amount: invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            due_date: invoice.dueDate,
            portal_url: `${window.location.origin}/sales/invoices/${invoice.id}`,
          },
          attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBase64 }],
          triggerModule: 'invoice_details',
        })));
        sentCount = results.filter((result) => result.success && result.data?.success !== false).length;
      }

      const updated: StoredInvoice = {
        ...invoice,
        status: 'Sent',
        activity: [
          ...invoice.activity,
          {
            id: `${Date.now()}-activity`,
            date: today,
            title: recipients.length > 0 ? 'Invoice sent' : 'Invoice marked sent',
            description: recipients.length > 0
              ? `Invoice emailed to ${recipients.join(', ')}.`
              : 'Invoice was marked as sent; no recipient email was configured.',
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      saveInvoice(updated);
      setInvoice(updated);
      setSendMessage(
        recipients.length === 0
          ? 'Invoice marked as sent. Add a recipient email to send it by email.'
          : sentCount === recipients.length
            ? `Invoice sent to ${recipients.join(', ')}.`
            : `Invoice saved as sent, but only ${sentCount} of ${recipients.length} email(s) were accepted.`,
      );
    } catch {
      setSendMessage('Invoice was not emailed. Check the email service and try again.');
    } finally {
      setSending(false);
    }
  };

  const grossSubtotal = invoice.grossSubtotal ?? invoice.subtotal;
  const totalDiscount = invoice.totalDiscount ?? 0;
  const shippingCharges = invoice.shippingCharges ?? 0;
  const adjustment = invoice.adjustment ?? 0;

  return (
    <div className="space-y-5 pb-6">
      {/* Header card */}
      <div className="flex items-start justify-between gap-3 bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}>{invoice.status}</span>
            </div>
            <p className="text-sm text-gray-600">Customer: <span className="font-medium text-gray-900">{invoice.clientName}</span></p>
            {invoice.poReference && <p className="text-sm text-gray-500">PO Reference: {invoice.poReference}</p>}
            <p className="text-sm text-gray-600 mt-0.5">Total: <span className="font-semibold text-gray-900">{fmt(invoice.grandTotal)}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => navigate(`/sales/invoices/${invoice.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={() => { downloadInvoicePdf(invoice); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            onClick={markSentAndEmail}
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Send size={16} /> {sending ? 'Sending…' : 'Send Invoice'}
          </button>
        </div>
      </div>
      {sendMessage && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {sendMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-5 border-b border-gray-200 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`pb-3 px-1 font-medium text-sm whitespace-nowrap ${activeTab === value ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoCard label="Customer">
              <p className="text-base font-bold text-gray-900 leading-tight">{invoice.clientName}</p>
              {invoice.contactPerson && <p className="text-sm text-gray-500 mt-1">{invoice.contactPerson}</p>}
            </InfoCard>
            <InfoCard label="Invoice Window">
              <p className="text-base font-bold text-gray-900">{invoice.invoiceDate}</p>
              <p className="text-sm text-gray-500 mt-1">Due {invoice.dueDate}</p>
            </InfoCard>
            <InfoCard label="Amount">
              <p className="text-base font-bold text-gray-900">{fmt(invoice.grandTotal)}</p>
              <p className="text-sm text-gray-500 mt-1">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</p>
            </InfoCard>
            <InfoCard label="References">
              {invoice.poReference && <p className="text-sm font-medium text-gray-900">PO: {invoice.poReference}</p>}
              {invoice.placeOfSupply && <p className="text-sm text-gray-500 mt-1">{invoice.placeOfSupply}</p>}
              {!invoice.poReference && !invoice.placeOfSupply && <p className="text-sm text-gray-400">—</p>}
            </InfoCard>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-3">BILLED TO</p>
              <p className="font-bold text-gray-900 mb-1">{invoice.clientName}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.billingAddress || 'No billing address'}</p>
              {invoice.clientGstin && <p className="text-sm text-gray-600 mt-1">GSTIN: <span className="font-medium">{invoice.clientGstin}</span></p>}
              {invoice.clientContact && <p className="text-sm text-gray-600 mt-0.5">Contact: {invoice.clientContact}</p>}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-3">SHIPPED TO</p>
              <p className="font-bold text-gray-900 mb-1">{invoice.clientName}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.shippingAddress || invoice.billingAddress || 'No shipping address'}</p>
              {invoice.shippingStateCode && <p className="text-sm text-gray-600 mt-1">State Code: {invoice.shippingStateCode}</p>}
              {invoice.shippingAttn && <p className="text-sm text-gray-600 mt-0.5">Attn: {invoice.shippingAttn}</p>}
            </div>
          </div>

          {/* Terms & Bank side by side */}
          {(invoice.termsConditions || invoice.bankName || invoice.bankAccountNo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {invoice.termsConditions && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-3">TERMS & CONDITIONS</p>
                  <ol className="space-y-1">
                    {invoice.termsConditions.split('\n').filter(Boolean).map((term, i) => (
                      <li key={i} className="text-sm text-gray-600">{i + 1}. {term}</li>
                    ))}
                  </ol>
                </div>
              )}
              {(invoice.bankName || invoice.bankAccountNo) && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-3">BANK REMITTANCE DETAILS</p>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {invoice.bankName && <p><span className="font-medium text-gray-700">Bank:</span> {invoice.bankName}</p>}
                    {invoice.bankAccountName && <p><span className="font-medium text-gray-700">Account Name:</span> {invoice.bankAccountName}</p>}
                    {invoice.bankAccountNo && <p><span className="font-medium text-gray-700">Account No:</span> {invoice.bankAccountNo}</p>}
                    {invoice.bankIfsc && <p><span className="font-medium text-gray-700">IFSC:</span> {invoice.bankIfsc}</p>}
                    {invoice.bankBranch && <p><span className="font-medium text-gray-700">Branch:</span> {invoice.bankBranch}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {invoice.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs uppercase text-gray-400 tracking-wide font-semibold mb-3">NOTES</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Line Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['#', 'ITEM / DESCRIPTION', 'HSN/SAC', 'QTY', `RATE (${currencySymbol})`, `DISC (${currencySymbol})`, `TAXABLE (${currencySymbol})`, 'GST RATE', `GST (${currencySymbol})`, `AMOUNT (${currencySymbol})`].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => {
                    const disc = item.discount ?? 0;
                    const taxable = Math.max(0, item.quantity * item.rate - disc);
                    const tax = taxable * (item.taxPercent / 100);
                    return (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="px-3 py-3 text-gray-400 text-center">{index + 1}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900">{item.description}</p>
                          {item.itemDetails && <p className="text-xs text-gray-500 mt-0.5">{item.itemDetails}</p>}
                          {item.commercialTerms && (
                            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gray-500 leading-tight">
                              <span>Pricing Model: <strong className="text-gray-700">{item.commercialTerms.pricingModel}</strong></span>
                              <span>MOQ / Min Qty: <strong className="text-gray-700">{item.commercialTerms.moqLabel}</strong></span>
                              <span>Lead Time / SLA: <strong className="text-gray-700">{item.commercialTerms.leadTimePrimary}{item.commercialTerms.leadTimeSecondary ? ` · ${item.commercialTerms.leadTimeSecondary}` : ""}</strong></span>
                              <span>Availability: <strong className={item.commercialTerms.availabilityStatus === "Out of Stock" ? "text-red-600" : "text-emerald-600"}>{getAvailabilityLabel(item.commercialTerms)}</strong></span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{item.hsnSac || '—'}</td>
                        <td className="px-3 py-3 text-center">{item.quantity}</td>
                        <td className="px-3 py-3 text-right">{fmt(item.rate)}</td>
                        <td className="px-3 py-3 text-right text-gray-500">{fmt(disc)}</td>
                        <td className="px-3 py-3 text-right">{fmt(taxable)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-900">{item.taxPercent}%</span>
                          {item.taxType && <span className="block text-xs text-gray-400">{item.taxType}</span>}
                        </td>
                        <td className="px-3 py-3 text-right">{fmt(tax)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-900">{fmt(taxable + tax)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-96 bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-500">Gross Subtotal</td>
                    <td className="px-4 py-2.5 text-right">{fmt(grossSubtotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-500">Item Level Discounts (−)</td>
                    <td className="px-4 py-2.5 text-right">−{fmt(totalDiscount)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-800">Total Taxable Value</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmt(invoice.subtotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-500">Total GST</td>
                    <td className="px-4 py-2.5 text-right">{fmt(invoice.totalTax)}</td>
                  </tr>
                  {shippingCharges > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-500">Shipping & Handling</td>
                      <td className="px-4 py-2.5 text-right">{fmt(shippingCharges)}</td>
                    </tr>
                  )}
                  {adjustment !== 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-500">Round Off Adjustment</td>
                    <td className="px-4 py-2.5 text-right">{adjustment < 0 ? '−' : ''}{fmt(Math.abs(adjustment))}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 font-bold text-gray-900">Total Payable</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(invoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payment history</h2>
              <p className="text-sm text-gray-500">Track payments received against this invoice.</p>
            </div>
            <button onClick={() => setShowPaymentForm((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              <Plus size={16} /> Record Payment
            </button>
          </div>
          {showPaymentForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Card</option><option>Cheque</option>
              </select>
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Reference" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={recordPayment} className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium">Save Payment</button>
            </div>
          )}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {invoice.payments.length === 0 ? (
              <div className="py-14 text-center text-gray-500">
                <Receipt size={28} className="mx-auto mb-2 text-gray-300" />
                No payments recorded yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">METHOD</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">REFERENCE</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">{p.date}</td>
                      <td className="px-4 py-3 text-gray-900">{p.method}</td>
                      <td className="px-4 py-3 text-gray-600">{p.reference}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {invoice.activity.length === 0 ? (
            <div className="py-14 text-center text-gray-500">No activity recorded yet.</div>
          ) : (
            invoice.activity.slice().reverse().map((event) => (
              <div key={event.id} className="px-6 py-4 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{event.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
