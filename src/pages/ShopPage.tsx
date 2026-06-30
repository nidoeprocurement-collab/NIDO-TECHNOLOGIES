import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Check, ChevronDown, ChevronLeft, ChevronRight, X, Package, Shield, Clock, Printer, Wifi, FileText, Cpu, HardDrive, Monitor, Settings2, Timer, ZoomIn } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import FloatingCartButton from "@/components/FloatingCartButton";
import { getCatalogProducts, type CatalogProduct } from "@/lib/catalogStore";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Product = {
  id: string | number;
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
  fromStore?: boolean;
};

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
  if (n.includes("storage") || n.includes("rack")) return <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center"><HardDrive size={40} className="text-gray-500" /></div>;
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

const BASE_PRODUCTS: Product[] = [
  {
    id: 1, name: "Dell PowerEdge R750", category: "Cloud Servers", image: "",
    specs: ["CPU: Intel Xeon Silver", "RAM: 32GB DDR5", "Storage: 1TB SSD", "Form Factor: 2U Rack", "Power Supply: Dual 750W", "Warranty: 3 Years"],
    leadTime: "5–7 Days", moq: 5, priceNum: 125000, inStock: true,
    description: "Enterprise-grade rack server for high-performance computing and virtualization workloads.",
    generalSpecs: [{ label: "Brand", value: "Dell" }, { label: "Model", value: "PowerEdge R750" }, { label: "Form Factor", value: "2U Rack" }, { label: "Power Supply", value: "Dual 750W" }],
  },
  {
    id: 2, name: "Dell Latitude 5420", category: "IT Hardware", image: "",
    specs: ["RAM: 16GB DDR4", "Storage: 512GB SSD", "Processor: i5 11th Gen", "Display: 14\" FHD", "OS: Windows 11 Pro", "Warranty: 1 Year"],
    leadTime: "3–5 Days", moq: 10, priceNum: 50000, inStock: true,
    description: "Reliable business laptop with enterprise security features and long battery life.",
    generalSpecs: [{ label: "Brand", value: "Dell" }, { label: "Model", value: "Latitude 5420" }, { label: "OS", value: "Windows 11 Pro" }, { label: "Connectivity", value: "Wi-Fi 6, Bluetooth 5" }],
  },
  {
    id: 3, name: "Ergonomic Office Chair", category: "Office Supplies", image: "",
    specs: ["Material: Mesh & Fabric", "Adjustable: Yes", "Weight Capacity: 120 kg", "Armrest: 3D Adjustable", "Back Support: Lumbar", "Warranty: 1 Year"],
    leadTime: "7–10 Days", moq: 5, priceNum: 8500, inStock: true,
    description: "Premium ergonomic chair designed for all-day comfort and productivity.",
    generalSpecs: [{ label: "Material", value: "Mesh & Fabric" }, { label: "Color", value: "Black" }, { label: "Weight", value: "12 kg" }, { label: "Max Capacity", value: "120 kg" }],
  },
  {
    id: 4, name: "Nescafe Classic 50g", category: "Pantry & Consumables", image: "",
    specs: ["Type: Coffee", "Weight: 50g", "Form: Powder", "Shelf Life: 12 Months", "Packaging: Pouch", "Brand: Nescafe"],
    leadTime: "2–3 Days", moq: 20, priceNum: 120, inStock: true,
    description: "Smooth and rich instant coffee for the office pantry.",
    generalSpecs: [{ label: "Brand", value: "Nescafe" }, { label: "Type", value: "Instant Coffee" }, { label: "Weight", value: "50g" }, { label: "Shelf Life", value: "12 Months" }],
  },
  {
    id: 5, name: "Premium Notebook A5", category: "Stationery & Miscellaneous", image: "",
    specs: ["Size: A5", "Pages: 200", "Type: Ruled", "Cover: Hard Cover", "Paper: 80 GSM", "Binding: Spiral"],
    leadTime: "3–5 Days", moq: 50, priceNum: 45, inStock: true,
    description: "High-quality ruled notebook ideal for office and fieldwork use.",
    generalSpecs: [{ label: "Size", value: "A5" }, { label: "Pages", value: "200" }, { label: "Cover", value: "Hard Cover" }, { label: "Paper GSM", value: "80 GSM" }],
  },
  {
    id: 6, name: "HP LaserJet Pro MFP", category: "IT Hardware", image: "",
    specs: ["Function: Print/Scan/Copy", "Connectivity: Wi-Fi, USB", "Print Speed: 30 ppm", "Resolution: 1200 x 1200 dpi", "Paper Size: A4", "Warranty: 1 Year"],
    leadTime: "4–6 Days", moq: 5, priceNum: 28000, inStock: true,
    description: "High-performance multifunction printer designed for enterprise productivity.",
    generalSpecs: [{ label: "Brand", value: "HP" }, { label: "Model", value: "LaserJet Pro MFP" }, { label: "Print Type", value: "Laser" }, { label: "Duty Cycle", value: "Up to 8,000 pages/month" }],
  },
  {
    id: 7, name: "Storage Rack 5 Layer", category: "Office Supplies", image: "",
    specs: ["Material: Steel", "Load Capacity: 50kg/layer", "Layers: 5", "Dimensions: 180x90x40 cm", "Finish: Powder Coated", "Assembly: Boltless"],
    leadTime: "6–8 Days", moq: 10, priceNum: 4500, inStock: true,
    description: "Heavy-duty steel shelving rack suitable for warehouse and office storage.",
    generalSpecs: [{ label: "Material", value: "Steel" }, { label: "Layers", value: "5" }, { label: "Finish", value: "Powder Coated" }, { label: "Color", value: "Grey" }],
  },
  {
    id: 8, name: "Bisleri Water Bottle 1L", category: "Pantry & Consumables", image: "",
    specs: ["Type: Drinking Water", "Volume: 1 Liter", "Packaging: Bottle", "Source: Natural", "Shelf Life: 6 Months", "Brand: Bisleri"],
    leadTime: "1–2 Days", moq: 30, priceNum: 15, inStock: true,
    description: "Pure and natural drinking water in 1L sealed bottles for office pantries.",
    generalSpecs: [{ label: "Brand", value: "Bisleri" }, { label: "Volume", value: "1 Liter" }, { label: "Source", value: "Natural Spring" }, { label: "Shelf Life", value: "6 Months" }],
  },
];

const ALL_CATEGORIES = ["All Categories", "Cloud Servers", "IT Hardware", "Office Supplies", "Pantry & Consumables", "Stationery & Miscellaneous"];
const PAGE_SIZE = 8;

function formatPrice(n: number) {
  if (!n || n === 0) return "Price on request";
  return "₹" + n.toLocaleString("en-IN");
}

function formatLeadTime(t: string) {
  return t || "—";
}

function formatMoq(n: number) {
  return n > 0 ? String(n) : "—";
}

function ProductDetailDialog({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(product?.moq ?? 1);
  const [added, setAdded] = useState(false);

  useEffect(() => { if (product) setQty(Math.max(1, product.moq)); }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    if (added) return;
    addItem({ id: typeof product.id === 'string' ? parseInt(product.id) || Math.random() * 10000 : product.id as number, name: product.name, image: product.image, specs: product.specs, moq: product.moq, priceNum: product.priceNum }, Math.max(1, qty));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specPairs = product.specs.map(s => {
    const idx = s.indexOf(': ');
    return idx > -1 ? { key: s.slice(0, idx), val: s.slice(idx + 2) } : { key: '', val: s };
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-white">
          {/* Top section */}
          <div className="flex flex-col md:flex-row gap-0 p-6 border-b border-gray-100">
            {/* Image */}
            <div className="md:w-[300px] shrink-0">
              <div className="w-full aspect-square rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  getProductIcon(product.name, product.category)
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><ZoomIn size={12} /> Click image to zoom</p>
            </div>

            {/* Details */}
            <div className="flex-1 md:px-6 mt-4 md:mt-0">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <span className={`inline-block mt-2 text-xs font-semibold ${getCategoryColor(product.category)}`}>{product.category}</span>
              {product.description && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{product.description}</p>}

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Specifications</h3>
                <div className="grid grid-cols-3 gap-2">
                  {specPairs.map((sp, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="mt-0.5 shrink-0">{getSpecIcon(sp.key)}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{sp.key}</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{sp.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Panel */}
            <div className="md:w-[210px] shrink-0">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Price (Excl. GST)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(product.priceNum)} <span className="text-sm font-normal text-gray-500">/ each</span>
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setQty(q => Math.max(Math.max(1, product.moq), q - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg leading-none">−</button>
                  <span className="flex-1 text-center font-semibold text-sm">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg leading-none">+</button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1">(Min: {formatMoq(product.moq)})</p>

                <button
                  onClick={handleAdd}
                  className={`w-full mt-3 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${added ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                  {added ? <Check size={15} /> : <ShoppingCart size={15} />}
                  {added ? "Added!" : "Add to Cart"}
                </button>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600"><Package size={13} className="text-gray-400" /><span>MOQ: {product.moq > 0 ? `${product.moq} Units` : '—'}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600"><Clock size={13} className="text-gray-400" /><span>Lead Time: {formatLeadTime(product.leadTime)}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600"><Shield size={13} className="text-gray-400" />
                    <span>{product.specs.find(s => s.toLowerCase().includes('warrant'))?.split(': ')[1] || 'Subject to Availability'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Specs */}
          {product.generalSpecs && product.generalSpecs.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">General Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8">
                {product.generalSpecs.map((gs, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-100 py-1.5">
                    <span className="text-xs text-gray-500">{gs.label}</span>
                    <span className="text-xs font-medium text-gray-800">{gs.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 p-4">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Close</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductCard({ product, onPreview }: { product: Product; onPreview: (p: Product) => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(Math.max(1, product.moq));
  const [adding, setAdding] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock || adding) return;
    setAdding(true);
    addItem({ id: typeof product.id === 'string' ? Math.random() * 10000 : product.id as number, name: product.name, image: product.image, specs: product.specs, moq: product.moq, priceNum: product.priceNum }, Math.max(1, qty));
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

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");
  const [catOpen, setCatOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  const loadCatalogProducts = () => {
    const stored = getCatalogProducts()
      .map((p) => ({
        id: `store-${p.id}`,
        name: p.productName,
        category: p.category || 'General',
        image: p.images[0] || '',
        specs: p.specifications.map(s => `${s.specification}: ${s.value}${s.unit && s.unit !== '-' ? ' ' + s.unit : ''}`).filter(Boolean),
        leadTime: p.leadTime || '',
        moq: p.moq || 0,
        priceNum: p.price || 0,
        inStock: true,
        description: p.description,
        fromStore: true,
        generalSpecs: p.generalSpecs.filter(g => g.category || g.attributeValue).map(g => ({ label: g.category, value: g.attributeValue })),
      }));
    setCatalogProducts(stored);
  };

  useEffect(() => {
    loadCatalogProducts();
    window.addEventListener('catalogUpdated', loadCatalogProducts);
    return () => window.removeEventListener('catalogUpdated', loadCatalogProducts);
  }, []);

  const ALL_COMBINED = [...BASE_PRODUCTS, ...catalogProducts];

  const allCats = ["All Categories", ...Array.from(new Set(ALL_COMBINED.map(p => p.category)))];

  let filtered = ALL_COMBINED.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "All Categories" && p.category !== category) return false;
    if (availability === "In Stock" && !p.inStock) return false;
    if (availability === "Out of Stock" && p.inStock) return false;
    return true;
  });

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategoryChange = (cat: string) => { setCategory(cat); setCatOpen(false); setCurrentPage(1); };
  const handleAvailChange = (val: string) => { setAvailability(val); setAvailOpen(false); setCurrentPage(1); };

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
          <p className="text-sm text-gray-500 mt-0.5">Manage and organize your product catalog</p>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-72 bg-white shadow-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search products by name, category, or keyword..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none w-full"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => { setCatOpen(o => !o); setAvailOpen(false); }}
            className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors ${catOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
          >
            {category}
            <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[200px]">
              {allCats.map(opt => (
                <button key={opt} onClick={() => handleCategoryChange(opt)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${category === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Availability dropdown */}
        <div className="relative">
          <button
            onClick={() => { setAvailOpen(o => !o); setCatOpen(false); }}
            className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 transition-colors ${availOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
          >
            Availability: {availability}
            <ChevronDown size={14} className={`transition-transform ${availOpen ? "rotate-180" : ""}`} />
          </button>
          {availOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[180px]">
              {["All", "In Stock", "Out of Stock"].map(opt => (
                <button key={opt} onClick={() => handleAvailChange(opt)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${availability === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* More Filters */}
        <button className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <Filter size={14} />
          More Filters
        </button>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {paginated.map(product => (
            <ProductCard key={product.id} product={product} onPreview={setPreviewProduct} />
          ))}
        </div>
      )}

      {/* Footer Pagination */}
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

      {/* Product Detail Dialog */}
      <ProductDetailDialog product={previewProduct} open={!!previewProduct} onClose={() => setPreviewProduct(null)} />

      {/* Close dropdowns on outside click */}
      {(catOpen || availOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setCatOpen(false); setAvailOpen(false); }} />
      )}
    </div>
  );
}
