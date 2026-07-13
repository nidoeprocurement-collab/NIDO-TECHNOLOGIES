import { useState } from "react";
import { Download, X } from "lucide-react";

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

export function CircleCheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors${
        checked ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white hover:border-blue-300"
      }`}
    >
      {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  );
}

export type RoleFormData = {
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

export function NewRolePage({ onBack, onSave, initialData, isEdit }: { onBack: () => void; onSave?: (data: RoleFormData) => void; initialData?: Partial<RoleFormData>; isEdit?: boolean }) {
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
                className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-blue-600 mb-1">Role Code <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.code}
                onChange={setField("code")}
                placeholder="e.g. PM"
                className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300"
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
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 resize-none"
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
          <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/40 flex items-center gap-2">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              placeholder="Enter module name..."
              autoFocus
              className="flex-1 px-2 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-300 bg-white"
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
              <th className="text-left px-2 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wide">MODULE</th>
              {permissionCols.map((col) => (
                <th key={col} className="text-center px-2 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wide">{col}</th>
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
                className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none text-gray-700"
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
                className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none text-gray-700"
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

export default function ClientRolesPage() {
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
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-2.5 text-xs text-blue-700">
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
              className={`border rounded-xl p-2 cursor-pointer transition-all ${
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
                  <th className="text-left px-2 py-2.5 font-semibold text-gray-600 text-[11px] w-44">MODULE</th>
                  {matrixColumns.map((col) => (
                    <th key={col} className="text-center px-2 py-2.5 font-semibold text-gray-600 text-[11px]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, i) => (
                  <tr key={mod} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2 text-gray-700 font-medium text-[11px]">{mod}</td>
                    {matrixData[mod].map((access, j) => (
                      <td key={j} className="text-center px-2 py-2">
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
                <div key={item.module} className="border border-gray-200 rounded-lg px-2 py-2.5 bg-white">
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
                <th className="text-left px-2 py-2.5 font-semibold text-gray-600 uppercase tracking-wide w-32">Attribute</th>
                {comparisonRoles.map((r) => (
                  <th key={r} className="text-left px-2 py-2.5 font-semibold text-gray-600 whitespace-nowrap">{r}</th>
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
