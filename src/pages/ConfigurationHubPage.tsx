import {
  Settings,
  Users,
  GitBranch,
  ClipboardList,
  Bell,
  BookOpen,
  Plug,
  FileText,
  Zap,
  DollarSign,
  Mail,
  Calculator,
  Gauge,
  Boxes,
} from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  {
    title: "General Settings",
    description: "Organization, localization & defaults",
    icon: Settings,
    href: "/configuration/general-settings",
  },
  {
    title: "Nido-Users",
    description: "Manage roles and user assignments",
    icon: Users,
    href: "/configuration/nido-users",
  },
  {
    title: "Approval Workflows",
    description: "Define multi-level approval chains",
    icon: GitBranch,
    href: "/configuration/workflows",
  },
  {
    title: "Order Status",
    description: "Customize order lifecycle stages",
    icon: ClipboardList,
    href: "/configuration/order-statuses",
  },
  {
    title: "Notifications",
    description: "Email, SMS & in-app alert rules",
    icon: Bell,
    href: "/configuration/notifications",
  },
  {
    title: "Email Configuration",
    description: "Provider, sender identity & delivery settings",
    icon: Mail,
    href: "/configuration/email-settings",
  },
  {
    title: "Master Catalogue",
    description:
      "Manage and register the global product/service catalogue",
    icon: BookOpen,
    href: "/configuration/master-catalogue",
  },
  {
    title: "Integrations",
    description: "Manage connectors and API integrations",
    icon: Plug,
    href: "/integrations",
  },
  {
    title: "System Logs",
    description: "Activity & system event logs",
    icon: FileText,
    href: "/reports/audit",
  },
  {
    title: "Auto Assignment",
    description: "Smart analyst auto-routing rules",
    icon: Zap,
    href: "/configuration",
  },
  {
    title: "Price Engine",
    description: "Configure pricing rules and calculations",
    icon: DollarSign,
    href: "/configuration/pricing",
  },
  {
    title: "Tax Settings",
    description: "Centralized Tax Engine — GST, HSN/SAC, category rules",
    icon: Calculator,
    href: "/configuration/tax-settings",
  },
  {
    title: "SLA Management",
    description: "Centralized SLA Engine — vendor, client, procurement & service SLAs",
    icon: Gauge,
    href: "/configuration/sla-settings",
  },
  {
    title: "Stock Management",
    description: "Centralized inventory — single source of truth for all vendor stock",
    icon: Boxes,
    href: "/configuration/stock-management",
  },
];

export default function ConfigurationHubPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Configuration
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                to={item.href}
                className="block"
              >
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer h-full">
                  <div className="flex justify-center mb-5">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-semibold text-slate-800 text-lg flex items-center justify-center gap-1">
                      {item.title}
                      <span className="text-slate-400">›</span>
                    </h3>

                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}