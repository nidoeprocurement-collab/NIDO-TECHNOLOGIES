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
  Filter,
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

type RoleFormData = {
  name: string;
  code: string;
  type: string;
  description: string;
  active: boolean;
  isDefault: boolean;
  dataVisibility: string;
  locationAccess: string;
  canApproveOrders: boolean;
  approvalLimit: string;
};

function NewRolePage({ onBack, onSave, initialData, isEdit }: { onBack: () => void; onSave?: (data: RoleFormData) => void; initialData?: Partial<RoleFormData>; isEdit?: boolean }) {
  const [form, setForm] = useState<RoleFormData>({
    name: "",
    code: "",
    type: "Internal User",
    description: "",
    active: true,
    isDefault: false,
    dataVisibility: "All Data",
    locationAccess: "All Locations",
    canApproveOrders: false,
    approvalLimit: "",
    ...initialData,
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
        <h2 className="text-base font-semibold text-gray-900">{isEdit ? "Edit Role" : "Add New Role"}</h2>
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
          <div className="flex flex-col divide-y divide-gray-100">
            {/* Tab: Can Approve */}
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
            {/* Tab: Approval Limit */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-700 mb-1">Approval Limit</p>
              <p className="text-[11px] text-gray-400 mb-2">Maximum order amount this role can approve</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium select-none">₹</span>
                <input
                  type="number"
                  value={form.approvalLimit}
                  onChange={(e) => setForm((p) => ({ ...p, approvalLimit: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
                />
              </div>
              {form.approvalLimit && (
                <p className="text-[11px] text-blue-500 mt-1">
                  ₹{Number(form.approvalLimit).toLocaleString("en-IN")}
                </p>
              )}
            </div>
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
        <button
          onClick={() => { onSave?.(form); onBack(); }}
          className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {isEdit ? "Save Changes" : "Create Role"}
        </button>
      </div>
    </div>
  );
}

function RolesPage() {
  const [rolesState, setRolesState] = useState(roles);
  const [showNewRole, setShowNewRole] = useState(false);
  const [editingRole, setEditingRole] = useState<typeof roles[0] | null>(null);
  const [selectedRole, setSelectedRole] = useState<typeof roles[0] | null>(null);

  const handleSaveEdit = (data: RoleFormData) => {
    if (!editingRole) return;
    const badgeColorMap: Record<string, string> = {
      "Internal User": "bg-blue-100 text-blue-700",
      "Client User": "bg-orange-100 text-orange-700",
      "Vendor User": "bg-green-100 text-green-700",
    };
    const visMap: Record<string, string> = {
      "All Data": "All",
      "Department Only": "Department Only",
      "Own Only": "Own Only",
    };
    const limitNum = Number(data.approvalLimit);
    const formattedLimit = limitNum > 0
      ? `₹${limitNum.toLocaleString("en-IN")}`
      : "₹0";
    setRolesState((prev) =>
      prev.map((r) =>
        r.name === editingRole.name
          ? {
              ...r,
              name: data.name,
              icon: data.code || r.icon,
              badge: data.type,
              badgeColor: badgeColorMap[data.type] ?? r.badgeColor,
              desc: data.description,
              dataVisibility: visMap[data.dataVisibility] ?? data.dataVisibility,
              canApprove: data.canApproveOrders ? "Yes" : "No",
              approvalLimit: formattedLimit,
            }
          : r
      )
    );
  };

  if (showNewRole) return <NewRolePage onBack={() => setShowNewRole(false)} />;
  if (editingRole) return (
    <NewRolePage
      isEdit
      onBack={() => setEditingRole(null)}
      onSave={handleSaveEdit}
      initialData={{
        name: editingRole.name,
        code: editingRole.icon,
        type: editingRole.badge,
        description: editingRole.desc,
        active: true,
        dataVisibility: editingRole.dataVisibility === "All" ? "All Data" : editingRole.dataVisibility === "Own Only" ? "Own Only" : "Department Only",
        canApproveOrders: editingRole.canApprove === "Yes",
        approvalLimit: editingRole.approvalLimit.replace(/[₹,]/g, ""),
      }}
    />
  );

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
        {rolesState.map((role) => {
          const isSelected = selectedRole?.name === role.name;
          return (
            <div
              key={role.name}
              onClick={() => setSelectedRole(isSelected ? null : role)}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-400"
                  : "border-gray-200 bg-white hover:shadow-sm hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${role.iconBg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {role.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-blue-800" : "text-gray-900"}`}>{role.name}</p>
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${role.badgeColor}`}>{role.badge}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingRole(role); }}
                  title="Edit role"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <p className={`text-[11px] mb-3 leading-relaxed ${isSelected ? "text-blue-700" : "text-gray-500"}`}>{role.desc}</p>
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
          );
        })}
      </div>

      {/* Permission Matrix — only shown when a role is selected */}
      {selectedRole && (
        <>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${selectedRole.iconBg} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{selectedRole.icon}</div>
            <h3 className="text-sm font-semibold text-gray-900">Permission Matrix — {selectedRole.name}</h3>
          </div>
          <div className="border border-blue-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
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

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Permission Summary — {selectedRole.name}</h3>
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
        </>
      )}

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

const addUserDeviceOptions = [
  { sku: "MBP-14-M3-512", name: "Apple MacBook Pro (2023)", category: "Laptop", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=60&h=60&fit=crop&auto=format" },
  { sku: "IP15PRO-128-BLK", name: "Apple iPhone 15 Pro", category: "Mobile", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=60&h=60&fit=crop&auto=format" },
  { sku: "DELL-U2722D", name: "Dell UltraSharp 27\" Monitor", category: "Display", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=60&h=60&fit=crop&auto=format" },
  { sku: "LG-MX-KEYS-ADV", name: "Logitech MX Keys Keyboard", category: "Peripheral", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=60&h=60&fit=crop&auto=format" },
  { sku: "SONY-WH1000XM5", name: "Sony WH-1000XM5 Headphones", category: "Audio", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop&auto=format" },
  { sku: "IPAD-PRO-12-M4", name: "Apple iPad Pro 12.9\" (M4)", category: "Tablet", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=60&h=60&fit=crop&auto=format" },
  { sku: "HP-ELITEBOOK-840", name: "HP EliteBook 840 G11", category: "Laptop", img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=60&h=60&fit=crop&auto=format" },
  { sku: "SAM-GALAXY-S25", name: "Samsung Galaxy S25 Ultra", category: "Mobile", img: "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=60&h=60&fit=crop&auto=format" },
  { sku: "WEBCAM-LOGITECH-C920", name: "Logitech C920 HD Webcam", category: "Peripheral", img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=60&h=60&fit=crop&auto=format" },
  { sku: "DOCK-THUNDERBOLT-4", name: "CalDigit Thunderbolt 4 Dock", category: "Peripheral", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&auto=format" },
];

type AssignedDeviceEntry = {
  sku: string;
  name: string;
  category: string;
  img: string;
  serialNo: string;
  modelNo: string;
  referenceNo: string;
  assignedOn: string;
  status: "Active" | "In Repair";
};

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const modalTabs = ["Overview", "Permissions", "Expenses", "Assigned Devices"];

  const [form, setForm] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    reportingManager: "",
    gender: "",
    joiningDate: "",
    role:"",
    orgAccess: "",
    dataVisibility: "All Data",
    locationAccess: "All Locations",
    status: "Active",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  // Permissions
  const addUserModules = ["Dashboard", "Purchase Orders", "Shop", "Vendors", "Clients", "Inventory", "Transactions", "Invoices", "Reports & Analytics", "User Management"];
  const addUserPermCols = ["View", "Create", "Edit", "Delete", "Approve"];
  const initPerms = () => {
    const out: Record<string, Record<string, boolean>> = {};
    addUserModules.forEach((m) => {
      out[m] = {};
      addUserPermCols.forEach((c) => { out[m][c] = false; });
    });
    return out;
  };
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(initPerms);
  const togglePerm = (mod: string, col: string) =>
    setPerms((prev) => ({ ...prev, [mod]: { ...prev[mod], [col]: !prev[mod][col] } }));

  // Expenses
  const [expenseForm, setExpenseForm] = useState({
    monthlyLimit: "",
    annualLimit: "",
    currency: "INR",
    approvalRequired: true,
    approvalThreshold: "",
    categories: [] as string[],
  });
  const expenseCategories = ["Hardware", "Software", "Travel", "Furniture", "Accessories", "Training"];
  const toggleCategory = (cat: string) =>
    setExpenseForm((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));

  // Assigned Devices
  const [assignedDevices, setAssignedDevices] = useState<typeof addUserDeviceOptions>([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceDropOpen, setDeviceDropOpen] = useState(false);
  const filteredDeviceOptions = addUserDeviceOptions.filter(
    (d) =>
      (d.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        d.sku.toLowerCase().includes(deviceSearch.toLowerCase())) &&
      !assignedDevices.some((a) => a.sku === d.sku)
  );
  const assignDevice = (d: typeof addUserDeviceOptions[0]) => {
    setAssignedDevices((prev) => [...prev, d]);
    setDeviceSearch("");
    setDeviceDropOpen(false);
  };
  const removeDevice = (sku: string) =>
    setAssignedDevices((prev) => prev.filter((d) => d.sku !== sku));

  const inputCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 bg-white";
  const labelCls = "block text-xs text-blue-600 mb-1";
  const disabledCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-6 pt-5 pb-0 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
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
          {/* Tabs */}
          <div className="flex">
            {modalTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── OVERVIEW ── */}
          {activeTab === "Overview" && (
            <div className="flex flex-col gap-5">
              {/* Section: Personal Information */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Personal Information</p>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>User ID</label>
                      <input type="text" value="UI-00009" disabled className={disabledCls} />
                      <p className="text-[10px] text-gray-400 mt-0.5">Auto-generated</p>
                    </div>
                    <div>
                      <label className={labelCls}>Employee ID <span className="text-red-400">*</span></label>
                      <input type="text" value={form.employeeId} onChange={set("employeeId")} placeholder="e.g. EMP-001" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>User Type</label>
                      <input type="text" value="Client User" disabled className={disabledCls} />
                      <p className="text-[10px] text-gray-400 mt-0.5">Default user type</p>
                    </div>
                    <div>
                      <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                      <input type="text" value={form.fullName} onChange={set("fullName")} placeholder="Enter full name" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email ID <span className="text-red-400">*</span></label>
                      <input type="email" value={form.email} onChange={set("email")} placeholder="Enter email address" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number <span className="text-red-400">*</span></label>
                      <input type="text" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Job Title</label>
                      <input type="text" value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Procurement Manager" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <input type="text" value={form.department} onChange={set("department")} placeholder="e.g. Operations" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Reporting Manager</label>
                      <input type="text" value={form.reportingManager} onChange={set("reportingManager")} placeholder="e.g. John Smith" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select value={form.gender} onChange={set("gender")} className={inputCls + " appearance-none"}>
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Joining Date</label>
                      <input type="date" value={form.joiningDate} onChange={set("joiningDate")} className={inputCls + " text-gray-600"} />
                    </div>
                    <div>
                      <label className={labelCls}>Status <span className="text-red-400">*</span></label>
                      <select value={form.status} onChange={set("status")} className={inputCls + " appearance-none text-gray-700"}>
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Role & Access */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Role & Access</p>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Role <span className="text-red-400">*</span></label>
                      <select value={form.role} onChange={set("role")} className={inputCls + " appearance-none text-gray-600"}>
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
                    <div>
                      <label className={labelCls}>Organization Access <span className="text-red-400">*</span></label>
                      <select value={form.orgAccess} onChange={set("orgAccess")} className={inputCls + " appearance-none text-gray-500"}>
                        <option value="">Select organization</option>
                        <option>Nitin Supplies HQ</option>
                        <option>Nitin Supplies — South Division</option>
                        <option>Nitin Supplies — North Division</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Data Visibility</label>
                      <select value={form.dataVisibility} onChange={set("dataVisibility")} className={inputCls + " appearance-none text-gray-700"}>
                        <option>All Data</option>
                        <option>Department Only</option>
                        <option>Own Only</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Location Access</label>
                      <select value={form.locationAccess} onChange={set("locationAccess")} className={inputCls + " appearance-none text-gray-700"}>
                        <option>All Locations</option>
                        <option>Home Location Only</option>
                        <option>Assigned Locations</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PERMISSIONS ── */}
          {activeTab === "Permissions" && (
            <div className="flex flex-col gap-4">
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Module Permissions</p>
                  <p className="text-[10px] text-gray-400">Toggle access per module</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Module</th>
                      {addUserPermCols.map((col) => (
                        <th key={col} className="text-center px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wide">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addUserModules.map((mod, i) => (
                      <tr key={mod} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 text-gray-700 font-medium text-[11px]">{mod}</td>
                        {addUserPermCols.map((col) => (
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
            </div>
          )}

          {/* ── EXPENSES ── */}
          {activeTab === "Expenses" && (
            <div className="flex flex-col gap-5">
              {/* Limits */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Expense Limits</p>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Currency</label>
                      <select
                        value={expenseForm.currency}
                        onChange={(e) => setExpenseForm((p) => ({ ...p, currency: e.target.value }))}
                        className={inputCls + " appearance-none text-gray-700"}
                      >
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Monthly Limit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">₹</span>
                        <input
                          type="number"
                          value={expenseForm.monthlyLimit}
                          onChange={(e) => setExpenseForm((p) => ({ ...p, monthlyLimit: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className={inputCls + " pl-7"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Annual Limit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">₹</span>
                        <input
                          type="number"
                          value={expenseForm.annualLimit}
                          onChange={(e) => setExpenseForm((p) => ({ ...p, annualLimit: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className={inputCls + " pl-7"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval settings */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Approval Settings</p>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseForm.approvalRequired}
                      onChange={() => setExpenseForm((p) => ({ ...p, approvalRequired: !p.approvalRequired }))}
                      className="mt-0.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Require Approval</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Expenses above the threshold need manager approval</p>
                    </div>
                  </label>
                  {expenseForm.approvalRequired && (
                    <div className="max-w-xs">
                      <label className={labelCls}>Approval Threshold</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">₹</span>
                        <input
                          type="number"
                          value={expenseForm.approvalThreshold}
                          onChange={(e) => setExpenseForm((p) => ({ ...p, approvalThreshold: e.target.value }))}
                          placeholder="e.g. 5000"
                          min="0"
                          className={inputCls + " pl-7"}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Expenses above this amount trigger an approval request</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Allowed categories */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Allowed Expense Categories</p>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {expenseCategories.map((cat) => {
                      const active = expenseForm.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
                            active
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Leave all unselected to allow all categories</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ASSIGNED DEVICES ── */}
          {activeTab === "Assigned Devices" && (
            <div className="flex flex-col gap-5">
              {/* Search & assign */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Assign Devices</p>
                </div>
                <div className="p-4">
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input
                        type="text"
                        value={deviceSearch}
                        onChange={(e) => { setDeviceSearch(e.target.value); setDeviceDropOpen(true); }}
                        onFocus={() => setDeviceDropOpen(true)}
                        placeholder="Search device by name or SKU..."
                        className="w-full pl-8 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
                      />
                    </div>
                    {deviceDropOpen && deviceSearch && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                        {filteredDeviceOptions.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-gray-400">No devices found</p>
                        ) : filteredDeviceOptions.map((d) => (
                          <button
                            key={d.sku}
                            onClick={() => assignDevice(d)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img src={d.img} alt={d.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-800">{d.name}</p>
                              <p className="text-[10px] text-gray-400">{d.sku} · {d.category}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned device cards */}
              {assignedDevices.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {assignedDevices.map((device) => (
                    <div key={device.sku} className="border border-gray-200 rounded-xl p-4 flex items-start gap-4 bg-white">
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={device.img} alt={device.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-900 leading-snug">{device.name}</p>
                          <button
                            onClick={() => removeDevice(device.sku)}
                            className="text-[10px] text-red-500 hover:text-red-700 font-medium shrink-0 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{device.sku}</p>
                        <span className="inline-block mt-1.5 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{device.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2 border border-dashed border-gray-200 rounded-xl">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  <p className="text-xs text-gray-400">No devices assigned yet</p>
                  <p className="text-[11px] text-gray-300">Search and select devices above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            {modalTabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab ? "bg-blue-600" : "bg-gray-200"}`}
                title={tab}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Create User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadUserTemplate() {
  const headers = ["User ID", "Employee ID", "User Type", "Full Name", "Email ID", "Phone Number", "Job Title", "Role", "Organization Access", "Status"];
  const example = ["UI-00009", "EMP-001", "Client User", "John Doe", "john.doe@example.com", "+91 98765 43210", "Procurement Manager", "Client User", "Nitin Supplies HQ", "Active"];
  const csv = [headers.join(","), example.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "user_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportUsersCSV() {
  const headers = ["User ID", "Full Name", "Role", "Email", "Phone", "Last Active", "Status"];
  const rows = usersData.map((u, i) => [
    `UI-${String(i + 1).padStart(5, "0")}`,
    u.name,
    u.role,
    u.email,
    u.phone,
    new Date(u.lastActive).toLocaleDateString("en-US"),
    u.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const archivedUsersData = [
  { id: "arc-001", name: "David Kim", role: "Analyst", email: "david.kim@apex.com", phone: "+1-555-1201", lastActive: "2025-11-15T10:00:00.000Z", status: "Archived", archivedOn: "2025-12-01", reason: "Left company", initials: "DK", color: "bg-slate-500" },
  { id: "arc-002", name: "Priya Sharma", role: "Finance Officer", email: "priya.sharma@apex.com", phone: "+1-555-1202", lastActive: "2025-10-20T08:00:00.000Z", status: "Archived", archivedOn: "2025-11-01", reason: "Contract ended", initials: "PS", color: "bg-rose-400" },
  { id: "arc-003", name: "Tom Baker", role: "Support Lead", email: "tom.baker@apex.com", phone: "+1-555-1203", lastActive: "2025-09-05T14:30:00.000Z", status: "Archived", archivedOn: "2025-10-01", reason: "Role restructured", initials: "TB", color: "bg-amber-500" },
];

function ResetPasswordModal({ userName, onClose }: { userName: string; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = () => {
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setDone(true);
  };

  const inputCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 pr-9";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reset Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set a new password for <span className="font-medium text-gray-700">{userName}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {!done ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              {error && <p className="text-[11px] text-red-500">{error}</p>}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-[11px] text-blue-600">
                Password must be at least 8 characters and contain a mix of letters and numbers.
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Password Reset Successfully</p>
              <p className="text-xs text-gray-400 text-center">A confirmation email has been sent to the user.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button onClick={handleReset} className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Reset Password
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ArchivedUserDetailPage({ user, onBack }: { user: typeof archivedUsersData[0]; onBack: () => void }) {
  const formattedDate = new Date(user.lastActive).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Archived Users
        </button>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        This is an archived user — the profile is read-only and cannot be edited.
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${user.color} flex items-center justify-center text-white text-lg font-bold shrink-0 opacity-70`}>
            {user.initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-gray-700">{user.name}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                Archived
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{user.role}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><Mail size={11} className="text-gray-400" />{user.email}</div>
              <div className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{user.phone}</div>
              <div className="flex items-center gap-1.5"><Clock size={11} className="text-gray-400" />Last active {formattedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-700 mb-4">Archive Details</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
          {[
            { label: "Full Name", value: user.name },
            { label: "Role", value: user.role },
            { label: "Email", value: user.email },
            { label: "Phone", value: user.phone },
            { label: "Last Active", value: formattedDate },
            { label: "Archived On", value: user.archivedOn },
            { label: "Reason", value: user.reason },
            { label: "Status", value: "Archived" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-400 mb-0.5">{label}</p>
              <p className="text-gray-700 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type UserRecord = typeof usersData[0];

function EditUserPage({ user, onBack, onSave }: { user: UserRecord; onBack: () => void; onSave: (updated: UserRecord) => void }) {
  const modalTabs = ["Overview", "Permissions", "Expenses", "Assigned Devices"];
  const [activeTab, setActiveTab] = useState("Overview");

  const [form, setForm] = useState({
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    jobTitle: user.role,
    department: "",
    reportingManager: "",
    gender: "",
    joiningDate: "",
    role: user.role,
    orgAccess: "Nitin Supplies HQ",
    dataVisibility: "All Data",
    locationAccess: "All Locations",
    status: user.status,
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const addUserModules = ["Dashboard", "Purchase Orders", "Shop", "Vendors", "Clients", "Inventory", "Transactions", "Invoices", "Reports & Analytics", "User Management"];
  const addUserPermCols = ["View", "Create", "Edit", "Delete", "Approve"];
  const initPerms = () => {
    const out: Record<string, Record<string, boolean>> = {};
    addUserModules.forEach((m) => { out[m] = {}; addUserPermCols.forEach((c) => { out[m][c] = true; }); });
    return out;
  };
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(initPerms);
  const togglePerm = (mod: string, col: string) =>
    setPerms((prev) => ({ ...prev, [mod]: { ...prev[mod], [col]: !prev[mod][col] } }));

  const [expenseForm, setExpenseForm] = useState({ monthlyLimit: "50000", annualLimit: "500000", currency: "INR", approvalRequired: true, approvalThreshold: "5000", categories: [] as string[] });
  const expenseCategories = ["Hardware", "Software", "Travel", "Furniture", "Accessories", "Training"];
  const toggleCategory = (cat: string) =>
    setExpenseForm((p) => ({ ...p, categories: p.categories.includes(cat) ? p.categories.filter((c) => c !== cat) : [...p.categories, cat] }));

  const [assignedDevices, setAssignedDevices] = useState<typeof addUserDeviceOptions>([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceDropOpen, setDeviceDropOpen] = useState(false);
  const filteredDeviceOptions = addUserDeviceOptions.filter(
    (d) => (d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.sku.toLowerCase().includes(deviceSearch.toLowerCase())) && !assignedDevices.some((a) => a.sku === d.sku)
  );

  const handleSave = () => {
    const nameParts = form.fullName.trim().split(" ");
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : form.fullName.slice(0, 2).toUpperCase();
    onSave({ ...user, name: form.fullName || user.name, role: form.role || user.role, email: form.email || user.email, phone: form.phone || user.phone, status: form.status, initials });
    onBack();
  };

  const inputCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 bg-white";
  const labelCls = "block text-xs text-blue-600 mb-1";
  const disabledCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed";

  return (
    <div className="flex flex-col gap-0">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Editing <span className="font-medium text-gray-700">{user.name}</span> — update their{" "}
                <span className="text-orange-500">access</span>,{" "}
                <span className="text-blue-500">role</span> and{" "}
                <span className="text-blue-500">details</span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={onBack} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Save Changes</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex">
          {modalTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 px-6 py-5">

        {activeTab === "Overview" && (
          <div className="flex flex-col gap-5">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-xs font-semibold text-gray-700">Personal Information</p></div>
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>User ID</label>
                    <input type="text" value={`UI-${String(usersData.findIndex(u => u.id === user.id) + 1).padStart(5, "0")}`} disabled className={disabledCls} />
                    <p className="text-[10px] text-gray-400 mt-0.5">Auto-generated</p>
                  </div>
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.fullName} onChange={set("fullName")} placeholder="Enter full name" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email ID <span className="text-red-400">*</span></label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="Enter email address" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number <span className="text-red-400">*</span></label>
                    <input type="text" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Job Title</label>
                    <input type="text" value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Procurement Manager" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <input type="text" value={form.department} onChange={set("department")} placeholder="e.g. Operations" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={form.gender} onChange={set("gender")} className={inputCls + " appearance-none"}>
                      <option value="">Select gender</option>
                      <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status <span className="text-red-400">*</span></label>
                    <select value={form.status} onChange={set("status")} className={inputCls + " appearance-none text-gray-700"}>
                      <option>Active</option><option>Pending</option><option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-xs font-semibold text-gray-700">Role & Access</p></div>
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Role <span className="text-red-400">*</span></label>
                    <select value={form.role} onChange={set("role")} className={inputCls + " appearance-none text-gray-700"}>
                      <option>Administrator</option><option>Procurement Manager</option><option>Procurement Specialist</option>
                      <option>Accounts Payable Officer</option><option>Finance Manager</option><option>Employee</option>
                      <option>Client Administrator</option><option>Client User</option><option>Manager</option>
                      <option>IT Specialist</option><option>Accountant</option><option>Sales Rep</option>
                      <option>Support Agent</option><option>HR Specialist</option><option>IT Director</option><option>Procurement</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Organization Access</label>
                    <select value={form.orgAccess} onChange={set("orgAccess")} className={inputCls + " appearance-none text-gray-700"}>
                      <option>Nitin Supplies HQ</option><option>Nitin Supplies — South Division</option><option>Nitin Supplies — North Division</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Data Visibility</label>
                    <select value={form.dataVisibility} onChange={set("dataVisibility")} className={inputCls + " appearance-none text-gray-700"}>
                      <option>All Data</option><option>Department Only</option><option>Own Only</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Location Access</label>
                    <select value={form.locationAccess} onChange={set("locationAccess")} className={inputCls + " appearance-none text-gray-700"}>
                      <option>All Locations</option><option>Home Location Only</option><option>Assigned Locations</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Permissions" && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">Module Permissions</p>
              <p className="text-[10px] text-gray-400">Toggle access per module</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Module</th>
                  {addUserPermCols.map((col) => <th key={col} className="text-center px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wide">{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {addUserModules.map((mod, i) => (
                  <tr key={mod} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 text-gray-700 font-medium text-[11px]">{mod}</td>
                    {addUserPermCols.map((col) => (
                      <td key={col} className="px-3 py-2.5 text-center">
                        <CircleCheck checked={!!perms[mod]?.[col]} onChange={() => togglePerm(mod, col)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "Expenses" && (
          <div className="flex flex-col gap-5">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-xs font-semibold text-gray-700">Expense Limits</p></div>
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select value={expenseForm.currency} onChange={(e) => setExpenseForm((p) => ({ ...p, currency: e.target.value }))} className={inputCls + " appearance-none text-gray-700"}>
                      <option>INR</option><option>USD</option><option>EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Monthly Limit</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">₹</span>
                      <input type="number" value={expenseForm.monthlyLimit} onChange={(e) => setExpenseForm((p) => ({ ...p, monthlyLimit: e.target.value }))} placeholder="0" min="0" className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Annual Limit</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">₹</span>
                      <input type="number" value={expenseForm.annualLimit} onChange={(e) => setExpenseForm((p) => ({ ...p, annualLimit: e.target.value }))} placeholder="0" min="0" className={inputCls + " pl-7"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-xs font-semibold text-gray-700">Allowed Expense Categories</p></div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map((cat) => {
                    const active = expenseForm.categories.includes(cat);
                    return (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${active ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{cat}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Assigned Devices" && (
          <div className="flex flex-col gap-5">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-xs font-semibold text-gray-700">Assign Devices</p></div>
              <div className="p-4">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" value={deviceSearch} onChange={(e) => { setDeviceSearch(e.target.value); setDeviceDropOpen(true); }} onFocus={() => setDeviceDropOpen(true)} placeholder="Search device by name or SKU..." className="w-full pl-8 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400" />
                  </div>
                  {deviceDropOpen && deviceSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                      {filteredDeviceOptions.length === 0 ? <p className="px-4 py-3 text-xs text-gray-400">No devices found</p>
                        : filteredDeviceOptions.map((d) => (
                          <button key={d.sku} onClick={() => { setAssignedDevices((prev) => [...prev, d]); setDeviceSearch(""); setDeviceDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <img src={d.img} alt={d.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                            <div><p className="text-xs font-medium text-gray-800">{d.name}</p><p className="text-[10px] text-gray-400">{d.sku} · {d.category}</p></div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {assignedDevices.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {assignedDevices.map((device) => (
                  <div key={device.sku} className="border border-gray-200 rounded-xl p-4 flex items-start gap-4 bg-white">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0"><img src={device.img} alt={device.name} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 leading-snug">{device.name}</p>
                        <button onClick={() => setAssignedDevices((prev) => prev.filter((d) => d.sku !== device.sku))} className="text-[10px] text-red-500 hover:text-red-700 font-medium shrink-0 transition-colors">Remove</button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{device.sku}</p>
                      <span className="inline-block mt-1.5 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{device.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArchivedUsersPage({ onBack, archivedUsers }: { onBack: () => void; archivedUsers: typeof archivedUsersData }) {
  const [selectedUser, setSelectedUser] = useState<typeof archivedUsersData[0] | null>(null);

  if (selectedUser) return <ArchivedUserDetailPage user={selectedUser} onBack={() => setSelectedUser(null)} />;

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Users
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Archived Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">Archived users are read-only and cannot be edited or activated from here.</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">{archivedUsers.length} archived</span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Name / Role <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Archived On <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Reason <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {archivedUsers.map((user, i) => (
              <tr key={user.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 opacity-70`}>
                      {user.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 text-[11px]">{user.name}</p>
                      <p className="text-gray-400 text-[10px]">{user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500"><div className="flex items-center gap-1"><Mail size={11} className="text-gray-400 shrink-0" />{user.email}</div></td>
                <td className="px-4 py-3 text-gray-500"><div className="flex items-center gap-1"><Phone size={11} className="text-gray-400 shrink-0" />{user.phone}</div></td>
                <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{user.archivedOn}</td>
                <td className="px-4 py-3"><span className="inline-block text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{user.reason}</span></td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-[11px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportUsersModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    return lines.map((line) =>
      line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim())
    );
  };

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCSV(text));
    };
    reader.readAsText(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  const headers = preview[0] ?? [];
  const rows = preview.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Users</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload a CSV file to bulk-import users.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Upload area */}
          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50/50 hover:border-gray-300"}`}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p className="text-sm text-gray-600 font-medium">Drag & drop your CSV file here</p>
              <p className="text-xs text-gray-400">or</p>
              <label className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer">
                Browse File
                <input type="file" accept=".csv" onChange={onInputChange} className="hidden" />
              </label>
              <p className="text-[11px] text-gray-400">Supported format: .csv</p>
            </div>
          )}

          {/* Preview */}
          {file && !imported && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="font-medium text-gray-800">{file.name}</span>
                  <span className="text-gray-400">· {rows.length} user{rows.length !== 1 ? "s" : ""} found</span>
                </div>
                <button onClick={() => { setFile(null); setPreview([]); }} className="text-[11px] text-red-400 hover:text-red-600 transition-colors">Remove</button>
              </div>

              {rows.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-52">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {headers.map((h, i) => (
                            <th key={i} className="text-left px-3 py-2 font-semibold text-gray-500 text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 10 && (
                    <p className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100">… and {rows.length - 10} more rows</p>
                  )}
                </div>
              )}
            </>
          )}

          {imported && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Import Successful</p>
              <p className="text-xs text-gray-400">{rows.length} user{rows.length !== 1 ? "s" : ""} imported successfully.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => { downloadUserTemplate(); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <Download size={12} /> Download Template
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              {imported ? "Close" : "Cancel"}
            </button>
            {!imported && (
              <button
                disabled={!file || rows.length === 0}
                onClick={() => setImported(true)}
                className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Import {rows.length > 0 ? `${rows.length} User${rows.length !== 1 ? "s" : ""}` : "Users"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const userActivityLog = [
  { action: "Logged in", date: "2026-06-02 1:03 PM", icon: "login" },
  { action: "Placed order #ORD-2024-1245", date: "2026-05-28 10:30 AM", icon: "order" },
  { action: "Updated profile information", date: "2026-05-20 3:15 PM", icon: "edit" },
  { action: "Password changed", date: "2026-05-10 11:00 AM", icon: "lock" },
];

function UserDetailPage({ user, onBack, onEdit, onResetPassword, onDeactivate, assignedDevices = [], onOpenAssignPage }: { user: UserRecord; onBack: () => void; onEdit?: () => void; onResetPassword?: () => void; onDeactivate?: () => void; assignedDevices?: AssignedDeviceEntry[]; onOpenAssignPage?: () => void }) {
  const [detailTab, setDetailTab] = useState("Overview");
  const detailTabs = ["Overview", "Activity", "Orders", "Services", "Expenses", "Assigned Devices"];
  const [dotMenuOpen, setDotMenuOpen] = useState(false);
  const [expMonth, setExpMonth] = useState("2026-06");

  const formattedDate = new Date(user.lastActive).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  const userId = `USR${String(100040 + usersData.findIndex(u => u.id === user.id) + 1)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Back button + header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Users
          </button>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-xs font-semibold text-gray-800">{user.name}</span>
          <StatusBadge status={user.status} />
        </div>
        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setDotMenuOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <MoreVertical size={15} />
          </button>
          {dotMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDotMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={() => { setDotMenuOpen(false); onResetPassword?.(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Reset Password
                </button>
                <button
                  onClick={() => { setDotMenuOpen(false); onEdit?.(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit User
                </button>
                <button
                  onClick={() => { setDotMenuOpen(false); onDeactivate?.(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-orange-600 hover:bg-orange-50 transition-colors text-left"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  {user.status === "Inactive" ? "Activate" : "Deactivate"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs + content card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-4">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                detailTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {detailTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {detailTab === "Overview" && (
          <div className="grid grid-cols-[210px_1fr]">
            {/* Left sidebar */}
            <div className="border-r border-gray-100 p-5 flex flex-col gap-3">
              {/* Avatar photo */}
              <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-800 shrink-0 ring-2 ring-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&h=160&fit=crop&auto=format"
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              {/* Contact details */}
              <div className="flex flex-col gap-2.5 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-400 shrink-0" />
                  {user.phone}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-500 shrink-0" />
                  {user.status} · Today
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-gray-400 shrink-0" />
                  Apex Tech Solutions
                </div>
              </div>
              <button className="mt-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                <Mail size={12} /> Send Email
              </button>
              <div className="text-[10px] text-gray-400 space-y-0.5 leading-relaxed">
                <p>Last Login: Today, 11:15 AM</p>
                <p>Logged in from San Diego, CA · IP 192.168.1.224</p>
              </div>
            </div>

            {/* Right content */}
            <div className="flex flex-col">
              {/* Stats bar */}
              <div className="grid grid-cols-5 border-b border-gray-100">
                {/* User ID */}
                <div className="px-4 py-3 flex flex-col gap-1.5 border-r border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Users size={11} className="text-blue-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">User ID</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{userId}</p>
                </div>
                {/* Status */}
                <div className="px-4 py-3 flex flex-col gap-1.5 border-r border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle size={11} className="text-green-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Status</span>
                  </div>
                  <p className="text-sm font-bold text-green-600">{user.status}</p>
                </div>
                {/* Cost Center */}
                <div className="px-4 py-3 flex flex-col gap-1.5 border-r border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 size={11} className="text-indigo-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Cost Center</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">IT Operations</p>
                </div>
                {/* Total Orders */}
                <div className="px-4 py-3 flex flex-col gap-1.5 border-r border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <span className="text-[10px] text-gray-500">Total Orders</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">5</p>
                  <p className="text-[10px] text-gray-400">Year-to-Date</p>
                </div>
                {/* Expenses */}
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <DollarSign size={11} className="text-green-600" />
                      </div>
                      <span className="text-[10px] text-gray-500">Expenses</span>
                    </div>
                    <span className="text-[10px] text-blue-500 cursor-pointer hover:underline whitespace-nowrap">View All &gt;</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 leading-none">$15,450</p>
                  <p className="text-[10px] text-gray-400">Year-to-Date</p>
                  <p className="text-[10px] text-gray-400">IP: 192.168.1.224</p>
                </div>
              </div>

              {/* Personal + Professional info */}
              <div className="grid grid-cols-2 flex-1">
                <div className="p-5 border-r border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Personal Information</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: "Full Name", value: user.name },
                      { label: "Employee ID", value: "EMP-2024-0157" },
                      { label: "Email Address", value: user.email },
                      { label: "Phone Number", value: user.phone },
                      { label: "Gender", value: "Male" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-xs text-gray-800 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Professional Information</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: "Job Title", value: user.role },
                      { label: "Department", value: "Operations" },
                      { label: "Reporting Manager", value: "Sophia Martinez" },
                      { label: "Joining Date", value: "2022-04-18" },
                      { label: "Account Info", value: "Postpaid" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-xs text-gray-800 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === "Activity" && (
          <div className="p-5 flex flex-col gap-0">
            <p className="text-xs font-semibold text-gray-700 mb-4">Recent Activity</p>
            {userActivityLog.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    {item.icon === "login" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
                    {item.icon === "order" && <ShoppingCart size={13} className="text-blue-500" />}
                    {item.icon === "edit" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                    {item.icon === "lock" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  </div>
                  {i < userActivityLog.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-xs font-medium text-gray-800">{item.action}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {detailTab === "Orders" && (
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-700 mb-3">Orders by this user</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Order ID", "Date", "Items", "Amount", "Status"].map(h => (
                    <th key={h} className="text-left py-2.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide pr-4">
                      {h}{(h === "Status") && <Filter size={9} className="inline ml-0.5 text-gray-300" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordersData.slice(0, 3).map((o, i) => (
                  <tr key={o.id} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="py-2.5 pr-4 text-blue-500 font-medium">{o.id}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{o.date}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{o.items} items</td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-900">{o.amount}</td>
                    <td className="py-2.5 pr-4"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailTab === "Services" && (
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-700 mb-3">Services by this user</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Service ID", "Requested Date", "Service Name", "Requested By", "Amount", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide">
                        {h}{(h === "Status" || h === "Requested Date") && <Filter size={9} className="inline ml-0.5 text-gray-300" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {servicesData.map((svc, i) => (
                    <tr key={svc.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                      <td className="px-4 py-2.5 text-blue-500 font-medium">{svc.id}</td>
                      <td className="px-4 py-2.5 text-gray-600">{svc.startDate}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{svc.name}</td>
                      <td className="px-4 py-2.5 text-blue-500">{svc.provider}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{svc.amount}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === "Expenses" && (
          <div className="p-5 flex flex-col gap-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/60">
                <p className="text-[10px] text-gray-400 mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-gray-900">$15,450</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Year to date</p>
              </div>
              <div className="border border-blue-100 rounded-xl px-4 py-3 bg-blue-50/40">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-gray-400">This Month</p>
                  <select
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    className="text-[10px] text-blue-600 border border-blue-200 rounded-md px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                  >
                    <option value="2026-01">Jan 2026</option>
                    <option value="2026-02">Feb 2026</option>
                    <option value="2026-03">Mar 2026</option>
                    <option value="2026-04">Apr 2026</option>
                    <option value="2026-05">May 2026</option>
                    <option value="2026-06">Jun 2026</option>
                    <option value="2025-12">Dec 2025</option>
                    <option value="2025-11">Nov 2025</option>
                    <option value="2025-10">Oct 2025</option>
                  </select>
                </div>
                <p className="text-xl font-bold text-blue-600">$3,200</p>
                <p className="text-[11px] text-blue-400 mt-0.5">
                  {new Date(expMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/60">
                <p className="text-[10px] text-gray-400 mb-1">Pending Approval</p>
                <p className="text-xl font-bold text-orange-500">$1,800</p>
                <p className="text-[11px] text-gray-400 mt-0.5">2 requests</p>
              </div>
            </div>

            {/* Chart + Top 5 */}
            <div className="grid grid-cols-5 gap-5">
              {/* Bar chart */}
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">Monthly Expenses</p>
                  <span className="text-[10px] border border-gray-200 rounded-md px-2 py-0.5 text-gray-500">This Year</span>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={[
                      { month: "Jan", value: 800 },
                      { month: "Feb", value: 1200 },
                      { month: "Mar", value: 950 },
                      { month: "Apr", value: 2100 },
                      { month: "May", value: 1750 },
                      { month: "Jun", value: 3200 },
                      { month: "Jul", value: 0 },
                      { month: "Aug", value: 0 },
                      { month: "Sep", value: 0 },
                      { month: "Oct", value: 0 },
                      { month: "Nov", value: 0 },
                      { month: "Dec", value: 0 },
                    ]}
                    barSize={10}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis key="exp-xaxis" dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis key="exp-yaxis" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v ? `$${v / 1000}K` : ""} />
                    <Tooltip
                      key="exp-tooltip"
                      formatter={(v: number) => [`$${v.toLocaleString()}`, "Expenses"]}
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                    />
                    <Bar key="exp-bar" dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 items */}
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-700 mb-3">Top 5 Items</p>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "MacBook Pro", amount: "$4,200", pct: 27 },
                    { name: "Adobe Creative Suite", amount: "$2,800", pct: 18 },
                    { name: "Travel — Bangalore", amount: "$1,950", pct: 13 },
                    { name: "Ergonomic Chair", amount: "$1,740", pct: 11 },
                    { name: "iPhone 15 Pro", amount: "$1,320", pct: 9 },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-gray-700 truncate max-w-[130px]">{item.name}</span>
                        <span className="text-gray-500 font-medium shrink-0">{item.amount}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.pct * 3.7}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {detailTab === "Assigned Devices" && (() => {
          const staticDevices: AssignedDeviceEntry[] = [
            { name: "Apple MacBook Pro (2023)", sku: "MBP-14-M3-512", category: "Laptop", assignedOn: "2023-09-01", status: "Active", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&h=80&fit=crop&auto=format", serialNo: "C02XL0UKJHD5", modelNo: "A2779", referenceNo: "REF-2023-0091" },
            { name: "Apple iPhone 15 Pro", sku: "IP15PRO-128-BLK", category: "Mobile", assignedOn: "2023-10-15", status: "Active", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=80&h=80&fit=crop&auto=format", serialNo: "F7RTXK9BPQM", modelNo: "A3290", referenceNo: "REF-2023-0122" },
            { name: "Dell UltraSharp 27\" Monitor", sku: "DELL-U2722D", category: "Display", assignedOn: "2023-09-01", status: "Active", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=80&h=80&fit=crop&auto=format", serialNo: "CN-0GHVMX-47122", modelNo: "U2722D", referenceNo: "REF-2023-0089" },
            { name: "Logitech MX Keys Keyboard", sku: "LG-MX-KEYS-ADV", category: "Peripheral", assignedOn: "2024-01-10", status: "In Repair", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=80&h=80&fit=crop&auto=format", serialNo: "2210LZ19D310", modelNo: "920-009295", referenceNo: "REF-2024-0011" },
          ];
          const allDevices = [...assignedDevices, ...staticDevices];
          const activeCount = allDevices.filter((d) => d.status === "Active").length;
          const repairCount = allDevices.filter((d) => d.status === "In Repair").length;
          return (
            <div className="p-5 flex flex-col gap-5">
              {/* Summary + action row */}
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {[
                    { label: "Total Devices", value: String(allDevices.length), sub: "Assigned to user" },
                    { label: "Active", value: String(activeCount), sub: "In use", color: "text-green-600" },
                    { label: "In Repair", value: String(repairCount), sub: repairCount > 0 ? "Est. return Jun 28" : "None", color: "text-orange-500" },
                  ].map((card) => (
                    <div key={card.label} className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/60">
                      <p className="text-[10px] text-gray-400 mb-1">{card.label}</p>
                      <p className={`text-xl font-bold ${card.color ?? "text-gray-900"}`}>{card.value}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onOpenAssignPage?.()}
                  className="ml-4 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Assign Device
                </button>
              </div>

              {/* Newly assigned devices (from AssignDevicePage) */}
              {assignedDevices.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Recently Assigned</p>
                  <div className="grid grid-cols-2 gap-4">
                    {assignedDevices.map((device) => (
                      <div key={device.sku + device.assignedOn} className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                        <div className="w-16 h-16 rounded-lg bg-white border border-blue-100 overflow-hidden shrink-0">
                          <img src={device.img} alt={device.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-900 leading-snug">{device.name}</p>
                            <span className="shrink-0 inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                              {device.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{device.sku}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-gray-500">
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{device.category}</span>
                            {device.serialNo && <span className="font-mono">S/N: {device.serialNo}</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-400">
                            {device.modelNo && <span>Model: {device.modelNo}</span>}
                            {device.referenceNo && <span>Ref: {device.referenceNo}</span>}
                          </div>
                          <p className="text-[10px] text-blue-500 mt-1">Assigned {new Date(device.assignedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Static existing device cards */}
              <div>
                {assignedDevices.length > 0 && <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Previously Assigned</p>}
                <div className="grid grid-cols-2 gap-4">
                  {staticDevices.map((device) => (
                    <div key={device.sku} className="border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow bg-white">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={device.img} alt={device.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-900 leading-snug">{device.name}</p>
                          <span className={`shrink-0 inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                            device.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-orange-50 text-orange-600 border-orange-200"
                          }`}>
                            {device.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{device.sku}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                          <span className="inline-block bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{device.category}</span>
                          <span>Assigned {new Date(device.assignedOn).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ArchiveConfirmModal({ user, onConfirm, onCancel }: { user: { name: string; role: string; initials: string; color: string }; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Archive User</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Archive {user.name}?</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              This user will be moved to Archived Users and will lose access to the system. This action can be reviewed in the archived users list.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 w-full">
            <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
              {user.initials}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800">{user.name}</p>
              <p className="text-[11px] text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            Yes, Archive User
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignDevicePage({ userName, onBack, onAssign }: { userName: string; onBack: () => void; onAssign: (device: AssignedDeviceEntry) => void }) {
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [selected, setSelected] = useState<typeof addUserDeviceOptions[0] | null>(null);
  const [serialNo, setSerialNo] = useState("");
  const [modelNo, setModelNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [activeField, setActiveField] = useState<"serial" | "model" | "reference">("serial");

  const filtered = addUserDeviceOptions.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!selected) return;
    onAssign({
      sku: selected.sku,
      name: selected.name,
      category: selected.category,
      img: selected.img,
      serialNo,
      modelNo,
      referenceNo,
      assignedOn: new Date().toISOString().slice(0, 10),
      status: "Active",
    });
    onBack();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span className="text-gray-300 text-xs">/</span>
        <span className="text-xs text-gray-500">{userName}</span>
        <span className="text-gray-300 text-xs">/</span>
        <span className="text-xs font-semibold text-gray-800">Assign Device</span>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: "560px" }}>
        {/* Card header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Assign Device</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Search the master catalog and assign a device to{" "}
            <span className="font-medium text-gray-700">{userName}</span>.
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 py-5 flex flex-col gap-6 flex-1">

          {/* Search bar */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Search Master Catalog <span className="text-red-400">*</span>
            </label>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                placeholder="Search by device name or SKU..."
                className="w-full pl-8 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
              />
              {showDrop && search.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-60 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400">No devices found</p>
                  ) : (
                    filtered.map((d) => (
                      <button
                        key={d.sku}
                        onClick={() => { setSelected(d); setSearch(""); setShowDrop(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <img src={d.img} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 group-hover:text-blue-700">{d.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{d.sku} · {d.category}</p>
                        </div>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{d.category}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected product card */}
          {selected && (
            <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-blue-100 overflow-hidden shrink-0 shadow-sm">
                <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{selected.sku}</p>
                <span className="inline-block mt-1.5 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {selected.category}
                </span>
              </div>
              <button
                onClick={() => { setSelected(null); setSerialNo(""); setModelNo(""); setReferenceNo(""); }}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 3-tab entry fields */}
          {selected && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Tab strip */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {(["serial", "model", "reference"] as const).map((field, idx) => {
                  const labels = { serial: "Serial No", model: "Model No", reference: "Reference No" };
                  const values = { serial: serialNo, model: modelNo, reference: referenceNo };
                  return (
                    <button
                      key={field}
                      onClick={() => setActiveField(field)}
                      className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative border-r last:border-r-0 border-gray-200 ${
                        activeField === field
                          ? "text-blue-600 bg-white"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/60"
                      }`}
                    >
                      <span className="block">{labels[field]}</span>
                      {values[field] && (
                        <span className="block text-[9px] text-blue-400 mt-0.5 font-mono truncate max-w-[80px] mx-auto">{values[field]}</span>
                      )}
                      {activeField === field && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Tab input */}
              <div className="p-5">
                {activeField === "serial" && (
                  <div>
                    <label className="block text-[11px] text-blue-600 mb-1.5">Serial Number</label>
                    <input
                      type="text"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      placeholder="e.g. C02XL0UKJHD5"
                      autoFocus
                      className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Located on the device label or packaging</p>
                  </div>
                )}
                {activeField === "model" && (
                  <div>
                    <label className="block text-[11px] text-blue-600 mb-1.5">Model Number</label>
                    <input
                      type="text"
                      value={modelNo}
                      onChange={(e) => setModelNo(e.target.value)}
                      placeholder="e.g. A2779"
                      autoFocus
                      className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Model identifier from the manufacturer</p>
                  </div>
                )}
                {activeField === "reference" && (
                  <div>
                    <label className="block text-[11px] text-blue-600 mb-1.5">Reference Number</label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. REF-2024-00198"
                      autoFocus
                      className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Internal reference or asset tag number</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — Assign Device button at bottom right */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected}
            className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Assign Device
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([...usersData]);
  const [archived, setArchived] = useState<typeof archivedUsersData>([...archivedUsersData]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showImportUsers, setShowImportUsers] = useState(false);
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<UserRecord | null>(null);
  const [userDevices, setUserDevices] = useState<Record<string, AssignedDeviceEntry[]>>({});
  const [assigningDeviceFor, setAssigningDeviceFor] = useState<UserRecord | null>(null);

  const archiveUser = (id: string) => {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    setArchived((prev) => [...prev, { ...u, status: "Archived", archivedOn: new Date().toISOString().slice(0, 10), reason: "Manually archived" }] as typeof archivedUsersData);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setArchiveTarget(null);
    setRowMenu(null);
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  const deactivateUser = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "Inactive" ? "Active" : "Inactive" } : u));
    if (selectedUser?.id === id) setSelectedUser((prev) => prev ? { ...prev, status: prev.status === "Inactive" ? "Active" : "Inactive" } : prev);
    setRowMenu(null);
  };

  const saveEditedUser = (updated: UserRecord) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
  };

  const liveSelectedUser = selectedUser ? (users.find((u) => u.id === selectedUser.id) ?? selectedUser) : null;

  if (showArchivedUsers) return <ArchivedUsersPage onBack={() => setShowArchivedUsers(false)} archivedUsers={archived} />;
  if (editingUser) return <EditUserPage user={editingUser} onBack={() => setEditingUser(null)} onSave={saveEditedUser} />;
  if (assigningDeviceFor) return (
    <AssignDevicePage
      userName={assigningDeviceFor.name}
      onBack={() => setAssigningDeviceFor(null)}
      onAssign={(device) => {
        setUserDevices((prev) => ({
          ...prev,
          [assigningDeviceFor.id]: [...(prev[assigningDeviceFor.id] ?? []), device],
        }));
        setAssigningDeviceFor(null);
      }}
    />
  );
  if (liveSelectedUser) return (
    <UserDetailPage
      user={liveSelectedUser}
      onBack={() => setSelectedUser(null)}
      onEdit={() => setEditingUser(liveSelectedUser)}
      onResetPassword={() => setResetPasswordUser(liveSelectedUser)}
      onDeactivate={() => deactivateUser(liveSelectedUser.id)}
      assignedDevices={userDevices[liveSelectedUser.id] ?? []}
      onOpenAssignPage={() => setAssigningDeviceFor(liveSelectedUser)}
    />
  );

  const allIds = users.map((u) => u.id);
  const allChecked = selected.size === allIds.length && allIds.length > 0;

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const total = users.length;
  const active = users.filter((u) => u.status === "Active").length;
  const pending = users.filter((u) => u.status === "Pending").length;
  const inactive = users.filter((u) => u.status === "Inactive").length;

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setHeaderMenuOpen(false); setRowMenu(null); }}>
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}
      {showImportUsers && <ImportUsersModal onClose={() => setShowImportUsers(false)} />}
      {resetPasswordUser && <ResetPasswordModal userName={resetPasswordUser.name} onClose={() => setResetPasswordUser(null)} />}
      {archiveTarget && (
        <ArchiveConfirmModal
          user={archiveTarget}
          onConfirm={() => archiveUser(archiveTarget.id)}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
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
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-48" onClick={(e) => e.stopPropagation()}>
              {[
                { icon: <UserPlus size={13} />, label: "Add Users", action: () => { setShowAddUser(true); setHeaderMenuOpen(false); } },
                { icon: <Download size={13} />, label: "Export Users", action: () => { exportUsersCSV(); setHeaderMenuOpen(false); } },
                { icon: <Upload size={13} />, label: "Import Users", action: () => { setShowImportUsers(true); setHeaderMenuOpen(false); } },
                { icon: <FileText size={13} />, label: "Download Template", action: () => { downloadUserTemplate(); setHeaderMenuOpen(false); } },
                { icon: <Users size={13} />, label: "Archived Users", action: () => { setShowArchivedUsers(true); setHeaderMenuOpen(false); }, divider: true },
              ].map(({ icon, label, action, divider }) => (
                <div key={label}>
                  {divider && <div className="my-1 border-t border-gray-100" />}
                  <button onClick={action} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-400">{icon}</span>{label}
                  </button>
                </div>
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
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Name / Role <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Email</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Phone</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Last Active <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${selected.has(user.id) ? "bg-blue-50/40" : i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} className="rounded border-gray-300 text-blue-500 cursor-pointer" />
                </td>
                <td className="px-3 py-3">
                  <span
                    className="text-blue-500 font-mono text-[10px] hover:underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                  >{`UI-${String(usersData.findIndex(u => u.id === user.id) + 1 || i + 1).padStart(5, "0")}`}</span>
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
                    <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-40" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingUser(user); setRowMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">Edit User</button>
                      <button onClick={() => { setResetPasswordUser(user); setRowMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">Reset Password</button>
                      <button onClick={() => deactivateUser(user.id)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">
                        {user.status === "Inactive" ? "Activate" : "Deactivate"}
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button onClick={() => { setArchiveTarget(user); setRowMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-orange-500">Archive User</button>
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
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Date <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Amount <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Vendor <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
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

function AddServiceModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    provider: "",
    startDate: "",
    endDate: "",
    amount: "",
    description: "",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold text-gray-900">Add New Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5 flex flex-col gap-4">
          {/* Service Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Service Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Cloud Hosting Premium"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Provider <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.provider}
              onChange={set("provider")}
              placeholder="e.g. CloudServe Inc"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-500"
              />
            </div>
          </div>

          {/* Annual Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Annual Amount (₹) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={set("amount")}
              placeholder="e.g. 12000"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Short description of the service"
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
            Add Service
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Category");
  const [page, setPage] = useState(1);
  const [showAddService, setShowAddService] = useState(false);

  const filtered = selectedCategory === "Category" || selectedCategory === "All"
    ? servicesData
    : servicesData.filter((s) => s.category === selectedCategory);

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setRowMenu(null); setCategoryOpen(false); }}>
      {showAddService && <AddServiceModal onClose={() => setShowAddService(false)} />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold text-gray-900">Service History</h2>
        <button
          onClick={(e) => { e.stopPropagation(); setShowAddService(true); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
        >
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
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Requested Date <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Service Name <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Requested By</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Amount <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((svc, i) => (
              <tr key={svc.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                <td className="px-4 py-3">
                  <span className="text-blue-500 hover:underline cursor-pointer font-medium">{svc.id}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{svc.startDate}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{svc.name}</td>
                <td className="px-4 py-3">
                  <span className="text-blue-500 hover:underline cursor-pointer">{svc.provider}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{svc.amount}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">No services found for this category.</td>
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
    productCode: "PC-DL-001",
    sku: "PRD-001",
    name: "Dell Laptop XPS 15",
    category: "Hardware",
    roles: ["Admin", "IT Manager"],
    price: "₹21,004",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=40&h=40&fit=crop&auto=format",
  },
  {
    productCode: "PC-MS-002",
    sku: "PRD-002",
    name: "Microsoft Office 365",
    category: "Software",
    roles: ["IT Manager", "Finance"],
    price: "₹83,375",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=40&h=40&fit=crop&auto=format",
  },
  {
    productCode: "PC-EO-003",
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
  const [headerMenu, setHeaderMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState(catalogProducts.map((p) => ({ ...p, roles: [...p.roles] })));
  const [editingProductSku, setEditingProductSku] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [editingPreferences, setEditingPreferences] = useState({
    discountApplicable: true,
    bulkOrdersAllowed: true,
    customizationAllowed: false,
  });

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

  const openEditRolesDialog = (product: any) => {
    setEditingProductSku(product.sku);
    setEditingRoles([...product.roles]);
    setEditingPreferences({
      discountApplicable: true,
      bulkOrdersAllowed: true,
      customizationAllowed: false,
    });
  };

  const saveRolesAndPreferences = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.sku === editingProductSku ? { ...p, roles: editingRoles } : p
      )
    );
    setEditingProductSku(null);
    setRowMenu(null);
  };

  const toggleEditingRole = (role: string) => {
    setEditingRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setRowMenu(null); setHeaderMenu(false); }}>
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
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setHeaderMenu((v) => !v); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {headerMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setShowAddProduct(true); setHeaderMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
                  Add New Product
                </button>
                <button onClick={() => setHeaderMenu(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download size={13} className="text-gray-400" /> Export
                </button>
              </div>
            )}
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
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Product ID</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">SKU Code</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Product</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Category <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Roles <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-36">Selling Price <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Availability <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.sku} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{product.productCode}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={product.img} alt={product.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                      <span className="font-medium text-gray-800 text-[11px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.roles.map((role) => (
                        <span key={role} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          {role}
                          <button onClick={(e) => { e.stopPropagation(); removeRole(product.sku, role); }} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      product.availability === "In Stock" ? "bg-green-50 text-green-700 border-green-200"
                      : product.availability === "Low Stock" ? "bg-orange-50 text-orange-600 border-orange-200"
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
                      <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setRowMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">View Product</button>
                        <button onClick={() => { openEditRolesDialog(product); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">Edit Roles & Preferences</button>
                        <div className="my-1 border-t border-gray-100" />
                        <button onClick={() => { setProducts((prev) => prev.filter((p) => p.sku !== product.sku)); setRowMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-red-500">Remove Product</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-gray-400">No products match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">Showing 1 to {filtered.length} of {filtered.length} products</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40">–</button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
            <button onClick={() => setPage((p) => p + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors">+</button>
          </div>
        </div>
      </div>

      {/* Edit Roles & Preferences Dialog */}
      {editingProductSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingProductSku(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingProductSku(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2 className="text-sm font-semibold text-gray-900">Edit Roles & Preferences</h2>
              </div>
              <button onClick={() => setEditingProductSku(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
              {products.find((p) => p.sku === editingProductSku) && (
                <>
                  {/* Product Info */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">Product Information</p>
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Product Name</p>
                          <p className="text-sm font-medium text-gray-900">{products.find((p) => p.sku === editingProductSku)?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">SKU</p>
                          <p className="text-sm text-gray-600">{editingProductSku}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assign Roles */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">Assign Roles <span className="text-red-400">*</span></p>
                    <p className="text-xs text-blue-500 mb-3">Select which roles can access this product.</p>
                    <div className="space-y-2">
                      {catalogRoleOptions.map((role) => (
                        <label key={role} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={editingRoles.includes(role)}
                            onChange={() => toggleEditingRole(role)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-gray-700">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">Preferences <span className="text-red-400">*</span></p>
                    <p className="text-xs text-blue-500 mb-3">Configure additional product options for this client.</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editingPreferences.discountApplicable}
                          onChange={(e) => setEditingPreferences({ ...editingPreferences, discountApplicable: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">Allow Discounts</p>
                          <p className="text-[10px] text-gray-500">Enable discount codes for this product</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editingPreferences.bulkOrdersAllowed}
                          onChange={(e) => setEditingPreferences({ ...editingPreferences, bulkOrdersAllowed: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">Allow Bulk Orders</p>
                          <p className="text-[10px] text-gray-500">Enable bulk purchasing for this product</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editingPreferences.customizationAllowed}
                          onChange={(e) => setEditingPreferences({ ...editingPreferences, customizationAllowed: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">Allow Customization</p>
                          <p className="text-[10px] text-gray-500">Allow customization options for this product</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEditingProductSku(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRolesAndPreferences}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [configTab, setConfigTab] = useState("General");
  const configTabs = ["General", "Invite Users"];

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailServices: true,
    sms: false,
  });
  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  // Invite Users state
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteRoleFilter, setInviteRoleFilter] = useState("All Roles");
  const [inviteRoleOpen, setInviteRoleOpen] = useState(false);
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set());
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [showInviteConfirm, setShowInviteConfirm] = useState(false);

  const uniqueRoles = ["All Roles", ...Array.from(new Set(usersData.map((u) => u.role)))];

  const inviteFiltered = usersData.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(inviteSearch.toLowerCase());
    const matchRole = inviteRoleFilter === "All Roles" || u.role === inviteRoleFilter;
    return matchSearch && matchRole;
  });

  const allSelectableIds = inviteFiltered.filter((u) => !invitedIds.has(u.id)).map((u) => u.id);
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedInvites.has(id));

  const toggleSelectAll = () => {
    setSelectedInvites((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allSelectableIds.forEach((id) => next.delete(id));
      } else {
        allSelectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleInvite = (id: string) => {
    setSelectedInvites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmAndSendInvites = () => {
    setInvitedIds((prev) => new Set([...prev, ...selectedInvites]));
    setSelectedInvites(new Set());
    setShowInviteConfirm(false);
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900">Configuration</h2>

      {/* Inner tabs */}
      <div className="flex border-b border-gray-100 -mt-2">
        {configTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setConfigTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
              configTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {configTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {configTab === "General" && (
        <div className="flex flex-col gap-0">
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
                  <input type="checkbox" checked={notifications[key]} onChange={() => toggle(key)} className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
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
      )}

      {configTab === "Invite Users" && (
        <div className="flex flex-col gap-4" onClick={() => setInviteRoleOpen(false)}>
          {/* Invite confirmation popup */}
          {showInviteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowInviteConfirm(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Confirm Invitation</h2>
                  <button onClick={() => setShowInviteConfirm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                  <p className="text-xs text-gray-500">
                    You are about to send invitations to <span className="font-semibold text-gray-800">{selectedInvites.size} user{selectedInvites.size > 1 ? "s" : ""}</span>. They will receive an email with access instructions.
                  </p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {usersData.filter((u) => selectedInvites.has(u.id)).map((user, i) => (
                      <div key={user.id} className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                        <div className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{user.initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 shrink-0">{user.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button onClick={() => setShowInviteConfirm(false)} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmAndSendInvites} className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5">
                    <UserPlus size={12} /> Send Invitation{selectedInvites.size > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500">Search and select users to invite to this client. Invited users will receive an email with access instructions.</p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              placeholder="Search by name, email or role..."
              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
            />
          </div>

          {/* Role filter */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setInviteRoleOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filter by Role: <span className="text-blue-600 font-medium">{inviteRoleFilter}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {inviteRoleOpen && (
              <div className="absolute left-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
                {uniqueRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => { setInviteRoleFilter(role); setInviteRoleOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${inviteRoleFilter === role ? "text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {inviteFiltered.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No users match your search.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 accent-blue-600 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">User</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Email</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Role <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Status <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                  </tr>
                </thead>
                <tbody>
                  {inviteFiltered.map((user, i) => {
                    const invited = invitedIds.has(user.id);
                    return (
                      <tr key={user.id} className={`border-b border-gray-100 last:border-0 transition-colors ${selectedInvites.has(user.id) ? "bg-blue-50/40" : i % 2 === 0 ? "bg-white" : "bg-gray-50/20"} ${invited ? "opacity-50" : "hover:bg-gray-50/60"}`}>
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedInvites.has(user.id)}
                            disabled={invited}
                            onChange={() => toggleInvite(user.id)}
                            className="rounded border-gray-300 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{user.initials}</div>
                            <span className="font-medium text-gray-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{user.email}</td>
                        <td className="px-3 py-2.5 text-gray-600">{user.role}</td>
                        <td className="px-3 py-2.5">
                          {invited
                            ? <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Invited</span>
                            : <StatusBadge status={user.status} />
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {selectedInvites.size > 0 ? `${selectedInvites.size} user${selectedInvites.size > 1 ? "s" : ""} selected` : "Select users above to invite"}
            </p>
            <button
              onClick={() => selectedInvites.size > 0 && setShowInviteConfirm(true)}
              disabled={selectedInvites.size === 0}
              className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={12} /> Invite User{selectedInvites.size > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    sortBy: "",
  });

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

          {/* Tabs with Filter */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-4">
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Filter size={18} />
              </button>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="border-b border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 font-medium">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Default</option>
                      <option value="name">Name</option>
                      <option value="date">Date</option>
                      <option value="recent">Most Recent</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setFilters({ status: "", dateRange: "", sortBy: "" });
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
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
                      <XAxis key="spend-xaxis" dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis key="spend-yaxis" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip
                        key="spend-tooltip"
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                      <Bar key="spend-bar" dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
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
