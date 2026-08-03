import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Building2,
  Users,
  Package,
  DollarSign,
  HeadphonesIcon,
  Clock,
  CheckSquare,
  Receipt,
  FileSearch,
  Wrench,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  sub?: { label: string; path: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Executive Dashboard", path: "/reports/executive", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Sales Reports", path: "/reports/sales", icon: <TrendingUp className="w-4 h-4" /> },
  { label: "Procurement Reports", path: "/reports/procurement", icon: <ShoppingCart className="w-4 h-4" /> },
  { label: "Vendor Performance", path: "/reports/vendors", icon: <Building2 className="w-4 h-4" /> },
  { label: "Client Reports", path: "/reports/clients", icon: <Users className="w-4 h-4" /> },
  { label: "Inventory Reports", path: "/reports/inventory", icon: <Package className="w-4 h-4" /> },
  { label: "Finance Reports", path: "/reports/finance", icon: <DollarSign className="w-4 h-4" /> },
  { label: "Support Reports", path: "/reports/support", icon: <HeadphonesIcon className="w-4 h-4" /> },
  { label: "SLA Reports", path: "/reports/sla", icon: <Clock className="w-4 h-4" /> },
  { label: "Approval Reports", path: "/reports/approvals", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Tax Reports", path: "/reports/tax", icon: <Receipt className="w-4 h-4" /> },
  { label: "Audit Reports", path: "/reports/audit", icon: <FileSearch className="w-4 h-4" /> },
  { label: "Custom Reports", path: "/reports", icon: <Wrench className="w-4 h-4" /> },
];

export default function ReportShell({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex gap-0 -mx-6 -mt-6 min-h-[calc(100vh-64px)]">
      {/* Left Sidebar */}
      <aside
        className={`shrink-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-200 ${collapsed ? "w-14" : "w-56"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-gray-700">Reports & BI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className={`p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors ${collapsed ? "mx-auto" : ""}`}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active =
              item.path === "/reports"
                ? location.pathname === "/reports"
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors relative group ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-r" />
                )}
                <span className={`shrink-0 ${active ? "text-blue-600" : ""}`}>{item.icon}</span>
                {!collapsed && (
                  <span className="text-xs font-medium leading-tight truncate">{item.label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
