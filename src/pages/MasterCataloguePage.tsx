"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, Upload, Download, FileSpreadsheet, FileText, Package } from "lucide-react";

type ProductStatus = "Published" | "Draft" | "Archived";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  color: string;
  status: ProductStatus;
  updatedAt: string;
};

export default function MasterCataloguePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [tab, setTab] = useState("upload");

  const products: Product[] = [
    {
      id: 1,
      name: "Executive Office Chair",
      sku: "CHR-1001",
      category: "Furniture",
      brand: "IKEA",
      color: "Black",
      status: "Published",
      updatedAt: "2025-06-12",
    },
    {
      id: 2,
      name: "Standing Desk",
      sku: "DSK-1002",
      category: "Furniture",
      brand: "Steelcase",
      color: "White",
      status: "Draft",
      updatedAt: "2025-06-14",
    },
    {
      id: 3,
      name: "Gaming Laptop",
      sku: "LTP-1003",
      category: "Electronics",
      brand: "Dell",
      color: "Silver",
      status: "Archived",
      updatedAt: "2025-06-16",
    },
  ];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ? true : p.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const stats = [
    { label: "Total Items", value: products.length },
    { label: "Published", value: products.filter((x) => x.status === "Published").length },
    { label: "Draft", value: products.filter((x) => x.status === "Draft").length },
    { label: "Archived", value: products.filter((x) => x.status === "Archived").length },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Catalogue</h1>
          <p className="text-muted-foreground">
            Manage products, imports, exports and audit logs.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="border rounded-lg px-4 py-2 flex items-center gap-2">
            <Download size={16} />
            Export
          </button>

          <button className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-2">
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border p-5 bg-white shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4" />
          <input
            className="w-full border rounded-xl pl-10 pr-4 py-2"
            placeholder="Search by product name or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded-xl px-4 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Archived</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr className="text-left border-b">
              <th className="p-4">Product</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Brand</th>
              <th className="p-4">Color</th>
              <th className="p-4">Status</th>
              <th className="p-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4">{product.sku}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">{product.brand}</td>
                <td className="p-4">{product.color}</td>
                <td className="p-4">{product.status}</td>
                <td className="p-4">{product.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border p-6">
        <div className="flex gap-3 mb-6">
          <button onClick={() => setTab("upload")} className="border rounded-lg px-4 py-2">
            Bulk Upload
          </button>
          <button onClick={() => setTab("excel")} className="border rounded-lg px-4 py-2">
            Excel Export
          </button>
          <button onClick={() => setTab("pdf")} className="border rounded-lg px-4 py-2">
            PDF Export
          </button>
          <button onClick={() => setTab("audit")} className="border rounded-lg px-4 py-2">
            Audit Logs
          </button>
        </div>

        {tab === "upload" && (
          <div className="border-2 border-dashed rounded-2xl p-12 text-center">
            <Upload className="mx-auto mb-4" />
            <h3 className="font-semibold">Upload Catalogue File</h3>
            <p className="text-sm text-muted-foreground">
              CSV, XLSX supported
            </p>
          </div>
        )}

        {tab === "excel" && (
          <div className="flex items-center gap-3">
            <FileSpreadsheet />
            Generate Excel Export
          </div>
        )}

        {tab === "pdf" && (
          <div className="flex items-center gap-3">
            <FileText />
            Generate PDF Export
          </div>
        )}

        {tab === "audit" && (
          <div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3">Admin</td>
                  <td className="p-3">Created Product</td>
                  <td className="p-3">2025-06-15</td>
                </tr>
                <tr>
                  <td className="p-3">Manager</td>
                  <td className="p-3">Updated Status</td>
                  <td className="p-3">2025-06-16</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package />
          <h2 className="font-semibold">Approval Queue</h2>
        </div>

        <div className="space-y-3">
          <div className="border rounded-xl p-4 flex justify-between">
            <span>Gaming Laptop</span>
            <span>Pending Approval</span>
          </div>

          <div className="border rounded-xl p-4 flex justify-between">
            <span>Standing Desk</span>
            <span>Awaiting Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
