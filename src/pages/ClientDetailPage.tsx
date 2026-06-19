"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const lineData = [
  { name: "Jan", value: 20000 },
  { name: "Feb", value: 40000 },
  { name: "Mar", value: 50000 },
  { name: "Apr", value: 65000 },
  { name: "May", value: 80000 },
  { name: "Jun", value: 101000 },
]

const pieData = [
  { name: "Hardware", value: 45, color: "#4f46e5" },
  { name: "Software", value: 30, color: "#3b82f6" },
  { name: "Service", value: 15, color: "#8b5cf6" },
  { name: "Other", value: 10, color: "#9ca3af" },
]

export default function ClientDetailPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-white border-r p-6 space-y-6">
        
        <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white text-3xl font-bold">
          ATS
        </div>

        <div>
          <h2 className="text-lg font-semibold">Apex Tech Solutions</h2>
          <p className="text-sm text-gray-500">Premium Client • Since 2024</p>
        </div>

        <div className="space-y-2 text-sm">
          <p>📧 support@apex.com</p>
          <p>📞 +1-555-1000</p>
          <p>📍 San Diego, CA</p>
          <p>📅 2025–2026</p>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">
            Email
          </button>
          <button className="flex-1 border py-2 rounded-lg">
            Call
          </button>
        </div>

        <div>
          <p className="text-sm mb-2">Contract Progress</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 w-[70%] bg-indigo-500 rounded-full" />
          </div>
          <p className="text-xs mt-1 text-gray-500">272 days left</p>
        </div>

        <button className="w-full border rounded-lg py-2 text-sm">
          ⬇ Download Profile
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">

        <h1 className="text-2xl font-semibold">Apex Tech Solutions</h1>

        {/* TOP CARDS */}
        <div className="grid grid-cols-3 gap-4">
          <TopCard title="Total Users" value="24" sub="12 Active" />
          <TopCard title="Total Spends" value="$101,000" sub="Year to date" />
          <TopCard title="Open Orders" value="3" sub="$32,500 value" />
        </div>

        {/* MIDDLE GRID */}
        <div className="grid grid-cols-3 gap-4">

          {/* COMPANY DETAILS */}
          <div className="card">
            <h3 className="card-title">Company Details</h3>
            <div className="space-y-2 text-sm">
              <p><b>Apex Tech Solutions</b></p>
              <p>Technology</p>
              <p>51–200 employees</p>
              <p>🌐 www.apex.com</p>
              <p>📞 +1-555-1000</p>
              <p>✉ billing@apex.com</p>
            </div>
          </div>

          {/* LINE CHART */}
          <div className="card">
            <h3 className="card-title">Spending Overview</h3>
            <p className="text-xl font-semibold mb-2">$101,000</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PIE CHART */}
          <div className="card">
            <h3 className="card-title">Top Spend Categories</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="grid grid-cols-3 gap-4">

          <div className="card">
            <h3 className="card-title">User Summary</h3>
            <p><b>24</b> Total Users</p>
            <p className="text-green-600">12 Active</p>
            <p className="text-red-500">4 Inactive</p>
          </div>

          <div className="card">
            <h3 className="card-title">Recent Orders</h3>
            <p><b>3</b> Open Orders</p>
            <p>$32,500 Total</p>
          </div>

          <div className="card">
            <h3 className="card-title">Active Services</h3>
            <p><b>2</b> Contracts</p>
            <p className="text-amber-600">272 days</p>
          </div>

        </div>
      </main>
    </div>
  )
}

/* COMPONENTS */

function TopCard({ title, value, sub }: any) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-semibold">{value}</h2>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  )
}