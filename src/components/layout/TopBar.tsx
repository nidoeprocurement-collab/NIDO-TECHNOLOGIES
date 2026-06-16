import { Bell, Search, User, LogOut, ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Route to label mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'shop': 'Shop',
  'services': 'Services',
  'support': 'Support',
  'clients': 'Clients',
  'vendors': 'Vendors',
  'orders': 'Orders',
  'reports': 'Reports',
  'expenses': 'Expenses',
  'invoices': 'Invoices',
  'bills': 'Bills',
  'payment-receipts': 'Payment Receipts',
  'payments-made': 'Payments Made',
  'purchase-orders': 'Purchase Orders',
  'vendor-credits': 'Vendor Credits',
  'recurring-invoices': 'Recurring Invoices',
  'recurring-expenses': 'Recurring Expenses',
  'delivery-challans': 'Delivery Challans',
  'credit-notes': 'Credit Notes',
  'eway-bills': 'e-Way Bills',
  'departments': 'Departments',
  'roles': 'Roles',
  'user-invitations': 'Invitations',
  'audit-logs': 'Audit Logs',
  'sla-overview': 'SLA Overview',
  'configuration': 'Configuration',
  'categories': 'Categories',
  'onboarding': 'Onboarding',
  'add': 'Add New',
  'contracts': 'Contracts',
  'dashboard/vendor': 'Vendor Dashboard',
  'dashboard/sla': 'SLA Overview',
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(s => s && s !== 'app');
  const breadcrumbs: Array<{ label: string; path: string; isActive: boolean }> = [];

  // Add home
  breadcrumbs.push({
    label: 'Home',
    path: '/dashboard',
    isActive: segments.length === 0,
  });

  // Build breadcrumb trail
  let cumulativePath = '';
  segments.forEach((segment, index) => {
    cumulativePath += `/${segment}`;
    const isActive = index === segments.length - 1;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      path: cumulativePath,
      isActive,
    });
  });

  return breadcrumbs;
}

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 lg:ml-64">
      {/* Top section - Search bar and actions */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4 border-b border-gray-100">
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

      {/* Breadcrumb section */}
      <div className="h-10 px-4 md:px-6 flex items-center gap-2 bg-gray-50">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {index === 0 ? (
              <button
                onClick={() => navigate(crumb.path)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="Go to Dashboard"
              >
                <Home size={16} />
              </button>
            ) : (
              <>
                <ChevronRight size={16} className="text-gray-400" />
                <button
                  onClick={() => navigate(crumb.path)}
                  className={`text-sm px-2 py-1 rounded transition-colors ${
                    crumb.isActive
                      ? 'text-blue-600 font-medium bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {crumb.label}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
