import { BarChart3, TrendingUp, Package, DollarSign, AlertCircle } from "lucide-react";

const DASHBOARD_STATS = [
  { label: "Pending Orders", value: 23, icon: Package, color: "bg-blue-100 text-blue-600" },
  { label: "Total Revenue", value: "$45,231", icon: DollarSign, color: "bg-green-100 text-green-600" },
  { label: "Fulfillment Rate", value: "94.5%", icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
  { label: "SLA Status", value: "On Track", icon: AlertCircle, color: "bg-yellow-100 text-yellow-600" },
];

export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div>
            <p className="text-xs text-gray-500">Vendor Portal / Dashboard</p>
            <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {DASHBOARD_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Orders by Month */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Orders Trend</h3>
            <div className="space-y-2">
              {["Jan", "Feb", "Mar", "Apr", "May"].map((month) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="w-8 text-sm">{month}</span>
                  <div className="flex-1 bg-gray-100 h-6 rounded" style={{width: Math.random() * 100 + "%"}}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>On-Time Delivery</span>
                  <span className="font-semibold">94%</span>
                </div>
                <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{width: "94%"}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quality Score</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{width: "87%"}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[
              { id: "ORD-001", client: "Tech Solutions Inc", status: "Delivered", date: "Jan 20" },
              { id: "ORD-002", client: "Marketing Pro", status: "Processing", date: "Jan 19" },
              { id: "ORD-003", client: "Finance Corp", status: "Pending", date: "Jan 18" },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.status}</p>
                  <p className="text-xs text-gray-500">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
