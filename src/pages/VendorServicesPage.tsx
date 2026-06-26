import { useState, useMemo } from "react";
import { Wrench, FileCheck, Boxes, Ticket, CheckCircle, IndianRupee, ChevronDown, Calendar } from "lucide-react";

type ServiceType = "AMC" | "Repair" | "Rental" | "Recycling";
type ServiceStatus = "Active" | "In Progress" | "Completed" | "Pending";

interface Service {
  id: string;
  type: ServiceType;
  client: string;
  asset: string;
  contractPO: string;
  engineer: string;
  engineerInitials: string;
  engineerColor: string;
  nextDueDate: string;
  daysLeft: number | null;
  sla: string;
  status: ServiceStatus;
  region: string;
}

const ALL_SERVICES: Service[] = [
  { id: "SER-1001", type: "AMC",       client: "Apex Tech Solutions",  asset: "Dell PowerEdge R740",      contractPO: "AMC-2026-001",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jun 15, 2026", daysLeft: 25,  sla: "99.8%", status: "Active",      region: "North" },
  { id: "SER-1002", type: "Repair",    client: "TechNova Systems",     asset: "HP LaserJet M607",         contractPO: "REP-2026-045",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 10, 2026", daysLeft: 20,  sla: "95.5%", status: "In Progress", region: "West"  },
  { id: "SER-1003", type: "Rental",    client: "Innovix Solutions",    asset: "Zebra DS3678 Scanner",     contractPO: "RENT-2026-023", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Jul 01, 2026", daysLeft: 41,  sla: "–",     status: "Active",      region: "South" },
  { id: "SER-1004", type: "Recycling", client: "GlobalCom Ltd.",       asset: "Desktop & Monitor Fleet",  contractPO: "REC-2026-015",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "East"  },
  { id: "SER-1005", type: "AMC",       client: "BrightWave Pvt. Ltd.", asset: "Dell PowerEdge R640",      contractPO: "AMC-2026-002",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jul 20, 2026", daysLeft: 60,  sla: "98.7%", status: "Active",      region: "North" },
  { id: "SER-1006", type: "Repair",    client: "NextGen Retail",       asset: "Lenovo ThinkPad T14",      contractPO: "REP-2026-050",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 05, 2026", daysLeft: 15,  sla: "92.1%", status: "In Progress", region: "West"  },
  { id: "SER-1007", type: "Rental",    client: "BuildRight Infra",     asset: 'Dell Monitor 24"',         contractPO: "RENT-2026-028", engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Jul 15, 2026", daysLeft: 55,  sla: "–",     status: "Active",      region: "South" },
  { id: "SER-1008", type: "AMC",       client: "HealthCare Plus",      asset: "Dell Storage MD3400",      contractPO: "AMC-2026-003",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jun 18, 2026", daysLeft: 28,  sla: "99.2%", status: "Active",      region: "North" },
  { id: "SER-1009", type: "Repair",    client: "EduSmart Systems",     asset: "HP ProDesk 600 G6",        contractPO: "REP-2026-051",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 08, 2026", daysLeft: 18,  sla: "90.0%", status: "Pending",     region: "East"  },
  { id: "SER-1010", type: "Recycling", client: "Green Planet Org.",    asset: "E-Waste Collection",       contractPO: "REC-2026-016",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "South" },
  { id: "SER-1011", type: "AMC",       client: "Optima Logistics",     asset: "Dell PowerEdge T440",      contractPO: "AMC-2026-004",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jun 25, 2026", daysLeft: 35,  sla: "98.1%", status: "Active",      region: "West"  },
  { id: "SER-1012", type: "Repair",    client: "CoreTech Industries",  asset: "Canon imageRUNNER 2630",   contractPO: "REP-2026-052",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 12, 2026", daysLeft: 22,  sla: "88.5%", status: "In Progress", region: "North" },
  { id: "SER-1013", type: "Rental",    client: "SwiftMove Co.",        asset: "HP Color LaserJet E77428", contractPO: "RENT-2026-029", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Aug 01, 2026", daysLeft: 72,  sla: "–",     status: "Active",      region: "East"  },
  { id: "SER-1014", type: "Recycling", client: "CleanEarth Ltd.",      asset: "Server & UPS Fleet",       contractPO: "REC-2026-017",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "North" },
  { id: "SER-1015", type: "AMC",       client: "Pinnacle Finance",     asset: "Dell Latitude 5540",       contractPO: "AMC-2026-005",  engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Jul 05, 2026", daysLeft: 45,  sla: "97.3%", status: "Active",      region: "West"  },
  { id: "SER-1016", type: "Repair",    client: "MediCare Systems",     asset: "Zebra ZT411 Printer",      contractPO: "REP-2026-053",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 03, 2026", daysLeft: 13,  sla: "91.4%", status: "Pending",     region: "South" },
  { id: "SER-1017", type: "Rental",    client: "UrbanSpace Pvt. Ltd.", asset: "Dell Projector S718QL",    contractPO: "RENT-2026-030", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Jul 22, 2026", daysLeft: 62,  sla: "–",     status: "Active",      region: "North" },
  { id: "SER-1018", type: "Recycling", client: "TechPark Solutions",   asset: "Networking Equipment",     contractPO: "REC-2026-018",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "East"  },
  { id: "SER-1019", type: "AMC",       client: "GlobalShip Logistics", asset: "HP ProLiant DL380",        contractPO: "AMC-2026-006",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jun 28, 2026", daysLeft: 38,  sla: "99.5%", status: "Active",      region: "West"  },
  { id: "SER-1020", type: "Repair",    client: "DigiPrint Studios",    asset: "Epson SureColor T5470",    contractPO: "REP-2026-054",  engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Jun 14, 2026", daysLeft: 24,  sla: "86.0%", status: "In Progress", region: "South" },
  { id: "SER-1021", type: "Rental",    client: "RetailEdge Corp.",     asset: "Dell OptiPlex 7010",       contractPO: "RENT-2026-031", engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "Aug 10, 2026", daysLeft: 81,  sla: "–",     status: "Active",      region: "North" },
  { id: "SER-1022", type: "AMC",       client: "InfoSec Partners",     asset: "Cisco Firewall ASA5505",   contractPO: "AMC-2026-007",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jul 10, 2026", daysLeft: 50,  sla: "96.8%", status: "Active",      region: "West"  },
  { id: "SER-1023", type: "Repair",    client: "AutoDrive Ltd.",       asset: "HP DesignJet Z6",          contractPO: "REP-2026-055",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 07, 2026", daysLeft: 17,  sla: "89.2%", status: "Pending",     region: "East"  },
  { id: "SER-1024", type: "Recycling", client: "EcoCycle India",       asset: "UPS & Battery Packs",      contractPO: "REC-2026-019",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "South" },
  { id: "SER-1025", type: "AMC",       client: "NexGen Banking",       asset: "Dell PowerVault ME5024",   contractPO: "AMC-2026-008",  engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Jul 30, 2026", daysLeft: 70,  sla: "98.0%", status: "Active",      region: "North" },
  { id: "SER-1026", type: "Repair",    client: "SkyLine Hotels",       asset: "Zebra ZD421 Printer",      contractPO: "REP-2026-056",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 18, 2026", daysLeft: 28,  sla: "93.7%", status: "In Progress", region: "West"  },
  { id: "SER-1027", type: "Rental",    client: "BioLife Sciences",     asset: "Dell Latitude 7440",       contractPO: "RENT-2026-032", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Aug 20, 2026", daysLeft: 91,  sla: "–",     status: "Active",      region: "East"  },
  { id: "SER-1028", type: "AMC",       client: "FastTrack Couriers",   asset: "HP EliteBook 840 G9",      contractPO: "AMC-2026-009",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jul 08, 2026", daysLeft: 48,  sla: "97.9%", status: "Active",      region: "South" },
  { id: "SER-1029", type: "Repair",    client: "TexFab Industries",    asset: "Canon PIXMA TR8620",       contractPO: "REP-2026-057",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 02, 2026", daysLeft: 12,  sla: "85.5%", status: "Pending",     region: "North" },
  { id: "SER-1030", type: "Recycling", client: "GreenWorks Corp.",     asset: "CCTV & AV Equipment",      contractPO: "REC-2026-020",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "West"  },
  { id: "SER-1031", type: "AMC",       client: "DataVault Systems",    asset: "Dell EMC PowerStore 500T", contractPO: "AMC-2026-010",  engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Aug 05, 2026", daysLeft: 76,  sla: "99.1%", status: "Active",      region: "East"  },
  { id: "SER-1032", type: "Repair",    client: "ProBuild Ltd.",        asset: "HP PageWide Pro 477",      contractPO: "REP-2026-058",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 20, 2026", daysLeft: 30,  sla: "94.2%", status: "In Progress", region: "South" },
  { id: "SER-1033", type: "Rental",    client: "FinCorp Advisory",     asset: "Dell Vostro 3510",         contractPO: "RENT-2026-033", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Sep 01, 2026", daysLeft: 103, sla: "–",     status: "Active",      region: "North" },
  { id: "SER-1034", type: "AMC",       client: "AgriTech Ventures",    asset: "Cisco Catalyst 2960",      contractPO: "AMC-2026-011",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jul 25, 2026", daysLeft: 65,  sla: "96.5%", status: "Active",      region: "West"  },
  { id: "SER-1035", type: "Recycling", client: "SmartCity Corp.",      asset: "Thin Client Fleet",        contractPO: "REC-2026-021",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "East"  },
  { id: "SER-1036", type: "Repair",    client: "SpeedNet ISP",         asset: "Juniper SRX300 Router",    contractPO: "REP-2026-059",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 22, 2026", daysLeft: 32,  sla: "87.8%", status: "In Progress", region: "South" },
  { id: "SER-1037", type: "AMC",       client: "HorizonEdu Trust",     asset: "Dell Chromebook 3100",     contractPO: "AMC-2026-012",  engineer: "Neha Kapoor",  engineerInitials: "NK", engineerColor: "bg-teal-500",   nextDueDate: "Aug 12, 2026", daysLeft: 83,  sla: "98.5%", status: "Active",      region: "North" },
  { id: "SER-1038", type: "Rental",    client: "EventPro India",       asset: "Dell Venue 8 Pro Tablet",  contractPO: "RENT-2026-034", engineer: "Priya Shah",   engineerInitials: "PS", engineerColor: "bg-pink-500",   nextDueDate: "Sep 15, 2026", daysLeft: 117, sla: "–",     status: "Active",      region: "West"  },
  { id: "SER-1039", type: "Repair",    client: "ClearVision Optics",   asset: "HP Envy 6055e Printer",    contractPO: "REP-2026-060",  engineer: "Sanjay Patel", engineerInitials: "SP", engineerColor: "bg-orange-500", nextDueDate: "Jun 25, 2026", daysLeft: 35,  sla: "92.9%", status: "Pending",     region: "East"  },
  { id: "SER-1040", type: "AMC",       client: "TechCore Solutions",   asset: "Dell PowerEdge R350",      contractPO: "AMC-2026-013",  engineer: "Rahul Kumar",  engineerInitials: "RK", engineerColor: "bg-blue-500",   nextDueDate: "Jul 18, 2026", daysLeft: 58,  sla: "99.0%", status: "Active",      region: "South" },
  { id: "SER-1041", type: "Recycling", client: "BlueOcean Pvt. Ltd.",  asset: "Legacy Server Room",       contractPO: "REC-2026-022",  engineer: "Amit Singh",   engineerInitials: "AS", engineerColor: "bg-green-500",  nextDueDate: "–",            daysLeft: null, sla: "N/A",   status: "Completed",   region: "North" },
  { id: "SER-1042", type: "Repair",    client: "PharmaLink India",     asset: "Epson WorkForce WF-4830",  contractPO: "REP-2026-061",  engineer: "Vikram Yadav", engineerInitials: "VY", engineerColor: "bg-purple-500", nextDueDate: "Jun 30, 2026", daysLeft: 40,  sla: "88.0%", status: "In Progress", region: "West"  },
];

const SERVICE_TYPE_STYLE: Record<ServiceType, string> = {
  AMC:       "bg-blue-100 text-blue-700",
  Repair:    "bg-orange-100 text-orange-600",
  Rental:    "bg-green-100 text-green-700",
  Recycling: "bg-purple-100 text-purple-700",
};

const STATUS_STYLE: Record<ServiceStatus, string> = {
  Active:       "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed:    "bg-gray-100 text-gray-600",
  Pending:      "bg-orange-100 text-orange-600",
};

const SERVICE_TYPES = ["All", "AMC", "Repair", "Rental", "Recycling"];
const STATUSES      = ["All", "Active", "In Progress", "Completed", "Pending"];
const CLIENTS       = ["All", ...Array.from(new Set(ALL_SERVICES.map(s => s.client))).sort()];
const REGIONS       = ["All", "North", "South", "East", "West"];
const ENGINEERS     = ["All", ...Array.from(new Set(ALL_SERVICES.map(s => s.engineer))).sort()];
const DATE_OPTS     = ["This Year", "Last Year", "Last 6 Months", "Last 3 Months", "All Time"];
const PAGE_SIZES    = [10, 25, 50];

function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[120px]">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function VendorServicesPage() {
  const [typeFilter,     setTypeFilter]     = useState("All");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [clientFilter,   setClientFilter]   = useState("All");
  const [regionFilter,   setRegionFilter]   = useState("All");
  const [engineerFilter, setEngineerFilter] = useState("All");
  const [dateRange,      setDateRange]      = useState("This Year");
  const [page,           setPage]           = useState(1);
  const [pageSize,       setPageSize]       = useState(10);

  const filtered = useMemo(() => {
    return ALL_SERVICES.filter(s => {
      if (typeFilter     !== "All" && s.type     !== typeFilter)     return false;
      if (statusFilter   !== "All" && s.status   !== statusFilter)   return false;
      if (clientFilter   !== "All" && s.client   !== clientFilter)   return false;
      if (regionFilter   !== "All" && s.region   !== regionFilter)   return false;
      if (engineerFilter !== "All" && s.engineer !== engineerFilter) return false;
      return true;
    });
  }, [typeFilter, statusFilter, clientFilter, regionFilter, engineerFilter, dateRange]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = () => setPage(1);

  const active      = ALL_SERVICES.filter(s => s.status === "Active").length;
  const amc         = ALL_SERVICES.filter(s => s.type   === "AMC").length;
  const rental      = ALL_SERVICES.filter(s => s.type   === "Rental").length;
  const openReqs    = ALL_SERVICES.filter(s => s.status === "In Progress" || s.status === "Pending").length;
  const completed   = ALL_SERVICES.filter(s => s.status === "Completed").length;

  const stats = [
    { label: "Active Services",       value: String(active),    sub: "View all active",    icon: <Wrench      className="w-5 h-5 text-green-500"  />, bg: "bg-green-50",  onClick: () => { setStatusFilter("Active");      reset(); } },
    { label: "AMC Contracts",         value: String(amc),       sub: "View AMC list",      icon: <FileCheck   className="w-5 h-5 text-blue-500"   />, bg: "bg-blue-50",   onClick: () => { setTypeFilter("AMC");           reset(); } },
    { label: "Rental Assets",         value: String(rental),    sub: "View rental list",   icon: <Boxes       className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50", onClick: () => { setTypeFilter("Rental");        reset(); } },
    { label: "Open Service Requests", value: String(openReqs),  sub: "View open tickets",  icon: <Ticket      className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50", onClick: () => { setStatusFilter("In Progress"); reset(); } },
    { label: "Completed This Month",  value: String(completed), sub: "View completed",     icon: <CheckCircle className="w-5 h-5 text-teal-500"   />, bg: "bg-teal-50",   onClick: () => { setStatusFilter("Completed");   reset(); } },
    { label: "Service Revenue",       value: "₹1.85 Cr",        sub: "This Financial Year", icon: <IndianRupee className="w-5 h-5 text-yellow-600" />, bg: "bg-yellow-50", onClick: () => {} },
  ];

  const pageNums = (() => {
    const nums: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) nums.push(i);
      if (page < totalPages - 2) nums.push("…");
      nums.push(totalPages);
    }
    return nums;
  })();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1280px] mx-auto px-6 py-5 space-y-4">

        {/* Stat cards */}
        <div className="grid grid-cols-6 gap-4">
          {stats.map(s => (
            <button key={s.label} onClick={s.onClick} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left hover:border-blue-200 hover:shadow-md transition-all group">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
              <p className="text-xs text-blue-500 font-medium group-hover:underline">{s.sub}</p>
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-end gap-3 flex-wrap">
            <FilterSelect label="Service Type" value={typeFilter}     options={SERVICE_TYPES} onChange={v => { setTypeFilter(v);     reset(); }} />
            <FilterSelect label="Status"       value={statusFilter}   options={STATUSES}      onChange={v => { setStatusFilter(v);   reset(); }} />
            <FilterSelect label="Client"       value={clientFilter}   options={CLIENTS}       onChange={v => { setClientFilter(v);   reset(); }} />
            <FilterSelect label="Region"       value={regionFilter}   options={REGIONS}       onChange={v => { setRegionFilter(v);   reset(); }} />
            <FilterSelect label="Engineer"     value={engineerFilter} options={ENGINEERS}     onChange={v => { setEngineerFilter(v); reset(); }} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Date Range</label>
              <div className="relative">
                <select value={dateRange} onChange={e => { setDateRange(e.target.value); reset(); }}
                  className="appearance-none border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[130px]">
                  {DATE_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Reset filters */}
            {(typeFilter !== "All" || statusFilter !== "All" || clientFilter !== "All" || regionFilter !== "All" || engineerFilter !== "All") && (
              <button onClick={() => { setTypeFilter("All"); setStatusFilter("All"); setClientFilter("All"); setRegionFilter("All"); setEngineerFilter("All"); reset(); }}
                className="self-end px-3.5 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Reset filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  {["Service ID", "Service Type", "Client", "Asset / Equipment", "Contract / PO", "Assigned Engineer", "Next Due Date", "SLA", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">No services match the selected filters.</td></tr>
                ) : paginated.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold cursor-pointer hover:underline">{s.id}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SERVICE_TYPE_STYLE[s.type]}`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 font-medium">{s.client}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">{s.asset}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-blue-600 font-medium cursor-pointer hover:underline">{s.contractPO}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${s.engineerColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {s.engineerInitials}
                        </div>
                        <span className="text-gray-700">{s.engineer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {s.nextDueDate === "–" ? (
                        <span className="text-gray-300">–</span>
                      ) : (
                        <div>
                          <p className="text-gray-700 font-medium">{s.nextDueDate}</p>
                          {s.daysLeft !== null && (
                            <p className={`text-xs font-medium ${s.daysLeft <= 20 ? "text-orange-500" : "text-green-600"}`}>
                              ({s.daysLeft} days left)
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 font-medium">{s.sla}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of{" "}
              <span className="font-semibold text-gray-700">{filtered.length}</span> services
            </p>

            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">
                ‹
              </button>
              {pageNums.map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === n ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {n}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">
                ›
              </button>
            </div>

            <div className="relative">
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {PAGE_SIZES.map(sz => <option key={sz} value={sz}>{sz} / page</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
