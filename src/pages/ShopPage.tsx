import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Check, ChevronDown, ChevronLeft, ChevronRight, X, Package, Shield, Clock, Printer, Wifi, FileText, Cpu, HardDrive, Monitor, Settings2, Timer, ZoomIn, Building2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import FloatingCartButton from "@/components/FloatingCartButton";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { getClients as getStoredClients } from "@/lib/clientStore";
import { getAllProductPricing, updateWinningVendorMoq } from "@/lib/priceEngineStore";

// ── Types ────────────────────────────────────────────────────────────────────

type Client = { id: string; name: string };

type Product = {
  id: string;
  productCode: string;
  name: string;
  category: string;
  image: string;
  specs: string[];
  leadTime: string;
  moq: number;
  priceNum: number;
  inStock: boolean;
  description?: string;
  generalSpecs?: { label: string; value: string }[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("cloud") || c.includes("server")) return "text-blue-600";
  if (c.includes("it") || c.includes("hardware") || c.includes("tech")) return "text-blue-600";
  if (c.includes("office")) return "text-emerald-600";
  if (c.includes("pantry") || c.includes("food") || c.includes("beverage") || c.includes("consumable")) return "text-orange-600";
  if (c.includes("station") || c.includes("misc")) return "text-violet-600";
  if (c.includes("furniture")) return "text-amber-600";
  if (c.includes("network")) return "text-cyan-600";
  return "text-gray-600";
}

function getProductIcon(name: string, category: string) {
  const n = (name + category).toLowerCase();
  if (n.includes("server") || n.includes("rack") || n.includes("poweredge")) return <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"><HardDrive size={40} className="text-slate-400" /></div>;
  if (n.includes("laptop") || n.includes("latitude") || n.includes("notebook")) return <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"><Monitor size={40} className="text-blue-400" /></div>;
  if (n.includes("chair") || n.includes("office") || n.includes("ergonomic")) return <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><Package size={40} className="text-gray-500" /></div>;
  if (n.includes("coffee") || n.includes("nescafe") || n.includes("pantry")) return <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center"><Package size={40} className="text-amber-500" /></div>;
  if (n.includes("print") || n.includes("laserjet") || n.includes("mfp")) return <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><Printer size={40} className="text-gray-500" /></div>;
  if (n.includes("water") || n.includes("bisleri") || n.includes("bottle")) return <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center"><Package size={40} className="text-cyan-400" /></div>;
  if (n.includes("storage")) return <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center"><HardDrive size={40} className="text-gray-500" /></div>;
  if (n.includes("notebook") || n.includes("station") || n.includes("book")) return <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"><FileText size={40} className="text-zinc-400" /></div>;
  return <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><Package size={40} className="text-blue-400" /></div>;
}

function getSpecIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("print") || n.includes("scan") || n.includes("copy") || n.includes("function")) return <Printer size={18} className="text-blue-500" />;
  if (n.includes("speed") || n.includes("rate")) return <Timer size={18} className="text-blue-500" />;
  if (n.includes("connect") || n.includes("wifi") || n.includes("network")) return <Wifi size={18} className="text-blue-500" />;
  if (n.includes("paper") || n.includes("size") || n.includes("format")) return <FileText size={18} className="text-blue-500" />;
  if (n.includes("warrant") || n.includes("guarantee")) return <Shield size={18} className="text-blue-500" />;
  if (n.includes("processor") || n.includes("cpu") || n.includes("memory") || n.includes("ram")) return <Cpu size={18} className="text-blue-500" />;
  if (n.includes("storage") || n.includes("ssd") || n.includes("hdd")) return <HardDrive size={18} className="text-blue-500" />;
  if (n.includes("display") || n.includes("screen") || n.includes("resolution") || n.includes("monitor")) return <Monitor size={18} className="text-blue-500" />;
  return <Settings2 size={18} className="text-blue-500" />;
}

const PAGE_SIZE = 20;

function formatPrice(n: number) {
  if (!n || n === 0) return "Price on request";
  return "₹" + n.toLocaleString("en-IN");
}
function formatLeadTime(t: string) { return t || "—"; }
function formatMoq(n: number) { return n > 0 ? String(n) : "—"; }

type VendorMatch = { leadTime: string; moq: number };

function getVendorMatchMap(): Map<string, VendorMatch> {
  const map = new Map<string, VendorMatch>();
  getAllProductPricing().forEach(p => {
    if (!p.winningVendor) return;
    const days = p.winningVendor.leadTime;
    map.set(p.masterProductCode, {
      leadTime: days > 0 ? `${days} Day${days !== 1 ? "s" : ""}` : "",
      moq: p.winningVendor.moq,
    });
  });
  return map;
}

function entryToProduct(e: ClientCatalogEntry, vendorMatches: Map<string, VendorMatch>): Product {
  const match = vendorMatches.get(e.productCode);
  return {
    id: `client-${e.productCode}`,
    productCode: e.productCode,
    name: e.name,
    category: e.category || "General",
    image: e.img || "",
    specs: e.specs || [],
    leadTime: match?.leadTime || e.leadTime || "",
    moq: match?.moq ?? e.moq ?? 0,
    priceNum: e.priceNum ?? 0,
    inStock: e.availability !== "Out of Stock",
    description: e.description,
    generalSpecs: e.generalSpecs,
  };
}

function loadClients(): Client[] {
  const stored = getStoredClients();
  return stored.map((c) => ({ id: c.id, name: c.name }));
}

// ── Product Detail Dialog ────────────────────────────────────────────────────

function ProductDetailDialog({ product, open, onClose, onMoqChange }: { product: Product | null; open: boolean; onClose: () => void; onMoqChange: (product: Product, newMoq: number) => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(product?.moq ?? 1);
  const [added, setAdded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [editingMoq, setEditingMoq] = useState(false);
  const [moqDraft, setMoqDraft] = useState(String(product?.moq ?? 0));

  useEffect(() => { if (product) setQty(Math.max(1, product.moq)); }, [product]);
  useEffect(() => { if (product) setMoqDraft(String(product.moq)); }, [product?.moq]);

  if (!product) return null;

  const handleAdd = () => {
    if (added) return;
    addItem({ id: Math.random() * 10000, name: product.name, image: product.image, specs: product.specs, moq: product.moq, priceNum: product.priceNum }, Math.max(1, qty));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specPairs = product.specs.map(s => {
    const idx = s.indexOf(': ');
    return idx > -1 ? { key: s.slice(0, idx), val: s.slice(idx + 2) } : { key: '', val: s };
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{product.name}</h2>
            <span className={`text-xs font-medium ${getCategoryColor(product.category)}`}>{product.category}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* Top section: image + details + price */}
          <div className="flex gap-8">

            {/* Image */}
            <div className="w-80 shrink-0">
              <div
                className={`w-full aspect-square rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 ${product.image ? "cursor-zoom-in" : ""}`}
                onClick={() => product.image && setZoomed(true)}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  getProductIcon(product.name, product.category)
                )}
              </div>
              {product.image && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 justify-center">
                  <ZoomIn size={12} /> Click image to zoom
                </p>
              )}
            </div>

            {/* Lightbox */}
            {zoomed && product.image && (
              <div
                className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
                onClick={() => setZoomed(false)}
              >
                <button
                  onClick={() => setZoomed(false)}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-zoom-out"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <span className={`inline-block mt-2 text-sm font-semibold ${getCategoryColor(product.category)}`}>{product.category}</span>

              {product.description && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-2xl">{product.description}</p>
              )}

              {specPairs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Specifications</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {specPairs.map((sp, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="mt-0.5 shrink-0">{getSpecIcon(sp.key)}</div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 uppercase tracking-wide">{sp.key}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{sp.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price panel */}
            <div className="w-60 shrink-0">
              <div className="border border-gray-200 rounded-2xl p-5 sticky top-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price (Excl. GST)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatPrice(product.priceNum)}
                </p>
                {product.priceNum > 0 && <p className="text-xs text-gray-400 mt-0.5">per unit</p>}

                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={() => setQty(q => Math.max(Math.max(1, product.moq), q - 1))}
                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg leading-none"
                  >−</button>
                  <span className="flex-1 text-center font-bold text-base">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg leading-none"
                  >+</button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1">Min. qty: {formatMoq(product.moq)}</p>

                <button
                  onClick={handleAdd}
                  className={`w-full mt-4 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${added ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                  {added ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {added ? "Added to Cart!" : "Add to Cart"}
                </button>

                <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package size={14} className="text-gray-400 shrink-0" />
                    {editingMoq ? (
                      <input
                        type="number"
                        min={1}
                        autoFocus
                        value={moqDraft}
                        onChange={e => setMoqDraft(e.target.value)}
                        onBlur={() => {
                          setEditingMoq(false);
                          const parsed = parseInt(moqDraft, 10);
                          if (!isNaN(parsed) && parsed > 0 && parsed !== product.moq) onMoqChange(product, parsed);
                          else setMoqDraft(String(product.moq));
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="w-16 h-6 text-sm border border-gray-300 rounded px-1"
                      />
                    ) : (
                      <button onClick={() => setEditingMoq(true)} className="hover:underline underline-offset-2 decoration-dotted">
                        MOQ: {product.moq > 0 ? `${product.moq} Units` : '—'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span>Lead Time: {formatLeadTime(product.leadTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield size={14} className="text-gray-400 shrink-0" />
                    <span>Subject to Availability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Specifications */}
          {product.generalSpecs && product.generalSpecs.length > 0 && (
            <div className="mt-8 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">General Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8">
                {product.generalSpecs.map((gs, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-100 py-2.5">
                    <span className="text-sm text-gray-500">{gs.label}</span>
                    <span className="text-sm font-medium text-gray-800">{gs.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onPreview }: { product: Product; onPreview: (p: Product) => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(Math.max(1, product.moq));
  const [adding, setAdding] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock || adding) return;
    setAdding(true);
    addItem({ id: Math.random() * 10000, name: product.name, image: product.image, specs: product.specs, moq: product.moq, priceNum: product.priceNum }, Math.max(1, qty));
    setTimeout(() => setAdding(false), 1500);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onPreview(product)}
    >
      <div className="flex gap-0 flex-1">
        {/* Image */}
        <div className="w-[110px] shrink-0 bg-gray-50 overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full min-h-[160px]">
              {getProductIcon(product.name, product.category)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</h3>
          <span className={`text-xs font-medium mt-0.5 ${getCategoryColor(product.category)}`}>{product.category}</span>

          {product.specs.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Key Specifications</p>
              <ul className="space-y-0.5">
                {product.specs.slice(0, 6).map((spec, i) => (
                  <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 border-t border-gray-100 mt-auto pt-2">
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
          <span>Lead Time: {formatLeadTime(product.leadTime)}</span>
          <span>MOQ: {formatMoq(product.moq)}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-bold text-gray-900 ${product.priceNum === 0 ? 'text-xs text-gray-500' : 'text-base'}`}>
            {formatPrice(product.priceNum)}
            {product.priceNum > 0 && <span className="text-xs font-normal text-gray-500"> / each</span>}
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${!product.inStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : adding ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {adding ? <Check size={13} /> : <ShoppingCart size={13} />}
            {adding ? "Added!" : "Add to Cart"}
          </button>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setQty(q => Math.max(Math.max(1, product.moq), q - 1))} className="px-1.5 py-1.5 text-gray-600 hover:bg-gray-100 text-sm leading-none">−</button>
            <span className="px-2 text-xs font-semibold text-gray-800 min-w-[28px] text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="px-1.5 py-1.5 text-gray-600 hover:bg-gray-100 text-sm leading-none">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");
  const [catOpen, setCatOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  // Load clients on mount and re-load when the shared store updates
  useEffect(() => {
    setClients(loadClients());
    const onUpdate = () => setClients(loadClients());
    window.addEventListener('nidoClientsUpdated', onUpdate);
    return () => window.removeEventListener('nidoClientsUpdated', onUpdate);
  }, []);

  // Load client catalog whenever selectedClientId changes, merging in the
  // live winning-vendor Lead Time / MOQ from the Vendor Product List for every product.
  const loadClientProducts = () => {
    if (!selectedClientId) { setCatalogProducts([]); return; }
    const entries = getClientCatalog(selectedClientId);
    const vendorMatches = getVendorMatchMap();
    setCatalogProducts(entries.map(e => entryToProduct(e, vendorMatches)));
  };

  useEffect(() => {
    loadClientProducts();
    const events = ['clientCatalogUpdated', 'vendorProductsUpdated', 'nidoVendorsUpdated', 'catalogUpdated', 'priceEngineSettingsUpdated'];
    events.forEach(ev => window.addEventListener(ev, loadClientProducts));
    return () => events.forEach(ev => window.removeEventListener(ev, loadClientProducts));
  }, [selectedClientId]);

  // Reset page on filter change
  const resetPage = () => setCurrentPage(1);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const allCats = ["All Categories", ...Array.from(new Set(catalogProducts.map(p => p.category)))];

  const filtered = catalogProducts.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "All Categories" && p.category !== category) return false;
    if (availability === "In Stock" && !p.inStock) return false;
    if (availability === "Out of Stock" && p.inStock) return false;
    return true;
  });

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    setCategory("All Categories");
    setAvailability("All");
    setSearch("");
    setCurrentPage(1);
    setClientOpen(false);
  };

  const pageNums = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <FloatingCartButton />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedClient
              ? `Showing catalog for ${selectedClient.name}`
              : "Select a client to view their catalog"}
          </p>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-72 bg-white shadow-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            className="text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none w-full"
          />
          {search && (
            <button onClick={() => { setSearch(""); resetPage(); }} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">

        {/* ── Client dropdown ── */}
        <div className="relative">
          <button
            onClick={() => { setClientOpen(o => !o); setCatOpen(false); setAvailOpen(false); }}
            className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors min-w-[180px] ${clientOpen ? "border-blue-500 text-blue-600 bg-blue-50" : selectedClientId ? "border-blue-500 text-blue-700 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
          >
            <Building2 size={14} className="shrink-0" />
            <span className="flex-1 text-left truncate">
              {selectedClient ? selectedClient.name : "Select Client"}
            </span>
            <ChevronDown size={14} className={`transition-transform shrink-0 ${clientOpen ? "rotate-180" : ""}`} />
          </button>
          {clientOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[220px] max-h-64 overflow-y-auto">
              {clients.map(c => (
                <button key={c.id} onClick={() => handleClientChange(c.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedClientId === c.id ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-xs text-gray-400">{c.id}</span>
                </button>
              ))}
              {clients.length === 0 && <div className="px-4 py-3 text-sm text-gray-400">No clients found</div>}
            </div>
          )}
        </div>

        {/* Category dropdown — only when client selected */}
        {selectedClientId && (
          <div className="relative">
            <button
              onClick={() => { setCatOpen(o => !o); setAvailOpen(false); setClientOpen(false); }}
              className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors ${catOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            >
              {category}
              <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[200px]">
                {allCats.map(opt => (
                  <button key={opt} onClick={() => { setCategory(opt); setCatOpen(false); resetPage(); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${category === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability dropdown — only when client selected */}
        {selectedClientId && (
          <div className="relative">
            <button
              onClick={() => { setAvailOpen(o => !o); setCatOpen(false); setClientOpen(false); }}
              className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors ${availOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            >
              Availability: {availability}
              <ChevronDown size={14} className={`transition-transform ${availOpen ? "rotate-180" : ""}`} />
            </button>
            {availOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[180px]">
                {["All", "In Stock", "Out of Stock"].map(opt => (
                  <button key={opt} onClick={() => { setAvailability(opt); setAvailOpen(false); resetPage(); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${availability === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* More Filters */}
        {selectedClientId && (
          <button className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Filter size={14} />
            More Filters
          </button>
        )}
      </div>

      {/* Content */}
      {!selectedClientId ? (
        /* No client selected — empty state */
        <div className="text-center py-32 text-gray-400">
          <Building2 size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-lg text-gray-500">Select a client to view their catalog</p>
          <p className="text-sm mt-2">Use the dropdown above to choose a client. Only products added to that client's catalog will appear here.</p>
        </div>
      ) : paginated.length === 0 ? (
        /* Client selected but no products */
        <div className="text-center py-24 text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">
            {catalogProducts.length === 0
              ? `No products have been added to ${selectedClient?.name}'s catalog yet`
              : "No products match your filters"}
          </p>
          <p className="text-sm mt-1">
            {catalogProducts.length === 0
              ? "Go to the client's Catalog tab to add products from the master catalog."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {paginated.map(product => (
              <ProductCard key={product.id} product={product} onPreview={setPreviewProduct} />
            ))}
          </div>

          {/* Pagination */}
          {totalProducts > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalProducts)} to {Math.min(currentPage * PAGE_SIZE, totalProducts)} of {totalProducts} products
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                {pageNums().map((n, i) => (
                  n === '...' ? (
                    <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === n ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                      {n}
                    </button>
                  )
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Detail Dialog */}
      <ProductDetailDialog product={previewProduct} open={!!previewProduct} onClose={() => setPreviewProduct(null)} />

      {/* Close dropdowns on outside click */}
      {(catOpen || availOpen || clientOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setCatOpen(false); setAvailOpen(false); setClientOpen(false); }} />
      )}
    </div>
  );
}
