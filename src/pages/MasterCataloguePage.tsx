// MasterCataloguePage_Full.tsx
"use client";

import { Upload, Download, Plus, FileSpreadsheet } from "lucide-react";

export default function MasterCataloguePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Master Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and review all products/services available for client contracts
            and downstream client specific mappings.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-md bg-blue-600 text-white px-4 py-3 text-sm font-medium">
            12 Total
          </div>
          <div className="rounded-md bg-green-100 text-green-700 px-4 py-3 text-sm font-medium">
            9 Published
          </div>
          <div className="rounded-md bg-amber-100 text-amber-700 px-4 py-3 text-sm font-medium">
            0 Drafts
          </div>
          <div className="rounded-md bg-red-100 text-red-600 px-4 py-3 text-sm font-medium">
            0 Archived
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex justify-end gap-2 mb-4">
            <button className="h-8 px-3 text-xs border rounded-md flex items-center gap-1 bg-white">
              <Download size={14} />
              Export CSV
            </button>

            <button className="h-8 px-3 text-xs border rounded-md bg-white">
              Bulk Import
            </button>

            <button className="h-8 px-3 text-xs rounded-md bg-blue-600 text-white flex items-center gap-1">
              <Plus size={14} />
              Add New Item
            </button>
          </div>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr className="text-slate-500">
                  <th className="p-3 text-left">ITEM NAME</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-left">CATEGORY</th>
                  <th className="p-3 text-left">BRAND</th>
                  <th className="p-3 text-left">STATUS</th>
                  <th className="p-3 text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-slate-400"
                  >
                    No items match the selected filters. Adjust search,
                    category, or status to view catalog entries.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            Showing 0 of 0 entries
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white">
            <div className="border-b p-3">
              <h2 className="text-sm font-medium">Import / Export Products</h2>
            </div>

            <div className="px-3 pt-3 flex gap-4 text-xs">
              <button className="font-medium border-b-2 border-blue-600 pb-2">
                Bulk Upload Items
              </button>
              <button className="text-slate-500">
                Export Catalog (Excel)
              </button>
              <button className="text-slate-500">
                Export Catalog (PDF)
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed rounded-lg py-10 text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <div className="text-xs text-slate-500">
                  Bulk upload your product catalog using CSV template.
                </div>

                <button className="mt-4 px-4 py-2 text-xs rounded-md bg-blue-600 text-white">
                  Upload
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="text-sm font-medium">Approval & Audit Logs</h2>

              <button className="text-xs border rounded-md px-3 py-1 flex items-center gap-1">
                <FileSpreadsheet size={14} />
                Export
              </button>
            </div>

            <div className="p-3">
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-500">
                      <th className="p-3 text-left">EVENT</th>
                      <th className="p-3 text-left">USER</th>
                      <th className="p-3 text-left">DATE</th>
                      <th className="p-3 text-left">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="h-32"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
