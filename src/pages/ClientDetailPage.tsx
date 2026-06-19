"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

export default function ApexDashboard() {
  const [showProfile, setShowProfile] = useState(true)
  const [activeTab, setActiveTab] = useState("Overview")

  // DOWNLOAD FUNCTION
  const downloadProfile = () => {
    const content = `
Client: Apex Tech Solutions
Email: support@apex.com
Phone: +1-555-1000
Address: 123 Corp Ave, San Diego, CA
Client ID: CLT-1024
Since: Jan 2024
Contract: 2025-01-01 to 2026-12-31
    `

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "client-profile.txt"
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        Apex Tech Solutions
      </h1>

      <div className="flex gap-6">

        {/* SIDEBAR */}
        {showProfile && (
          <div className="w-80 transition-all duration-300">
            <Card className="overflow-hidden relative">

              {/* TOGGLE BUTTON (RIGHT SIDE) */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-2 right-2 p-1 bg-white rounded shadow"
              >
                <EyeOff size={16} />
              </button>

              {/* TOP */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-28 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center font-bold text-blue-600">
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
                  <p>📍 San Diego, CA</p>
                </div>

                <div className="flex gap-2">
                  <Button className="w-full">Email</Button>
                  <Button variant="outline" className="w-full">
                    Call
                  </Button>
                </div>

                {/* PROGRESS (CUSTOM FIX - NO IMPORT ERROR) */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Contract</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div className="bg-blue-500 h-2 rounded w-[70%]" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadProfile}
                >
                  Download Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SHOW BUTTON WHEN HIDDEN */}
        {!showProfile && (
          <button
            onClick={() => setShowProfile(true)}
            className="h-10 px-3 bg-white shadow rounded"
          >
            <Eye size={16} />
          </button>
        )}

        {/* MAIN CONTENT (AUTO EXPANDS) */}
        <div className="flex-1 transition-all duration-300">

          {/* TABS */}
          <div className="flex gap-6 border-b pb-2 mb-4">
            {[
              "Overview",
              "Users",
              "Orders",
              "Services",
              "Catalog",
              "Activity",
              "Notes",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          {activeTab === "Overview" && <Overview />}
          {activeTab === "Users" && <Page title="Users Page" />}
          {activeTab === "Orders" && <Page title="Orders Page" />}
          {activeTab === "Services" && <Page title="Services Page" />}
          {activeTab === "Catalog" && <Page title="Catalog Page" />}
          {activeTab === "Activity" && <Page title="Activity Page" />}
          {activeTab === "Notes" && <Page title="Notes Page" />}
        </div>
      </div>
    </div>
  )
}

/* OVERVIEW PAGE */
function Overview() {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Users" value="24" sub="12 Active" />
        <StatCard title="Spends" value="$101K" sub="+12%" />
        <StatCard title="Orders" value="3" sub="Open" />
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">
            Spending Overview
          </h3>

          <div className="flex items-end gap-2 h-24">
            {[20,30,40,50,60,80,100].map((h,i)=>(
              <div
                key={i}
                className="bg-blue-500 w-3"
                style={{height:`${h}%`}}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* SIMPLE PAGE */
function Page({ title }: any) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-lg">
        {title}
      </CardContent>
    </Card>
  )
}

/* STAT CARD */
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