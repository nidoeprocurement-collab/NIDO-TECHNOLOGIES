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
    children: [
      { label: 'Main Dashboard', path: '/dashboard' },
      { label: 'SLA Overview', path: '/dashboard/sla' },
    ],
  },
  {
    label: 'Shop',
    icon: <ShoppingCart size={20} />,
    path: '/shop',
  },
  {
    label: 'Services & AMC',
    icon: <Wrench size={20} />,
    children: [
      { label: 'Services', path: '/services' },
      { label: 'New AMC', path: '/services/amc/new' },
    ],
  },
  {
    label: 'Support',
    icon: <Headphones size={20} />,
    path: '/support',
  },
  {
    label: 'Clients',
    icon: <Users size={20} />,
    children: [
      { label: 'Client List', path: '/clients' },
      { label: 'Add Client', path: '/clients/add' },
      { label: 'Contracts', path: '/clients/contracts' },
    ],
  },
  {
    label: 'Vendors',
    icon: <TrendingUp size={20} />,
    children: [
      { label: 'Vendor List', path: '/vendors' },
      { label: 'Vendor Orders', path: '/vendors/orders' },
      { label: 'Vendor Dashboard', path: '/dashboard/vendor' },
      { label: 'Categories', path: '/vendors/categories' },
      { label: 'Onboarding', path: '/vendors/onboarding' },
    ],
  },
  {
    label: 'Procure',
    icon: <Package size={20} />,
    children: [
      { label: 'Orders', path: '/orders' },
      { label: 'Requests', path: '/procure/requests' },
      { label: 'Approvals', path: '/configuration/workflows' },
    ],
  },
  {
    label: 'Reports',
    icon: <TrendingUp size={20} />,
    children: [
      { label: 'Analytics', path: '/reports' },
      { label: 'Audit Trail', path: '/reports/audit' },
    ],
  },
  {
    label: 'Transactions',
    icon: <DollarSign size={20} />,
    children: [
      {
        label: 'Sales',
        children: [
          { label: 'Quotes', path: '/sales/quotes' },
          { label: 'Orders', path: '/sales/orders' },
          { label: 'Invoices', path: '/sales/invoices' },
          { label: 'Recurring', path: '/sales/recurring-invoices' },
          { label: 'Delivery', path: '/sales/delivery-challans' },
          { label: 'Receipts', path: '/sales/payment-receipts' },
          { label: 'Credits', path: '/sales/credit-notes' },
          { label: 'e-Way Bills', path: '/sales/eway-bills' },
        ],
      },
      {
        label: 'Purchases',
        children: [
          { label: 'Expenses', path: '/transactions/purchase/expenses' },
          { label: 'Recurring', path: '/transactions/purchase/recurring-expenses' },
          { label: 'Purchase Orders', path: '/transactions/purchase/purchase-orders' },
          { label: 'Bills', path: '/transactions/purchase/bills' },
          { label: 'Payments', path: '/transactions/purchase/payments-made' },
          { label: 'Credits', path: '/transactions/purchase/vendor-credits' },
        ],
      },
    ],
  },
  {
    label: 'User Management',
    icon: <Users size={20} />,
    children: [
      { label: 'Users', path: '/users/management' },
      { label: 'Roles', path: '/users/roles' },
      { label: 'Departments', path: '/users/departments' },
      { label: 'Invitations', path: '/users/invitations' },
      { label: 'Audit Trail', path: '/users/audit-trail' },
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
}

function NavItemComponent({ item, level = 0 }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isTopLevel = level === 0;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isTopLevel
              ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && (
          <div className={`space-y-1 ${isTopLevel ? 'pl-2' : 'pl-4'}`}>
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        isTopLevel
          ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
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
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 w-64 overflow-y-auto transition-transform duration-300 z-30 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 z-10">
          <h1 className="text-xl font-bold text-white">NIDO</h1>
          <p className="text-xs text-gray-500">Procurement Platform</p>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navigationItems.map((item, idx) => (
            <NavItemComponent key={idx} item={item} />
          ))}
        </nav>
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
