import { useNavigate } from 'react-router-dom';
import { Plus, Download, Archive, FileDown, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function SalesQuotesPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);

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
    <div className="max-w-[1280px]space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Create and manage client quotations</p>
          <h1 className="text-2xl font-bold text-gray-900">{quotes.length} Quotes</h1>
        </div>
        
        {/* 3-Dot Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={20} className="text-gray-600" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
              <button
                onClick={() => {
                  navigate('/sales/quotes/create');
                  setMenuOpen(false);
                }}
                className="w-full px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                New Quote
              </button>
              <button
                onClick={() => {
                  console.log('[v0] Export CSV clicked');
                  setMenuOpen(false);
                }}
                className="w-full px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <FileDown size={16} />
                Export CSV
              </button>
              <button
                onClick={() => {
                  console.log('[v0] Archived Quotes clicked');
                  setMenuOpen(false);
                }}
                className="w-full px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Archive size={16} />
                Archived Quotes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">QUOTE #</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">REFERENCE #</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CUSTOMER</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">VALID TILL</th>
                <th className="px-4 sm:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL</th>
                <th className="px-4 sm:px-6 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-2 text-sm text-gray-900">{quote.date}</td>
                  <td className="px-4 sm:px-6 py-2 text-sm font-medium">
                    <button
                      onClick={() => navigate(`/sales/quotes/${quote.id}`)}
                      className="text-blue-600 hover:underline font-semibold bg-yellow-100 px-2 py-1 rounded transition-colors"
                    >
                      {quote.quoteNumber}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-2 text-sm text-gray-600">{quote.referenceNumber}</td>
                  <td className="px-4 sm:px-6 py-2 text-sm text-gray-900">{quote.customer}</td>
                  <td className="px-4 sm:px-6 py-2 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-2 text-sm text-gray-600">{quote.validTill}</td>
                  <td className="px-4 sm:px-6 py-2 text-sm font-medium text-gray-900">{quote.total}</td>
                  <td className="px-4 sm:px-6 py-2 text-sm">
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <button
                          onClick={() => setRowMenuOpen(rowMenuOpen === quote.id ? null : quote.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                        
                        {rowMenuOpen === quote.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                            <button
                              onClick={() => {
                                navigate(`/sales/quotes/${quote.id}/edit`);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                console.log('[v0] Download clicked for', quote.quoteNumber);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Download size={16} />
                              Download
                            </button>
                            <button
                              onClick={() => {
                                console.log('[v0] Archive clicked for', quote.quoteNumber);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Archive size={16} />
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
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
