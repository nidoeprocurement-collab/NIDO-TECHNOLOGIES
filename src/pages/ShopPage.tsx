import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, MessageSquare, ShoppingCart, Check } from "lucide-react";
import type { CartItem } from "./App";
import FloatingCartButton from "@/components/FloatingCartButton";

type Product = {
  id: number;
  name: string;
  image: string;
  specs: string[];
  moq: number;
  priceNum: number;
  category: string;
  inStock: boolean;
};

const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Dell Server PowerEdge T340",
    image: "/products/server.png",
    specs: ["Intel Xeon E-2224", "8GB RAM", "1TB HDD", "365W Power Supply"],
    moq: 5,
    priceNum: 85000,
    category: "Electronics",
    inStock: true,
  },
  {
    id: 2,
    name: "HP Laptop 15s-eq2143AU",
    image: "/products/laptop.png",
    specs: ["AMD Ryzen 5", "8GB RAM", "512GB SSD", '15.6" FHD Display'],
    moq: 10,
    priceNum: 42990,
    category: "Electronics",
    inStock: true,
  },
  {
    id: 3,
    name: "Ergonomic Office Chair",
    image: "/products/chair.png",
    specs: ["Adjustable Height", "Lumbar Support", "Mesh Back", "360° Swivel"],
    moq: 12,
    priceNum: 8500,
    category: "Furniture",
    inStock: true,
  },
  {
    id: 4,
    name: "Nescafe Classic Jar",
    image: "/products/coffee.png",
    specs: ["200g Pack", "Instant Coffee", "Rich Aroma", "Premium Quality"],
    moq: 25,
    priceNum: 450,
    category: "Food & Beverages",
    inStock: false,
  },
];

const CATEGORIES = ["All Categories", "Electronics", "Furniture", "Food & Beverages"];
const AVAILABILITY = ["All", "In Stock", "Out of Stock"];
const SORT_OPTIONS = ["Default", "Price: Low to High", "Price: High to Low", "Name A-Z"];

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 transition-colors ${
          open ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {value}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                value === opt ? "text-blue-600 font-medium" : "text-gray-700"
              }`}
            >
              {value === opt && <Check size={13} className="text-blue-600" />}
              {value !== opt && <span className="w-[13px]" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  inCart,
  onAddToCart,
}: {
  product: Product;
  inCart: boolean;
  onAddToCart: (p: Omit<CartItem, "quantity">) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!onAddToCart) return;
    onAddToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      specs: product.specs,
      moq: product.moq,
      priceNum: product.priceNum,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="w-full h-48 overflow-hidden bg-gray-100 relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-base mb-2">{product.name}</h3>
        <ul className="space-y-0.5 mb-4">
          {product.specs.map((spec) => (
            <li key={spec} className="flex items-start gap-1.5 text-sm text-gray-600">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
              {spec}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between mt-auto mb-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">MOQ: {product.moq}</span>
          <span className="font-bold text-gray-900 text-base">{formatPrice(product.priceNum)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <MessageSquare size={15} />
            Enquire
          </button>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              !product.inStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {added ? <Check size={15} /> : <ShoppingCart size={15} />}
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage({
  cart = [],
  onAddToCart,
}: {
  cart?: CartItem[];
  onAddToCart?: (p: Omit<CartItem, "quantity">) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");
  const [sortBy, setSortBy] = useState("Default");

  const cartIds = new Set(cart.map((c) => c.id));

  let filtered = ALL_PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All Categories" || p.category === category;
    const matchAvail =
      availability === "All" ||
      (availability === "In Stock" && p.inStock) ||
      (availability === "Out of Stock" && !p.inStock);
    return matchSearch && matchCat && matchAvail;
  });

  if (sortBy === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.priceNum - b.priceNum);
  if (sortBy === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.priceNum - a.priceNum);
  if (sortBy === "Name A-Z") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <FloatingCartButton />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Discover our complete product catalog</p>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Dropdown label={category} options={CATEGORIES} value={category} onChange={setCategory} />
            <Dropdown label={availability} options={AVAILABILITY} value={availability} onChange={setAvailability} />
            <Dropdown label="More Filters" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 w-64 bg-white">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none w-full"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={cartIds.has(product.id)}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
