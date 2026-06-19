"use client"
import { useState } from "react"

export default function Dashboard() {
  const [hideSidebar, setHideSidebar] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] p-6 gap-6">

      {/* SIDEBAR */}
      {!hideSidebar && (
        <div className="w-[280px] bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative">

          {/* Hide Button */}
          <button
            onClick={() => setHideSidebar(true)}
            className="absolute -right-3 top-6 bg-white border shadow-sm rounded-full px-2 py-1"
          >
            ◀
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#2f6fed] to-[#6ea8fe] h-28 rounded-xl flex items-center justify-center text-white text-2xl font-semibold">
            ATS
          </div>

          <h2 className="mt-4 text-[16px] font-semibold text-gray-800">
            Apex Tech Solutions
          </h2>
          <p className="text-sm text-gray-400">
            Premium Client • Since 2024
          </p>

          {/* Info */}
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>📧 support@apex.com</p>
            <p>📞 +1-555-1000</p>
            <p>📍 San Diego, CA</p>
            <p>📅 2025–2026</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button className="bg-[#2f6fed] text-white px-4 py-2 rounded-lg w-full">
              Email
            </button>
            <button className="border px-4 py-2 rounded-lg w-full">
              Call
            </button>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <p className="text-sm text-gray-500 mb-1">
              Contract Progress
            </p>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-[#2f6fed] w-[70%] rounded-full"></div>
            </div>
          </div>

          {/* Download */}
          <button className="mt-5 w-full border rounded-lg py-2 text-sm">
            ⬇ Download Profile
          </button>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1">

        {hideSidebar && (
          <button
            onClick={() => setHideSidebar(false)}
            className="mb-4 bg-white border px-3 py-1 rounded"
          >
            ▶
          </button>
        )}

        <h1 className="text-[24px] font-semibold text-gray-800 mb-4">
          Apex Tech Solutions
        </h1>

        {/* TABS */}
        <div className="flex gap-6 border-b mb-6 text-sm">
          {["Overview","Users","Orders","Services","Catalog","Activity","Notes"].map(tab => (
            <span
              key={tab}
              className={`pb-2 cursor-pointer ${
                tab === "Overview"
                  ? "border-b-2 border-gray-900 text-gray-900 font-medium"
                  : "text-gray-400"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* TOP CARDS */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card title="Total Users" value="24" sub="12 Active" />
          <Card title="Total Spends" value="$101,000" sub="Year to date" />
          <Card title="Open Orders" value="3" sub="$32,500 value" />
        </div>

        {/* MIDDLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-3 gap-6">
            <Box title="Company Details" />
            <Box title="Spending Overview" chart="line" />
            <Box title="Top Spend Categories" chart="pie" />
          </div>
        </div>

        {/* BOTTOM */}
        <div className="grid grid-cols-3 gap-6">
          <Card title="User Summary" value="24" sub="Total Users" />
          <Card title="Recent Orders" value="3" sub="$32,500" />
          <Card title="Active Services" value="2" sub="272 days" />
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-semibold text-gray-800 mt-1">
        {value}
      </h2>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function Box({ title, chart }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-[220px]">
      <p className="font-medium text-gray-700 mb-2">{title}</p>

      {chart === "line" && (
        <>
          
        </>
      )}

      {chart === "pie" && (
        <>
          
        </>
      )}
    </div>
  )
}