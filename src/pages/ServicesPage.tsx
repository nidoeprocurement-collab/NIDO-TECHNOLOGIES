import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ClipboardList,
  Recycle,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const SERVICE_CARDS = [
  {
    title: "Annual Maintenance Contract",
    description:
      "Create AMC requests with mandatory client, category, duration, and authorization details.",
    icon: Wrench,
    href: "/services/amc/new",
    tone: "from-blue-50 to-cyan-50 border-blue-200",
    badge: "Primary workflow",
  },
  {
    title: "Recycle / Disposal",
    description:
      "Capture equipment recycling and disposal requests in a guided service flow.",
    icon: Recycle,
    href: "/support",
    tone: "from-emerald-50 to-teal-50 border-emerald-200",
    badge: "Service desk",
  },
  {
    title: "Service Desk Requests",
    description:
      "Raise supporting service tickets, track progress, and keep stakeholders aligned.",
    icon: ClipboardList,
    href: "/support",
    tone: "from-slate-50 to-white border-slate-200",
    badge: "Ticketing",
  },
];

export default function ServicesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Services page loaded");
  }, []);

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] border border-blue-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-2 md:p-6 lg:p-8 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="w-fit rounded-full border border-white/15 bg-white/10 px-2 py-2 text-white text-sm">
              Services Hub
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              One place for AMC, recycling, and service requests.
            </h1>
            <p className="max-w-xl text-sm text-slate-200 md:text-base">
              Use the dedicated services workflow to open structured requests,
              keep client details consistent, and move faster with cleaner
              forms.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/services/amc/new")}
              className="gap-2 rounded-full bg-white px-2 py-2 text-slate-950 hover:bg-slate-100 flex items-center font-medium"
            >
              New AMC <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/support")}
              className="gap-2 rounded-full border border-white/20 bg-transparent px-2 py-2 text-white hover:bg-white/10 flex items-center font-medium"
            >
              Open Service Desk
            </button>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid gap-2 md:grid-cols-3">
        {SERVICE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`overflow-hidden border bg-gradient-to-br ${card.tone} rounded-lg shadow-sm p-2 space-y-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                  {card.badge}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <p className="text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
              <button
                onClick={() => navigate(card.href)}
                className="gap-2 rounded-full px-2 py-2 text-sm font-medium flex items-center border border-slate-300 hover:bg-white/50"
              >
                Open <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="border border-slate-200 rounded-lg shadow-sm p-6">
        <div className="grid gap-2 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">
              Guided workflow
            </p>
            <h2 className="text-2xl font-semibold">
              Standardized service capture
            </h2>
            <p className="text-sm text-slate-600">
              The new AMC flow uses validated company selection, mandatory
              client fields, and clean section ordering so submissions are
              easier to approve.
            </p>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Mandatory fields enforced
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                Company dropdown
              </div>
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                Client authorization
              </div>
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                AMC duration
              </div>
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                Scope & category
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
