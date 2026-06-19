"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CompanyDashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold mb-4">veera industries</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value="24" sub="12 Active • 3 Pending invites" />
        <StatCard title="Total Spends" value="$101,000" sub="Last Payment: $25,000" />
        <StatCard title="Open Orders" value="3" sub="$32,500 value" />
        <StatCard title="Contracts" value="3" sub="Active contracts" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-4 gap-6">
        
        {/* LEFT PROFILE */}
        <Card className="col-span-1">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full border-2 flex items-center justify-center text-blue-600 font-bold">
                VI
              </div>
              <h2 className="mt-2 font-semibold">veera industries</h2>
              <p className="text-sm text-gray-500">Premium Client • Since 2026</p>
            </div>

            <div className="text-sm space-y-2">
              <p>📧 Veeru@indu.com</p>
              <p>📞 9784515647</p>
              <p>📍 No address</p>
              <p>🌐 N/A</p>
            </div>

            <div className="flex gap-2">
              <Button className="w-full">Email</Button>
              <Button variant="outline" className="w-full">Call</Button>
            </div>

            <div>
              <p className="text-sm mb-1">Contract Status</p>
              <p className="text-sm font-semibold">Active</p>
              <p className="text-xs text-gray-500 mt-1">0 days left</p>
            </div>

            <div className="text-sm flex justify-between">
              <span>Client Since</span>
              <span>Jun 2026</span>
            </div>

            <div className="text-sm flex justify-between">
              <span>Client ID</span>
              <span>CI-00023</span>
            </div>

            <Button className="w-full mt-2">Download Profile</Button>
          </CardContent>
        </Card>

        {/* RIGHT SIDE */}
        <div className="col-span-3 space-y-6">

          {/* TABS */}
          <div className="flex gap-6 border-b pb-2 text-sm">
            <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Overview</span>
            <span>Roles</span>
            <span>Users</span>
            <span>Orders</span>
            <span>Services</span>
            <span>Catalog</span>
            <span>Activity</span>
            <span>Configuration</span>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-3 gap-4">

            {/* COMPANY DETAILS */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <h3 className="font-semibold">Company Details</h3>
                <p>🏢 veera industries</p>
                <p>💻 Technology</p>
                <p>👥 51-200 employees</p>
                <p>🌐 www.veeraindustries.com</p>
                <p>📞 9784515647</p>
                <p>📧 Veeru@indu.com</p>
              </CardContent>
            </Card>

            {/* SPENDING OVERVIEW */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Spending Overview</h3>
                <p className="text-xl font-bold">$101,000</p>
                <p className="text-green-500 text-sm">+12.5% vs last year</p>

                {/* Fake chart bars */}
                <div className="mt-4 flex items-end gap-2 h-24">
                  {[10, 20, 30, 25, 35, 40, 45, 30, 50].map((h, i) => (
                    <div key={i} className="bg-blue-500 w-3" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CATEGORY PIE */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">Top Spend Categories</h3>

                <div className="flex items-center justify-center h-32">
                  <div className="h-24 w-24 rounded-full border-8 border-blue-500 border-t-green-500 border-r-yellow-500 border-b-purple-500"></div>
                </div>

                <div className="text-sm space-y-1">
                  <p>🔵 Hardware 45%</p>
                  <p>🟢 Software 30%</p>
                  <p>🟡 Service 15%</p>
                  <p>🟣 Other 10%</p>
                </div>
              </CardContent>
            </Card>

            {/* USER SUMMARY */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">User Summary</h3>
                <p className="text-xl font-bold">24</p>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="text-green-600">12 Active</span>
                  <span className="text-red-500">4 Inactive</span>
                </div>
              </CardContent>
            </Card>

            {/* RECENT ORDERS */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">Recent Orders</h3>
                <p className="text-xl font-bold">$32,500</p>
                <p className="text-sm">3 Open Orders</p>
              </CardContent>
            </Card>

            {/* ACTIVE SERVICES */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">Active Services</h3>
                <p className="text-xl font-bold text-blue-600">0 days</p>
                <p className="text-sm">Until Renewal</p>
                <p className="text-sm mt-1">2 Active Contracts</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

/* REUSABLE STAT CARD */
function StatCard({ title, value, sub }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </CardContent>
    </Card>
  )
}
