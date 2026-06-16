import { Bell, Search, User, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 lg:ml-64">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Back & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search users, orders, vendors, clients, invoices..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none flex-1"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">System Owner</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-blue-700 transition-colors">
              A
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
