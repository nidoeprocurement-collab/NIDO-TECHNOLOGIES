import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Grid2X2,
  MoreVertical,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Repeat2,
} from "lucide-react";

type RenewalStatus = "Overdue" | "Upcoming" | "Due Soon";
type AutoRenew = "Enabled" | "Disabled";

interface Renewal {
  id: string;
  product: string;
  brand: "microsoft" | "adobe" | "vmware" | "fortinet";
  client: string;
  licenseType: string;
  seats: string;
  dueDate: string;
  dueIn: string;
  amount: string;
  renewalStatus: RenewalStatus;
  autoRenew: AutoRenew;
}

const TABS = [
  "Overview",
  "Calendar View",
  "Upcoming Renewals",
  "Renewal History",
  "Expiring Soon",
  "Auto Renewals",
] as const;

const RENEWALS: Renewal[] = [
  {
    id: "REN-000041",
    product: "Microsoft 365 Business Standard",
    brand: "microsoft",
    client: "Nido Tech CorpEssentials",
    licenseType: "Subscription (License)",
    seats: "10 Users",
    dueDate: "Aug 24, 2026",
    dueIn: "Due in 0 days",
    amount: "₹59,000.00",
    renewalStatus: "Overdue",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000042",
    product: "Adobe Acrobat Pro",
    brand: "adobe",
    client: "Cloud Systems India",
    licenseType: "Subscription (License)",
    seats: "5 Users",
    dueDate: "Sep 10, 2026",
    dueIn: "Due in 17 days",
    amount: "₹24,750.00",
    renewalStatus: "Upcoming",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000043",
    product: "VMware vSphere Standard",
    brand: "vmware",
    client: "InfoTech Pvt. Ltd.",
    licenseType: "Subscription (License)",
    seats: "2 CPU",
    dueDate: "Oct 05, 2026",
    dueIn: "Due in 42 days",
    amount: "₹1,25,000.00",
    renewalStatus: "Due Soon",
    autoRenew: "Disabled",
  },
  {
    id: "REN-000044",
    product: "FortiGate 100F (UTM Firewall)",
    brand: "fortinet",
    client: "Apex Tech Solutions",
    licenseType: "Subscription (License)",
    seats: "1 Device",
    dueDate: "Oct 28, 2026",
    dueIn: "Due in 65 days",
    amount: "₹85,000.00",
    renewalStatus: "Due Soon",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000045",
    product: "Microsoft Windows Server 2022 Std",
    brand: "microsoft",
    client: "Nido Tech CorpEssentials",
    licenseType: "Perpetual + SA (License)",
    seats: "1 Server",
    dueDate: "Nov 15, 2026",
    dueIn: "Due in 83 days",
    amount: "₹45,000.00",
    renewalStatus: "Upcoming",
    autoRenew: "Disabled",
  },
];

const STATUS_STYLES: Record<RenewalStatus, string> = {
  Overdue: "bg-rose-50 text-rose-600",
  Upcoming: "bg-blue-50 text-blue-600",
  "Due Soon": "bg-amber-50 text-amber-700",
};

function BrandMark({ brand }: { brand: Renewal["brand"] }) {
  if (brand === "adobe") {
    return (
      <div className="flex h-5 w-5 items-center justify-center text-[#e21b2d]">
        <span className="text-[21px] font-bold leading-none">A</span>
      </div>
    );
  }

  if (brand === "fortinet") {
    return (
      <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
        <span className="bg-[#e1261c]" />
        <span className="bg-[#b6ce39]" />
        <span className="bg-[#e1261c]" />
        <span className="bg-[#b6ce39]" />
      </div>
    );
  }

  if (brand === "vmware") {
    return (
      <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
        <span className="bg-[#f25022]" />
        <span className="bg-[#7fba00]" />
        <span className="bg-[#00a4ef]" />
        <span className="bg-[#ffb900]" />
      </div>
    );
  }

  return (
    <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`min-w-0 ${wide ? "sm:col-span-1" : ""}`}>
      <span className="mb-1 block text-[9px] font-semibold text-gray-600">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-[11px] text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
      </span>
    </label>
  );
}

function exportRenewals(rows: Renewal[]) {
  const headings = [
    "Renewal ID",
    "Product / License",
    "Client",
    "License Type",
    "Due Date",
    "Amount",
    "Renewal Status",
    "Auto Renew",
  ];
  const values = rows.map((row) => [
    row.id,
    row.product,
    row.client,
    `${row.licenseType} ${row.seats}`,
    row.dueDate,
    row.amount,
    row.renewalStatus,
    row.autoRenew,
  ]);
  const csv = [headings, ...values]
    .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "renewals.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function MyRenewalsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [client, setClient] = useState("All Clients");
  const [status, setStatus] = useState("All Statuses");
  const [renewalStatus, setRenewalStatus] = useState("All");
  const [licenseType, setLicenseType] = useState("All");
  const [dateRange, setDateRange] = useState("Select Range");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredRenewals = useMemo(() => {
    return RENEWALS.filter((row) => {
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        row.id.toLowerCase().includes(search) ||
        row.product.toLowerCase().includes(search) ||
        row.client.toLowerCase().includes(search);
      const matchesClient = client === "All Clients" || row.client.includes(client);
      const matchesStatus = status === "All Statuses" || row.autoRenew === status;
      const matchesRenewalStatus =
        renewalStatus === "All" || row.renewalStatus === renewalStatus;
      const matchesLicenseType =
        licenseType === "All" || row.licenseType.includes(licenseType);
      return (
        matchesQuery &&
        matchesClient &&
        matchesStatus &&
        matchesRenewalStatus &&
        matchesLicenseType
      );
    });
  }, [client, licenseType, query, renewalStatus, status]);

  const visibleRows =
    filteredRenewals.length > 0
      ? filteredRenewals
      : query || client !== "All Clients" || status !== "All Statuses" || renewalStatus !== "All"
        ? []
        : RENEWALS;

  return (
    <div className="min-h-screen bg-white px-1.5 pb-4 text-gray-900 sm:px-2">
      <header className="flex items-start justify-between gap-4 px-1.5 pb-2 pt-1.5 sm:px-2">
        <div>
          <h1 className="text-[19px] font-bold leading-6 tracking-[-0.35px] text-gray-900">
            Renewals
          </h1>
          <p className="mt-0.5 text-[10px] leading-4 text-gray-500">
            Monitor and manage all license and subscription renewals
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => exportRenewals(visibleRows)}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Renewal
          </button>
        </div>
      </header>

      <nav className="flex min-w-max items-end border-b border-gray-200 px-1.5 sm:px-2">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative h-9 px-3.5 text-[10px] font-medium transition-colors ${
              activeTab === tab ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </nav>

      <main className="space-y-4 px-1.5 pt-3 sm:px-2">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            {
              label: "Total Renewals",
              value: "58",
              note: "All time",
              icon: CalendarDays,
              iconClass: "bg-blue-50 text-blue-600",
            },
            {
              label: "Upcoming (0–30 days)",
              value: "12",
              note: "Next 30 days",
              icon: Clock3,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Due Soon (31–60 days)",
              value: "18",
              note: "Next 31–60 days",
              icon: CalendarDays,
              iconClass: "bg-amber-50 text-amber-600",
            },
            {
              label: "Overdue",
              value: "3",
              note: "Past due",
              icon: AlertTriangle,
              iconClass: "bg-rose-50 text-rose-600",
            },
            {
              label: "Auto Renewals",
              value: "26",
              note: "Enabled",
              icon: Repeat2,
              iconClass: "bg-purple-50 text-purple-600",
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex min-h-[78px] items-center gap-3 rounded-[10px] border border-gray-200 bg-white px-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-gray-500">{metric.label}</p>
                  <p className="mt-0.5 text-[21px] font-bold leading-6 text-gray-900">{metric.value}</p>
                  <p className="mt-0.5 text-[9px] text-gray-500">{metric.note}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[10px] border border-gray-200 bg-white px-3 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-6">
            <SelectField
              label="Client"
              value={client}
              options={["All Clients", "Nido Tech", "Cloud Systems", "InfoTech", "Apex Tech"]}
              onChange={(value) => {
                setClient(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Status"
              value={status}
              options={["All Statuses", "Enabled", "Disabled"]}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Renewal Status"
              value={renewalStatus}
              options={["All", "Upcoming", "Due Soon", "Overdue"]}
              onChange={(value) => {
                setRenewalStatus(value);
                setPage(1);
              }}
            />
            <SelectField
              label="License Type"
              value={licenseType}
              options={["All", "Subscription", "Perpetual"]}
              onChange={(value) => {
                setLicenseType(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Due Date"
              value={dateRange}
              options={["Select Range", "Next 30 Days", "Next 60 Days", "This Year"]}
              onChange={setDateRange}
            />
            <div className="relative self-end">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-medium transition-colors ${
                  filtersOpen
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-3 w-3" />
                More Filters
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-gray-200 bg-white p-3 text-[10px] text-gray-600 shadow-xl">
                  <p className="font-semibold text-gray-800">Additional filters</p>
                  <p className="mt-1.5 leading-4">Use the filters above to narrow the renewal list.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex h-11 items-center justify-between gap-3 border-b border-gray-100 px-3.5">
            <h2 className="text-[11px] font-semibold text-gray-800">
              Renewal List ({filteredRenewals.length > 0 ? 58 : 0})
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex h-7 w-[205px] items-center gap-2 rounded-lg border border-gray-200 px-2.5 text-gray-400 focus-within:border-blue-400">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search renewals..."
                  className="min-w-0 flex-1 bg-transparent text-[10px] text-gray-700 outline-none placeholder:text-gray-400"
                />
              </label>
              <button
                type="button"
                title="List view"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Grid2X2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-[10px]">
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13.5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10.5%" }} />
                <col style={{ width: "10.5%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "3.5%" }} />
              </colgroup>
              <thead>
                <tr className="h-8 border-b border-gray-100 bg-gray-50/80 text-[8px] font-semibold uppercase text-gray-500">
                  <th className="px-3 text-left">Renewal ID</th>
                  <th className="px-3 text-left">Product / License</th>
                  <th className="px-3 text-left">Client</th>
                  <th className="px-3 text-left">License Type</th>
                  <th className="px-3 text-left">Due Date <span className="text-gray-400">⌄</span></th>
                  <th className="px-3 text-left">Amount</th>
                  <th className="px-3 text-left">Renewal Status</th>
                  <th className="px-3 text-left">Auto Renew</th>
                  <th className="px-3 text-left">Status</th>
                  <th className="px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="h-[64px] border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="px-3 align-middle">
                      <button type="button" className="font-semibold text-blue-600 hover:underline">
                        {row.id}
                      </button>
                    </td>
                    <td className="px-3 align-middle">
                      <div className="flex items-start gap-2">
                        <BrandMark brand={row.brand} />
                        <div className="min-w-0">
                          <p className="font-semibold leading-[14px] text-gray-800">{row.product}</p>
                          <span className="mt-1 inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-purple-700">
                            Digital License
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="leading-[14px] text-gray-700">{row.client.split(" ").slice(0, 2).join(" ")}</p>
                      <p className="leading-[14px] text-gray-700">{row.client.split(" ").slice(2).join(" ")}</p>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="leading-[14px] text-gray-700">{row.licenseType}</p>
                      <p className="leading-[14px] text-gray-700">{row.seats}</p>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="text-gray-700">{row.dueDate}</p>
                      <p className={`mt-0.5 ${row.renewalStatus === "Overdue" ? "text-rose-600" : row.renewalStatus === "Due Soon" ? "text-amber-600" : "text-amber-600"}`}>
                        {row.dueIn}
                      </p>
                    </td>
                    <td className="px-3 align-middle font-semibold text-gray-800">{row.amount}</td>
                    <td className="px-3 align-middle">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${STATUS_STYLES[row.renewalStatus]}`}>
                        {row.renewalStatus}
                      </span>
                    </td>
                    <td className="px-3 align-middle">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-medium ${row.autoRenew === "Enabled" ? "text-gray-700" : "text-gray-500"}`}>
                        {row.autoRenew === "Enabled" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-gray-400" />
                        )}
                        {row.autoRenew}
                      </span>
                    </td>
                    <td className="px-3 align-middle">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </td>
                    <td className="px-2 text-center align-middle">
                      <button type="button" className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="h-40 text-center text-xs text-gray-400">
                      No renewals match the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex h-10 items-center justify-between border-t border-gray-100 px-3.5">
            <span className="text-[10px] text-gray-500">
              {visibleRows.length > 0 ? "Showing 1 to 5 of 58 renewals" : "Showing 0 renewals"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => setPage(number)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-medium transition-colors ${
                    page === number
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(6, current + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="ml-2 flex h-7 items-center gap-3 rounded-lg border border-gray-200 px-2.5 text-[10px] text-gray-700 transition-colors hover:bg-gray-50"
              >
                10 / page
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}