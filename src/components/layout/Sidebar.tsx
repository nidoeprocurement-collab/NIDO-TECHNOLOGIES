import { useState } from 'react';
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
  Menu,
  X,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
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
      { label: 'Vendor List', path: '/vendors' },
      { label: 'Vendor Orders', path: '/vendors/orders' },
      { label: 'Vendor Dashboard', path: '/vendors/dashboard' },
      { label: 'Categories', path: '/vendors/categories' },
      { label: 'Onboarding', path: '/vendors/onboarding' },
    ],
  },
  {
    label: 'MY Requests',
    icon: <TrendingUp size={20} />,
    children: [
      { label: 'My Orders', path: '/orders' },
      { label: 'My Services', path: '/services' },
      { label: 'SLA Overview', path: '/sla-overview' },
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
        children: [
          { label: 'Quotes', path: '/sales/quotes' },
          { label: 'Sales Orders', path: '/sales/orders' },
          { label: 'Invoices', path: '/invoices' },
          { label: 'Recurring Invoices', path: '/recurring-invoices' },
          { label: 'Delivery Challans', path: '/delivery-challans' },
          { label: 'Payment Receipts', path: '/payment-receipts' },
          { label: 'Credit Notes', path: '/credit-notes' },
          { label: 'e-Way Bills', path: '/eway-bills' },
        ],
      },
      {
        label: 'Purchases',
        children: [
          { label: 'Expenses', path: '/expenses' },
          { label: 'Recurring Expenses', path: '/recurring-expenses' },
          { label: 'Purchase Orders', path: '/purchase-orders' },
          { label: 'Bills', path: '/bills' },
          { label: 'Payments Made', path: '/payments-made' },
          { label: 'Vendor Credits', path: '/vendor-credits' },
        ],
      },
    ],
  },
  {
    label: 'User Management',
    icon: <Users size={20} />,
    children: [
      { label: 'Users', path: '/users/management' },
      { label: 'Roles', path: '/roles' },
      { label: 'Departments', path: '/departments' },
      { label: 'Invitations', path: '/user-invitations' },
      { label: 'Audit Trail', path: '/audit-logs' },
    ],
  },
  {
    label: 'Configuration',
    icon: <Settings size={20} />,
    path: '/configuration',
  },
];

interface NavItemProps {
  item: NavItem;
  level?: number;
  isActive?: boolean;
}

function NavItemComponent({ item, level = 0 }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isTopLevel = level === 0;

  // Check if current path matches
  const isActive = item.path && location.pathname.startsWith(item.path);
  
  // Check if any child is active
  const hasActiveChild = hasChildren && item.children.some(child => {
    if (child.children) {
      return child.children.some(subchild => subchild.path && location.pathname.startsWith(subchild.path));
    }
    return child.path && location.pathname.startsWith(child.path);
  });

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isOpen || hasActiveChild
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
              <NavItemComponent key={idx} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
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

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 w-64 overflow-y-auto transition-transform duration-300 z-30 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">NIDO</h1>
              <p className="text-xs text-gray-500">Procurement</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navigationItems.map((item, idx) => (
            <NavItemComponent key={idx} item={item} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-4 mt-4">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">N</span>
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
