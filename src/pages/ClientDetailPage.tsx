\
"use client";

import { useState } from "react";

export default function ClientOverviewPage() {
  const [showClientCard, setShowClientCard] = useState(true);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-3">
      <h1 className="text-3xl font-bold mb-3">Nitin Supplies</h1>

      <div
        className={`grid gap-4 transition-all duration-300 ${
          showClientCard ? "grid-cols-[280px_1fr]" : "grid-cols-1"
        }`}
      >
        {showClientCard && (
          <div className="bg-white border rounded-xl p-5">
            <button
              className="text-sm border rounded px-2 py-1 mb-4"
              onClick={() => setShowClientCard(false)}
            >
              Hide Panel
            </button>

            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-[#4f6ef7] flex items-center justify-center text-[#4f6ef7] text-2xl font-bold">
                NS
              </div>
            </div>

            <h2 className="text-center font-semibold mt-4">Nitin Supplies</h2>
            <p className="text-center text-sm text-gray-500">
              Premium Client • Since 2026
            </p>
          </div>
        )}

        <div>
          {!showClientCard && (
            <button
              className="mb-3 border rounded px-3 py-2 bg-white"
              onClick={() => setShowClientCard(true)}
            >
              Show Client Card
            </button>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-5">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-3xl font-bold">24</div>
              <div className="text-sm">12 Active</div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <div className="text-sm text-gray-500">Total Spends</div>
              <div className="text-3xl font-bold">$101,000</div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <div className="text-sm text-gray-500">Open Orders</div>
              <div className="text-3xl font-bold">3</div>
            </div>
          </div>

          <div className="border-b mt-5">
            <div className="flex gap-6 text-sm">
              <div className="border-b-2 border-[#4f6ef7] text-[#4f6ef7] pb-3">
                Overview
              </div>
              <div>Roles</div>
              <div>Users</div>
              <div>Orders</div>
              <div>Services</div>
              <div>Catalog</div>
              <div>Activity</div>
              <div>Configuration</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold">Company Details</h3>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold">Spending Overview</h3>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold">Top Spend Categories</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
