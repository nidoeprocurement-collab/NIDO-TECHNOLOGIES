import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Users,
  DollarSign,
  Construction,
  ShoppingCart,
  Building2,
  Globe,
  ChevronRight,
  FileText,
  Clock,
  MoreVertical,
  UserPlus,
  Upload,
  X,
  CheckCircle,
  Timer,
} from "lucide-react";

const monthlySpend = [
  { month: "Jan", value: 18000 },
  { month: "Feb", value: 22000 },
  { month: "Mar", value: 19000 },
  { month: "Apr", value: 25000 },
  { month: "May", value: 21000 },
  { month: "Jun", value: 28000 },
  { month: "Jul", value: 32000 },
  { month: "Aug", value: 38000 },
  { month: "Sep", value: 45000 },
  { month: "Oct", value: 52000 },
  { month: "Nov", value: 58000 },
  { month: "Dec", value: 60000 },
];

const spendCategories = [
  { name: "Hardware", value: 45, amount: "$200,250", color: "#3b82f6" },
  { name: "Software", value: 30, amount: "$30,300", color: "#22c55e" },
  { name: "Service", value: 15, amount: "$15,300", color: "#f97316" },
  { name: "Other", value: 10, amount: "$10,500", color: "#a855f7" },
];

const tabs = ["Overview", "Roles", "Users", "Orders", "Services", "Catalog", "Activity", "Configuration"];

function DonutChart({ categories, size }: { categories: typeof spendCategories; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.28;
  const total = categories.reduce((s, c) => s + c.value, 0);
  let angle = -Math.PI / 2;

  const slices = categories.map((cat) => {
    const sweep = (cat.value / total) * 2 * Math.PI;
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle + sweep);
    const y2 = cy + outerR * Math.sin(angle + sweep);
    const ix1 = cx + innerR * Math.cos(angle + sweep);
    const iy1 = cy + innerR * Math.sin(angle + sweep);
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
    angle += sweep;
    return { d, color: cat.color, name: cat.name };
  });

  return (
    <svg width={size} height={size}>
      {slices.map((s) => (
        <path key={s.name} d={s.d} fill={s.color} stroke="white" strokeWidth={1} />
      ))}
    </svg>
  );
}

const roles = [
  {
    name: "Administrator",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Full system with all permissions",
    dataVisibility: "All",
    canApprove: "No",
    approvalLimit: "—",
    icon: "A",
    iconBg: "bg-blue-500",
  },
  {
    name: "Procurement Manager",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Manage purchase orders and vendor relationships",
    dataVisibility: "All",
    canApprove: "Yes",
    approvalLimit: "₹500,000",
    icon: "PM",
    iconBg: "bg-purple-500",
  },
  {
    name: "Procurement Specialist",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Create and manage purchase orders",
    dataVisibility: "All",
    canApprove: "No",
    approvalLimit: "₹0",
    icon: "PS",
    iconBg: "bg-indigo-400",
  },
  {
    name: "Accounts Payable Officer",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Handle invoices, payments, and vendor credits",
    dataVisibility: "All",
    canApprove: "Yes",
    approvalLimit: "₹50,000",
    icon: "AP",
    iconBg: "bg-teal-500",
  },
  {
    name: "Finance Manager",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Full financial operations access",
    dataVisibility: "All",
    canApprove: "Yes",
    approvalLimit: "₹5,00,000",
    icon: "FM",
    iconBg: "bg-green-500",
  },
  {
    name: "Employee",
    badge: "Internal User",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Basic access to dashboard and shop",
    dataVisibility: "Department Only",
    canApprove: "No",
    approvalLimit: "₹0",
    icon: "E",
    iconBg: "bg-gray-400",
  },
  {
    name: "Client Administrator",
    badge: "Client User",
    badgeColor: "bg-orange-100 text-orange-700",
    desc: "Admin access for client account",
    dataVisibility: "All",
    canApprove: "Yes",
    approvalLimit: "₹1,000,000",
    icon: "CA",
    iconBg: "bg-orange-500",
  },
  {
    name: "Client User",
    badge: "Client User",
    badgeColor: "bg-orange-100 text-orange-700",
    desc: "Standard client account access",
    dataVisibility: "Own Only",
    canApprove: "No",
    approvalLimit: "₹0",
    icon: "CU",
    iconBg: "bg-orange-400",
  },
  {
    name: "Vendor Administrator",
    badge: "Vendor User",
    badgeColor: "bg-green-100 text-green-700",
    desc: "Vendor account admin with full access",
    dataVisibility: "Own Only",
    canApprove: "No",
    approvalLimit: "₹0",
    icon: "VA",
    iconBg: "bg-emerald-500",
  },
  {
    name: "Vendor User",
    badge: "Vendor User",
    badgeColor: "bg-green-100 text-green-700",
    desc: "Vendor staff member with limited access",
    dataVisibility: "Own Only",
    canApprove: "No",
    approvalLimit: "₹0",
    icon: "VU",
    iconBg: "bg-emerald-400",
  },
];

const modules = [
  "Dashboard",
  "Purchase Orders",
  "Shop",
  "Vendors",
  "Clients",
  "Inventory",
  "Transactions",
  "Invoices",
  "Reports & Analytics",
  "Configuration",
  "Approvals",
  "Audit Trail",
  "Notifications",
  "User Management",
];

type Access = "full" | "view" | "own" | "—";

const matrixColumns = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];

const matrixData: Record<string, Access[]> = {
  Dashboard: ["full", "—", "—", "—", "—", "view"],
  "Purchase Orders": ["full", "full", "full", "full", "full", "full"],
  Shop: ["full", "full", "full", "—", "—", "view"],
  Vendors: ["full", "full", "full", "full", "—", "full"],
  Clients: ["full", "full", "full", "full", "—", "full"],
  Inventory: ["full", "full", "full", "—", "—", "view"],
  Transactions: ["full", "—", "—", "—", "full", "full"],
  Invoices: ["full", "full", "full", "full", "full", "full"],
  "Reports & Analytics": ["full", "—", "—", "—", "—", "full"],
  Configuration: ["full", "full", "full", "full", "—", "—"],
  Approvals: ["full", "—", "—", "—", "full", "view"],
  "Audit Trail": ["full", "—", "—", "—", "—", "full"],
  Notifications: ["full", "full", "full", "—", "—", "—"],
  "User Management": ["full", "full", "full", "full", "—", "—"],
};

const permissionSummary = [
  {
    module: "Dashboard",
    permissions: ["create", "edit", "view", "delete"],
  },
  {
    module: "Purchase Orders",
    permissions: ["approve", "create", "edit", "view", "delete"],
  },
  {
    module: "Shop",
    permissions: ["create", "edit", "view", "delete"],
  },
  {
    module: "Vendors",
    permissions: ["approve", "create", "edit", "view"],
  },
  {
    module: "Clients",
    permissions: ["approve", "create", "view"],
  },
  {
    module: "Inventory",
    permissions: ["create", "edit", "view", "delete"],
  },
  {
    module: "Transactions",
    permissions: ["approve", "edit", "view"],
  },
  {
    module: "Invoices",
    permissions: ["approve", "create", "edit", "view"],
  },
  {
    module: "Reports & Analytics",
    permissions: ["create", "edit", "view"],
  },
  {
    module: "Configuration",
    permissions: ["configure", "view"],
  },
  {
    module: "Approvals",
    permissions: ["approve", "edit", "view"],
  },
  {
    module: "User Management",
    permissions: ["configure", "create", "edit", "view"],
  },
];

const comparisonRoles = [
  "System Administrator",
  "Procurement Manager",
  "Accounts Payable Officer",
  "Finance Manager",
  "Employee",
  "Client Administrator",
  "Client User",
  "Vendor Administrator",
  "Vendor User",
];

const comparisonAttrs = [
  { label: "Type", values: ["Internal User", "Internal User", "Internal User", "Internal User", "Internal User", "Client User", "Client User", "Vendor User", "Vendor User"] },
  { label: "Data Visibility", values: ["All", "All", "All", "All", "Department Only", "All", "Own Only", "Own Only", "Own Only"] },
  { label: "Can Approve", values: ["Yes", "Yes", "Yes", "Yes", "No", "Yes", "No", "No", "No"] },
  { label: "Approval Limit", values: ["₹500,000", "₹200,000", "₹100,000", "₹200,000", "₹0", "₹1,000,000", "₹0", "₹0", "₹0"] },
  { label: "Module Access", values: ["14 modules", "10 modules", "8 modules", "8 modules", "3 modules", "6 modules", "3 modules", "4 modules", "2 modules"] },
];

function AccessDot({ type }: { type: Access }) {
  if (type === "—") return <span className="text-gray-300 text-xs">—</span>;
  const color = type === "full" ? "bg-green-400" : type === "view" ? "bg-blue-400" : "bg-orange-400";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

const defaultRoleModules = [
  "Dashboard",
  "Purchase Orders",
  "Shop",
  "Vendors",
  "Clients",
  "Inventory",
  "Transactions",
  "Invoices",
  "Reports & Analytics",
  "Configuration",
  "Approvals",
  "Audit Trail",
  "Notifications",
  "User Management",
];

const permissionCols = ["View", "Create", "Edit", "Delete", "Approve", "Export"];

type PermRow = Record<string, boolean>;

function CircleCheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors mx-auto ${
        checked ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white hover:border-blue-300"
      }`}
    >
      {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  );
}

function NewRolePage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "Internal User",
    description: "",
    active: true,
    isDefault: false,
    dataVisibility: "All Data",
    locationAccess: "All Locations",
    canApproveOrders: false,
  });

  const [modules, setModules] = useState<string[]>(defaultRoleModules);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");

  const initPerms = (mods: string[]): Record<string, PermRow> => {
    const out: Record<string, PermRow> = {};
    mods.forEach((m) => {
      const row: PermRow = {};
      permissionCols.forEach((c) => { row[c] = false; });
      out[m] = row;
    });
    return out;
  };

  const [perms, setPerms] = useState<Record<string, PermRow>>(() => initPerms(defaultRoleModules));

  const togglePerm = (mod: string, col: string) =>
    setPerms((prev) => ({ ...prev, [mod]: { ...prev[mod], [col]: !prev[mod][col] } }));

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const addModule = () => {
    const name = newModuleName.trim();
    if (!name || modules.includes(name)) return;
    setModules((prev) => [...prev, name]);
    setPerms((prev) => {
      const row: PermRow = {};
      permissionCols.forEach((c) => { row[c] = false; });
      return { ...prev, [name]: row };
    });
    setNewModuleName("");
    setShowAddModule(false);
  };

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Add New Role</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Role Information */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </span>
          <p className="text-xs font-semibold text-gray-700">Role Information</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Row 1: Name + Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-blue-600 mb-1">Role Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. Procurement Manager"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-blue-600 mb-1">Role Code <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.code}
                onChange={setField("code")}
                placeholder="e.g. PM"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Role Type */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Role Type</label>
            <div className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-600 select-none">
              {form.type}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={setField("description")}
              placeholder="Describe the purpose and responsibilities of this role"
              rows={2}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 resize-none"
            />
          </div>

          {/* Active toggle + Default Role */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.active ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-xs text-gray-600">{form.active ? "Active" : "Inactive"}</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={() => setForm((p) => ({ ...p, isDefault: !p.isDefault }))}
                className="rounded border-gray-300 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-gray-600">Set as Default Role</span>
            </label>
          </div>
        </div>
      </div>

      {/* Module Permissions */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </span>
            <p className="text-xs font-semibold text-gray-700">Module Permissions</p>
          </div>
          <button
            onClick={() => setShowAddModule((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors font-medium"
          >
            <span className="text-sm leading-none">+</span> Add Module
          </button>
        </div>

        {showAddModule && (
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/40 flex items-center gap-2">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              placeholder="Enter module name..."
              autoFocus
              className="flex-1 px-3 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 bg-white"
            />
            <button
              onClick={addModule}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddModule(false); setNewModuleName(""); }}
              className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wide">MODULE</th>
              {permissionCols.map((col) => (
                <th key={col} className="text-center px-3 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, i) => (
              <tr key={mod} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-4 py-2.5 text-gray-700 text-[11px] font-medium">{mod}</td>
                {permissionCols.map((col) => (
                  <td key={col} className="px-3 py-2.5 text-center">
                    <CircleCheck
                      checked={!!perms[mod]?.[col]}
                      onChange={() => togglePerm(mod, col)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom two-column section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Data Access Control */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </span>
            <p className="text-xs font-semibold text-gray-700">Data Access Control</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label className="block text-[11px] text-blue-600 mb-1">Data Visibility <span className="text-red-400">*</span></label>
              <select
                value={form.dataVisibility}
                onChange={setField("dataVisibility")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none text-gray-700"
              >
                <option>All Data</option>
                <option>Department Only</option>
                <option>Own Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-blue-600 mb-1">Location Access <span className="text-red-400">*</span></label>
              <select
                value={form.locationAccess}
                onChange={setField("locationAccess")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none text-gray-700"
              >
                <option>All Locations</option>
                <option>Home Location Only</option>
                <option>Assigned Locations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Approval Permissions */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </span>
            <p className="text-xs font-semibold text-gray-700">Approval Permissions</p>
          </div>
          <div className="p-4">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canApproveOrders}
                onChange={() => setForm((p) => ({ ...p, canApproveOrders: !p.canApproveOrders }))}
                className="mt-0.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
              />
              <div>
                <p className="text-xs font-medium text-gray-700">Can Approve Orders</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Enable order approvals for this role</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 pb-1">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          Create Role
        </button>
      </div>
    </div>
  );
}

function RolesPage() {
  const [showNewRole, setShowNewRole] = useState(false);

  if (showNewRole) return <NewRolePage onBack={() => setShowNewRole(false)} />;

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Roles Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRole(true)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            New Role
          </button>
          <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>

      {/* RBAC explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
        <span className="font-semibold">Role-Based Access Control (RBAC)</span> — Roles determine what users in this client can access and do in the system. Each role has specific permissions across modules. Users can only perform actions their role allows.
      </div>

      {/* Role cards grid */}
      <div className="grid grid-cols-3 gap-3">
        {roles.map((role) => (
          <div key={role.name} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full ${role.iconBg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {role.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{role.name}</p>
                  <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${role.badgeColor}`}>{role.badge}</span>
                </div>
              </div>
              <button className="text-gray-300 hover:text-gray-500 transition-colors">
                <FileText size={13} />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{role.desc}</p>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div>
                <p className="text-gray-400">Data Visibility</p>
                <p className="font-medium text-gray-700">{role.dataVisibility}</p>
              </div>
              <div>
                <p className="text-gray-400">Can Approve</p>
                <p className={`font-medium ${role.canApprove === "Yes" ? "text-green-600" : "text-red-400"}`}>{role.canApprove}</p>
              </div>
              <div>
                <p className="text-gray-400">Approval Limit</p>
                <p className="font-medium text-blue-600">{role.approvalLimit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Permission Matrix</h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] w-44">MODULE</th>
                {matrixColumns.map((col) => (
                  <th key={col} className="text-center px-3 py-2.5 font-semibold text-gray-600 text-[11px]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, i) => (
                <tr key={mod} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-2 text-gray-700 font-medium text-[11px]">{mod}</td>
                  {matrixData[mod].map((access, j) => (
                    <td key={j} className="text-center px-3 py-2">
                      <AccessDot type={access} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Permission Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          {permissionSummary.map((item) => (
            <div key={item.module} className="border border-gray-200 rounded-lg px-3 py-2.5 bg-white">
              <p className="text-[11px] font-semibold text-gray-700 mb-1.5">{item.module}</p>
              <div className="flex flex-wrap gap-1">
                {item.permissions.map((p) => (
                  <span key={p} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Comparison */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Role Comparison</h3>
        <p className="text-xs text-gray-400 mb-3">Compare permissions, restrictions, and capabilities across different roles to assign the right access level to your team members.</p>
        <p className="text-[11px] font-semibold text-gray-600 mb-2">Detailed Role Comparison</p>
        <div className="border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-[10px] min-w-max">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wide w-32">Attribute</th>
                {comparisonRoles.map((r) => (
                  <th key={r} className="text-left px-3 py-2.5 font-semibold text-gray-600 whitespace-nowrap">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonAttrs.map((attr, i) => (
                <tr key={attr.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">{attr.label}</td>
                  {attr.values.map((v, j) => (
                    <td key={j} className={`px-3 py-2 whitespace-nowrap ${v === "Yes" ? "text-green-600 font-medium" : v === "No" ? "text-red-400 font-medium" : "text-gray-700"}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const usersData = [
  { id: "7402c20a-a234-4593-b4c0-5de723bd6255", name: "Kevin Johnson", role: "Manager", email: "kevin.johnson@apex.com", phone: "+1-555-1102", lastActive: "2026-06-02T13:03:19.022Z", status: "Active", initials: "KJ", color: "bg-blue-500" },
  { id: "40a1ce03-730f-40a7-b006-25ef6c4d59b7", name: "Emma Clark", role: "IT Specialist", email: "emma.clark@apex.com", phone: "+1-555-1104", lastActive: "2026-06-01T13:03:19.022Z", status: "Active", initials: "EC", color: "bg-teal-500" },
  { id: "ec587a43-4639-4c31-96f8-fae1b56b7ef6", name: "Sarah Collins", role: "Procurement", email: "sarah.collins@apex.com", phone: "+1-555-1106", lastActive: "2026-05-30T13:03:19.022Z", status: "Active", initials: "SC", color: "bg-gray-500" },
  { id: "8e7c131b-3cfc-457d-9c1e-e919b0fd763d", name: "Michael Brown", role: "Accountant", email: "michael.brown@apex.com", phone: "+1-555-1107", lastActive: "2026-05-28T13:03:19.022Z", status: "Active", initials: "MB", color: "bg-blue-600" },
  { id: "e19bfa7d-0dea-4b78-a3e6-b0cb3fb7775f", name: "John Williams", role: "Sales Rep", email: "john.williams@apex.com", phone: "+1-555-1105", lastActive: "2026-05-31T13:03:19.022Z", status: "Pending", initials: "JW", color: "bg-indigo-500" },
  { id: "9fb6607a-7486-4525-94fe-f3f5889d5886", name: "Robert White", role: "Support Agent", email: "robert.white@apex.com", phone: "+1-555-1109", lastActive: "2026-05-26T13:03:19.022Z", status: "Pending", initials: "RW", color: "bg-orange-500" },
  { id: "33b222e9-d434-4dd4-b01c-304ef32492dd", name: "Linda Evans", role: "HR Specialist", email: "linda.evans@apex.com", phone: "+1-555-1110", lastActive: "2026-04-18T13:03:19.022Z", status: "Inactive", initials: "LE", color: "bg-teal-600" },
  { id: "0608fc5c-dc21-4888-a5b6-c823c8a09e4e", name: "Mark Thompson", role: "IT Director", email: "mark.thompson@apex.com", phone: "+1-555-1111", lastActive: "2026-02-02T13:03:19.022Z", status: "Inactive", initials: "MT", color: "bg-cyan-600" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle size={10} /> Active
    </span>
  );
  if (status === "Pending") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
      <Timer size={10} /> Pending
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">
      <X size={10} /> Inactive
    </span>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    role: "",
    orgAccess: "",
    status: "Active",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add User</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create a new user and define their{" "}
              <span className="text-orange-500">access</span>,{" "}
              <span className="text-blue-500">role</span> and{" "}
              <span className="text-blue-500">permissions</span>.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          <p className="text-xs font-semibold text-gray-800">Step 1: User Information</p>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blue-600 mb-1">User ID</label>
              <input
                type="text"
                value="UI-00009"
                disabled
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Auto-generated</p>
            </div>
            <div>
              <label className="block text-xs text-blue-600 mb-1">Employee ID <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.employeeId}
                onChange={set("employeeId")}
                placeholder="Enter employee ID"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blue-600 mb-1">User Type</label>
              <input
                type="text"
                value="Client User"
                disabled
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Default user type</p>
            </div>
            <div>
              <label className="block text-xs text-blue-600 mb-1">Full Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="Enter full name"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blue-600 mb-1">Email ID <span className="text-red-400">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="Enter email address"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-600 mb-1">Phone Number <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blue-600 mb-1">Job Title</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={set("jobTitle")}
                placeholder="Enter job title"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-600 mb-1">Role <span className="text-red-400">*</span></label>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600 bg-white appearance-none"
              >
                <option value="">Select role</option>
                <option>Administrator</option>
                <option>Procurement Manager</option>
                <option>Procurement Specialist</option>
                <option>Accounts Payable Officer</option>
                <option>Finance Manager</option>
                <option>Employee</option>
                <option>Client Administrator</option>
                <option>Client User</option>
              </select>
              <button className="text-[11px] text-blue-500 hover:underline mt-1">+ Add New Role</button>
            </div>
          </div>

          {/* Organization Access */}
          <div>
            <label className="block text-xs text-blue-600 mb-1">Organization Access <span className="text-red-400">*</span></label>
            <select
              value={form.orgAccess}
              onChange={set("orgAccess")}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-400 bg-white appearance-none"
            >
              <option value="">Search and select organizations</option>
              <option>Nitin Supplies HQ</option>
              <option>Nitin Supplies — South Division</option>
              <option>Nitin Supplies — North Division</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-0.5">You can select one or more organizations</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-blue-600 mb-1">Status <span className="text-red-400">*</span></label>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 bg-white appearance-none"
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadUserTemplate() {
  const headers = ["Employee ID", "Full Name", "Email ID", "Phone Number", "Job Title", "Role", "Organization Access", "Status"];
  const example = ["EMP-001", "John Doe", "john.doe@example.com", "+91 98765 43210", "Procurement Manager", "Client User", "Nitin Supplies HQ", "Active"];
  const csv = [headers.join(","), example.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "user_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function UsersPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const allIds = usersData.map((u) => u.id);
  const allChecked = selected.size === allIds.length;

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const total = usersData.length;
  const active = usersData.filter((u) => u.status === "Active").length;
  const pending = usersData.filter((u) => u.status === "Pending").length;
  const inactive = usersData.filter((u) => u.status === "Inactive").length;

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setHeaderMenuOpen(false); setRowMenu(null); }}>
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Users</h2>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setHeaderMenuOpen((v) => !v); setRowMenu(null); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {headerMenuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44" onClick={(e) => e.stopPropagation()}>
              {[
                { icon: <UserPlus size={13} />, label: "Add Users", action: () => { setShowAddUser(true); setHeaderMenuOpen(false); } },
                { icon: <Download size={13} />, label: "Export Users", action: () => setHeaderMenuOpen(false) },
                { icon: <Upload size={13} />, label: "Import Users", action: () => setHeaderMenuOpen(false) },
                { icon: <FileText size={13} />, label: "Download Template", action: () => { downloadUserTemplate(); setHeaderMenuOpen(false); } },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400">{icon}</span>{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Users size={16} className="text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{total}</p>
            <p className="text-[11px] text-gray-400">{active} Active</p>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Timer size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{pending}</p>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <X size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{inactive}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-3 py-3">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-gray-300 text-blue-500 cursor-pointer" />
              </th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">User ID</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Name / Role</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Email</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Phone</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Last Active</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {usersData.map((user, i) => (
              <tr key={user.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${selected.has(user.id) ? "bg-blue-50/40" : i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} className="rounded border-gray-300 text-blue-500 cursor-pointer" />
                </td>
                <td className="px-3 py-3">
                  <span className="text-blue-500 font-mono text-[10px] hover:underline cursor-pointer">{user.id}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {user.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-[11px]">{user.name}</p>
                      <p className="text-gray-400 text-[10px]">{user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Mail size={11} className="text-gray-400 shrink-0" />
                    {user.email}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Phone size={11} className="text-gray-400 shrink-0" />
                    {user.phone}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-500 font-mono text-[10px]">{user.lastActive}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-3 py-3 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === user.id ? null : user.id); setHeaderMenuOpen(false); }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <MoreVertical size={13} />
                  </button>
                  {rowMenu === user.id && (
                    <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-36" onClick={(e) => e.stopPropagation()}>
                      {["View Profile", "Edit User", "Reset Password", "Deactivate", "Remove"].map((action) => (
                        <button key={action} onClick={() => setRowMenu(null)} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${action === "Remove" ? "text-red-500" : "text-gray-700"}`}>
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ordersData = [
  { id: "ORD-2024-1245", date: "2024-05-28", items: 12, amount: "$125,000", vendor: "TechSupply Co", status: "Delivered" },
  { id: "ORD-2024-1233", date: "2024-05-20", items: 8, amount: "$45,000", vendor: "Office Essentials", status: "In Transit" },
  { id: "ORD-2024-1198", date: "2024-05-15", items: 5, amount: "$22,000", vendor: "CloudServe Inc", status: "Delivered" },
  { id: "ORD-2024-1187", date: "2024-05-10", items: 15, amount: "$89,000", vendor: "TechSupply Co", status: "Delivered" },
];

function OrderStatusBadge({ status }: { status: string }) {
  if (status === "Delivered") return (
    <span className="inline-flex items-center text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
      Delivered
    </span>
  );
  if (status === "In Transit") return (
    <span className="inline-flex items-center text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
      In Transit
    </span>
  );
  return (
    <span className="inline-flex items-center text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
      {status}
    </span>
  );
}

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ items: "", quantity: "", amount: "", deliveryDate: "", notes: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create New Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Items <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.items}
              onChange={set("items")}
              placeholder="e.g. Laptop, Monitor, Keyboard"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity <span className="text-red-400">*</span></label>
            <input
              type="number"
              value={form.quantity}
              onChange={set("quantity")}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-400">*</span></label>
            <input
              type="number"
              value={form.amount}
              onChange={set("amount")}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={set("deliveryDate")}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Additional notes for this order"
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-xs bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersPage() {
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const total = ordersData.length;

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => setRowMenu(null)}>
      {showCreateOrder && <CreateOrderModal onClose={() => setShowCreateOrder(false)} />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Order History</h2>
          <p className="text-xs text-gray-400 mt-0.5">View and manage all orders placed by this client.</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowCreateOrder(true); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span> New Order
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Order ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Vendor</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {ordersData.map((order, i) => (
              <tr key={order.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-4 py-3">
                  <span className="text-blue-500 hover:underline cursor-pointer font-medium">{order.id}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{order.date}</td>
                <td className="px-4 py-3 text-gray-700">{order.items} Items</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{order.amount}</td>
                <td className="px-4 py-3 text-gray-700">{order.vendor}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === order.id ? null : order.id); }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <MoreVertical size={13} />
                  </button>
                  {rowMenu === order.id && (
                    <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-36" onClick={(e) => e.stopPropagation()}>
                      {["View Details", "Edit Order", "Download Invoice", "Cancel Order"].map((action) => (
                        <button key={action} onClick={() => setRowMenu(null)} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${action === "Cancel Order" ? "text-red-500" : "text-gray-700"}`}>
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
          <p className="text-[11px] text-orange-500 font-medium">Showing 1 to {total} of {total} orders</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40"
              disabled={page === 1}
            >
              –
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const servicesData = [
  { id: "SRV-001", name: "Cloud Hosting Premium", provider: "CloudServe Inc", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$12,000/year", status: "Active", category: "Hosting" },
  { id: "SRV-002", name: "IT Support & Maintenance", provider: "TechSupply Co", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$24,000/year", status: "Active", category: "Support" },
  { id: "SRV-003", name: "Software Licenses", provider: "Microsoft", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$36,000/year", status: "Active", category: "Software" },
];

const serviceCategories = ["All", "Hosting", "Support", "Software", "Networking", "Security"];

function ServicesPage() {
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Category");
  const [page, setPage] = useState(1);

  const filtered = selectedCategory === "Category" || selectedCategory === "All"
    ? servicesData
    : servicesData.filter((s) => s.category === selectedCategory);

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setRowMenu(null); setCategoryOpen(false); }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold text-gray-900">Service History</h2>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
          <span className="text-base leading-none">+</span> Add Service
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filter
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setCategoryOpen((v) => !v); }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            {selectedCategory}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {categoryOpen && (
            <div className="absolute left-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-36" onClick={(e) => e.stopPropagation()}>
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat === "All" ? "Category" : cat); setCategoryOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${selectedCategory === cat || (cat === "All" && selectedCategory === "Category") ? "text-blue-600 font-medium" : "text-gray-700"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Service ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Service Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Provider</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Start Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">End Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((svc, i) => (
              <tr key={svc.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-4 py-3">
                  <span className="text-blue-500 hover:underline cursor-pointer font-medium">{svc.id}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{svc.name}</td>
                <td className="px-4 py-3">
                  <span className="text-blue-500 hover:underline cursor-pointer">{svc.provider}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{svc.startDate}</td>
                <td className="px-4 py-3 text-gray-700">{svc.endDate}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{svc.amount}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === svc.id ? null : svc.id); }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <MoreVertical size={13} />
                  </button>
                  {rowMenu === svc.id && (
                    <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-36" onClick={(e) => e.stopPropagation()}>
                      {["View Details", "Edit Service", "Renew Service", "Cancel Service"].map((action) => (
                        <button key={action} onClick={() => setRowMenu(null)} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${action === "Cancel Service" ? "text-red-500" : "text-gray-700"}`}>
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-gray-400">No services found for this category.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
          <p className="text-[11px] text-orange-500 font-medium">
            Showing 1 to {filtered.length} of {filtered.length} services
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40"
            >
              –
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const catalogProducts = [
  {
    sku: "PRD-001",
    name: "Dell Laptop XPS 15",
    category: "Hardware",
    roles: ["Admin", "IT Manager"],
    price: "₹21,004",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=40&h=40&fit=crop&auto=format",
  },
  {
    sku: "PRD-002",
    name: "Microsoft Office 365",
    category: "Software",
    roles: ["IT Manager", "Finance"],
    price: "₹83,375",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=40&h=40&fit=crop&auto=format",
  },
  {
    sku: "PRD-003",
    name: "Ergonomic Office Chair",
    category: "Accessories",
    roles: ["IT Staff", "Support"],
    price: "₹1,740",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=40&h=40&fit=crop&auto=format",
  },
];

const masterCatalogProducts = [
  { sku: "WH1000XM5/B", name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones", brand: "Sony", category: "Audio > Headphones", catalog: "Electronics Master Catalog", price: "₹12,331", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop&auto=format" },
  { sku: "MX-KEYS-ADV", name: "Logitech MX Keys Advanced Keyboard", brand: "Logitech", category: "Peripherals > Keyboards", catalog: "Electronics Master Catalog", price: "₹8,999", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=60&h=60&fit=crop&auto=format" },
  { sku: "DELL-U2722D", name: "Dell UltraSharp 27 USB-C Hub Monitor", brand: "Dell", category: "Displays > Monitors", catalog: "Electronics Master Catalog", price: "₹45,000", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=60&h=60&fit=crop&auto=format" },
  { sku: "ERGO-CH-001", name: "Herman Miller Aeron Chair", brand: "Herman Miller", category: "Furniture > Chairs", catalog: "Office Master Catalog", price: "₹1,20,000", img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=60&h=60&fit=crop&auto=format" },
];

const catalogRoleOptions = ["Admin", "IT Manager", "Finance", "IT Staff", "Support", "Procurement Manager", "Employee"];

type MasterProduct = typeof masterCatalogProducts[0];

function AddNewProductModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<MasterProduct[]>([]);
  const [role, setRole] = useState("");
  const [preference, setPreference] = useState("");
  const [preferences, setPreferences] = useState(["Preference 1", "Preference 2"]);
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);
  const [addingPref, setAddingPref] = useState(false);
  const [newPrefName, setNewPrefName] = useState("");

  const filtered = masterCatalogProducts.filter((p) =>
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())) &&
    !selectedProducts.some((s) => s.sku === p.sku)
  );

  const selectProduct = (p: MasterProduct) => {
    setSelectedProducts((prev) => [...prev, p]);
    setQuery("");
    setDropdownOpen(false);
  };

  const removeProduct = (sku: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const addNewPreference = () => {
    const name = newPrefName.trim();
    if (!name || preferences.includes(name)) return;
    setPreferences((prev) => [...prev, name]);
    setPreference(name);
    setNewPrefName("");
    setAddingPref(false);
    setPrefDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h2 className="text-sm font-semibold text-gray-900">Add New Product</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6" onClick={() => { setDropdownOpen(false); setPrefDropdownOpen(false); }}>
          {/* Search Product */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Search Product</p>
            <p className="text-xs text-blue-500 mb-3">Choose an item from the Master Catalog and add it to your client catalog.</p>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search for products in Master Catalog..."
                  className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {dropdownOpen && query && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400">No products found</p>
                  ) : filtered.map((p) => (
                    <button key={p.sku} onClick={() => selectProduct(p)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <img src={p.img} alt={p.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.sku} · {p.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Products list */}
          {selectedProducts.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Selected Product{selectedProducts.length > 1 ? "s" : ""}</p>
              <div className="flex flex-col gap-3">
                {selectedProducts.map((prod) => (
                  <div key={prod.sku} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <img src={prod.img} alt={prod.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{prod.name}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Selected
                          </span>
                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-2">
                            <div>
                              <p className="text-[10px] text-gray-400">SKU</p>
                              <p className="text-xs text-gray-700">{prod.sku}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-500">Brand</p>
                              <p className="text-xs text-blue-500">{prod.brand}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400">Category</p>
                              <p className="text-xs text-blue-500">{prod.category}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-500">Master Catalog</p>
                              <p className="text-xs text-blue-500">{prod.catalog}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeProduct(prod.sku)} className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium shrink-0">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-4">Product Details</p>
            <div className="flex flex-col gap-4">
              {/* Roles */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roles <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none text-gray-500 bg-white">
                    <option value="">Select role</option>
                    {catalogRoleOptions.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <p className="text-[10px] text-blue-500 mt-1">Choose the role this product will be available for.</p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                  <input
                    type="text"
                    value={selectedProducts.length === 1 ? selectedProducts[0].price.replace("₹", "") : selectedProducts.length > 1 ? "Multiple" : ""}
                    readOnly
                    placeholder="—"
                    className="w-full pl-7 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-300 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Price from Master Catalog (read-only).</p>
              </div>

              {/* Preferences — custom dropdown with Add new option */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferences <span className="text-red-400">*</span></label>
                <button
                  type="button"
                  onClick={() => { setPrefDropdownOpen((v) => !v); setAddingPref(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-left"
                >
                  <span className={preference ? "text-gray-700" : "text-gray-400"}>{preference || "Select preference"}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {prefDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                    {preferences.map((p) => (
                      <button key={p} onClick={() => { setPreference(p); setPrefDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${preference === p ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                        {p}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      {addingPref ? (
                        <div className="px-3 py-2 flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newPrefName}
                            onChange={(e) => setNewPrefName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addNewPreference()}
                            placeholder="Preference name..."
                            className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <button onClick={addNewPreference} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add</button>
                          <button onClick={() => { setAddingPref(false); setNewPrefName(""); }} className="px-2 py-1 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingPref(true)} className="w-full text-left px-4 py-2 text-xs text-blue-500 hover:bg-blue-50 transition-colors font-medium flex items-center gap-1.5">
                          <span className="text-sm leading-none">+</span> Add new preference
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-blue-500 mt-1">Choose a preference for this product.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Add Product</button>
        </div>
      </div>
    </div>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState("");
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState(catalogProducts.map((p) => ({ ...p, roles: [...p.roles] })));

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = products.length;
  const inStock = products.filter((p) => p.availability === "In Stock").length;
  const lowStock = products.filter((p) => p.availability === "Low Stock").length;
  const outOfStock = products.filter((p) => p.availability === "Out of Stock").length;

  const removeRole = (sku: string, role: string) => {
    setProducts((prev) =>
      prev.map((p) => p.sku === sku ? { ...p, roles: p.roles.filter((r) => r !== role) } : p)
    );
  };

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => setRowMenu(null)}>
      {showAddProduct && <AddNewProductModal onClose={() => setShowAddProduct(false)} />}
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-500">{inStock}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-orange-400">{lowStock}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-500">{outOfStock}</p>
        </div>
      </div>

      {/* Catalog table card */}
      <div className="border border-gray-200 rounded-xl bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Client Catalog</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={12} /> Bulk Import
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={12} /> Export
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowAddProduct(true); }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <span className="text-base leading-none">+</span> Add New Product
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, brand..."
              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">SKU</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Product</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-32">Category</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Roles</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-40">Selling Price (INR)</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Availability</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.sku} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0"
                      />
                      <span className="font-medium text-gray-800 text-[11px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.roles.map((role) => (
                        <span key={role} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          {role}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeRole(product.sku, role); }}
                            className="text-blue-400 hover:text-blue-700 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      product.availability === "In Stock"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : product.availability === "Low Stock"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-red-50 text-red-500 border-red-200"
                    }`}>
                      {product.availability}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === product.sku ? null : product.sku); }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <MoreVertical size={13} />
                    </button>
                    {rowMenu === product.sku && (
                      <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-36" onClick={(e) => e.stopPropagation()}>
                        {["View Product", "Edit Product", "Duplicate", "Remove"].map((action) => (
                          <button key={action} onClick={() => setRowMenu(null)} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${action === "Remove" ? "text-red-500" : "text-gray-700"}`}>
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">No products match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">Showing 1 to {filtered.length} of {filtered.length} products</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40"
            >
              –
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const activityItems = [
  {
    id: 1,
    title: "New order placed",
    description: <>Order #ORD-2024-1245 for $125,000</>,
    date: "2024-05-28 10:30 AM",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <ShoppingCart size={15} />,
  },
  {
    id: 2,
    title: "User added",
    description: <>Aaron Lee (EMP-001) added as <span className="text-blue-500">Admin</span></>,
    date: "2024-05-25 02:15 PM",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    icon: <UserPlus size={15} />,
  },
  {
    id: 3,
    title: "Contract updated",
    description: <>Contract period extended to <span className="text-blue-500">Dec 2025</span></>,
    date: "2024-05-20 11:00 AM",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    icon: <FileText size={15} />,
  },
];

function ActivityPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          View the latest <span className="text-blue-500">updates</span> and <span className="text-blue-500">actions</span> for this client.
        </p>
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {activityItems.map((item, i) => (
          <div key={item.id} className="flex gap-4">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 z-10`}>
                {item.icon}
              </div>
              {i < activityItems.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${i === activityItems.length - 1 ? "pb-2" : ""}`}>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{item.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar size={11} className="text-orange-400 shrink-0" />
                <span className="text-[11px] text-gray-400">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <p className="text-[11px] text-gray-500">Showing 1 to {activityItems.length} of {activityItems.length} activities</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40"
          >
            –
          </button>
          <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigurationPage() {
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailServices: true,
    sms: false,
  });

  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-5 flex flex-col gap-0">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Configuration</h2>

      {/* API Settings */}
      <div className="pb-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-blue-600 mb-3">API Settings</p>
        <label className="block text-xs text-gray-600 mb-1.5">API Key</label>
        <input
          type="password"
          defaultValue="supersecretapikey1234"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono tracking-widest text-gray-700"
        />
        <button className="mt-3 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Regenerate API Key
        </button>
      </div>

      {/* Notifications */}
      <div className="py-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-800 mb-3">Notifications</p>
        <div className="flex flex-col gap-2.5">
          {[
            { key: "emailOrders" as const, label: "Email notifications for orders" },
            { key: "emailServices" as const, label: "Email notifications for services" },
            { key: "sms" as const, label: "SMS notifications" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={() => toggle(key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-5">
        <p className="text-xs font-semibold text-gray-800 mb-3">Danger Zone</p>
        <button className="px-3 py-1.5 text-xs border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          Archive Client
        </button>
      </div>
    </div>
  );
}

function PlaceholderPage({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Construction size={28} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{tab}</h2>
        <p className="text-sm text-gray-400 mt-1">This section is ready — data coming soon.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const isOverview = activeTab === "Overview";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Page header */}
      <div className="px-6 pt-5 pb-0">
        <h1 className="text-lg font-semibold text-gray-900">Nitin Supplies</h1>
      </div>

      <div className="flex gap-0 p-4 pt-3 min-h-[calc(100vh-48px)]">
        {/* LEFT SIDEBAR — only on Overview */}
        {isOverview && sidebarVisible && (
          <aside className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 mr-4 h-fit relative">
            {/* Hide button */}
            <button
              onClick={() => setSidebarVisible(false)}
              title="Hide panel"
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500 flex items-center justify-center bg-white">
                <span className="text-blue-600 font-bold text-lg">NS</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">Nitin Supplies</p>
                <p className="text-xs text-gray-500">Premium Client • Since 2026</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span>nitinshetty@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span>080-4000017</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span>No address</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span>N/A</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                <Mail size={12} />
                Email
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                <Phone size={12} />
                Call
              </button>
            </div>

            {/* Contract Progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-600">Contract Progress</span>
                <span className="text-xs text-gray-500">0 days left</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Client meta */}
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-gray-500">Client Since</p>
                <p className="font-medium text-gray-800">Jun 2026</p>
              </div>
              <div>
                <p className="text-gray-500">Client ID</p>
                <p className="font-medium text-gray-800">CI-00020</p>
              </div>
            </div>

            {/* Download button */}
            <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Download size={13} />
              Download Profile
            </button>
          </aside>
        )}

        {/* Show sidebar button — visible when sidebar is hidden */}
        {isOverview && !sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            title="Show panel"
            className="mr-3 mt-1 w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Stats row — only on Overview */}
          {isOverview && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">24</p>
                    <p className="text-xs text-gray-400 mt-0.5">12 Active</p>
                    <p className="text-xs text-gray-400">3 Pending Invites</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign size={16} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spends</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">$101,000</p>
                    <p className="text-xs text-gray-400 mt-0.5">Year to date</p>
                    <p className="text-xs text-gray-400">Last Payment: $25,000</p>
                    <p className="text-xs text-gray-400">Jan 11, 2026</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <ShoppingCart size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open Orders</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">3</p>
                    <p className="text-xs text-gray-400 mt-0.5">$32,500 value</p>
                    <p className="text-xs text-gray-400">Contracts</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Non-overview tab content */}
          {!isOverview && (
            <div className="bg-white rounded-xl border border-gray-200 flex-1">
              {activeTab === "Roles" ? <RolesPage /> : activeTab === "Users" ? <UsersPage /> : activeTab === "Orders" ? <OrdersPage /> : activeTab === "Services" ? <ServicesPage /> : activeTab === "Catalog" ? <CatalogPage /> : activeTab === "Activity" ? <ActivityPage /> : activeTab === "Configuration" ? <ConfigurationPage /> : <PlaceholderPage tab={activeTab} />}
            </div>
          )}

          {/* Overview panels */}
          {isOverview && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {/* Company Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Company Details</h3>
                  <div className="flex flex-col gap-3 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 shrink-0" />
                      <span>Nitin Supplies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span>Technology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400 shrink-0" />
                      <span>51-200 employees</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Website</span>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400 shrink-0" />
                        <a href="#" className="text-blue-500 hover:underline">www.nitinsupplies.com</a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Phone</span>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span>080-4000017</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Billing Email</span>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <a href="#" className="text-blue-500 hover:underline">nitinshetty@gmail.com</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Spending Overview</h3>
                    <span className="text-xs border border-gray-200 rounded-md px-2 py-0.5 text-gray-500">This Year</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">$101,000</p>
                  <p className="text-xs text-gray-400 mb-1">Total Spend</p>
                  <p className="text-xs text-green-500 font-medium mb-3">+12.5% vs last year</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={monthlySpend} barSize={10} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Spend Categories */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Spend Categories</h3>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <DonutChart categories={spendCategories} size={100} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {spendCategories.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-gray-600">{cat.name} {cat.value}%</span>
                          </div>
                          <span className="text-gray-800 font-medium">{cat.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-3 gap-4">
                {/* User Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">User Summary</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <Users size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <p className="text-xs text-gray-400">Total Users</p>
                    </div>
                    <div className="flex gap-4 pb-1">
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-500">12</p>
                        <p className="text-xs text-gray-400">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-orange-400">4</p>
                        <p className="text-xs text-gray-400">Inactive</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Recent Orders</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <ShoppingCart size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-xs text-gray-400">Open Orders</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xl font-bold text-gray-900">$32,500</p>
                      <p className="text-xs text-gray-400">Total Value</p>
                    </div>
                  </div>
                </div>

                {/* Active Services */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Active Services</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <FileText size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">2</p>
                      <p className="text-xs text-gray-400">Active Contracts</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xl font-bold text-blue-500">0 days</p>
                      <p className="text-xs text-gray-400">Until Renewal</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
