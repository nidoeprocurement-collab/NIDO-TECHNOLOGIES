import { useState, useEffect } from 'react';
import { Search, ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SLANotificationPopup from '@/components/shared/SLANotificationPopup';

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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

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
      <div className="relative z-10 h-16 px-2 md:px-2 flex items-center justify-between gap-2 bg-background border-b border-border shadow-[0_2px_6px_-2px_rgba(15,23,42,0.10)]">
        {/* Left: Back & Search */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
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
          {/* SLA Notifications */}
          <SLANotificationPopup />

          {/* Live Date & Time */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="text-right">
              <p className="text-base font-bold text-foreground tabular-nums tracking-wide">{formattedTime}</p>
              <p className="text-sm font-medium text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb section */}
      <div className="h-10 px-2 md:px-2 flex items-center gap-2 bg-transparent">
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
