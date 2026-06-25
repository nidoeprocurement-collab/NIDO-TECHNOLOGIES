import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  ShoppingCart,
  IndianRupee,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";

const STATS = [
  {
    icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,
    bg: "bg-blue-50",
    label: "Total Orders",
    value: "156",
    sub: "All Time",
  },
  {
    icon: <IndianRupee className="w-5 h-5 text-blue-400" />,
    bg: "bg-blue-50",
    label: "Total Spend",
    value: "₹12.45 Cr",
    sub: "All Time",
    muted: true,
  },
  {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    bg: "bg-green-50",
    label: "Confirmed Orders",
    value: "96",
    sub: "₹8.74 Cr",
  },
  {
    icon: <Truck className="w-5 h-5 text-blue-400" />,
    bg: "bg-blue-50",
    label: "In Transit",
    value: "24",
    sub: "₹2.18 Cr",
  },
  {
    icon: <PackageCheck className="w-5 h-5 text-green-500" />,
    bg: "bg-green-50",
    label: "Delivered",
    value: "96",
    sub: "₹1.37 Cr",
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    bg: "bg-red-50",
    label: "Cancelled",
    value: "6",
    sub: "₹16.30 L",
  },
  {
    icon: <Clock className="w-5 h-5 text-orange-400" />,
    bg: "bg-orange-50",
    label: "Pending",
    value: "18",
    sub: "₹1.82 Cr",
  },
];

type OrderStatus =
  | "Processing"
  | "Confirmed"
  | "Shipped"
  | "In Transit"
  | "Delivered"
  | "Cancelled"
  | "Overdue"
  | "Pending";

interface Order {
  poId: string;
  orderDate: string;
  poValue: string;
  items: number;
  status: OrderStatus;
  expectedDelivery: string;
  trackingNo: string | null;
  createdBy: string;
}

const ORDERS: Order[] = [
  {
    poId: "PO-10034",
    orderDate: "Apr 16, 2026",
    poValue: "₹2,19,200.00",
    items: 3,
    status: "Processing",
    expectedDelivery: "Apr 28, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10033",
    orderDate: "Apr 15, 2026",
    poValue: "₹5,87,000.00",
    items: 5,
    status: "Confirmed",
    expectedDelivery: "Apr 27, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10032",
    orderDate: "Apr 14, 2026",
    poValue: "₹8,45,050.00",
    items: 8,
    status: "Shipped",
    expectedDelivery: "Apr 26, 2026",
    trackingNo: "12999AA10123456784",
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10031",
    orderDate: "Apr 13, 2026",
    poValue: "₹3,25,000.00",
    items: 4,
    status: "In Transit",
    expectedDelivery: "Apr 25, 2026",
    trackingNo: "LT123456789IN",
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10030",
    orderDate: "Apr 12, 2026",
    poValue: "₹6,78,000.00",
    items: 6,
    status: "Delivered",
    expectedDelivery: "Apr 24, 2026",
    trackingNo: "DEL-456789123",
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10029",
    orderDate: "Apr 11, 2026",
    poValue: "₹1,12,000.00",
    items: 2,
    status: "Delivered",
    expectedDelivery: "Apr 23, 2026",
    trackingNo: "DEL-456789122",
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10028",
    orderDate: "Apr 10, 2026",
    poValue: "₹1,45,025.00",
    items: 3,
    status: "Cancelled",
    expectedDelivery: "Apr 22, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10027",
    orderDate: "Apr 09, 2026",
    poValue: "₹4,98,000.00",
    items: 7,
    status: "Overdue",
    expectedDelivery: "Apr 21, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10026",
    orderDate: "Apr 08, 2026",
    poValue: "₹2,98,000.00",
    items: 4,
    status: "Pending",
    expectedDelivery: "Apr 20, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
  {
    poId: "PO-10025",
    orderDate: "Apr 07, 2026",
    poValue: "₹1,89,050.00",
    items: 2,
    status: "Confirmed",
    expectedDelivery: "Apr 19, 2026",
    trackingNo: null,
    createdBy: "Pavan (System Owner)",
  },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Processing: "bg-blue-100 text-blue-700",
  Confirmed:  "bg-green-100 text-green-700",
  Shipped:    "bg-indigo-100 text-indigo-700",
  "In Transit": "bg-cyan-100 text-cyan-700",
  Delivered:  "bg-emerald-100 text-emerald-700",
  Cancelled:  "bg-gray-100 text-gray-500",
  Overdue:    "bg-red-100 text-red-600",
  Pending:    "bg-orange-100 text-orange-600",
};

function SortIcon() {
  return (
    <span className="flex flex-col ml-1">
      <ChevronUp className="w-3 h-3 -mb-1" />
      <ChevronDown className="w-3 h-3" />
    </span>
  );
}

function SelectBox({ label, options }: { label: string; options: string[] }) {
  const [val, setVal] = useState(options[0]);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <select
          className="appearance-none border border-gray-200 rounded-lg bg-white text-sm px-3 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function VendorOrdersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  return (
    <div
      className="w-full bg-gray-50 font-sans"
      onClick={() => setOpenRowMenu(null)}
    >
      <div className="max-w-[1280px] mx-auto px-4 py-6 space-y-4">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow ${stat.muted ? "opacity-70" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                {stat.icon}
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1 leading-tight">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <SelectBox
              label="Order Status"
              options={["All Status", "Processing", "Confirmed", "Shipped", "In Transit", "Delivered", "Cancelled", "Overdue", "Pending"]}
            />

            {/* Date Range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Date Range</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 min-w-[240px] cursor-pointer hover:border-gray-300 transition-colors">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Apr 01, 2025 – Apr 30, 2026</span>
                <Calendar className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
              </div>
            </div>

            <SelectBox
              label="Order Type"
              options={["All Types", "Purchase Order", "Return Order", "Replacement"]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">PO ID</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center cursor-pointer hover:text-gray-900">Order Date <SortIcon /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center cursor-pointer hover:text-gray-900">PO Value <SortIcon /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Items</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Expected Delivery</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center cursor-pointer hover:text-gray-900">Tracking No <SortIcon /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Created By</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ORDERS.map((order) => (
                  <tr key={order.poId} className="hover:bg-gray-50/70 transition-colors">
                    {/* PO ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold text-sm hover:underline cursor-pointer">
                        {order.poId}
                      </span>
                    </td>
                    {/* Order Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{order.orderDate}</td>
                    {/* PO Value */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-gray-800 text-sm">{order.poValue}</td>
                    {/* Items */}
                    <td className="px-4 py-3.5 text-gray-600 text-sm">{order.items}</td>
                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    {/* Expected Delivery */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{order.expectedDelivery}</td>
                    {/* Tracking No */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                      {order.trackingNo ? (
                        <span className="text-blue-600 font-medium hover:underline cursor-pointer">{order.trackingNo}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Created By */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{order.createdBy}</td>
                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRowMenu(openRowMenu === order.poId ? null : order.poId);
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openRowMenu === order.poId && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                              <button
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => setOpenRowMenu(null)}
                              >
                                <Pencil className="w-4 h-4 text-gray-400" />
                                Edit Order
                              </button>
                              <button
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                onClick={() => setOpenRowMenu(null)}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing 1 to 10 of 156 orders
            </span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-gray-400 text-sm">...</span>
              <button
                onClick={() => setCurrentPage(16)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 16
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                16
              </button>
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="ml-2 flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-gray-50">
                10 / page
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
