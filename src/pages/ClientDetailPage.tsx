"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function DashboardApp() {
  const [showProfile, setShowProfile] = useState(true)
  const [activeTab, setActiveTab] = useState("Overview")

  // ✅ DOWNLOAD FUNCTION
  const downloadProfile = () => {
    const content = `
Client Profile

Name: Apex Tech Solutions
Email: support@apex.com
Phone: +1-555-1000
Location: San Diego, CA
Client Since: Jan 2024
Contract: 2025 - 2026
Client ID: CLT-1024
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

        {/* 🔹 LEFT PROFILE PANEL */}
        <div
          className={`relative transition-all duration-300 ${
            showProfile ? "w-[300px]" : "w-0"
          }`}
        >
          {/* Toggle */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="absolute -right-3 top-4 z-10 bg-white border rounded-full p-1 shadow"
          >
            {showProfile ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Profile */}
          <div className={`transition-all ${showProfile ? "opacity-100" : "opacity-0 overflow-hidden"}`}>
            <Card>
              <CardContent className="p-4 space-y-4">
                <h2 className="text-center font-semibold">
                  Apex Tech Solutions
                </h2>

                <p className="text-sm text-center text-gray-500">
                  Premium Client
                </p>

                <div className="text-sm space-y-1">
                  <p>📧 support@apex.com</p>
                  <p>📞 +1-555-1000</p>
                  <p>📍 San Diego, CA</p>
                </div>

                <button
                  onClick={downloadProfile}
                  className="w-full bg-blue-600 text-white p-2 rounded"
                >
                  Download Profile
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 🔹 RIGHT CONTENT */}
        <div className="flex-1">

          {/* TABS */}
          <div className="flex gap-6 border-b mb-4">
            {["Overview","Users","Orders","Services","Catalog","Activity","Notes"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT (acts like pages) */}
          <Card>
            <CardContent className="p-6">
              {activeTab === "Overview" && <Overview />}
              {activeTab === "Users" && <Users />}
              {activeTab === "Orders" && <Orders />}
              {activeTab === "Services" && <Services />}
              {activeTab === "Catalog" && <Catalog />}
              {activeTab === "Activity" && <Activity />}
              {activeTab === "Notes" && <Notes />}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

//////////////////////////////////////////////////////
// 🔥 TAB PAGES (SIMULATED PAGES)
//////////////////////////////////////////////////////

function Overview() {
  return <h2 className="text-lg font-semibold">Overview Page</h2>
}

function Users() {
  return <h2 className="text-lg font-semibold">Users Page</h2>
}

function Orders() {
  return <h2 className="text-lg font-semibold">Orders Page</h2>
}

function Services() {
  return <h2 className="text-lg font-semibold">Services Page</h2>
}

function Catalog() {
  return <h2 className="text-lg font-semibold">Catalog Page</h2>
}

function Activity() {
  return <h2 className="text-lg font-semibold">Activity Page</h2>
}

function Notes() {
  return <h2 className="text-lg font-semibold">Notes Page</h2>
}