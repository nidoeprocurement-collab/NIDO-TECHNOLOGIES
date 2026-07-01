import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight, Plus, Trash2, Info, Save } from "lucide-react";
import { getCatalogProducts, CatalogProduct } from "@/lib/catalogStore";
import {
  addVendorProducts,
  updateVendorProduct,
  getVendorProducts,
  VendorProduct,
} from "@/lib/vendorStore";

// ─── Thumb ────────────────────────────────────────────────────────────────────

function ProductThumb({ images, name }: { images: string[]; name: string }) {
  if (images && images.length > 0) {
    return (
      <img
        src={images[0]}
        alt={name}
        className="w-8 h-8 rounded-md object-cover border border-gray-200 flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 border border-blue-200">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedRow {
  catalogProduct: CatalogProduct;
  price: string;
  moq: string;
  leadTime: string;
  stock: string;
  vendorProductCode: string;
}

const PAGE_SIZE = 20;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddVendorProductsPage() {
  const { id: vendorId = "unknown" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const editProductId = searchParams.get("edit"); // null → add mode, string → edit mode
  const isEditMode = Boolean(editProductId);

  // ── Catalog ──────────────────────────────────────────────────────────────
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  useEffect(() => {
    setCatalog(getCatalogProducts());
    const h = () => setCatalog(getCatalogProducts());
    window.addEventListener("catalogUpdated", h);
    return () => window.removeEventListener("catalogUpdated", h);
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [query]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.masterProductCode.toLowerCase().includes(q)
    );
  }, [catalog, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const nums: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) nums.push(i);
      if (page < totalPages - 2) nums.push("…");
      nums.push(totalPages);
    }
    return nums;
  }, [page, totalPages]);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);

  // In edit mode: pre-populate with the existing product
  useEffect(() => {
    if (!isEditMode || !editProductId) return;
    const existing = getVendorProducts(vendorId).find((p) => p.id === editProductId);
    if (!existing) return;
    const catalogProduct = getCatalogProducts().find((p) => p.id === editProductId);
    if (!catalogProduct) return;
    setSelectedIds(new Set([editProductId]));
    setSelectedRows([{
      catalogProduct,
      price: existing.price,
      moq: existing.moq,
      leadTime: existing.leadTime,
      stock: existing.stock,
      vendorProductCode: existing.vendorProductCode,
    }]);
  }, [editProductId, isEditMode, vendorId]);

  const toggleSelect = useCallback((product: CatalogProduct) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        setSelectedRows((rows) => rows.filter((r) => r.catalogProduct.id !== product.id));
      } else {
        next.add(product.id);
        setSelectedRows((rows) => [
          ...rows,
          { catalogProduct: product, price: "", moq: "", leadTime: "", stock: "", vendorProductCode: "" },
        ]);
      }
      return next;
    });
  }, []);

  const removeSelected = useCallback((id: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setSelectedRows((rows) => rows.filter((r) => r.catalogProduct.id !== id));
  }, []);

  const updateRow = useCallback(
    (id: string, field: keyof Omit<SelectedRow, "catalogProduct">, value: string) => {
      setSelectedRows((rows) => rows.map((r) => r.catalogProduct.id === id ? { ...r, [field]: value } : r));
    },
    []
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (selectedRows.length === 0) return;
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (isEditMode && editProductId) {
      const row = selectedRows[0];
      updateVendorProduct(vendorId, editProductId, {
        price: row.price,
        moq: row.moq,
        leadTime: row.leadTime,
        stock: row.stock,
        vendorProductCode: row.vendorProductCode,
      });
    } else {
      const products: VendorProduct[] = selectedRows.map((r) => ({
        id: r.catalogProduct.id,
        vendorId,
        masterProductCode: r.catalogProduct.masterProductCode,
        skuCode: r.catalogProduct.skuCode,
        productName: r.catalogProduct.productName,
        category: r.catalogProduct.category,
        brand: r.catalogProduct.brand,
        images: r.catalogProduct.images,
        price: r.price,
        moq: r.moq,
        leadTime: r.leadTime,
        stock: r.stock,
        vendorProductCode: r.vendorProductCode,
        addedAt: now,
        status: "Active",
      }));
      addVendorProducts(vendorId, products);
    }
    navigate(`/vendors/${vendorId}`, { state: { tab: "products" } });
  };

  const goBack = () => navigate(`/vendors/${vendorId}`, { state: { tab: "products" } });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6fa] font-[Inter,sans-serif]">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <button onClick={goBack} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Edit Vendor Product" : "Add Products to Vendor"}
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-7">
          {isEditMode
            ? "Update the vendor-specific details for this product."
            : "Search and select products from master catalog and set vendor-specific details."}
        </p>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-6 py-4 flex flex-col gap-4">

        {/* ── Section 1: Search & Select ── */}
        {!isEditMode && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">

            {/* Header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <h2 className="text-sm font-semibold text-gray-800">Search &amp; Select Products</h2>
              {selectedIds.size > 0 && (
                <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {/* Search bar */}
            <div className="flex-shrink-0 px-5 py-2.5 border-b border-gray-100">
              <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product name, SKU, category, brand…"
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table area */}
            <div className="w-full overflow-x-auto">
              {catalog.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">
                  No products in master catalog yet. Add products via Master Catalog first.
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  No products match "<span className="font-medium text-gray-600">{query}</span>"
                </div>
              ) : (
                <table className="w-full text-sm" style={{ minWidth: "620px" }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">Select</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Master Product Code</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pageItems.map((product) => {
                      const checked = selectedIds.has(product.id);
                      return (
                        <tr
                          key={product.id}
                          onClick={() => toggleSelect(product)}
                          className={`cursor-pointer transition-colors ${checked ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelect(product)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <ProductThumb images={product.images} name={product.productName} />
                              <div>
                                <div className="font-medium text-gray-800 text-sm leading-tight">{product.productName}</div>
                                <div className="text-xs text-gray-400 font-mono mt-0.5">{product.masterProductCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{product.masterProductCode || "—"}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 text-sm">{product.category || "—"}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 text-sm">{product.brand || "—"}</td>
                          <td className="px-4 py-2.5 max-w-[200px]">
                            <span className="text-gray-500 text-xs line-clamp-2">{product.description || "—"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination — always visible at bottom of section 1 */}
            {filtered.length > 0 && (
              <div className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between border-t border-gray-100 bg-white">
                <span className="text-xs text-gray-500">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} className="px-1 text-gray-400 text-xs">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${page === n ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Section 2: Selected Products ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">

          {/* Header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 flex items-center gap-3">
            {!isEditMode && (
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
            )}
            <h2 className="text-sm font-semibold text-gray-800">
              {isEditMode
                ? "Product Details"
                : <>Selected Products{selectedRows.length > 0 && <span className="ml-1.5 text-blue-600">({selectedRows.length})</span>}</>
              }
            </h2>
          </div>

          {selectedRows.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No products selected yet — check items in the list above.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: "900px" }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {!isEditMode && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>}
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Master Product Code</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        <span className="flex items-center gap-1">Price (₹) <Info className="w-3 h-3 text-gray-400" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="flex items-center gap-1">MOQ <Info className="w-3 h-3 text-gray-400" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        <span className="flex items-center gap-1">Lead Time (Days) <Info className="w-3 h-3 text-gray-400" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="flex items-center gap-1">Stock <Info className="w-3 h-3 text-gray-400" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vendor Product Code</th>
                      {!isEditMode && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">Remove</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedRows.map((row, idx) => (
                      <tr key={row.catalogProduct.id} className="hover:bg-gray-50/40 transition-colors">
                        {!isEditMode && (
                          <td className="px-3 py-3 text-gray-500 text-sm font-medium">{idx + 1}</td>
                        )}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <ProductThumb images={row.catalogProduct.images} name={row.catalogProduct.productName} />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 text-sm leading-tight truncate max-w-[180px]">{row.catalogProduct.productName}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{row.catalogProduct.masterProductCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{row.catalogProduct.masterProductCode || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={0} step="0.01"
                            value={row.price}
                            onChange={(e) => updateRow(row.catalogProduct.id, "price", e.target.value)}
                            placeholder="0.00"
                            className="w-full min-w-[90px] max-w-[110px] px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={0} step="1"
                            value={row.moq}
                            onChange={(e) => updateRow(row.catalogProduct.id, "moq", e.target.value)}
                            placeholder="0"
                            className="w-full min-w-[64px] max-w-[80px] px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={0} step="1"
                            value={row.leadTime}
                            onChange={(e) => updateRow(row.catalogProduct.id, "leadTime", e.target.value)}
                            placeholder="0"
                            className="w-full min-w-[64px] max-w-[80px] px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={0} step="1"
                            value={row.stock}
                            onChange={(e) => updateRow(row.catalogProduct.id, "stock", e.target.value)}
                            placeholder="0"
                            className="w-full min-w-[64px] max-w-[80px] px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={row.vendorProductCode}
                            onChange={(e) => updateRow(row.catalogProduct.id, "vendorProductCode", e.target.value)}
                            placeholder="e.g. VPC-001"
                            className="w-full min-w-[110px] max-w-[150px] px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        {!isEditMode && (
                          <td className="px-3 py-3">
                            <button
                              onClick={() => removeSelected(row.catalogProduct.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isEditMode && (
                <div className="flex-shrink-0 px-5 py-2 border-t border-gray-100 bg-white">
                  <span className="text-xs text-gray-500">
                    {selectedRows.length} product{selectedRows.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        <button
          onClick={goBack}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedRows.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isEditMode ? (
            <><Save className="w-4 h-4" /> Save Changes</>
          ) : (
            <><Plus className="w-4 h-4" /> Add Products</>
          )}
        </button>
      </div>
    </div>
  );
}
