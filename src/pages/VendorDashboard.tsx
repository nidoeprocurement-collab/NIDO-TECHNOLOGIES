import { BarChart3, TrendingUp, Package, DollarSign, AlertCircle, Star } from "lucide-react";

const DASHBOARD_STATS = [
  { label: "TOTAL VENDORS", value: 2, icon: Package, color: "bg-blue-100 text-blue-600" },
  { label: "TOTAL SPEND", value: "$NaN", icon: DollarSign, color: "bg-green-100 text-green-600" },
  { label: "TOTAL ORDERS", value: "NaN", icon: BarChart3, color: "bg-purple-100 text-purple-600" },
  { label: "AVG RATING", value: "0.0", icon: Star, color: "bg-yellow-100 text-yellow-600" },
];

const MOCK_VENDOR_PROFILES = [
  { id: 1, vendor: "SGH.JSBMDF", category: "IT Hardware", rating: 0, orders: 0, spend: "$0", status: "Active" },
  { id: 2, vendor: "raj furnitures", category: "manufacturer", rating: 0, orders: 0, spend: "$0", status: "Active" },
];

export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Vendor Analytics</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {DASHBOARD_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-semibold">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon size={20} className="sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Spend by Category */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Spend by Category</h3>
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-500">No data available</p>
            </div>
          </div>

          {/* Top Vendors by Spend */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Top Vendors by Spend ($K)</h3>
            <div className="space-y-3">
              {["SGH.JSBMDF", "raj furnitures"].map((vendor) => (
                <div key={vendor} className="flex items-center gap-3">
                  <span className="w-24 sm:w-32 text-xs sm:text-sm truncate">{vendor}</span>
                  <div className="flex-1 bg-gray-100 h-5 rounded" style={{width: Math.random() * 100 + "%"}}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor Profiles Table */}
        <div className="bg-white p-4 sm:p-6 rounded-lg border">
          <h3 className="font-semibold mb-4 text-sm sm:text-base">Vendor Profiles</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">VENDOR</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">CATEGORY</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">RATING</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">ORDERS</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">TOTAL SPEND</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VENDOR_PROFILES.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">{vendor.vendor}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm">{vendor.category}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm"><span className="text-yellow-500">★</span> {vendor.rating}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">{vendor.orders}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs sm:text-sm">{vendor.spend}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {vendor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
