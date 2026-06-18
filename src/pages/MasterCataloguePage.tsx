"use client";

import React, { useMemo, useRef, useState } from "react";
import { Upload, Download, Plus, Search, FileText, FileSpreadsheet } from "lucide-react";
import CatalogUpdatesTab from "@/components/configuration/CatalogUpdatesTab";

const COLORS = ["Black","White","Red","Blue","Green","Yellow","Orange","Purple","Pink","Brown","Gray","Silver","Gold","Beige","Maroon","Navy","Teal","Olive","Cyan","Magenta"];

type Status = "published" | "draft" | "archived";

export default function MasterCataloguePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upload");
  const [activeTab, setActiveTab] = useState("products");

  const [products, setProducts] = useState([
    {id:1,name:"Office Chair",sku:"OC001",category:"Furniture",brand:"IKEA",color:"Black",status:"published" as Status},
    {id:2,name:"Standing Desk",sku:"SD002",category:"Furniture",brand:"Steelcase",color:"White",status:"draft" as Status},
    {id:3,name:"Laptop",sku:"LP003",category:"Electronics",brand:"Dell",color:"Silver",status:"archived" as Status},
  ]);

  const [form,setForm] = useState({
    name:"",sku:"",category:"",brand:"",color:"Black",status:"published"
  });

  const filtered = useMemo(()=>products.filter(p=>{
    const f = filter==="all" || p.status===filter;
    const s = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return f && s;
  }),[products,filter,search]);

  const exportCSV=()=>{
    const rows = [
      "Name,SKU,Category,Brand,Color,Status",
      ...filtered.map(p=>`${p.name},${p.sku},${p.category},${p.brand},${p.color},${p.status}`)
    ];
    const blob=new Blob([rows.join("\n")],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="catalog.csv";
    a.click();
  };

  const addProduct=()=>{
    setProducts([...products,{id:Date.now(),...form,status:form.status as Status}]);
    setShowAdd(false);
  };

  if (activeTab === "add") {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add Master Catalogue Item</h1>
          <button onClick={()=>setActiveTab("products")} className="text-slate-500 hover:text-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="w-full">
          <CatalogUpdatesTab />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Master Catalogue</h1>
            <p className="text-slate-500">Manage products and catalog operations</p>
          </div>
          <div className="flex gap-2 border-b">
            <button onClick={()=>setActiveTab("products")} className={`px-4 py-2 border-b-2 transition ${activeTab==="products" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>Products</button>
            <button onClick={()=>setActiveTab("add")} className={`px-4 py-2 border-b-2 transition ${activeTab==="add" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>Add Master Catalogue</button>
          </div>
        </div>

        <>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ["all","Total",products.length,"bg-blue-600 text-white"],
            ["published","Published",products.filter(x=>x.status==="published").length,"bg-green-100"],
            ["draft","Drafts",products.filter(x=>x.status==="draft").length,"bg-amber-100"],
            ["archived","Archived",products.filter(x=>x.status==="archived").length,"bg-red-100"]
          ].map(([key,label,count,cls])=>(
            <button key={String(key)} onClick={()=>setFilter(String(key))} className={`rounded-xl p-4 text-left border ${cls}`}>
              <div className="text-sm">{label}</div>
              <div className="text-3xl font-bold">{count}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex flex-wrap gap-2 justify-between mb-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4"/>
              <input className="border rounded-lg pl-10 p-2 w-full" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="border rounded-lg px-3 py-2 flex gap-2"><Download size={16}/>Export CSV</button>
              <button onClick={()=>fileRef.current?.click()} className="border rounded-lg px-3 py-2">Bulk Import</button>
              <button onClick={()=>setActiveTab("add")} className="bg-blue-600 text-white rounded-lg px-3 py-2 flex gap-2"><Plus size={16}/>Add New Item</button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Name</th><th>SKU</th><th>Category</th><th>Brand</th><th>Color</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className="border-b">
                  <td className="p-3">{p.name}</td><td>{p.sku}</td><td>{p.category}</td><td>{p.brand}</td><td>{p.color}</td><td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b font-semibold">Import / Export Products</div>
            <div className="flex gap-4 px-4 pt-4">
              <button onClick={()=>setTab("upload")}>Bulk Upload Items</button>
              <button onClick={()=>setTab("excel")}>Export Excel</button>
              <button onClick={()=>setTab("pdf")}>Export PDF</button>
            </div>
            <div className="p-4">
              {tab==="upload" && <div className="border-2 border-dashed rounded-xl p-12 text-center">
                <Upload className="mx-auto mb-3"/>
                <button onClick={()=>fileRef.current?.click()} className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
                <input ref={fileRef} hidden type="file" accept=".csv,.xlsx"/>
              </div>}
              {tab==="excel" && <div className="p-8"><FileSpreadsheet/> Excel export ready.</div>}
              {tab==="pdf" && <div className="p-8"><FileText/> PDF export ready.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Approval & Audit Logs</h3>
              <button onClick={()=>alert("Export logs")} className="border px-3 py-1 rounded">Export</button>
            </div>
            <table className="w-full mt-4 text-sm">
              <thead><tr><th>User</th><th>Action</th><th>Date</th></tr></thead>
              <tbody><tr><td>Admin</td><td>Created Product</td><td>2025-06-01</td></tr></tbody>
            </table>
          </div>
        </div>
        </>
      </div>
    </div>
  );
}
function setShowAdd(arg0: boolean) {
  throw new Error("Function not implemented.");
}

