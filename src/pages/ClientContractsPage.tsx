import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, X, Download, FileText } from "lucide-react";

const contractsData = [
  {
    id: "CON-001",
    title: "Annual Service Agreement",
    type: "Service",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    value: "$48,000",
    status: "Active",
    signedBy: "Rajesh Kumar",
  },
  {
    id: "CON-002",
    title: "Hardware Supply Contract",
    type: "Supply",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    value: "$1,20,000",
    status: "Active",
    signedBy: "Amit Singh",
  },
  {
    id: "CON-003",
    title: "Software License Agreement",
    type: "License",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    value: "$36,000",
    status: "Expired",
    signedBy: "Priya Sharma",
  },
  {
    id: "CON-004",
    title: "Support & Maintenance SLA",
    type: "SLA",
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    value: "$24,000",
    status: "Active",
    signedBy: "Vikram Patel",
  },
  {
    id: "CON-005",
    title: "Cloud Infrastructure Agreement",
    type: "Service",
    startDate: "2024-09-01",
    endDate: "2025-08-31",
    value: "$60,000",
    status: "Draft",
    signedBy: "—",
  },
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-600",
  Draft: "bg-yellow-100 text-yellow-700",
  Terminated: "bg-gray-100 text-gray-500",
};

const typeOptions = ["All", "Service", "Supply", "License", "SLA"];

function AddContractModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: "",
    type: "",
    startDate: "",
    endDate: "",
    value: "",
    signedBy: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add New Contract</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contract Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Annual Service Agreement"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={set("type")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                {["Service", "Supply", "License", "SLA"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                value={form.value}
                onChange={set("value")}
                placeholder="e.g. $12,000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Signed By</label>
            <input
              type="text"
              value={form.signedBy}
              onChange={set("signedBy")}
              placeholder="Contact name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Contract
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered =
    selectedType === "All"
      ? contractsData
      : contractsData.filter((c) => c.type === selectedType);

  return (
    <div className="p-6">
      {showAddModal && <AddContractModal onClose={() => setShowAddModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Contracts</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} contract{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={13} />
            Filter
          </button>
          <button
            className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors"
          >
            + Add Contract
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilter && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedType === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
              <th className="text-left px-4 py-3">Contract ID</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Start Date</th>
              <th className="text-left px-4 py-3">End Date</th>
              <th className="text-left px-4 py-3">Value</th>
              <th className="text-left px-4 py-3">Signed By</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                <td 
                  className="px-4 py-3 text-blue-600 font-medium text-xs cursor-pointer hover:underline" 
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  {contract.id}
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium text-xs">{contract.title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{contract.type}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{contract.startDate}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{contract.endDate}</td>
                <td className="px-4 py-3 text-gray-800 font-medium text-xs">{contract.value}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{contract.signedBy}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[contract.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {contract.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
                    <FileText size={13} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            No contracts found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
