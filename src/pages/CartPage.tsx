import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Minus, Plus, ChevronLeft, ChevronRight,
  Shield, Truck, RotateCcw, Mail, Phone, ShoppingCart, Lock, ArrowLeft,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { getSlabDiscountPct, getAllProductPricing, allocateQtyAcrossVendors, type VendorStockAllocation } from "@/lib/priceEngineStore";
import { computeCartGST } from "@/lib/cartGstHelper";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getEffectiveTaxPctForCategory, getProductCategoryTaxMap, getHsnCodes } from "@/lib/taxEngine";
import { useOrgConfig } from "@/contexts/ConfigContext";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Pick up to 6 client-catalog products relevant to what's in the cart. */
function getSuggested(cartItems: CartItem[]): ClientCatalogEntry[] {
  const clientId = cartItems.find(i => i.clientId)?.clientId;
  if (!clientId) return [];
  const all = getClientCatalog(clientId);
  const cartCodes = new Set(cartItems.map(i => i.productCode).filter(Boolean));
  const cartCategories = new Set(cartItems.map(i => i.category).filter(Boolean));
  const notInCart = (p: ClientCatalogEntry) => !cartCodes.has(p.productCode);
  const sameCategory = all.filter(p => notInCart(p) && cartCategories.has(p.category));
  const others      = all.filter(p => notInCart(p) && !cartCategories.has(p.category));
  return [...sameCategory, ...others].slice(0, 6);
}

function QtyInput({
  value, moq, max, onChange,
}: {
  value: number; moq: number; max?: number; onChange: (qty: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const min = Math.max(1, moq);
  const atMax = max !== undefined && max > 0 && value >= max;
  const commit = () => {
    const parsed = parseInt(draft, 10);
    let clamped = isNaN(parsed) || parsed < min ? min : parsed;
    if (max !== undefined && max > 0) clamped = Math.min(max, clamped);
    setDraft(String(clamped));
    onChange(clamped);
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === "Enter" && commit()}
          className="w-10 text-center text-sm font-medium text-gray-900 border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => { if (!atMax) onChange(value + 1); }}
          disabled={atMax}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors shrink-0 ${atMax ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"}`}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function formatMoq(n?: number) { return n && n > 0 ? String(n) : "—"; }
function formatLeadTime(t?: string) { return t ? `${t} (Subject to Availability)` : "—"; }

function SuggestedCard({
  product, clientId,
}: {
  product: ClientCatalogEntry;
  clientId?: string;
}) {
  const navigate = useNavigate();
  const image = product.img ?? "";
  const priceNum = product.priceNum ?? parseFloat(product.price) ?? 0;
  const specs = product.specs?.slice(0, 2) ?? [];

  return (
    <div className="min-w-[190px] max-w-[190px] border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col">
      {/* Image */}
      {image ? (
        <img src={image} alt={product.name} className="w-full h-28 object-cover bg-gray-100" />
      ) : (
        <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-300">
          <ShoppingCart size={28} />
        </div>
      )}

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
        <p className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-sm font-bold text-gray-900 mb-2">
          {formatPrice(priceNum)}
          {priceNum > 0 && <span className="text-[11px] font-normal text-gray-500"> / each</span>}
        </p>

        {/* Lead Time + MOQ — exact same style as shop page ProductCard footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-2 mb-2">
          <span>Lead Time: {formatLeadTime(product.leadTime)}</span>
          <span>MOQ: {formatMoq(product.moq)}</span>
        </div>

        <button
          onClick={() => navigate(`/shop/product/${product.productCode}`, { state: { product: { id: product.productCode, productCode: product.productCode, name: product.name, category: product.category, image: product.img || "", specs: product.specs || [], leadTime: product.leadTime || "", moq: product.moq ?? 1, priceNum: priceNum, inStock: (product as any).totalStock !== 0 }, clientId } })}
          className="mt-auto flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1.5 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
        >
          <ShoppingCart size={12} />
          View &amp; Select Vendor →
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items: cart, updateQuantity: onUpdateQuantity, removeItem: onRemove, clearCart: onClear, addItem } = useCart();
  const navigate = useNavigate();
  const org = useOrgConfig();
  const [scrollIdx, setScrollIdx] = useState(0);

  // Product-level stock + vendor data map — reactive: rebuilds whenever vendor
  // stock changes (vendorProductsUpdated fires after every reserveStock /
  // releaseStock call so the badge + max-qty update immediately).
  type VendorInfo = { leadTime: string; moq: number; totalStock: number; allocations: VendorStockAllocation[] };
  const buildVendorMatchMap = (): Map<string, VendorInfo> => {
    const map = new Map<string, VendorInfo>();
    getAllProductPricing().forEach(p => {
      const days = p.winningVendor?.leadTime ?? 0;
      const displayDays = days > 0 ? days * 2 : 0;
      const allocations: VendorStockAllocation[] = p.vendorComparisons
        .filter(r => r.stock > 0)
        .map(r => ({
          vendorId: r.vendorId,
          vendorName: r.vendorName,
          stock: r.stock,
          landedCostPerUnit: r.landedCostPerUnit,
          basePrice: r.basePrice,
          moq: r.moq,
        }));
      const totalStock = allocations.reduce((s, a) => s + a.stock, 0);
      map.set(p.masterProductCode, {
        leadTime: displayDays > 0 ? `${displayDays} Day${displayDays !== 1 ? "s" : ""}` : "",
        moq: p.winningVendor?.moq ?? 0,
        totalStock,
        allocations,
      });
    });
    return map;
  };

  const [vendorMatchMap, setVendorMatchMap] = useState<Map<string, VendorInfo>>(buildVendorMatchMap);

  useEffect(() => {
    const refresh = () => setVendorMatchMap(buildVendorMatchMap());
    window.addEventListener("vendorProductsUpdated", refresh);
    return () => window.removeEventListener("vendorProductsUpdated", refresh);
  }, []);

  // Catalog map — brand/sku only (MOQ now comes from vendorMatchMap).
  const catalogMap = useMemo(() => {
    const map = new Map<string, { brand: string; sku: string }>();
    getCatalogProducts().forEach(p => {
      map.set(p.masterProductCode || p.skuCode || "", {
        brand: p.brand || "",
        sku: p.skuCode || "",
      });
    });
    return map;
  }, []);

  // Enrich suggested entries with live vendor leadTime, moq, totalStock — mirrors
  // ShopPage's entryToProduct() so every card shows identical data.
  const enrich = (entries: ClientCatalogEntry[]): ClientCatalogEntry[] =>
    entries.map(e => {
      const vendor = vendorMatchMap.get(e.productCode);
      const moq        = vendor?.moq && vendor.moq > 0 ? vendor.moq
                       : (e.moq && e.moq > 0 ? e.moq : 1);
      const leadTime   = vendor?.leadTime || e.leadTime || "";
      const totalStock = vendor?.totalStock ?? 0;
      return { ...e, moq, leadTime, totalStock };
    });

  const [suggested, setSuggested] = useState<ClientCatalogEntry[]>(() =>
    enrich(getSuggested(cart))
  );

  useEffect(() => {
    setSuggested(enrich(getSuggested(cart)));
    const handler = () => setSuggested(enrich(getSuggested(cart)));
    window.addEventListener("clientCatalogUpdated", handler);
    return () => window.removeEventListener("clientCatalogUpdated", handler);
  }, [cart, vendorMatchMap]);

  const onAddToCart = (p: Omit<CartItem, "quantity" | "vendorAllocations">) => {
    // p.moq and p.totalStock are already authoritative (enriched from live vendor data).
    const correctMoq = Math.max(1, p.moq);
    const qty = p.totalStock > 0 ? Math.min(p.totalStock, correctMoq) : correctMoq;
    addItem({ ...p, moq: correctMoq }, qty);
  };

  // HSN lookup by product category — from Tax Settings (Category Mapping first, then HSN/SAC table)
  const hsnByCategory = useMemo(() => {
    const map = new Map<string, string>();
    // Secondary source: HSN/SAC codes table
    getHsnCodes().forEach(h => {
      if (h.status === "Active" && h.productCategory) {
        map.set(h.productCategory.toLowerCase(), h.code);
      }
    });
    // Primary source: Category Tax Mapping (overrides HSN table)
    getProductCategoryTaxMap().forEach(m => {
      if (m.defaultHsnCode && m.productCategory) {
        map.set(m.productCategory.toLowerCase(), m.defaultHsnCode);
      }
    });
    return map;
  }, []);

  const totalItems = cart.length;
  const totalQty   = cart.reduce((s, i) => s + i.quantity, 0);

  const { slabs: gstSlabs, totalGst, preTaxSubtotal } = computeCartGST(
    cart.map(i => {
      const discountPct    = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
      const effectivePrice = discountPct > 0 ? i.priceNum * (1 - discountPct / 100) : i.priceNum;
      return { inclusiveAmount: effectivePrice * i.quantity, category: i.category };
    })
  );
  const subtotal = preTaxSubtotal;
  const total    = preTaxSubtotal + totalGst;

  const visibleCount = 4;
  const maxScroll    = Math.max(0, suggested.length - visibleCount);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cart ({totalItems})</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review your items and proceed to checkout</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/shop")}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} />
          Continue Shopping
        </button>
      </div>

      {/* ── Items Table ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        {cart.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-base">Your cart is empty</p>
            <button
              onClick={() => navigate("/shop")}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Continue shopping →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Product Details</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">HSN Code</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">GST (%)</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Unit Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Quantity</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">GST Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Total Amount</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const discountPct    = item.clientId ? getSlabDiscountPct(item.clientId, item.category || "", item.quantity) : 0;
                  const effectivePrice = discountPct > 0 ? item.priceNum * (1 - discountPct / 100) : item.priceNum;
                  const inclusiveTotal = effectivePrice * item.quantity;
                  const gstRate        = getEffectiveTaxPctForCategory(item.category || "");
                  const preTaxLine     = inclusiveTotal * 100 / (100 + gstRate);
                  const gstLine        = inclusiveTotal - preTaxLine;
                  const preTaxUnit     = effectivePrice * 100 / (100 + gstRate);
                  const catalog        = catalogMap.get(item.productCode || "");
                  const hsnCode        = hsnByCategory.get((item.category || "").toLowerCase()) || "—";
                  const stockInfo      = vendorMatchMap.get(item.productCode || "");
                  // After reserveStock, vendor stock is already reduced by item.quantity.
                  // stockInfo.totalStock = REMAINING stock on shelves (not yet reserved).
                  // maxQty = what the user could have in total = reserved + remaining.
                  const liveRemaining  = stockInfo?.totalStock ?? 0;
                  const stockDataKnown = stockInfo !== undefined;
                  const maxQty         = stockDataKnown ? item.quantity + liveRemaining : undefined;
                  const stockBadge = !stockDataKnown
                    ? { label: "In Stock", cls: "bg-green-50 text-green-600 border-green-200" }
                    : liveRemaining === 0
                    ? { label: "Reserved", cls: "bg-blue-50 text-blue-600 border-blue-200" }
                    : liveRemaining < 50
                    ? { label: `${liveRemaining} left`, cls: "bg-amber-50 text-amber-600 border-amber-200" }
                    : { label: "In Stock", cls: "bg-green-50 text-green-600 border-green-200" };
                  // Vendor split comes from what was actually reserved (item.vendorAllocations).
                  const allocation = item.vendorAllocations ?? [];

                  return (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50/50">

                      {/* Product Details */}
                      <td className="px-5 py-5 align-top">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                            />
                            <span className={`text-[10px] font-semibold border rounded-full px-2.5 py-0.5 ${stockBadge.cls}`}>
                              {stockBadge.label}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm mb-1 leading-snug">{item.name}</p>
                            {catalog?.brand && (
                              <p className="text-xs text-gray-500 mb-0.5">
                                <span className="font-medium text-gray-600">Brand:</span> {catalog.brand}
                              </p>
                            )}
                            {item.category && (
                              <p className="text-xs text-gray-500 mb-0.5">
                                <span className="font-medium text-gray-600">Category:</span> {item.category}
                              </p>
                            )}
                            {(catalog?.sku || item.productCode) && (
                              <p className="text-xs text-gray-500 mb-2">
                                <span className="font-medium text-gray-600">SKU:</span> {catalog?.sku || item.productCode}
                              </p>
                            )}
                            <ul className="space-y-0.5 mt-1">
                              {item.specs.map((s) => (
                                <li key={s} className="text-xs text-gray-500 flex items-start gap-1.5">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                            {item.selectedVendorName && (
                              <div className="mt-1 text-xs text-gray-600">
                                <p className="mb-0.5">
                                  <span className="font-medium">Vendor:</span>{" "}
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[9px] font-bold shrink-0">
                                      {item.selectedVendorName[0].toUpperCase()}
                                    </span>
                                    {item.selectedVendorName}
                                  </span>
                                  {item.landedCost && item.landedCost > 0 && (
                                    <span className="text-gray-400 ml-1">· ₹{item.landedCost.toLocaleString("en-IN")} landed</span>
                                  )}
                                </p>
                                {item.vendorRating != null && item.vendorRating > 0 && (
                                  <p className="mb-0.5">
                                    <span className="font-medium text-gray-500">Rating:</span>{" "}
                                    <span className="text-amber-500 font-semibold">{"★".repeat(Math.round(item.vendorRating))}</span>{" "}
                                    <span className="text-gray-500">{item.vendorRating.toFixed(1)}/5</span>
                                  </p>
                                )}
                                {item.leadTime && (
                                  <p className="mb-0.5">
                                    <span className="font-medium text-gray-500">Lead Time:</span>{" "}
                                    <span className="text-blue-600 font-medium">{item.leadTime}</span>
                                  </p>
                                )}
                                {item.totalStock != null && item.totalStock > 0 && (
                                  <p className="mb-0.5">
                                    <span className="font-medium text-gray-500">Vendor Stock:</span>{" "}
                                    <span className="text-gray-700 font-medium">{item.totalStock.toLocaleString("en-IN")} units</span>
                                  </p>
                                )}
                              </div>
                            )}
                            {discountPct > 0 && (
                              <p className="text-[10px] text-green-600 font-semibold mt-1.5 bg-green-50 rounded px-1.5 py-0.5 inline-block">
                                {discountPct}% slab discount applied
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* HSN Code */}
                      <td className="px-3 py-5 align-top text-sm text-gray-700 font-mono whitespace-nowrap">
                        {hsnCode}
                      </td>

                      {/* GST % */}
                      <td className="px-3 py-5 align-top text-sm text-gray-700 whitespace-nowrap">
                        {gstRate}%
                      </td>

                      {/* Unit Price (pre-tax) */}
                      <td className="px-3 py-5 align-top whitespace-nowrap">
                        {discountPct > 0 ? (
                          <>
                            <p className="text-xs text-gray-400 line-through">{formatPrice(item.priceNum * 100 / (100 + gstRate))}</p>
                            <p className="text-sm font-semibold text-green-600">{formatPrice(preTaxUnit)}</p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(preTaxUnit)}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">/ Unit</p>
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-5 align-top">
                        <QtyInput
                          value={item.quantity}
                          moq={item.moq}
                          max={maxQty}
                          onChange={qty => onUpdateQuantity(item.id, qty)}
                        />
                        {liveRemaining === 0 && stockDataKnown && (
                          <p className="text-[10px] text-blue-500 font-medium mt-1.5">
                            All available stock reserved
                          </p>
                        )}
                        {liveRemaining > 0 && liveRemaining < 50 && (
                          <p className="text-[10px] text-amber-600 font-medium mt-1.5">
                            Only {liveRemaining} more available
                          </p>
                        )}
                      </td>

                      {/* GST Amount */}
                      <td className="px-3 py-5 align-top text-sm font-medium text-gray-800 whitespace-nowrap">
                        {formatPrice(gstLine)}
                      </td>

                      {/* Total Amount */}
                      <td className="px-3 py-5 align-top text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatPrice(inclusiveTotal)}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-5 align-top text-center">
                        <button
                          onClick={() => onRemove(item.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors mx-auto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bottom section ──────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Left: You may also like */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-4">You may also like</h2>
            {suggested.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No published products in the catalog yet. Add products via the Master Catalogue to see recommendations here.
              </p>
            ) : (
              <div className="relative">
                {scrollIdx > 0 && (
                  <button
                    onClick={() => setScrollIdx((i) => Math.max(0, i - 1))}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-3 transition-transform duration-300"
                    style={{ transform: `translateX(-${scrollIdx * 186}px)` }}
                  >
                    {suggested.map((p) => (
                      <SuggestedCard key={p.productCode} product={p} clientId={cart[0]?.clientId} />
                    ))}
                  </div>
                </div>
                {scrollIdx < maxScroll && (
                  <button
                    onClick={() => setScrollIdx((i) => Math.min(maxScroll, i + 1))}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary + Why Nido + Support */}
        <div className="w-80 shrink-0 space-y-4">

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-900 text-base mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({totalItems} Item{totalItems !== 1 ? "s" : ""})</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {gstSlabs.map(sl => (
                <div key={sl.rate} className="flex justify-between">
                  <span className="text-gray-500">Total GST ({sl.rate}%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(sl.gst)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-base">Grand Total</span>
                <span className="font-bold text-blue-600 text-xl">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>

            <button
              onClick={() => navigate("/shop/checkout")}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              <Lock size={14} />
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
