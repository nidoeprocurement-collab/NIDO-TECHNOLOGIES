import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Send, Share2, FileText, MoreVertical, Save } from 'lucide-react';
import { useState } from 'react';

export default function SalesQuoteDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');

  const quote = {
    id: 1,
    quoteNumber: 'EST-000126',
    referenceNumber: 'REF-EST-126',
    status: 'ACCEPTED',
    customer: 'Nido Technologies',
    customerLocation: 'Karnataka (29)',
    total: 'INR 472',
    date: '2026-03-30',
    validTill: '2026-04-30',
    quoteType: 'Invoice',
    createdDate: '2026-03-30',
    salesperson: 'Mark Adams',
    placeOfSupply: 'Karnataka (29)',
    emailRecipients: 'pavaniddo@gmail.com',
    pdfTemplate: 'Simple',
    lineItems: [
      {
        id: 1,
        itemName: '3D Design Model',
        description: '3D model mould designs for handle',
        hsn: '9983',
        qty: 1,
        rate: 400,
        discount: 0,
        tax: 18,
        amount: 400
      }
    ],
    subtotal: 400,
    cgst: 36,
    sgst: 36,
    adjustment: 0,
    finalTotal: 472,
    billTo: {
      name: 'Nido Technologies',
      address: 'Nido Technologies, 4/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru'
    },
    shipTo: {
      name: 'Nido Technologies',
      address: 'Nido Technologies, 4/1 2nd Floor 10th Cross, Wilson Garden, Bengaluru'
    },
    notes: {
      bankDetails: 'BANK NAME: IDFC\nA/c Payee Name: Nido Technologies\nBank A/C No.: 00281864611'
    },
    termsConditions: 'Payment of 50% post approval of quote, 30% against trial component and 20% before delivery.',
    bankDetails: 'BANK NAME: IDFC\nA/c Payee Name: Nido Technologies\nBank IFSC Code: IDF0080154',
    activities: [
      {
        id: 1,
        type: 'CREATED',
        description: `Quote ${this?.quoteNumber || 'EST-000126'} created`,
        timestamp: '3/30/2026, 2:30:00 PM',
        user: 'System Owner'
      },
      {
        id: 2,
        type: 'CONVERTED',
        description: `Quote ${this?.quoteNumber || 'EST-000126'} converted to Sales Order SO-00001`,
        timestamp: '3/30/2026, 4:30:00 PM',
        user: 'System Owner'
      }
    ]
  };

  const activities = [
    {
      id: 1,
      type: 'CREATED',
      description: `Quote ${quote.quoteNumber} created`,
      timestamp: '3/30/2026, 2:30:00 PM',
      user: 'System Owner'
    },
    {
      id: 2,
      type: 'CONVERTED',
      description: `Quote ${quote.quoteNumber} converted to Sales Order SO-00001`,
      timestamp: '3/30/2026, 4:30:00 PM',
      user: 'System Owner'
    }
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/sales/quotes')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Quote</h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold uppercase">
                {quote.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customer: {quote.customer}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total: {quote.total}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>ACCEPTED</option>
            <option>PENDING</option>
            <option>REJECTED</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Send size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <FileText size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Quote Details
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Activity Logs
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Quote Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide mb-2">CUSTOMER</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{quote.customer}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quote.customerLocation}</p>
            </div>

            {/* Document Window */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide mb-2">DOCUMENT WINDOW</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{quote.date}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valid till {quote.validTill}</p>
            </div>

            {/* Line Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide mb-2">LINE ITEMS</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{quote.lineItems.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quote.total} total quote value</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quote Type</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.quoteType}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quote Number</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.quoteNumber}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Creation Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.createdDate}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Salesperson</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.salesperson}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reference #</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.referenceNumber}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Place of Supply</p>
              <p className="font-semibold text-gray-900 dark:text-white">{quote.placeOfSupply}</p>
            </div>
          </div>

          {/* Email Recipients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email Recipients</p>
            <p className="font-semibold text-gray-900 dark:text-white">{quote.emailRecipients}</p>
          </div>

          {/* Bill To and Ship To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide font-semibold mb-3">BILL TO</h3>
              <p className="font-bold text-gray-900 dark:text-white mb-1">{quote.billTo.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quote.billTo.address}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide font-semibold mb-3">SHIP TO</h3>
              <p className="font-bold text-gray-900 dark:text-white mb-1">{quote.shipTo.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quote.shipTo.address}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 dark:bg-gray-950">
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Item Name</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Description</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">HSN/SAC</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Qty</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Rate</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Discount</th>
                    <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Tax %</th>
                    <th className="px-4 sm:px-6 py-2 text-right text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white font-medium">{item.itemName}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-600 dark:text-gray-400">{item.hsn}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white">{item.qty}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white">{item.rate}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white">{item.discount}</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white">{item.tax}%</td>
                      <td className="px-4 sm:px-6 py-2 text-sm text-gray-900 dark:text-white text-right font-medium">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CGST (9%)</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.cgst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">SGST (9%)</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.sgst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Adjustment</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.adjustment}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{quote.finalTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide font-semibold mb-3">NOTES</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{quote.notes.bankDetails}</p>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide font-semibold mb-3">TERMS & CONDITIONS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quote.termsConditions}</p>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wide font-semibold mb-3">BANK DETAILS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{quote.bankDetails}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-6">
              <p className="text-xs uppercase font-semibold text-gray-700 dark:text-gray-300 tracking-wide mb-2">{activity.type}</p>
              <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium mb-2">{activity.description}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{activity.timestamp} by {activity.user}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
