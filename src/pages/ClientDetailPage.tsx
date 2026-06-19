"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff } from "lucide-react"

export default function ApexDashboard() {
  const [showProfile, setShowProfile] = useState(true)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <h1 className="text-2xl font-semibold mb-6">Apex Tech Solutions</h1>

      <div className="grid grid-cols-4 gap-6">
        
        {/* LEFT PROFILE WITH TOGGLE */}
        <div className="col-span-1">

          {/* Toggle Button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 rounded-md hover:bg-gray-200"
            >
              {showProfile ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {/* Profile Card */}
          <div
            className={`transition-all duration-300 ${
              showProfile ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            <Card className="overflow-hidden">
              
              {/* Top Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-28 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl shadow-md">
                  ATS
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <h2 className="font-semibold text-lg">
                    Apex Tech Solutions
                  </h2>
                  <p className="text-sm text-gray-500">
                    Premium Client • Since 2024
                  </p>
                </div>

                <div className="text-sm space-y-2">
                  <p>📧 support@apex.com</p>
                  <p>📞 +1-555-1000</p>
                  <p>📍 123 Corp Ave, San Diego, CA</p>
                  <p>📅 2025-01-01 - 2026-12-31</p>
                </div>

                <div className="flex gap-2">
                  <Button className="w-full">Email</Button>
                  <Button variant="outline" className="w-full">
                    Call
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Contract Progress</span>
                    <span>272 days left</span>
                  </div>
                  <Progress value={70} />
                </div>

                <div className="flex justify-between text-sm bg-gray-100 p-2 rounded">
                  <span>Client Since</span>
                  <span>Jan 2024</span>
                </div>

                <div className="flex justify-between text-sm bg-gray-100 p-2 rounded">
                  <span>Client ID</span>
                  <span>CLT-1024</span>
                </div>

                <Button variant="outline" className="w-full">
                  Download Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-span-3 space-y-6">

          {/* TABS */}
          <div className="flex gap-6 border-b pb-2 text-sm">
            <span className="text-blue-600 border-b-2 border-blue-600 pb-1">
              Overview
            </span>
            <span>Users</span>
            <span>Orders</span>
            <span>Services</span>
            <span>Catalog</span>
            <span>Activity</span>
            <span>Notes</span>
          </div>

          {/* TOP STATS */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              title="Total Users"
              value="24"
              sub="12 Active • 3 Pending invites"
            />
            <StatCard
              title="Total Spends"
              value="$101,000"
              sub="Last Payment: $25,000"
            />
            <StatCard
              title="Open Orders"
              value="3"
              sub="$32,500 value"
            />
          </div>

          {/* ANALYTICS */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">

                {/* COMPANY DETAILS */}
                <Card>
                  <CardContent className="p-4 space-y-2 text-sm">
                    <h3 className="font-semibold">Company Details</h3>
                    <p>🏢 Apex Tech Solutions</p>
                    <p>💻 Technology</p>
                    <p>👥 51-200 employees</p>
                    <p>🌐 www.apex.com</p>
                    <p>📞 +1-555-1000</p>
                    <p>📧 billing@apex.com</p>
                  </CardContent>
                </Card>

                {/* SPENDING */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">
                        Spending Overview
                      </h3>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        This Year
                      </span>
                    </div>

                    <p className="text-xl font-bold mt-2">
                      $101,000
                    </p>
                    <p className="text-green-500 text-sm">
                      +12.5% vs last year
                    </p>

                    <div className="mt-4 flex items-end gap-2 h-24">
                      {[20,30,40,50,60,80,100].map((h,i)=>(
                        <div key={i} className="bg-blue-500 w-3" style={{height:`${h}%`}} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* PIE */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold">
                      Top Spend Categories
                    </h3>

                    <div className="flex justify-center">
                      <div className="h-24 w-24 rounded-full border-[10px] border-blue-500 border-t-cyan-400 border-r-purple-400 border-b-gray-300"></div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p>🔵 Hardware 45%</p>
                      <p>🔷 Software 30%</p>
                      <p>🟣 Service 15%</p>
                      <p>⚪ Other 10%</p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </CardContent>
          </Card>

          {/* BOTTOM */}
          <div className="grid grid-cols-3 gap-4">

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">User Summary</h3>
                <p className="text-xl font-bold">24</p>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="text-green-600">12 Active</span>
                  <span className="text-red-500">4 Inactive</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Recent Orders</h3>
                <p className="text-xl font-bold">$32,500</p>
                <p className="text-sm">3 Open Orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Active Services</h3>
                <p className="text-xl font-bold text-orange-500">
                  272 days
                </p>
                <p className="text-sm">Until Renewal</p>
                <p className="text-sm mt-1">
                  2 Active Contracts
                </p>
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