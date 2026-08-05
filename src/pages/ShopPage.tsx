import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ShoppingCart, Check, ChevronDown, ChevronLeft, ChevronRight, X, Package, Shield, Clock, Printer, Wifi, FileText, Cpu, HardDrive, Monitor, Settings2, Timer, ZoomIn, Building2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import FloatingCartButton from "@/components/FloatingCartButton";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { getClients as getStoredClients } from "@/lib/clientStore";
import { getAllProductPricing, updateWinningVendorMoq, getSlabDiscountPct, computeVendorComparisons, type VendorComparisonRow } from "@/lib/priceEngineStore";
import { getProductTotalAvailableStock } from "@/lib/vendorStore";
import { getEffectiveTaxPctForCategory, getHsnCodes, getProductCategoryTaxMap } from "@/lib/taxEngine";

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
  /** Combined stock across all active vendors (0 = no vendor stock data). */
  totalStock: number;
  priceNum: number;
  inStock: boolean;
  description?: string;
  generalSpecs?: { label: string; value: string }[];
  preference?: string;
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
function formatLeadTime(t: string) { return t ? `${t} (Subject to Availability)` : "—"; }
function formatMoq(n: number) { return n > 0 ? String(n) : "—"; }

type VendorMatch = { leadTime: string; moq: number; totalStock: number };

// getClientOrderedQtyMap and getPOdQtyMap removed — available stock is now
// calculated directly from physicalStock − reservedStock in vendorStore, so
// no manual order/PO scanning is needed here.

function getVendorMatchMap(): Map<string, VendorMatch> {
  const map = new Map<string, VendorMatch>();
  getAllProductPricing().forEach(p => {
    const days = p.winningVendor?.leadTime ?? 0;
    const displayDays = days > 0 ? days * 2 : 0;
    // Use sum(physicalStock) − sum(reservedStock) across all vendors — the
    // same formula Stock Management uses — so the Shop always shows the
    // correct available qty even when one vendor's reservation exceeds its
    // physical stock (per-vendor clamping would over-report in that case).
    const totalStock = getProductTotalAvailableStock(p.masterProductCode);
    map.set(p.masterProductCode, {
      leadTime: displayDays > 0 ? `${displayDays} Day${displayDays !== 1 ? "s" : ""}` : "",
      moq: p.winningVendor?.moq ?? 0,
      totalStock,
    });
  });
  return map;
}

/** Returns a numeric sort key for a preference string.
 *  "Preference 1" → 1, "Preference 2" → 2, custom names → large number (alphabetical tiebreak),
 *  empty/undefined → Infinity (always last).
 */
function prefOrder(pref?: string): number {
  if (!pref || pref.trim() === "") return Infinity;
  const m = pref.match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  return 10000 + pref.charCodeAt(0);
}

function entryToProduct(e: ClientCatalogEntry, vendorMatches: Map<string, VendorMatch>): Product {
  const match = vendorMatches.get(e.productCode);
  const totalStock = match?.totalStock ?? 0;
  return {
    id: `client-${e.productCode}`,
    productCode: e.productCode,
    name: e.name,
    category: e.category || "General",
    image: e.img || "",
    specs: e.specs || [],
    leadTime: match?.leadTime || e.leadTime || "",
    moq: match?.moq ?? e.moq ?? 0,
    totalStock,
    priceNum: e.priceNum ?? 0,
    // Out of stock if: marked so in the catalog OR vendor stock is known and is 0.
    inStock: e.availability !== "Out of Stock" && (totalStock > 0 || match === undefined),
    description: e.description,
    generalSpecs: e.generalSpecs,
    preference: e.preference,
  };
}

function loadClients(): Client[] {
  const stored = getStoredClients();
  return stored.map((c) => ({ id: c.id, name: c.name }));
}

// ── Product Detail Dialog ────────────────────────────────────────────────────

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [zoomStyle, setZoomStyle] = useState<{ backgroundPosition: string } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ backgroundPosition: `${x}% ${y}%` });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoomStyle(null)}
    >
      <img src={src} alt={alt} className={`w-full h-full object-contain transition-opacity duration-150 ${zoomStyle ? "opacity-0" : "opacity-100"}`} />
      {zoomStyle && (
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "220%",
            backgroundPosition: zoomStyle.backgroundPosition,
          }}
        />
      )}
    </div>
  );
}

function ProductDetailDialog({ product, open, onClose, onMoqChange, clientId, allProducts, onSelectProduct }: { product: Product | null; open: boolean; onClose: () => void; onMoqChange: (product: Product, newMoq: number) => void; clientId?: string; allProducts: Product[]; onSelectProduct: (p: Product) => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(product?.moq ?? 1);
  const [qtyDraft, setQtyDraft] = useState(String(product?.moq ?? 1));
  const [added, setAdded] = useState(false);
  const [editingMoq, setEditingMoq] = useState(false);
  const [moqDraft, setMoqDraft] = useState(String(product?.moq ?? 0));

  useEffect(() => { if (product) { const v = Math.max(1, product.moq); setQty(v); setQtyDraft(String(v)); } }, [product]);
  useEffect(() => { if (product) setMoqDraft(String(product.moq)); }, [product?.moq]);

  const dialogMaxQty = product ? (product.totalStock > 0 ? product.totalStock : undefined) : undefined;

  const commitDialogQty = () => {
    const min = Math.max(1, product?.moq ?? 1);
    const parsed = parseInt(qtyDraft, 10);
    let clamped = isNaN(parsed) || parsed < min ? min : parsed;
    if (dialogMaxQty !== undefined) clamped = Math.min(dialogMaxQty, clamped);
    setQty(clamped);
    setQtyDraft(String(clamped));
  };

  if (!product) return null;

  const dialogDiscountPct = clientId ? getSlabDiscountPct(clientId, product.category, qty) : 0;
  const dialogGstRate = getEffectiveTaxPctForCategory(product.category);
  // priceNum is GST-inclusive; convert to excl. GST for display
  const dialogBasePriceExcl = product.priceNum * 100 / (100 + dialogGstRate);
  const dialogEffectivePrice = dialogDiscountPct > 0
    ? dialogBasePriceExcl * (1 - dialogDiscountPct / 100)
    : dialogBasePriceExcl;

  const handleAdd = () => {
    if (added) return;
    addItem({ id: Math.random() * 10000, name: product.name, image: product.image, specs: product.specs, moq: product.moq, totalStock: product.totalStock, priceNum: product.priceNum, clientId, category: product.category, productCode: product.productCode }, Math.max(1, qty));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specPairs = product.specs.map(s => {
    const idx = s.indexOf(': ');
    return idx > -1 ? { key: s.slice(0, idx), val: s.slice(idx + 2) } : { key: '', val: s };
  });

  const related = allProducts
    .filter(p => p.id !== product.id)
    .sort((a, b) => (a.category === product.category ? -1 : 0) - (b.category === product.category ? -1 : 0))
    .slice(0, 4);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Breadcrumb header */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-blue-600 font-medium hover:underline shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Products
          </button>
          <ChevronRight size={14} className="text-gray-300 shrink-0" />
          <span className="text-gray-800 font-medium truncate">{product.name}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="  px-2 py-2">

          {/* Top section: image + details + price */}
          <div className="flex gap-2">

            {/* Image column: thumbnail rail + main image */}
            <div className="w-[340px] shrink-0">
              <div className="flex gap-3">
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="w-14 h-14 rounded-lg border-2 border-blue-500 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="scale-[0.35] origin-center">{getProductIcon(product.name, product.category)}</div>
                    )}
                  </div>
                </div>
                <div className="flex-1 aspect-square rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                  {product.image ? (
                    <ZoomableImage src={product.image} alt={product.name} />
                  ) : (
                    getProductIcon(product.name, product.category)
                  )}
                </div>
              </div>
              {product.image && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 justify-center">
                  <ZoomIn size={12} /> Hover image to zoom
                </p>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 ${getCategoryColor(product.category)}`}>{product.category}</span>

              {product.description && (
                <p className="mt-4 text-sm text-gray-500 leading-relaxed ">{product.description}</p>
              )}

              {specPairs.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Specifications</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {specPairs.map((sp, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 border border-gray-200 rounded-xl bg-gray-50">
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
            <div className="w-72 shrink-0">
              <div className="border border-gray-200 rounded-2xl p-2 sticky top-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price (Excl. GST)</p>
                {dialogDiscountPct > 0 ? (
                  <>
                    <p className="text-sm text-gray-400 line-through mt-1">{formatPrice(dialogBasePriceExcl)}</p>
                    <p className="text-3xl font-bold text-green-600 mt-0.5">
                      {formatPrice(dialogEffectivePrice)}
                      {product.priceNum > 0 && <span className="text-sm font-normal text-gray-500"> / each</span>}
                    </p>
                    <p className="text-xs text-green-600 font-semibold mt-1">{dialogDiscountPct}% volume discount applied</p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatPrice(dialogBasePriceExcl)}
                    {product.priceNum > 0 && <span className="text-sm font-normal text-gray-500"> / each</span>}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">+ {dialogGstRate}% GST extra</p>

                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={() => { const v = Math.max(Math.max(1, product.moq), qty - 1); setQty(v); setQtyDraft(String(v)); }}
                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg leading-none shrink-0"
                  >−</button>
                  <input
                    type="number"
                    value={qtyDraft}
                    min={Math.max(1, product.moq)}
                    max={dialogMaxQty}
                    onChange={e => setQtyDraft(e.target.value)}
                    onBlur={commitDialogQty}
                    onKeyDown={e => e.key === "Enter" && commitDialogQty()}
                    className="flex-1 text-center font-bold text-base border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => { if (dialogMaxQty === undefined || qty < dialogMaxQty) { const v = qty + 1; setQty(v); setQtyDraft(String(v)); } }}
                    disabled={dialogMaxQty !== undefined && qty >= dialogMaxQty}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center text-lg leading-none shrink-0 ${dialogMaxQty !== undefined && qty >= dialogMaxQty ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                  >+</button>
                  <div className="flex flex-col text-xs text-gray-400 whitespace-nowrap">
                    <span>Min: {formatMoq(product.moq)}</span>
                    {dialogMaxQty !== undefined && <span>Max: {dialogMaxQty.toLocaleString("en-IN")}</span>}
                  </div>
                </div>
                {dialogMaxQty !== undefined && qty >= dialogMaxQty && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">
                    Maximum available stock reached ({dialogMaxQty.toLocaleString("en-IN")} units)
                  </p>
                )}

                <button
                  onClick={handleAdd}
                  disabled={!product.inStock}
                  className={`w-full mt-4 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${!product.inStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : added ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                  {added ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {!product.inStock ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}
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

          {/* Bottom section: General Specifications + Related Products */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-2 items-start">

            {/* General Specifications */}
            {product.generalSpecs && product.generalSpecs.length > 0 && (
              <div className="border border-gray-200 rounded-2xl p-2">
                <h3 className="text-base font-semibold text-gray-900 mb-4">General Specifications</h3>
                <div className="flex flex-col">
                  {product.generalSpecs.map((gs, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-100 last:border-0 py-2.5">
                      <span className="text-sm text-gray-500">{gs.label}</span>
                      <span className="text-sm font-medium text-gray-800">{gs.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Products */}
            {related.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Related Products</h3>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                  {related.map(rp => {
                    const rpDiscountPct = clientId ? getSlabDiscountPct(clientId, rp.category, Math.max(1, rp.moq)) : 0;
                    const rpGstRate = getEffectiveTaxPctForCategory(rp.category);
                    const rpBasePriceExcl = rp.priceNum * 100 / (100 + rpGstRate);
                    const rpPrice = rpDiscountPct > 0 ? rpBasePriceExcl * (1 - rpDiscountPct / 100) : rpBasePriceExcl;
                    return (
                      <div
                        key={rp.id}
                        onClick={() => onSelectProduct(rp)}
                        className="border border-gray-200 rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="w-full aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2">
                          {rp.image ? (
                            <img src={rp.image} alt={rp.name} className="w-full h-full object-contain" />
                          ) : (
                            getProductIcon(rp.name, rp.category)
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{rp.name}</p>
                        <span className={`text-[11px] font-medium mt-1 ${getCategoryColor(rp.category)}`}>{rp.category}</span>
                        <p className="text-sm font-bold text-gray-900 mt-1.5">
                          {formatPrice(rpPrice)}
                          {rp.priceNum > 0 && <span className="text-[11px] font-normal text-gray-500"> / each</span>}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">MOQ: {formatMoq(rp.moq)}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem({ id: Math.random() * 10000, name: rp.name, image: rp.image, specs: rp.specs, moq: rp.moq, priceNum: rp.priceNum, clientId, category: rp.category, productCode: rp.productCode }, Math.max(1, rp.moq));
                          }}
                          className="mt-2 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
                        >
                          <ShoppingCart size={12} /> Cart
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

// ── Vendor badge helper ───────────────────────────────────────────────────────
function getVendorBadge(comp: VendorComparisonRow, all: VendorComparisonRow[]): { label: string; color: string; bg: string } | null {
  if (all.length === 0) return null;
  if (comp.vendorId === all[0]?.vendorId) return { label: "Recommended", color: "#1d4ed8", bg: "#eff6ff" };
  const others = all.filter(c => c.vendorId !== all[0]?.vendorId);
  const minLT = Math.min(...all.map(c => c.leadTime));
  if (comp.leadTime === minLT && minLT > 0 && comp.vendorId !== all[0]?.vendorId) return { label: "Fastest", color: "#059669", bg: "#f0fdf4" };
  const minPrice = others.length > 0 ? Math.min(...others.map(c => c.basePrice)) : Infinity;
  if (comp.basePrice <= minPrice && comp.vendorId !== all[0]?.vendorId) return { label: "Best Price", color: "#d97706", bg: "#fffbeb" };
  const maxRating = Math.max(...all.map(c => c.rating));
  if (comp.rating === maxRating && maxRating > 0 && comp.vendorId !== all[0]?.vendorId) return { label: "Preferred", color: "#7c3aed", bg: "#faf5ff" };
  return null;
}

function getExpectedDelivery(leadTimeDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + leadTimeDays * 2);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ProductCard({ product, onPreview, clientId }: { product: Product; onPreview: (p: Product) => void; clientId?: string }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(Math.max(1, product.moq));
  const [qtyDraft, setQtyDraft] = useState(String(Math.max(1, product.moq)));
  const [adding, setAdding] = useState(false);
  const [vendorComps, setVendorComps] = useState<VendorComparisonRow[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorComparisonRow | null>(null);
  const [vendorPanelOpen, setVendorPanelOpen] = useState(false);

  useEffect(() => {
    if (product.productCode) {
      const comps = computeVendorComparisons(product.productCode, product.category);
      setVendorComps(comps);
    }
  }, [product.productCode, product.category]);

  const maxQty = selectedVendor ? (selectedVendor.stock > 0 ? selectedVendor.stock : undefined) : (product.totalStock > 0 ? product.totalStock : undefined);

  const commitCardQty = () => {
    const min = Math.max(1, product.moq);
    const parsed = parseInt(qtyDraft, 10);
    let clamped = isNaN(parsed) || parsed < min ? min : parsed;
    if (maxQty !== undefined) clamped = Math.min(maxQty, clamped);
    setQty(clamped);
    setQtyDraft(String(clamped));
  };

  const cardDiscountPct = clientId ? getSlabDiscountPct(clientId, product.category, qty) : 0;
  const cardGstRate = getEffectiveTaxPctForCategory(product.category);
  const cardBasePriceExcl = product.priceNum * 100 / (100 + cardGstRate);
  const cardEffectivePrice = cardDiscountPct > 0 ? cardBasePriceExcl * (1 - cardDiscountPct / 100) : cardBasePriceExcl;
  const displayPrice = selectedVendor ? selectedVendor.landedCostPerUnit : cardEffectivePrice;
  const displayPriceLabel = selectedVendor ? "landed cost" : "excl. GST";

  // Compute HSN code for this product's category (same logic as CartPage)
  const hsnForCategory = (() => {
    const map = new Map<string, string>();
    getHsnCodes().forEach(h => { if (h.status === "Active" && h.productCategory) map.set(h.productCategory.toLowerCase(), h.code); });
    getProductCategoryTaxMap().forEach(m => { if (m.defaultHsnCode && m.productCategory) map.set(m.productCategory.toLowerCase(), m.defaultHsnCode); });
    return map.get((product.category || "").toLowerCase()) || "";
  })();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock || adding || !selectedVendor) return;
    setAdding(true);
    addItem(
      {
        id: Math.random() * 10000,
        name: product.name,
        image: product.image,
        specs: product.specs,
        moq: product.moq,
        totalStock: selectedVendor.stock,
        priceNum: product.priceNum,
        clientId,
        category: product.category,
        productCode: product.productCode,
        leadTime: selectedVendor.leadTime > 0 ? `${selectedVendor.leadTime * 2} days` : product.leadTime,
        selectedVendorId: selectedVendor.vendorId,
        selectedVendorName: selectedVendor.vendorName,
        vendorPrice: selectedVendor.basePrice,
        landedCost: selectedVendor.landedCostPerUnit,
        gstSnapshot: cardGstRate,
        hsnSnapshot: hsnForCategory,
        vendorRating: selectedVendor.rating,
      },
      Math.max(1, qty)
    );
    setTimeout(() => setAdding(false), 1500);
  };

  const canAdd = product.inStock && !!selectedVendor;

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
        <div className="flex-1 p-2 flex flex-col min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</h3>
          <span className={`text-xs font-medium mt-0.5 ${getCategoryColor(product.category)}`}>{product.category}</span>

          {product.specs.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Key Specifications</p>
              <ul className="space-y-0.5">
                {product.specs.slice(0, 4).map((spec, i) => (
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

      {/* Vendor Selection Section */}
      <div className="px-3 pt-2 pb-1 border-t border-gray-100" onClick={e => e.stopPropagation()}>
        {vendorComps.length === 0 ? (
          <p className="text-[10px] text-gray-400 py-1">No vendor pricing available</p>
        ) : (
          <div>
            <select
              value={selectedVendor?.vendorId || ""}
              onChange={e => {
                const v = vendorComps.find(c => c.vendorId === e.target.value) || null;
                setSelectedVendor(v);
              }}
              className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">— Select a vendor —</option>
              {vendorComps.map((comp, i) => {
                const badge = i === 0 ? "★ Recommended" : (getVendorBadge(comp, vendorComps)?.label ?? "");
                const contactName = comp.primaryContact || comp.vendorName;
                const moqPart = comp.moq > 0 ? `MOQ: ${comp.moq}` : "MOQ: —";
                const leadPart = comp.leadTime > 0 ? `Lead: ${comp.leadTime * 2}d` : "Lead: —";
                const stockPart = comp.stock > 0 ? `Stock: ${comp.stock}` : "Stock: 0";
                const details = `${moqPart} · ${leadPart} · ${stockPart}`;
                const prefix = badge ? `[${badge}] ` : "";
                return (
                  <option key={comp.vendorId} value={comp.vendorId}>
                    {`${prefix}${contactName} — ${details}`}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 mt-auto pt-2">
        {/* Selling price — shown only after vendor is selected */}
        {selectedVendor && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-gray-900 text-base leading-tight">
              ₹{selectedVendor.landedCostPerUnit.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-gray-500"> / each</span>
            </span>
            <span className="text-[10px] text-gray-400">selling price</span>
          </div>
        )}

        {!selectedVendor && !product.inStock ? (
          <div className="flex items-center justify-center rounded-lg py-1.5 bg-gray-200 text-gray-400 text-xs font-semibold">Out of Stock</div>
        ) : (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                !canAdd ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-dashed border-gray-300" : adding ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {adding ? <Check size={13} /> : <ShoppingCart size={13} />}
              {adding ? "Added!" : !selectedVendor ? "Select a vendor first" : "Add to Cart"}
            </button>
            {selectedVendor && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                <button onClick={() => { const v = Math.max(Math.max(1, product.moq), qty - 1); setQty(v); setQtyDraft(String(v)); }} className="px-1.5 py-1.5 text-gray-600 hover:bg-gray-100 text-sm leading-none">−</button>
                <input
                  type="number"
                  value={qtyDraft}
                  min={Math.max(1, product.moq)}
                  max={maxQty}
                  onChange={e => setQtyDraft(e.target.value)}
                  onBlur={commitCardQty}
                  onKeyDown={e => e.key === "Enter" && commitCardQty()}
                  className="w-10 text-center text-xs font-semibold text-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => { if (maxQty === undefined || qty < maxQty) { const v = qty + 1; setQty(v); setQtyDraft(String(v)); } }}
                  disabled={maxQty !== undefined && qty >= maxQty}
                  className={`px-1.5 py-1.5 text-sm leading-none ${maxQty !== undefined && qty >= maxQty ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                >+</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const navigate = useNavigate();
  const { user, isClientPortalUser } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(
    () => (isClientPortalUser ? user?.clientId ?? "" : localStorage.getItem("nido_shop_selected_client") ?? "")
  );

  // Portal users only ever see their own assigned catalog — keep the
  // selected client pinned to their account even if it changes after mount.
  useEffect(() => {
    if (isClientPortalUser && user?.clientId && selectedClientId !== user.clientId) {
      setSelectedClientId(user.clientId);
    }
  }, [isClientPortalUser, user?.clientId]);
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");
  const [catOpen, setCatOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
  // Available stock is now physicalStock − reservedStock, maintained directly
  // in vendorStore. No order/PO scanning needed — the vendorProductsUpdated
  // event fires whenever reservedStock or physicalStock changes.
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
    return () => {
      events.forEach(ev => window.removeEventListener(ev, loadClientProducts));
    };
  }, [selectedClientId]);

  // Reset page on filter change
  const resetPage = () => setCurrentPage(1);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const allCats = ["All Categories", ...Array.from(new Set(catalogProducts.map(p => p.category)))];

  const filtered = catalogProducts
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "All Categories" && p.category !== category) return false;
      if (availability === "In Stock" && !p.inStock) return false;
      if (availability === "Out of Stock" && p.inStock) return false;
      return true;
    })
    .sort((a, b) => prefOrder(a.preference) - prefOrder(b.preference));

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    localStorage.setItem("nido_shop_selected_client", id);
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
    <div className="min-h-screen bg-white px-2 py-2">
      <FloatingCartButton />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedClient
              ? `Showing catalog for ${selectedClient.name}`
              : "Select a client to view their catalog"}
          </p>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-2 w-72 bg-white shadow-sm">
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

        {/* ── Client dropdown — hidden in the client portal, where the
            catalog is always scoped to the logged-in client's own account ── */}
        {!isClientPortalUser && (
          <div className="relative">
            <button
              onClick={() => { setClientOpen(o => !o); setCatOpen(false); setAvailOpen(false); }}
              className={`flex items-center gap-2 text-sm border rounded-lg px-2 py-2 transition-colors min-w-[180px] ${clientOpen ? "border-blue-500 text-blue-600 bg-blue-50" : selectedClientId ? "border-blue-500 text-blue-700 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
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
                    className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedClientId === c.id ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-xs text-gray-400">{c.id}</span>
                  </button>
                ))}
                {clients.length === 0 && <div className="px-2 py-2 text-sm text-gray-400">No clients found</div>}
              </div>
            )}
          </div>
        )}

        {/* Category dropdown — only when client selected */}
        {selectedClientId && (
          <div className="relative">
            <button
              onClick={() => { setCatOpen(o => !o); setAvailOpen(false); setClientOpen(false); }}
              className={`flex items-center gap-2 text-sm border rounded-lg px-2 py-2 transition-colors ${catOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            >
              {category}
              <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[200px]">
                {allCats.map(opt => (
                  <button key={opt} onClick={() => { setCategory(opt); setCatOpen(false); resetPage(); }}
                    className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-50 transition-colors ${category === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
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
              className={`flex items-center gap-2 text-sm border rounded-lg px-2 py-2 transition-colors ${availOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            >
              Availability: {availability}
              <ChevronDown size={14} className={`transition-transform ${availOpen ? "rotate-180" : ""}`} />
            </button>
            {availOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[180px]">
                {["All", "In Stock", "Out of Stock"].map(opt => (
                  <button key={opt} onClick={() => { setAvailability(opt); setAvailOpen(false); resetPage(); }}
                    className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-50 transition-colors ${availability === opt ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* More Filters */}
        {selectedClientId && (
          <button className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Filter size={14} />
            More Filters
          </button>
        )}
      </div>

      {/* Content */}
      {!selectedClientId ? (
        /* No client selected — empty state */
        <div className="text-center py-32 text-gray-400">
          <Building2 size={56} className=" mb-4 opacity-20" />
          <p className="font-semibold text-lg text-gray-500">Select a client to view their catalog</p>
          <p className="text-sm mt-2">Use the dropdown above to choose a client. Only products added to that client's catalog will appear here.</p>
        </div>
      ) : paginated.length === 0 ? (
        /* Client selected but no products */
        <div className="text-center py-24 text-gray-400">
          <ShoppingCart size={48} className=" mb-3 opacity-30" />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {paginated.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPreview={p => navigate(`/shop/product/${p.productCode}`, { state: { product: p, clientId: selectedClientId } })}
                clientId={selectedClientId}
              />
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

      {/* Close dropdowns on outside click */}
      {(catOpen || availOpen || clientOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setCatOpen(false); setAvailOpen(false); setClientOpen(false); }} />
      )}
    </div>
  );
}
