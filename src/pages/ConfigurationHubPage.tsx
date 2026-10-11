import {
  Settings,
  Users,
  GitBranch,
  ClipboardList,
  Bell,
  BookOpen,
  Plug,
  Zap,
  DollarSign,
  Mail,
  Calculator,
  Gauge,
  Boxes,
  UserCheck,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";

const AutoAssignmentTab = lazy(() => import("@/components/configuration/AutoAssignmentTab"));

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
    title: "Client Approval Workflow",
    description: "Manage approval rules for each client portal",
    icon: UserCheck,
    href: "/configuration/client-approval-workflows",
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
    title: "Auto Assignment",
    description: "Configure tier-based order assignment and round-robin sequences",
    icon: Zap,
    href: "/configuration?tab=auto-assignment",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "auto-assignment" ? "auto-assignment" : "overview";

  const selectTab = (tab: "overview" | "auto-assignment") => {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4 md:px-6 py-2 md:py-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Configuration
        </h1>

        <div className="mb-6 flex gap-2 border-b border-slate-200" role="tablist" aria-label="Configuration sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            onClick={() => selectTab("overview")}
            className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === "overview" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Configuration modules
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "auto-assignment"}
            onClick={() => selectTab("auto-assignment")}
            className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === "auto-assignment" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Auto Assignment
          </button>
        </div>

        {activeTab === "auto-assignment" ? (
          <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading Auto Assignment…</div>}>
            <AutoAssignmentTab />
          </Suspense>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.href} className="block">
                  <div className="h-full cursor-pointer rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md">
                    <div className="mb-5 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                        <Icon className="h-7 w-7 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-800">
                        {item.title}<span className="text-slate-400">›</span>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}