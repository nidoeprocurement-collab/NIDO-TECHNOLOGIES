import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Download, MoreVertical } from 'lucide-react';

export default function SalesQuotesPage() {
  const navigate = useNavigate();
  
  const quotes = [
    {
      id: 1,
      date: '2026-03-30',
      quoteNumber: 'EST-000126',
      referenceNumber: 'REF-EST-126',
      customer: 'Nido Technologies',
      status: 'ACCEPTED',
      validTill: '2026-04-30',
      total: 'INR 472'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Create and manage client quotations</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{quotes.length} Quotes</h1>
        </div>
        <button
          onClick={() => navigate('/sales/quotes/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Quote</span>
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">DATE</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">QUOTE #</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">REFERENCE #</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">CUSTOMER</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">VALID TILL</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">TOTAL</th>
                <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">{quote.date}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{quote.quoteNumber}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{quote.referenceNumber}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">{quote.customer}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{quote.validTill}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{quote.total}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                        <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                        <Download size={18} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
