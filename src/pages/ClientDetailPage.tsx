"use client"

import { useState } from "react"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Overview")
  const [hideSidebar, setHideSidebar] = useState(false)

  const tabs = ["Overview", "Users", "Orders", "Services", "Catalog", "Activity", "Notes"]

  const downloadProfile = () => {
    const content = `
Client: Apex Tech Solutions
Email: support@apex.com
Phone: +1-555-1000
Employees: 51-200
Website: www.apex.com
`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "client-profile.txt"
    a.click()
  }

  return (
    <div className="flex bg-gray-100 min-h-screen p-6 gap-6">

      {/* SIDEBAR */}
      {!hideSidebar && (
        <div className="w-[300px] bg-white rounded-2xl shadow-md p-5 relative">

          {/* Hide Button */}
          <button
            onClick={() => setHideSidebar(true)}
            className="absolute -right-3 top-6 bg-white shadow px-2 py-1 rounded-full"
          >
            ◀
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-32 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
            ATS
          </div>

          <h2 className="text-lg font-semibold mt-4">Apex Tech Solutions</h2>
          <p className="text-sm text-gray-500">Premium Client • Since 2024</p>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>📧 support@apex.com</p>
            <p>📞 +1-555-1000</p>
            <p>📍 San Diego, CA</p>
            <p>📅 2025-2026</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full">Email</button>
            <button className="border px-4 py-2 rounded-lg w-full">Call</button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">Contract Progress</p>
            <div className="h-2 bg-gray-200 rounded-full mt-1">
              <div className="h-2 bg-blue-600 rounded-full w-[70%]"></div>
            </div>
          </div>

          <button
            onClick={downloadProfile}
            className="mt-4 w-full border rounded-lg py-2 text-sm"
          >
            ⬇ Download Profile
          </button>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1">

        {/* Show Button */}
        {hideSidebar && (
          <button
            onClick={() => setHideSidebar(false)}
            className="mb-3 bg-white shadow px-3 py-1 rounded"
          >
            ▶ Show Profile
          </button>
        )}

        <h1 className="text-2xl font-semibold mb-4">Apex Tech Solutions</h1>

        {/* TABS */}
        <div className="flex gap-6 border-b mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 ${
                activeTab === tab
                  ? "border-b-2 border-black font-semibold"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "Overview" && (
          <>
            {/* TOP CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card title="Total Users" value="24" sub="12 Active" />
              <Card title="Total Spends" value="$101,000" sub="Year to date" />
              <Card title="Open Orders" value="3" sub="$32,500 value" />
            </div>

            {/* MIDDLE */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Box title="Company Details" />
              <Box title="Spending Overview" />
              <Box title="Top Spend Categories" />
            </div>

            {/* BOTTOM */}
            <div className="grid grid-cols-3 gap-4">
              <Card title="User Summary" value="24" sub="Total Users" />
              <Card title="Recent Orders" value="3" sub="$32,500" />
              <Card title="Active Services" value="2" sub="272 days" />
            </div>
          </>
        )}

        {/* OTHER TABS */}
        {activeTab !== "Overview" && (
          <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
            {activeTab} Page Content
          </div>
        )}
      </div>
    </div>
  )
}

/* COMPONENTS */

function Card({ title, value, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-semibold mt-1">{value}</h2>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function Box({ title }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow h-[200px]">
      <p className="font-semibold">{title}</p>
    </div>
  )
}