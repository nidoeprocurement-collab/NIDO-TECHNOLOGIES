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
    titleColor: "text-blue-600",
    dotColor: "bg-blue-500",
    blobColor: "bg-blue-100",
    btnBorder: "border-blue-300",
    btnText: "text-blue-600",
    btnHover: "hover:bg-blue-50",
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
    titleColor: "text-orange-500",
    dotColor: "bg-orange-400",
    blobColor: "bg-orange-100",
    btnBorder: "border-orange-300",
    btnText: "text-orange-500",
    btnHover: "hover:bg-orange-50",
    features: ["Diagnosis & Troubleshooting", "On-site / Off-site Repair", "Genuine Parts Replacement", "Service Report"],
  },
  {
    title: "Recycle / Disposal",
    subtitle: "",
    description: "Environmentally responsible recycling and disposal of electronic equipment.",
    icon: Recycle,
    href: "/support",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    blobColor: "bg-emerald-100",
    btnBorder: "border-emerald-300",
    btnText: "text-emerald-600",
    btnHover: "hover:bg-emerald-50",
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
    titleColor: "text-violet-600",
    dotColor: "bg-violet-500",
    blobColor: "bg-violet-100",
    btnBorder: "border-violet-300",
    btnText: "text-violet-600",
    btnHover: "hover:bg-violet-50",
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
    titleColor: "text-teal-600",
    dotColor: "bg-teal-500",
    blobColor: "bg-teal-100",
    btnBorder: "border-teal-300",
    btnText: "text-teal-600",
    btnHover: "hover:bg-teal-50",
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
              onClick={() => navigate(card.href)}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Top-right accent blob */}
              <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full ${card.blobColor} opacity-60 blur-2xl pointer-events-none`} />

              {/* Icon */}
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} mb-4`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>

              {/* Title */}
              <div className="mb-2">
                <h2 className={`text-base font-bold leading-snug ${card.titleColor}`}>
                  {card.title}
                </h2>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">({card.subtitle})</p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {card.description}
              </p>

              {/* Feature list */}
              <ul className="space-y-2 flex-1 mb-5">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${card.dotColor}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Open pill button */}
              <button
                className={`w-fit flex items-center gap-1.5 rounded-full border ${card.btnBorder} ${card.btnText} ${card.btnHover} px-4 py-1.5 text-xs font-semibold transition-colors`}
              >
                Open <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
