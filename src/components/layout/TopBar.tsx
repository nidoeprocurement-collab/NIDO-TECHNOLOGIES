import { Bell, Search, User, LogOut } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 z-20 lg:ml-64">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none flex-1"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-300">Admin User</p>
              <p className="text-xs text-gray-500">System Administrator</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
              <User size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
