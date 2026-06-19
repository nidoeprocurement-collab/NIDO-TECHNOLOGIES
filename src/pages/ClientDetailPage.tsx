"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

export default function ApexDashboard() {
  const [showProfile, setShowProfile] = useState(true)
  const [activeTab, setActiveTab] = useState("Overview")

  const downloadProfile = () => {
    const content = `Apex Tech Solutions Profile`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "profile.txt"
    a.click()
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        Apex Tech Solutions
      </h1>

      {/* GRID LAYOUT (IMPORTANT FIX) */}
      <div
        className={`grid gap-6 transition-all duration-300 ${
          showProfile ? "grid-cols-4" : "grid-cols-1"
        }`}
      >

        {/* SIDEBAR */}
        {showProfile && (
          <div className="col-span-1">
            <Card className="relative overflow-hidden">

              {/* HIDE BUTTON */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-2 right-2 bg-white p-1 rounded shadow"
              >
                <EyeOff size={16} />
              </button>

              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-28 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center font-bold text-blue-600">
                  ATS
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                <h2 className="text-center font-semibold">
                  Apex Tech Solutions
                </h2>

                <div className="text-sm space-y-1">
                  <p>📧 support@apex.com</p>
                  <p>📞 +1-555-1000</p>
                  <p>📍 San Diego</p>
                </div>

                {/* PROGRESS */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Contract</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div className="bg-blue-500 h-2 rounded w-[70%]" />
                  </div>
                </div>

                <Button onClick={downloadProfile} className="w-full">
                  Download Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MAIN */}
        <div className={`${showProfile ? "col-span-3" : "col-span-1"}`}>

          {/* SHOW BUTTON */}
          {!showProfile && (
            <button
              onClick={() => setShowProfile(true)}
              className="mb-4 bg-white p-2 rounded shadow"
            >
              <Eye size={16} />
            </button>
          )}

          {/* TABS */}
          <div className="flex gap-6 border-b pb-2 mb-6">
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

          {/* OVERVIEW PAGE */}
          {activeTab === "Overview" && (
            <>
              {/* TOP STATS */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard title="Total Users" value="24" />
                <StatCard title="Total Spends" value="$101K" />
                <StatCard title="Open Orders" value="3" />
              </div>

              {/* ANALYTICS (EXACT MATCH) */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">

                    {/* COMPANY */}
                    <Card>
                      <CardContent className="p-4 text-sm space-y-1">
                        <h3 className="font-semibold">
                          Company Details
                        </h3>
                        <p>Apex Tech</p>
                        <p>Technology</p>
                        <p>51-200 employees</p>
                      </CardContent>
                    </Card>

                    {/* BAR CHART */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">
                          Spending
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

                    {/* PIE */}
                    <Card>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold mb-2">
                          Categories
                        </h3>
                        <div className="h-24 w-24 mx-auto rounded-full border-[10px] border-blue-500 border-t-cyan-400 border-r-purple-400 border-b-gray-300"></div>
                      </CardContent>
                    </Card>

                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* OTHER PAGES */}
          {activeTab !== "Overview" && (
            <Card>
              <CardContent className="p-6 text-center">
                {activeTab} Page
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}