import { useState } from 'react';
import { Bell, Search, LogOut, ArrowLeft, ChevronRight, Home, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  // Drop generic wrapper segments ('app' for admin routes, 'portal' for
  // client portal routes) so breadcrumbs read as plain page names.
  const segments = pathname.split('/').filter(s => s && s !== 'app' && s !== 'portal');
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

    // `vendor-orders/:id` is the vendor PO detail route, but there is no
    // `/vendor-orders` list route — the actual list page lives at
    // `/vendors/orders`. Point the breadcrumb there instead of a 404.
    const linkPath = segment === 'vendor-orders' ? '/vendors/orders' : cumulativePath;

    breadcrumbs.push({
      label,
      path: linkPath,
      isActive,
    });
  });

  return breadcrumbs;
}

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isClientPortalUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const allBreadcrumbs = generateBreadcrumbs(location.pathname);
  // Client portal users should never see a link back to the owner/admin
  // dashboard, so the leading "Home" crumb is dropped entirely for them.
  const breadcrumbs = isClientPortalUser ? allBreadcrumbs.slice(1) : allBreadcrumbs;

  const handleLogout = () => {
    console.log('[v0] User logging out');
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative z-20 bg-transparent">
      {/* Top section - Search bar and actions */}
      <div className="relative z-10 h-16 px-4 md:px-6 flex items-center justify-between gap-4 bg-background border-b border-border shadow-[0_2px_6px_-2px_rgba(15,23,42,0.10)]">
        {/* Left: Back & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users, orders, vendors, clients, invoices..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative flex items-center gap-3 pl-4 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user?.name || 'System Owner'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'Administrator'}</p>
            </div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-blue-700 transition-colors"
              title={user?.email}
            >
              {user?.name?.charAt(0) || 'A'}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-lg py-2 w-48 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user?.name || 'System Owner'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                >
                  <User size={16} />
                  Profile
                </button>

                <div className="border-t border-border my-1"></div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb section */}
      <div className="h-10 px-4 md:px-6 flex items-center gap-2 bg-transparent">
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.path}-${index}`} className="flex items-center gap-2">
            {index === 0 && !isClientPortalUser ? (
              <button
                onClick={() => navigate(crumb.path)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                title="Go to Dashboard"
              >
                <Home size={16} />
              </button>
            ) : index === 0 ? (
              <button
                onClick={() => navigate(crumb.path)}
                className={`text-sm px-2 py-1 rounded transition-colors ${
                  crumb.isActive
                    ? 'text-primary font-medium bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {crumb.label}
              </button>
            ) : (
              <>
                <ChevronRight size={16} className="text-muted-foreground" />
                <button
                  onClick={() => navigate(crumb.path)}
                  className={`text-sm px-2 py-1 rounded transition-colors ${
                    crumb.isActive
                      ? 'text-primary font-medium bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
