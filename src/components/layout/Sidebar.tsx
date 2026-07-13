import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgConfig } from '@/contexts/ConfigContext';
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
  LogOut,
  Bell,
  User,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

// ── Admin (NIDO) navigation ───────────────────────────────────────────────────
const adminNavigationItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Shop', icon: <ShoppingCart size={20} />, path: '/shop' },
  { label: 'Services', icon: <Wrench size={20} />, path: '/services' },
  { label: 'Support', icon: <Headphones size={20} />, path: '/support' },
  { label: 'Clients', icon: <Users size={20} />, path: '/clients' },
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
  { label: 'Reports', icon: <TrendingUp size={20} />, path: '/reports' },
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
  { label: 'Configuration', icon: <Settings size={20} />, path: '/configuration' },
];

// ── Client Portal navigation ──────────────────────────────────────────────────
const clientNavigationItems: NavItem[] = [
  { label: 'Dashboard',    icon: <LayoutDashboard size={20} />, path: '/portal/dashboard' },
  { label: 'Shop',         icon: <ShoppingCart size={20} />,    path: '/portal/catalog' },
  { label: 'My Requests',  icon: <ClipboardList size={20} />,   path: '/portal/orders' },
  { label: 'My Invoices',  icon: <Receipt size={20} />,         path: '/portal/invoices' },
  { label: 'Services',     icon: <Wrench size={20} />,          path: '/portal/services' },
  { label: 'Support',      icon: <Headphones size={20} />,      path: '/portal/support' },
  { label: 'Contracts',    icon: <FileText size={20} />,        path: '/portal/contracts' },
  { label: 'Approvals',    icon: <FileCheck size={20} />,       path: '/portal/approvals' },
  { label: 'Reports',      icon: <TrendingUp size={20} />,      path: '/portal/reports' },
  { label: 'My Profile',   icon: <User size={20} />,            path: '/portal/profile' },
];

// ── Path helpers ──────────────────────────────────────────────────────────────
function collectPaths(items: NavItem[], acc: string[] = []): string[] {
  for (const item of items) {
    if (item.path) acc.push(item.path);
    if (item.children) collectPaths(item.children, acc);
  }
  return acc;
}

function findActivePath(pathname: string, items: NavItem[]): string | null {
  const allPaths = collectPaths(items);
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

// ── NavItem component ─────────────────────────────────────────────────────────
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
  const isActive = !!item.path && item.path === activePath;
  const hasActiveChild = !!hasChildren && !!activePath && item.children!.some(child => containsPath(child, activePath));

  if (hasChildren && isTopLevel && collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          className={`relative w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all ${
            hasActiveChild ? 'text-primary bg-primary/10' : 'text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
          title={item.label}
        >
          {item.icon}
          <ChevronRight size={10} className="absolute right-0.5 bottom-0.5 text-sidebar-foreground/50" />
        </button>
        {flyoutOpen && (
          <div className="absolute left-full top-0 ml-2 min-w-[220px] bg-background border border-border rounded-lg shadow-lg py-2 z-50">
            <p className="px-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
            {item.children!.map((child, idx) => (
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
            hasActiveChild ? 'text-primary bg-primary/10' : 'text-sidebar-foreground hover:bg-sidebar-accent'
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
            {item.children!.map((child, idx) => (
              <NavItemComponent key={idx} item={child} level={level + 1} activePath={activePath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isTopLevel && collapsed) {
    return (
      <Link
        to={item.path || '#'}
        title={item.label}
        className={`flex items-center justify-center px-2 py-2.5 rounded-lg transition-all ${
          isActive ? 'text-primary bg-primary/10' : 'text-sidebar-foreground hover:bg-sidebar-accent'
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
        isActive ? 'text-primary bg-primary/10' : 'text-sidebar-foreground hover:bg-sidebar-accent'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { user, logout, isClientPortalUser } = useAuth();
  const org = useOrgConfig();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = isClientPortalUser ? clientNavigationItems : adminNavigationItems;
  const activePath = findActivePath(location.pathname, navItems);

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const effectiveCollapsed = collapsed && isDesktop;

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name ?? 'Unknown User';
  const displayRole = isClientPortalUser
    ? `${user?.clientName ?? 'Client'} — ${user?.role ?? 'User'}`
    : user?.role ?? 'Owner';

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-background text-foreground hover:bg-muted border border-border shadow-sm"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-full bg-sidebar flex flex-col transition-all duration-300 z-30 w-64 lg:translate-x-0 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.10)] ${
          effectiveCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="relative shrink-0 bg-sidebar h-16 px-2 z-10 flex items-center justify-between gap-2 border-b border-sidebar-border">
          <div className="flex items-center min-w-0 flex-1 h-full py-2">
            {org.logoUrl ? (
              <div className={`h-full w-full flex items-center gap-2.5 overflow-hidden ${effectiveCollapsed ? 'justify-center' : 'justify-start'}`}>
                {effectiveCollapsed ? (
                  <div className="w-full h-full shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={org.logoUrl} alt={org.displayName || 'Logo'} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-full shrink-0 flex items-center overflow-hidden">
                    <img src={org.logoUrl} alt={org.displayName || 'Logo'} className="h-full max-w-full object-contain" />
                  </div>
                )}
                {!effectiveCollapsed && (() => {
                  const raw = org.displayName || 'NIDO';
                  const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
                  const mainName = match ? match[1].trim() : raw;
                  const subName = match ? match[2].trim() : null;
                  return (
                    <div className="min-w-0 flex flex-col justify-center leading-none">
                      <span
                        className="font-extrabold text-sidebar-foreground tracking-tight truncate leading-none"
                        style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.375rem)' }}
                      >
                        {mainName}
                      </span>
                      {subName && (
                        <span className="text-[11px] font-medium text-sidebar-foreground/60 truncate mt-1">
                          {subName}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
                  isClientPortalUser
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'
                }`}>
                  <Zap size={20} className="text-white" />
                </div>
                {!effectiveCollapsed && (
                  <div className="min-w-0">
                    <h1 className="text-sm font-bold text-sidebar-foreground truncate">{org.displayName || 'NIDO'}</h1>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {isClientPortalUser ? 'Client Portal' : 'Procurement'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex absolute -right-3 top-5 w-6 h-6 items-center justify-center rounded-full bg-background border border-border text-muted-foreground shadow-sm hover:text-primary hover:border-primary/50 hover:shadow-md transition-all"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Client badge (client portal only) */}
        {isClientPortalUser && !effectiveCollapsed && (
          <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20">
            <p className="text-xs text-purple-400 font-medium truncate">{user?.clientName}</p>
            <p className="text-[10px] text-purple-400/70 truncate">Client ID: {user?.clientId}</p>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 ${effectiveCollapsed ? 'p-2' : 'p-4'}`}>
          {navItems.map((item, idx) => (
            <NavItemComponent key={idx} item={item} collapsed={effectiveCollapsed} activePath={activePath} />
          ))}
        </nav>

        {/* Bottom — user + sign-out */}
        <div className="shrink-0 border-t border-sidebar-border">
          {effectiveCollapsed ? (
            <div className="p-2 flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isClientPortalUser
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'
                }`}
                title={displayName}
              >
                {avatarInitial}
              </div>
              <button
                title="Sign Out"
                onClick={handleSignOut}
                className="w-8 h-8 flex items-center justify-center text-sidebar-foreground/60 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isClientPortalUser
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'
                }`}>
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{displayRole}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full mt-2 px-3 py-2 text-xs text-sidebar-foreground/70 hover:text-red-400 text-left rounded-lg hover:bg-red-500/10 transition-all flex items-center gap-2"
              >
                <LogOut size={14} />
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
