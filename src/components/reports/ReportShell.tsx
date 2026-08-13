import { useNavigate, useLocation } from "react-router-dom";
import { useReportShellContext } from "@/contexts/ReportShellContext";
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
  const { inline } = useReportShellContext();
  const navigate = useNavigate();
  const location = useLocation();
  // When rendered inline inside ReportsPage, the Reports page already shows
  // its module navigation tiles. Do not add another navigation layer there.
  if (inline) {
    return <div className="space-y-5">{children}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Report navigation belongs at the top of the report page. The
          application Sidebar remains the only left sidebar. */}
      <nav
        aria-label="Report navigation"
        className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-x-auto"
      >
        <div className="flex items-center gap-1 min-w-max px-2 py-2">
          <div className="flex items-center gap-2 px-2 pr-3 mr-1 border-r border-gray-100">
            <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Reports &amp; BI</span>
          </div>
          {NAV_ITEMS.map((item) => {
            const active =
              item.path === "/reports"
                ? location.pathname === "/reports"
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={active ? "text-blue-600" : ""}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Report body */}
        <div className="p-6 bg-gray-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
