import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Headphones,
  Users,
  TrendingUp,
  Package,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Zap,
  List,
  ClipboardList,
  Tags,
  ShoppingBag,
  Gauge,
  FileText,
  Receipt,
  Repeat,
  Truck,
  FileMinus,
  FileCheck,
  Wallet,
  CreditCard,
  Banknote,
  ShieldCheck,
  Building2,
  Mail,
  History,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/dashboard',
  },
  {
    label: 'Shop',
    icon: <ShoppingCart size={20} />,
    path: '/shop',
  },
  {
    label: 'Services',
    icon: <Wrench size={20} />,
    path: '/services',
  },
  {
    label: 'Support',
    icon: <Headphones size={20} />,
    path: '/support',
  },
  {
    label: 'Clients',
    icon: <Users size={20} />,
    path: '/clients',
  },
  {
    label: 'Vendors',
    icon: <Package size={20} />,
    children: [
      { label: 'Vendor List', icon: <List size={16} />, path: '/vendors' },
      { label: 'Vendor Orders', icon: <ClipboardList size={16} />, path: '/vendors/orders' },
      { label: 'Vendor Dashboard', icon: <LayoutDashboard size={16} />, path: '/vendors/dashboard' },
      { label: 'Categories', icon: <Tags size={16} />, path: '/vendors/categories' },
    ],
  },
  {
    label: 'MY Requests',
    icon: <TrendingUp size={20} />,
    children: [
      { label: 'My Orders', icon: <ShoppingBag size={16} />, path: '/orders' },
      { label: 'My Services', icon: <Wrench size={16} />, path: '/services' },
      { label: 'SLA Overview', icon: <Gauge size={16} />, path: '/sla-overview' },
    ],
  },
  {
    label: 'Reports',
    icon: <TrendingUp size={20} />,
    path: '/reports',
  },
  {
    label: 'Transactions',
    icon: <DollarSign size={20} />,
    children: [
      {
        label: 'Sales',
        icon: <TrendingUp size={16} />,
        children: [
          { label: 'Quotes', icon: <FileText size={16} />, path: '/sales/quotes' },
          { label: 'Sales Orders', icon: <ClipboardList size={16} />, path: '/sales/orders' },
          { label: 'Invoices', icon: <Receipt size={16} />, path: '/invoices' },
          { label: 'Recurring Invoices', icon: <Repeat size={16} />, path: '/recurring-invoices' },
          { label: 'Delivery Challans', icon: <Truck size={16} />, path: '/delivery-challans' },
          { label: 'Payment Receipts', icon: <Receipt size={16} />, path: '/payment-receipts' },
          { label: 'Credit Notes', icon: <FileMinus size={16} />, path: '/credit-notes' },
          { label: 'e-Way Bills', icon: <FileCheck size={16} />, path: '/eway-bills' },
        ],
      },
      {
        label: 'Purchases',
        icon: <ShoppingCart size={16} />,
        children: [
          { label: 'Expenses', icon: <Wallet size={16} />, path: '/expenses' },
          { label: 'Recurring Expenses', icon: <Repeat size={16} />, path: '/recurring-expenses' },
          { label: 'Purchase Orders', icon: <ClipboardList size={16} />, path: '/purchase-orders' },
          { label: 'Bills', icon: <FileText size={16} />, path: '/bills' },
          { label: 'Payments Made', icon: <CreditCard size={16} />, path: '/payments-made' },
          { label: 'Vendor Credits', icon: <Banknote size={16} />, path: '/vendor-credits' },
        ],
      },
    ],
  },
  {
    label: 'User Management',
    icon: <Users size={20} />,
    children: [
      { label: 'Users', icon: <Users size={16} />, path: '/users/management' },
      { label: 'Roles', icon: <ShieldCheck size={16} />, path: '/roles' },
      { label: 'Departments', icon: <Building2 size={16} />, path: '/departments' },
      { label: 'Invitations', icon: <Mail size={16} />, path: '/user-invitations' },
      { label: 'Audit Trail', icon: <History size={16} />, path: '/audit-logs' },
    ],
  },
  {
    label: 'Configuration',
    icon: <Settings size={20} />,
    path: '/configuration',
  },
];

// Flatten all nav paths and pick the single most specific (longest) match for the
// current pathname, so sibling routes that share a prefix (e.g. '/vendors' and
// '/vendors/orders') never both light up — only the item that's actually open does.
function collectPaths(items: NavItem[], acc: string[] = []): string[] {
  for (const item of items) {
    if (item.path) acc.push(item.path);
    if (item.children) collectPaths(item.children, acc);
  }
  return acc;
}

function findActivePath(pathname: string): string | null {
  const allPaths = collectPaths(navigationItems);
  let best: string | null = null;
  for (const p of allPaths) {
    const matches = pathname === p || pathname.startsWith(p + '/');
    if (!matches) continue;
    if (!best || p.length > best.length) best = p;
  }
  return best;
}

function containsPath(item: NavItem, targetPath: string): boolean {
  if (item.path === targetPath) return true;
  return !!item.children?.some(child => containsPath(child, targetPath));
}

interface NavItemProps {
  item: NavItem;
  level?: number;
  collapsed?: boolean;
  activePath: string | null;
}

function NavItemComponent({ item, level = 0, collapsed = false, activePath }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isTopLevel = level === 0;

  // Only the single most specific matching item is "active"
  const isActive = !!item.path && item.path === activePath;

  // Check if the active path lives somewhere inside this item's children
  const hasActiveChild = !!hasChildren && !!activePath && item.children.some(child => containsPath(child, activePath));

  // Collapsed top-level item with children: icon-only trigger + hover flyout
  if (hasChildren && isTopLevel && collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          className={`relative w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all ${
            hasActiveChild ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={item.label}
        >
          {item.icon}
          {/* Small dropdown indicator so collapsed icons still hint they expand */}
          <ChevronRight size={10} className="absolute right-0.5 bottom-0.5 text-gray-400" />
        </button>
        {flyoutOpen && (
          <div className="absolute left-full top-0 ml-2 min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
            <p className="px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
            {item.children.map((child, idx) => (
              <NavItemComponent key={idx} item={child} level={1} activePath={activePath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            hasActiveChild
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && (
          <div className={`space-y-0.5 ${isTopLevel ? 'pl-2' : 'pl-4'}`}>
            {item.children.map((child, idx) => (
              <NavItemComponent key={idx} item={child} level={level + 1} activePath={activePath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Collapsed top-level leaf item: icon-only link
  if (isTopLevel && collapsed) {
    return (
      <Link
        to={item.path || '#'}
        title={item.label}
        className={`flex items-center justify-center px-2 py-2.5 rounded-lg transition-all ${
          isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {item.icon}
      </Link>
    );
  }

  return (
    <Link
      to={item.path || '#'}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const activePath = findActivePath(location.pathname);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // The collapse-to-icon-rail treatment is a desktop-only affordance — on
  // mobile the sidebar is a full-width overlay, so ignore the persisted
  // collapsed flag there to avoid a narrow icon rail with no way to expand.
  const effectiveCollapsed = collapsed && isDesktop;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar — flex column so the nav can scroll independently while the
          profile/sign-out block always stays pinned to the very bottom. */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white flex flex-col transition-all duration-300 z-30 w-64 lg:translate-x-0 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.10)] ${
          effectiveCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header — same h-16 row height as the TopBar's search row
            so the two line up. Separated from the nav below with a soft
            shadow instead of a hard divider line. */}
        <div className="relative shrink-0 bg-white h-16 px-4 z-10 flex items-center justify-between gap-2 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            {!effectiveCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 truncate">NIDO</h1>
                <p className="text-xs text-gray-500 truncate">Procurement</p>
              </div>
            )}
          </div>

          {/* Hide/unhide toggle — small arrow tab pinned to the top-right
              corner of the sidebar, echoed on the outer edge so it stays
              reachable even when collapsed to icon width. */}
          <button
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex absolute -right-3 top-5 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items — scrolls on its own, leaving the bottom block fixed */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 ${effectiveCollapsed ? 'p-2' : 'p-4'}`}>
          {navigationItems.map((item, idx) => (
            <NavItemComponent key={idx} item={item} collapsed={effectiveCollapsed} activePath={activePath} />
          ))}
        </nav>

        {/* Bottom Section — always pinned to the bottom of the sidebar,
            separated from the nav above with a soft shadow instead of a line */}
        <div className="shrink-0 shadow-[0_-2px_6px_-2px_rgba(15,23,42,0.10)]">
          {effectiveCollapsed ? (
            <div className="p-2 flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center"
                title="Nido Owner"
              >
                <Zap size={16} className="text-white" />
              </div>
              <button
                title="Sign Out"
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">Nido Owner</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
              </div>
              <button className="w-full mt-3 px-3 py-2 text-xs text-gray-600 hover:text-red-600 text-left rounded-lg hover:bg-red-50 transition-all">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
        />
      )}
    </>
  );
}
