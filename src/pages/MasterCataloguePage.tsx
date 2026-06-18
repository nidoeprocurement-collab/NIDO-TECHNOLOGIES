"use client";

import React, { useMemo, useRef, useState } from "react";
import { Upload, Download, Plus, Search, FileText, FileSpreadsheet } from "lucide-react";

const COLORS = ["Black","White","Red","Blue","Green","Yellow","Orange","Purple","Pink","Brown","Gray","Silver","Gold","Beige","Maroon","Navy","Teal","Olive","Cyan","Magenta"];

type Status = "published" | "draft" | "archived";

export default function MasterCataloguePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upload");
  const [showAdd, setShowAdd] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Master Catalogue</h1>
          <p className="text-slate-500">Manage products and catalog operations</p>
        </div>

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
              <button onClick={()=>setShowAdd(true)} className="bg-blue-600 text-white rounded-lg px-3 py-2 flex gap-2"><Plus size={16}/>Add New Item</button>
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

        return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Master Catalogue</h2>
          <p className="text-sm text-muted-foreground">Manage and update the product and service catalog. Add new items, bulk upload or update listings, and set pricing. Keep your catalog current and accurate.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setBulkImportOpen(true)}><Plus size={14} /> Bulk Import</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: `${stats.total} Items`, icon: ShoppingCart, color: 'bg-primary text-primary-foreground' },
          { label: `${stats.inStock} in Stock`, icon: ShoppingCart, color: 'bg-success/20 text-success' },
          { label: `${stats.lowStock} Low Stock`, icon: ShoppingCart, color: 'bg-warning/20 text-warning' },
          { label: `${stats.outOfStock} Out of Stock`, icon: ShoppingCart, color: 'bg-destructive/20 text-destructive' },
        ].map(stat => (
          <Card key={stat.label} className={`${stat.color} cursor-pointer`}>
            <CardContent className="pt-3 pb-3 flex items-center gap-2">
              <stat.icon size={16} />
              <span className="font-medium text-sm">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(categories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Brands" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
          <Input className="pl-7 h-8 w-36 text-xs" placeholder="Search Item" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBulkImportOpen(true)}><Upload size={12} /> Bulk Import</Button>
          <Button size="sm" className="gap-1.5" onClick={openAddDialog}><Plus size={12} /> Add New Item</Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <ImageIcon size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-sm">{item.category}</TableCell>
                  <TableCell className="text-sm text-primary">{item.brand}</TableCell>
                  <TableCell>₹{item.price.toLocaleString()}</TableCell>
                  <TableCell><Badge className={`${getStatusColor(item.status)} border-none`}>{item.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}><Pencil size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openViewDialog(item)}><Eye size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}><Trash2 size={12} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>Showing 1 - {filtered.length} of {items.length} entries</span>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export + Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Import / Export Products</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="upload">
              <TabsList className="bg-muted">
                <TabsTrigger value="upload">Bulk Upload Items</TabsTrigger>
                <TabsTrigger value="excel">Export Catalog (Excel)</TabsTrigger>
                <TabsTrigger value="pdf">Export Catalog (PDF)</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-3">
                <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                  <Upload size={24} className="mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium">Upload</p>
                  <p className="text-xs text-muted-foreground">Bulk upload new products or catalog using CSV template.</p>
                  <input ref={bulkFileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
                  <Button className="mt-2" size="sm" onClick={() => bulkFileRef.current?.click()}>Upload</Button>
                </div>
              </TabsContent>
              <TabsContent value="excel" className="mt-3">
                <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                  <FileDown size={24} className="mx-auto text-success mb-2" />
                  <p className="text-sm font-medium">Export</p>
                  <p className="text-xs text-muted-foreground">Export the entire product catalog as Excel file.</p>
                  <Button variant="outline" className="mt-2" size="sm" onClick={exportCatalogExcel}>Export Excel</Button>
                </div>
              </TabsContent>
              <TabsContent value="pdf" className="mt-3">
                <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                  <FileText size={24} className="mx-auto text-destructive mb-2" />
                  <p className="text-sm font-medium">Export Catalog</p>
                  <p className="text-xs text-muted-foreground">Export as PDF file.</p>
                  <Button variant="outline" className="mt-2" size="sm" onClick={exportCatalogPDF}>Export PDF</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Approval & Audit Logs</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAuditLogs}><Download size={12} /> Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Event</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {auditLogs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="text-sm font-medium">{log.event}</p>
                      <p className="text-xs text-muted-foreground">{log.detail}</p>
                    </TableCell>
                    <TableCell className="text-sm">{log.user}</TableCell>
                    <TableCell className="text-xs">{log.date}</TableCell>
                    <TableCell><Badge className="bg-success text-success-foreground border-none">{log.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bulk Import Items</DialogTitle></DialogHeader>
          <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
            <Upload size={32} className="mx-auto text-primary mb-3" />
            <p className="text-sm font-medium mb-1">Upload CSV File</p>
            <p className="text-xs text-muted-foreground mb-3">CSV must have headers: Item Name, SKU, Category, Brand, Price, Status</p>
            <input ref={bulkFileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
            <Button onClick={() => bulkFileRef.current?.click()}>Select CSV File</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkImportOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Item Details</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{viewItem.name}</p></div>
                <div><Label className="text-muted-foreground">SKU</Label><p>{viewItem.sku}</p></div>
                <div><Label className="text-muted-foreground">Category</Label><p>{viewItem.category}</p></div>
                <div><Label className="text-muted-foreground">Brand</Label><p>{viewItem.brand}</p></div>
                <div><Label className="text-muted-foreground">Price</Label><p>₹{viewItem.price.toLocaleString()}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><Badge className={`${getStatusColor(viewItem.status)} border-none`}>{viewItem.status}</Badge></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="px-6 pb-2" style={{ maxHeight: 'calc(90vh - 130px)' }}>
            <div className="space-y-6 pb-4">
              {/* General Details + Category */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1">General Details</h3>
                  <div>
                    <Label>Item Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Apple MacBook Air M3" value={form.name} onChange={e => updateForm({ name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Select value={form.brand} onValueChange={v => updateForm({ brand: v })}>
                      <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                      <SelectContent>
                        {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>SKU <span className="text-destructive">*</span></Label>
                      <div className="flex items-center gap-1 ml-auto">
                        <Checkbox checked={autoSku} onCheckedChange={v => setAutoSku(!!v)} id="autoSku" />
                        <Label htmlFor="autoSku" className="text-xs">Auto-Generate</Label>
                      </div>
                    </div>
                    <Input placeholder="e.g., LAP-1002" value={autoSku ? '(auto)' : form.sku} disabled={autoSku} onChange={e => updateForm({ sku: e.target.value })} />
                  </div>
                  <div>
                    <Label>Short Description</Label>
                    <Textarea placeholder="Brief product description" value={form.description || ''} onChange={e => updateForm({ description: e.target.value })} className="min-h-[60px]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1">Category & Classification</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      {addingCategory ? (
                        <div className="flex gap-1">
                          <Input value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} placeholder="New category" className="h-9" />
                          <Button size="sm" onClick={addNewCategory}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>✕</Button>
                        </div>
                      ) : (
                        <Select value={form.category} onValueChange={v => { if (v === '__add__') { setAddingCategory(true); } else { updateForm({ category: v, subCategory: '' }); } }}>
                          <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(categories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="__add__"><span className="text-primary">+ Add Category</span></SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label>Sub-category</Label>
                      {addingSubCategory ? (
                        <div className="flex gap-1">
                          <Input value={newSubCategoryInput} onChange={e => setNewSubCategoryInput(e.target.value)} placeholder="New sub-cat" className="h-9" />
                          <Button size="sm" onClick={addNewSubCategory}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingSubCategory(false)}>✕</Button>
                        </div>
                      ) : (
                        <Select value={form.subCategory} onValueChange={v => { if (v === '__add__') { setAddingSubCategory(true); } else { updateForm({ subCategory: v }); } }}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {(categories[form.category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            <SelectItem value="__add__"><span className="text-primary">+ Add Sub-category</span></SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {form.tags.map(t => (
                        <Badge key={t} variant="secondary" className="gap-1">{t}<X size={10} className="cursor-pointer" onClick={() => removeTag(t)} /></Badge>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input placeholder="Tags..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="h-8" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {defaultTags.filter(t => !form.tags.includes(t)).map(t => (
                        <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => updateForm({ tags: [...form.tags, t] })}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Pricing & Inventory</h3>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <Label>Regular Price</Label>
                    <div className="flex items-center">
                      <span className="text-xs mr-1">₹</span>
                      <Input type="number" value={form.price} onChange={e => updateForm({ price: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div>
                    <Label>Discount Price</Label>
                    <div className="flex items-center">
                      <span className="text-xs mr-1">₹</span>
                      <Input type="number" placeholder="(optional)" value={form.discountPrice || ''} onChange={e => updateForm({ discountPrice: parseFloat(e.target.value) || undefined })} />
                    </div>
                  </div>
                  <div>
                    <Label>Inventory Status</Label>
                    <Select value={form.status} onValueChange={v => updateForm({ status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Initial Stock Quantity</Label>
                    <Input type="number" value={form.initialStock} onChange={e => updateForm({ initialStock: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Minimum Stock Threshold</Label>
                    <Input type="number" value={form.minStockThreshold} onChange={e => updateForm({ minStockThreshold: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              {/* Product Specifics & Media */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Product Specifics & Media</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Detailed Specification</Label>
                      <Textarea placeholder="Rich Text Editor or long-text area" value={form.specification || ''} onChange={e => updateForm({ specification: e.target.value })} />
                    </div>
                    <div>
                      <Label>Warranty Information (for internal use)</Label>
                      <Textarea placeholder="Enter private notes or additional detail..." value={form.warranty || ''} onChange={e => updateForm({ warranty: e.target.value })} className="min-h-[60px]" />
                    </div>
                  </div>
                  <div>
                    <Label>Add Image</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <ImageIcon size={24} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm">Click to Upload or Drag Images</p>
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    {productImages.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {productImages.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 rounded overflow-hidden border">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5" onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))}>
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <div className="w-16 h-16 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:bg-muted/50" onClick={() => imageInputRef.current?.click()}>
                          <Plus size={16} className="text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logistics & Customs */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Logistics & Customs</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label>HSN/SAC Code</Label>
                    <Input placeholder="84713010" value={form.hsnCode || ''} onChange={e => updateForm({ hsnCode: e.target.value })} />
                  </div>
                  <div>
                    <Label>Dimensions</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">L</span><Input className="w-12 h-8" value={form.dimensionL || ''} onChange={e => updateForm({ dimensionL: e.target.value })} />
                      <span className="text-xs">W</span><Input className="w-12 h-8" value={form.dimensionW || ''} onChange={e => updateForm({ dimensionW: e.target.value })} />
                      <span className="text-xs">H</span><Input className="w-12 h-8" value={form.dimensionH || ''} onChange={e => updateForm({ dimensionH: e.target.value })} />
                      <Select value={form.dimUnit || 'cm'} onValueChange={v => updateForm({ dimUnit: v })}>
                        <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="in">in</SelectItem><SelectItem value="mm">mm</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Shipping Weight</Label>
                    <div className="flex items-center gap-1">
                      <Input value={form.weight || ''} onChange={e => updateForm({ weight: e.target.value })} className="h-8" />
                      <Select value={form.weightUnit || 'kg'} onValueChange={v => updateForm({ weightUnit: v })}>
                        <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="lb">lb</SelectItem><SelectItem value="g">g</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Customs Declaration</Label>
                    <Select value={form.customsDeclaration || 'Exempt'} onValueChange={v => updateForm({ customsDeclaration: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{customsOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vendor & Sourcing */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Vendor & Sourcing</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Primary Vendor</Label>
                    <Select value={form.primaryVendor || ''} onValueChange={v => updateForm({ primaryVendor: v })}>
                      <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                      <SelectContent>{defaultVendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor SKU (optional)</Label>
                    <Input placeholder="V-HP-MB-M3" value={form.vendorSku || ''} onChange={e => updateForm({ vendorSku: e.target.value })} />
                  </div>
                  <div>
                    <Label>Estimated Lead Time</Label>
                    <Select value={form.leadTime || '10 Days'} onValueChange={v => updateForm({ leadTime: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{leadTimeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vendor Contact */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Vendor Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vendor Contact Person</Label>
                    <Input placeholder="Annit Kumar" value={form.vendorContact || ''} onChange={e => updateForm({ vendorContact: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vendor Email</Label>
                    <Input placeholder="a.kumar@hpd.com" value={form.vendorEmail || ''} onChange={e => updateForm({ vendorEmail: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vendor Phone</Label>
                    <Input placeholder="+91 98765 43210" value={form.vendorPhone || ''} onChange={e => updateForm({ vendorPhone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vendor Phone</Label>
                    <Input placeholder="+91 98765 43210" value={form.vendorPhone2 || ''} onChange={e => updateForm({ vendorPhone2: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Track Vendor Performance */}
              <div>
                <h3 className="font-semibold text-sm border-b pb-1 mb-3">Track Vendor Performance</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label>Track Performance</Label>
                    <Switch checked={form.trackPerformance || false} onCheckedChange={v => updateForm({ trackPerformance: v })} />
                    <span className="text-xs">{form.trackPerformance ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Performance Rating (1-5 stars)</Label>
                    {renderStars(form.performanceRating || 4, r => updateForm({ performanceRating: r }))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>{editingItem ? 'Update Item' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
