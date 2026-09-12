import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Minus, Plus, ChevronLeft, ChevronRight,
  ShoppingCart, Lock, X, Phone, Mail, MessageCircle,
  CheckCircle2, RotateCcw, Headphones, BadgeCheck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { releaseVendorReservation } from "@/lib/vendorStore";
import {
  getSlabDiscountPct,
  getClientCartPricingSettings,
  getAllProductPricing,
  getRecommendedVendor,
  type VendorStockAllocation,
} from "@/lib/priceEngineStore";
import { computeCartGST } from "@/lib/cartGstHelper";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getEffectiveTaxPctForCategory, getProductCategoryTaxMap, getHsnCodes } from "@/lib/taxEngine";
import { getCartTaxRate, getCartUnitPriceExclGst, getCartUnitPriceInclusive } from "@/lib/vendorCartPricing";
import { useOrgConfig } from "@/contexts/ConfigContext";
import { useI18n } from "@/i18n/I18nProvider";
import { formatCurrency } from "@/lib/formatters";
import {
  getAvailabilityLabel,
  getProductCommercialTerms,
} from "@/lib/productCommercialTerms";

function formatPrice(n: number) {
  return formatCurrency(n);
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
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border-r border-gray-300"
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
          className="w-14 text-center text-sm font-semibold text-gray-900 py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => { if (!atMax) onChange(value + 1); }}
          disabled={atMax}
          className={`w-8 h-8 flex items-center justify-center transition-colors border-l border-gray-300 ${atMax ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-50 hover:bg-gray-100 text-gray-600"}`}
        >
          <Plus size={12} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400">Min. order {moq > 0 ? moq : 1}</p>
    </div>
  );
}

function SuggestedCard({
  product, clientId, shopBasePath,
}: {
  product: ClientCatalogEntry;
  clientId?: string;
  shopBasePath: string;
}) {
  const navigate = useNavigate();
  const image = product.img ?? "";
  const priceNum = product.priceNum ?? parseFloat(product.price) ?? 0;

  return (
    <div className="min-w-[190px] max-w-[190px] border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col">
      {image ? (
        <img src={image} alt={product.name} className="w-full h-28 object-cover bg-gray-100" />
      ) : (
        <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-300">
          <ShoppingCart size={28} />
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
        <p className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-sm font-bold text-gray-900 mb-2">
          {formatPrice(priceNum)}
          {priceNum > 0 && <span className="text-[11px] font-normal text-gray-500"> / each</span>}
        </p>
        <button
          onClick={() => navigate(`${shopBasePath}/product/${product.productCode}`, { state: { product: { id: product.productCode, productCode: product.productCode, name: product.name, category: product.category, image: product.img || "", specs: product.specs || [], leadTime: product.leadTime || "", moq: product.moq ?? 1, priceNum, inStock: (product as any).totalStock !== 0 }, clientId } })}
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
  useI18n();
  const { items: cart, updateQuantity: onUpdateQuantity, removeItem: onRemove, clearCart: onClear } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const shopBasePath = location.pathname.startsWith("/portal/")
    ? "/portal/shop"
    : "/shop";
  const org = useOrgConfig();
  const [scrollIdx, setScrollIdx] = useState(0);

  type VendorInfo = {
    leadTime: string;
    moq: number;
    totalStock: number;
    allocations: VendorStockAllocation[];
    recommendedVendorId?: string;
  };
  const buildVendorMatchMap = (): Map<string, VendorInfo> => {
    const map = new Map<string, VendorInfo>();
    getAllProductPricing().forEach(p => {
      const days = p.winningVendor?.leadTime ?? 0;
      const displayDays = days > 0 ? days * 2 : 0;
      const allocations: VendorStockAllocation[] = p.vendorComparisons
        // Keep zero-stock vendors in the map so a selected vendor reaching
        // zero cannot fall back to its stale add-to-cart stock snapshot.
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
        recommendedVendorId: getRecommendedVendor(p.vendorComparisons)?.vendorId,
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

  const enrich = (entries: ClientCatalogEntry[]): ClientCatalogEntry[] =>
    entries.map(e => {
      const vendor = vendorMatchMap.get(e.productCode);
      const moq        = vendor?.moq && vendor.moq > 0 ? vendor.moq : (e.moq && e.moq > 0 ? e.moq : 1);
      const leadTime   = vendor?.leadTime || e.leadTime || "";
      const totalStock = vendor?.totalStock ?? 0;
      return { ...e, moq, leadTime, totalStock };
    });

  const [suggested, setSuggested] = useState<ClientCatalogEntry[]>(() => enrich(getSuggested(cart)));

  useEffect(() => {
    setSuggested(enrich(getSuggested(cart)));
    const handler = () => setSuggested(enrich(getSuggested(cart)));
    window.addEventListener("clientCatalogUpdated", handler);
    return () => window.removeEventListener("clientCatalogUpdated", handler);
  }, [cart, vendorMatchMap]);

  const hsnByCategory = useMemo(() => {
    const map = new Map<string, string>();
    getHsnCodes().forEach(h => {
      if (h.status === "Active" && h.productCategory) map.set(h.productCategory.toLowerCase(), h.code);
    });
    getProductCategoryTaxMap().forEach(m => {
      if (m.defaultHsnCode && m.productCategory) map.set(m.productCategory.toLowerCase(), m.defaultHsnCode);
    });
    return map;
  }, []);

  const totalItems = cart.length;
  const primaryClientId = cart.find((item) => item.clientId)?.clientId;
  const primaryClientPricing = primaryClientId
    ? getClientCartPricingSettings(primaryClientId)
    : { discountPct: 0, shippingDeliveryFee: 0, platformFeePct: 0 };

  const { slabs: gstSlabs, totalGst, preTaxSubtotal } = computeCartGST(
    cart.map(i => {
      const discountPct    = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
      const clientDiscountPct = i.clientId ? getClientCartPricingSettings(i.clientId).discountPct : 0;
      const taxRate = getCartTaxRate(i) ?? getEffectiveTaxPctForCategory(i.category || "");
      const vendorInclusivePrice = getCartUnitPriceInclusive(i, taxRate);
      const slabPrice = discountPct > 0 ? vendorInclusivePrice * (1 - discountPct / 100) : vendorInclusivePrice;
      const effectivePrice = clientDiscountPct > 0 ? slabPrice * (1 - clientDiscountPct / 100) : slabPrice;
      return { inclusiveAmount: effectivePrice * i.quantity, category: i.category, taxRate };
    })
  );
  const { preTaxSubtotal: preClientDiscountSubtotal } = computeCartGST(
    cart.map(i => {
      const discountPct = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
      const taxRate = getCartTaxRate(i) ?? getEffectiveTaxPctForCategory(i.category || "");
      const vendorInclusivePrice = getCartUnitPriceInclusive(i, taxRate);
      const effectivePrice = discountPct > 0 ? vendorInclusivePrice * (1 - discountPct / 100) : vendorInclusivePrice;
      return { inclusiveAmount: effectivePrice * i.quantity, category: i.category, taxRate };
    })
  );
  const clientDiscountAmount = Math.max(0, preClientDiscountSubtotal - preTaxSubtotal);
  const platformFee = (preTaxSubtotal * primaryClientPricing.platformFeePct) / 100;
  const shippingDeliveryFee = primaryClientPricing.shippingDeliveryFee;
  const subtotal = preClientDiscountSubtotal;
  const grandTotal = preTaxSubtotal + totalGst + shippingDeliveryFee + platformFee;

  const visibleCount = 4;
  const maxScroll = Math.max(0, suggested.length - visibleCount);

  // Parse spec string into label + value (e.g. "Display: 6.2\"" → { key: "Display", val: "6.2\"" })
  function parseSpec(s: string): { key: string; val: string } {
    const idx = s.indexOf(": ");
    return idx > -1 ? { key: s.slice(0, idx), val: s.slice(idx + 2) } : { key: s, val: "" };
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <p className="text-sm text-gray-500">Review your items before checkout</p>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-49px)]">

        {/* ── Left: Products + Trust badges + Suggestions ─ */}
        <div className="flex-1 min-w-0 p-5 space-y-4">

          {/* ── Table ─────────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-base">Your cart is empty</p>
                <button onClick={() => navigate(shopBasePath)} className="mt-3 text-blue-600 text-sm hover:underline">
                  Continue shopping →
                </button>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid border-b border-gray-200 bg-gray-50 px-5 py-3" style={{ gridTemplateColumns: "1fr 160px 160px 80px 140px" }}>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Unit Price</span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Quantity</span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">GST</span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Total</span>
                </div>

                {/* Rows */}
                {cart.map((item, idx) => {
                  const discountPct    = item.clientId ? getSlabDiscountPct(item.clientId, item.category || "", item.quantity) : 0;
                  const clientDiscountPct = item.clientId ? getClientCartPricingSettings(item.clientId).discountPct : 0;
                  const taxRate        = getCartTaxRate(item) ?? getEffectiveTaxPctForCategory(item.category || "");
                  const unitPriceExcl   = getCartUnitPriceExclGst(item, taxRate);
                  const vendorInclusivePrice = getCartUnitPriceInclusive(item, taxRate);
                  const slabPrice = discountPct > 0 ? vendorInclusivePrice * (1 - discountPct / 100) : vendorInclusivePrice;
                  const effectivePrice = clientDiscountPct > 0 ? slabPrice * (1 - clientDiscountPct / 100) : slabPrice;
                   const hasDiscount = discountPct > 0 || clientDiscountPct > 0;
                  const inclusiveTotal = effectivePrice * item.quantity;
                  const gstRate        = taxRate;
                  const preTaxUnit     = effectivePrice * 100 / (100 + gstRate);
                   const gstAmount      = inclusiveTotal - preTaxUnit * item.quantity;
                   // Keep the Shop selling price as the reference price. The
                   // discounted unit price is calculated separately below.
                   const originalUnit   = unitPriceExcl;
                  const catalog        = catalogMap.get(item.productCode || "");
                   const stockInfo      = vendorMatchMap.get(item.productCode || "");
                   const selectedAllocation = item.selectedVendorId
                     ? stockInfo?.allocations.find(a => a.vendorId === item.selectedVendorId)
                     : undefined;
                   const liveRemaining  = item.selectedVendorId
                     ? (selectedAllocation?.stock ?? item.totalStock ?? 0)
                     : (stockInfo?.totalStock ?? item.totalStock ?? 0);
                   const stockDataKnown = item.selectedVendorId
                     ? selectedAllocation !== undefined || item.totalStock !== undefined
                     : stockInfo !== undefined;
                  const maxQty         = stockDataKnown ? item.quantity + liveRemaining : undefined;

                   const itemMoq = selectedAllocation?.moq && selectedAllocation.moq > 0
                     ? selectedAllocation.moq
                     : (item.moq > 0 ? item.moq : 1);
                   const itemLeadTime = item.leadTime || (item.selectedVendorId ? "" : stockInfo?.leadTime || "");
                   const itemStock = item.selectedVendorId ? (item.totalStock ?? selectedAllocation?.stock ?? 0) : (stockInfo?.totalStock ?? item.totalStock ?? 0);
                   const itemTerms = item.commercialTerms || getProductCommercialTerms(
                     item.productType || item.physicalType || (item.fulfillmentType === "digital" ? "Digital License" : "Physical Product"),
                     { moq: itemMoq, leadTime: itemLeadTime, stock: itemStock },
                   );

                  const specChips = item.specs.slice(0, 5).map(parseSpec);

                  return (
                    <div
                      key={item.id}
                      className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-white"}`}
                    >
                      <div className="grid px-5 py-5 items-start gap-3" style={{ gridTemplateColumns: "1fr 160px 160px 80px 140px" }}>

                        {/* ── Product info ────────────────────────────── */}
                        <div className="flex gap-4 min-w-0 pr-2">
                          {/* Image */}
                          <div className="shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50" />
                            ) : (
                              <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                <ShoppingCart size={24} className="text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            {/* Name + remove button */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-bold text-gray-900 text-sm leading-snug">{item.name}</p>
                              <button
                                onClick={() => {
                                  if (item.selectedVendorId && item.productCode) {
                                    releaseVendorReservation(item.selectedVendorId, item.productCode, item.quantity);
                                  }
                                  onRemove(item.id);
                                }}
                                className="shrink-0 w-6 h-6 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors mt-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>

                            {/* Vendor row */}
                            {item.selectedVendorName && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-gray-500">Vendor:</span>
                                <span className="text-xs font-semibold text-gray-800">{item.selectedVendorName}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  item.selectedVendorId && item.selectedVendorId === stockInfo?.recommendedVendorId
                                    ? "text-green-700 bg-green-100 border border-green-200"
                                    : "text-blue-700 bg-blue-100 border border-blue-200"
                                }`}>
                                  {item.selectedVendorId && item.selectedVendorId === stockInfo?.recommendedVendorId ? "Recommended" : "Selected"}
                                </span>
                              </div>
                            )}

                            {/* SKU + Category */}
                            <div className="flex items-center gap-3 mb-2">
                              {(catalog?.sku || item.productCode) && (
                                <span className="text-[11px] text-gray-500">
                                  <span className="font-medium text-gray-600">SKU:</span> {catalog?.sku || item.productCode}
                                </span>
                              )}
                              {item.category && (
                                <span className="text-[11px] text-gray-500">
                                  <span className="font-medium text-gray-600">Category:</span> {item.category}
                                </span>
                              )}
                            </div>

                            {/* Spec chips */}
                            {specChips.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2.5">
                                {specChips.map((chip, ci) => (
                                  <div key={ci} className="flex flex-col items-center border border-gray-200 rounded-md px-2 py-1 bg-gray-50 min-w-[48px]">
                                    <span className="text-[11px] font-semibold text-gray-800 leading-tight">{chip.val || chip.key}</span>
                                    {chip.val && <span className="text-[9px] text-gray-400 leading-tight mt-0.5">{chip.key}</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Commercial terms — the same type-aware format used by
                                Vendor Products and Shop. Values are snapshots for
                                the selected vendor when available. */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-gray-500">
                              <span>
                                Pricing Model: <strong className="font-semibold text-gray-700">{itemTerms.pricingModel}</strong>
                              </span>
                              <span>
                                MOQ / Min Qty: <strong className="font-semibold text-gray-700">{itemTerms.moqLabel}</strong>
                              </span>
                              <span>
                                Lead Time / SLA: <strong className="font-semibold text-gray-700">{itemTerms.leadTimePrimary}{itemTerms.leadTimeSecondary ? ` · ${itemTerms.leadTimeSecondary}` : ""}</strong>
                              </span>
                              <span>
                                Availability: <strong className={`font-semibold ${itemTerms.availabilityStatus === "Out of Stock" ? "text-red-600" : "text-emerald-600"}`}>{getAvailabilityLabel(itemTerms)}</strong>
                              </span>
                            </div>

                            {/* Slab discount badge */}
                            {(discountPct > 0 || clientDiscountPct > 0) && (
                              <div className="mt-1.5">
                                <span className="text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
                                  {discountPct + clientDiscountPct}% discount applied
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Unit Price ──────────────────────────────── */}
                        <div className="flex flex-col items-center justify-start pt-1">
                            {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through leading-tight">{formatPrice(originalUnit)}</p>
                          )}
                          <p className="text-sm font-bold text-gray-900">{formatPrice(preTaxUnit)}</p>
                          <p className="text-[10px] text-gray-400">/ Unit</p>
                        </div>

                        {/* ── Quantity ────────────────────────────────── */}
                        <div className="flex flex-col items-center justify-start pt-1">
                          <QtyInput
                            value={item.quantity}
                            moq={itemMoq}
                            max={maxQty}
                            onChange={qty => onUpdateQuantity(item.id, qty)}
                          />
                        </div>

                        {/* ── GST % ───────────────────────────────────── */}
                        <div className="flex items-start justify-center pt-2">
                          <div className="text-center">
                            <span className="text-sm font-semibold text-gray-700">{gstRate}%</span>
                            <span className="block text-[10px] text-gray-400">{formatPrice(gstAmount)}</span>
                          </div>
                        </div>

                        {/* ── Total ───────────────────────────────────── */}
                        <div className="flex items-start justify-end pt-2">
                          <span className="text-sm font-bold text-gray-900">{formatPrice(inclusiveTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* ── Trust Badges ───────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", title: "Secure Checkout", sub: "100% secure payments" },
                { icon: RotateCcw,    color: "text-orange-500", bg: "bg-orange-50", title: "Easy Returns",   sub: "Hassle-free returns" },
                { icon: Headphones,  color: "text-blue-600",  bg: "bg-blue-50",   title: "24/7 Support",   sub: "Always here to help" },
                { icon: BadgeCheck,  color: "text-blue-500",  bg: "bg-blue-50",   title: "Best Price Guarantee", sub: "Quality at best prices" },
              ].map(({ icon: Icon, color, bg, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── You may also like ──────────────────────────────────────── */}
          {suggested.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-4">You may also like</h2>
              <div className="relative">
                {scrollIdx > 0 && (
                  <button
                    onClick={() => setScrollIdx(i => Math.max(0, i - 1))}
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
                    {suggested.map(p => (
                      <SuggestedCard key={p.productCode} product={p} clientId={cart[0]?.clientId} shopBasePath={shopBasePath} />
                    ))}
                  </div>
                </div>
                {scrollIdx < maxScroll && (
                  <button
                    onClick={() => setScrollIdx(i => Math.min(maxScroll, i + 1))}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Order Summary ──────────────────────────────────────── */}
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white p-5 space-y-5 sticky top-0 h-fit min-h-screen">

          {/* Order Summary */}
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({totalItems} Item{totalItems !== 1 ? "s" : ""})</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {clientDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Client Discount</span>
                  <span className="font-semibold text-green-600">-{formatPrice(clientDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total GST</span>
                <span className="font-semibold text-gray-900">{formatPrice(totalGst)}</span>
              </div>
              {shippingDeliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping / Delivery Fee</span>
                  <span className="font-semibold text-gray-900">{formatPrice(shippingDeliveryFee)}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-semibold text-gray-900">{formatPrice(platformFee)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 mb-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-base">Grand Total</span>
                <span className="font-bold text-blue-600 text-xl">{formatPrice(grandTotal)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>
          </div>

          {/* Proceed to Checkout */}
          <button
            onClick={() => navigate(`${shopBasePath}/checkout`)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            <Lock size={14} />
            Proceed to Checkout
          </button>

          {/* We Accept */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2.5">We Accept</p>
            <div className="flex items-center gap-2">
              {/* VISA */}
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[13px] font-black text-blue-800 tracking-tight italic">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="h-7 px-1.5 border border-gray-200 rounded flex items-center justify-center bg-white gap-0.5">
                <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                <div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2" />
              </div>
              {/* RuPay */}
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[11px] font-black text-blue-700 tracking-tight">RuPay</span>
              </div>
              {/* UPI */}
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[11px] font-black tracking-tight">
                  <span className="text-green-600">U</span><span className="text-blue-600">P</span><span className="text-red-500">I</span>
                </span>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-gray-900 mb-1">Need Help?</p>
            <p className="text-xs text-gray-500 mb-3">Our support team is here to help you.</p>
            <div className="space-y-2.5">
              <a href="tel:+918012345678" className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                <Phone size={13} className="text-gray-400 shrink-0" />
                +91 80 1234 5678
              </a>
              <a href="mailto:support@nido-tech.com" className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                <Mail size={13} className="text-gray-400 shrink-0" />
                support@nido-tech.com
              </a>
              <button className="flex items-center justify-between w-full text-xs text-gray-600 hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-2">
                  <MessageCircle size={13} className="text-gray-400 shrink-0" />
                  Live Chat
                </span>
                <ChevronRight size={13} className="text-gray-400" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
