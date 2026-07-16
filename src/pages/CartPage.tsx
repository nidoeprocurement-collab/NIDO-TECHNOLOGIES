import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Minus, Plus, ChevronLeft, ChevronRight,
  Shield, Truck, RotateCcw, Mail, Phone, ShoppingCart, Lock, ArrowLeft,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { getSlabDiscountPct } from "@/lib/priceEngineStore";
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
  value, moq, onChange,
}: {
  value: number; moq: number; onChange: (qty: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const min = Math.max(1, moq);
  const commit = () => {
    const parsed = parseInt(draft, 10);
    const clamped = isNaN(parsed) || parsed < min ? min : parsed;
    setDraft(String(clamped));
    onChange(clamped);
  };
  return (
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
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === "Enter" && commit()}
        className="w-10 text-center text-sm font-medium text-gray-900 border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function SuggestedCard({
  product, onAdd,
}: {
  product: ClientCatalogEntry;
  onAdd: (p: Omit<CartItem, "quantity">) => void;
}) {
  const [added, setAdded] = useState(false);
  const image = product.img ?? "";
  const priceNum = product.priceNum ?? parseFloat(product.price) ?? 0;
  const specs = product.specs?.slice(0, 2) ?? [];

  return (
    <div className="min-w-[170px] max-w-[170px] border border-gray-200 rounded-xl bg-white p-3 flex flex-col">
      {image ? (
        <img src={image} alt={product.name} className="w-full h-28 object-cover rounded-lg mb-2 bg-gray-100" />
      ) : (
        <div className="w-full h-28 rounded-lg mb-2 bg-gray-100 flex items-center justify-center text-gray-300">
          <ShoppingCart size={28} />
        </div>
      )}
      <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
      <p className="text-xs font-medium text-gray-800 mb-1 line-clamp-2">{product.name}</p>
      <p className="text-sm font-bold text-gray-900 mb-2">{formatPrice(priceNum)}</p>
      <button
        onClick={() => {
          onAdd({
            id: Math.abs(product.productCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0)),
            name: product.name,
            image,
            specs,
            moq: product.moq ?? 1,
            priceNum,
            clientId: undefined,
            category: product.category,
            productCode: product.productCode,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className={`mt-auto flex items-center justify-center gap-1 text-xs font-medium rounded-lg py-1.5 transition-colors ${added ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
      >
        <ShoppingCart size={12} />
        {added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items: cart, updateQuantity: onUpdateQuantity, removeItem: onRemove, clearCart: onClear, addItem } = useCart();
  const navigate = useNavigate();
  const org = useOrgConfig();
  const [scrollIdx, setScrollIdx] = useState(0);
  const [suggested, setSuggested] = useState<ClientCatalogEntry[]>(() => getSuggested(cart));

  useEffect(() => {
    setSuggested(getSuggested(cart));
    const handler = () => setSuggested(getSuggested(cart));
    window.addEventListener("clientCatalogUpdated", handler);
    return () => window.removeEventListener("clientCatalogUpdated", handler);
  }, [cart]);

  const onAddToCart = (p: Omit<CartItem, "quantity">) => addItem(p);

  // Catalog lookup map for brand / SKU (by productCode)
  const catalogMap = useMemo(() => {
    const map = new Map<string, { brand: string; sku: string }>();
    getCatalogProducts().forEach(p => {
      map.set(p.productCode || p.skuCode || "", {
        brand: p.brand || "",
        sku: p.skuCode || "",
      });
    });
    return map;
  }, []);

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

                  return (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">

                      {/* Product Details */}
                      <td className="px-5 py-5 align-top">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                            />
                            <span className="text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200 rounded-full px-2.5 py-0.5">
                              In Stock
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
                          onChange={qty => onUpdateQuantity(item.id, qty)}
                        />
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
                      <SuggestedCard key={p.productCode} product={p} onAdd={onAddToCart} />
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

          {/* Why shop with NIDO */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Why shop with NIDO?</h2>
            <div className="space-y-4">
              {[
                { icon: Shield,    label: "100% Secure Transactions",  sub: "Your data is always protected" },
                { icon: Shield,    label: "GST Compliant Invoices",     sub: "Automatically generated" },
                { icon: Truck,     label: "Fast Delivery",              sub: "Across India" },
                { icon: RotateCcw, label: "Easy Returns",               sub: "Hassle-free returns" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="font-semibold text-blue-600 text-sm mb-1">Need help with your order?</p>
            <p className="text-xs text-gray-500 mb-3">Contact our support team</p>
            <div className="space-y-2">
              {(org.supportEmail || org.email) && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={13} className="text-gray-400" />
                  <a href={`mailto:${org.supportEmail || org.email}`} className="hover:text-blue-600">
                    {org.supportEmail || org.email}
                  </a>
                </div>
              )}
              {(org.supportPhone || org.phone) && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  {org.supportPhone || org.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
