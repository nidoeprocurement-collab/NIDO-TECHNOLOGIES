"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Upload, Plus, Download } from "lucide-react";

export default function MasterCataloguePage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState([
    { id: 1, name: "Office Chair", sku: "CHR001", category: "Furniture", brand: "IKEA", status: "published" },
    { id: 2, name: "Laptop", sku: "LTP001", category: "Electronics", brand: "Dell", status: "draft" },
    { id: 3, name: "Desk", sku: "DSK001", category: "Furniture", brand: "Steelcase", status: "archived" },
  ]);

  const filtered = useMemo(() => {
    return products.filter(p =>
      (filter === "all" || p.status === filter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, filter, search]);

  const exportCSV = () => {
    const csv = filtered.map(p => `${p.name},${p.sku},${p.category},${p.brand},${p.status}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "catalog.csv";
    a.click();
  };

  return <div className="p-6 space-y-6">
    <h1 className="text-3xl font-bold">Master Catalogue</h1>

    <div className="grid grid-cols-4 gap-4">
      {["all","published","draft","archived"].map(s=>
        <button key={s} onClick={()=>setFilter(s)} className="border rounded-xl p-4 text-left">
          {s.toUpperCase()}
        </button>
      )}
    </div>

    <div className="flex gap-2 justify-end">
      <button onClick={exportCSV}>Export CSV</button>
      <button onClick={()=>fileRef.current?.click()}>Bulk Import</button>
      <button onClick={()=>setOpen(true)}>Add New Item</button>
      <input hidden ref={fileRef} type="file" />
    </div>

    <input
      placeholder="Search"
      value={search}
      onChange={e=>setSearch(e.target.value)}
      className="border p-2 w-full"
    />

    <table className="w-full border">
      <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Brand</th><th>Status</th></tr></thead>
      <tbody>
        {filtered.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td>{p.category}</td><td>{p.brand}</td><td>{p.status}</td></tr>)}
      </tbody>
    </table>

    <div>
      <button onClick={()=>setActiveTab("upload")}>Bulk Upload</button>
      <button onClick={()=>setActiveTab("excel")}>Export Excel</button>
      <button onClick={()=>setActiveTab("pdf")}>Export PDF</button>

      {activeTab==="upload" && <div className="border p-10 mt-4">
        <button onClick={()=>fileRef.current?.click()}>Upload File</button>
      </div>}
      {activeTab==="excel" && <div className="mt-4">Excel Export Panel</div>}
      {activeTab==="pdf" && <div className="mt-4">PDF Export Panel</div>}
    </div>
  </div>
}
