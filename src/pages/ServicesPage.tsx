import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ShieldCheck,
  Wrench,
  Recycle,
  CalendarDays,
  ShoppingCart,
} from "lucide-react";

const SERVICE_CARDS = [
  {
    title: "AMC",
    subtitle: "Annual Maintenance Contract",
    description: "Comprehensive maintenance coverage to ensure optimal performance and reliability.",
    icon: ShieldCheck,
    href: "/services/amc/new",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
    tone: "border-slate-200 bg-white hover:shadow-md",
    features: ["Preventive Maintenance", "Breakdown Support", "Parts & Labor Coverage", "Priority Support"],
  },
  {
    title: "Repair Service",
    subtitle: "",
    description: "On-demand repair services for quick resolution of equipment issues.",
    icon: Wrench,
    href: "/support",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    dotColor: "bg-orange-400",
    tone: "border-slate-200 bg-white hover:shadow-md",
    features: ["Diagnosis & Troubleshooting", "On-site / Off-site Repair", "Genuine Parts Replacement", "Service Report"],
  },
  {
    title: "Recycle /\nDisposal",
    subtitle: "",
    description: "Environmentally responsible recycling and disposal of electronic equipment.",
    icon: Recycle,
    href: "/support",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    tone: "border-slate-200 bg-white hover:shadow-md",
    features: ["Secure Data Destruction", "Environment Friendly", "Compliance & Certification", "Pickup & Disposal"],
  },
  {
    title: "Rental Service",
    subtitle: "",
    description: "Flexible rental solutions for short-term and long-term equipment needs.",
    icon: CalendarDays,
    href: "/support",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    dotColor: "bg-violet-500",
    tone: "border-slate-200 bg-white hover:shadow-md",
    features: ["Short-term Rentals", "Long-term Leasing", "Flexible Tenure", "Maintenance Included"],
  },
  {
    title: "Regular Purchase",
    subtitle: "",
    description: "Daily essentials and consumables for smooth business operations.",
    icon: ShoppingCart,
    href: "/support",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    dotColor: "bg-teal-500",
    tone: "border-slate-200 bg-white hover:shadow-md",
    features: ["Pantry Items", "Water Cans", "Cleaning Supplies", "Other Daily Essentials"],
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
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SERVICE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`flex flex-col rounded-2xl border ${card.tone} p-5 shadow-sm transition-all duration-200 cursor-pointer group`}
              onClick={() => navigate(card.href)}
            >
              {/* Icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} mb-4`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>

              {/* Title */}
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900 leading-snug whitespace-pre-line">
                  {card.title}
                </h2>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">({card.subtitle})</p>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                {card.description}
              </p>

              {/* Divider */}
              <div className="border-t border-slate-100 mb-4" />

              {/* Feature list */}
              <ul className="space-y-2 flex-1">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${card.dotColor}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Open link */}
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-slate-700 transition-colors">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
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
