import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Minus, Plus, ChevronLeft, ChevronRight,
  Shield, Truck, RotateCcw, ArrowRight, Mail, Phone, ShoppingCart
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { getSlabDiscountPct } from "@/lib/priceEngineStore";
import { computeCartGST } from "@/lib/cartGstHelper";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { useOrgConfig } from "@/contexts/ConfigContext";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

/** Pick up to 6 client-catalog products relevant to what's in the cart. */
function getSuggested(cartItems: CartItem[]): ClientCatalogEntry[] {
  // Derive the active client from the first cart item that carries one
  const clientId = cartItems.find(i => i.clientId)?.clientId;
  if (!clientId) return [];

  const all = getClientCatalog(clientId);
  const cartCodes = new Set(cartItems.map(i => i.productCode).filter(Boolean));
  const cartCategories = new Set(cartItems.map(i => i.category).filter(Boolean));

  const notInCart = (p: ClientCatalogEntry) => !cartCodes.has(p.productCode);

  // Same-category products first, then others
  const sameCategory = all.filter(p => notInCart(p) && cartCategories.has(p.category));
  const others      = all.filter(p => notInCart(p) && !cartCategories.has(p.category));

  return [...sameCategory, ...others].slice(0, 6);
}

function QtyInput({
  value,
  moq,
  onChange,
  size = "md",
}: {
  value: number;
  moq: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
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

  const btnCls = size === "sm"
    ? "w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
    : "w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0";
  const inputCls = size === "sm"
    ? "w-10 text-center text-sm font-medium text-gray-900 border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    : "w-10 text-center text-sm font-medium text-gray-900 border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} className={btnCls}>
        <Minus size={12} />
      </button>
      <input
        type="number"
        value={draft}
        min={min}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === "Enter" && commit()}
        className={inputCls}
      />
      <button onClick={() => onChange(value + 1)} className={btnCls}>
        <Plus size={12} />
      </button>
    </div>
  );
}

function CartItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  const lineTotal = item.priceNum * item.quantity;

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-4">
        <div className="flex items-start gap-3">
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{item.name}</p>
            <ul className="space-y-0.5">
              {item.specs.map((s) => (
                <li key={s} className="text-xs text-gray-500 flex items-start gap-1">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-2">MOQ: {item.moq}</p>
          </div>
        </div>
      </td>
      <td className="py-2 pr-4 align-top">
        <p className="font-semibold text-gray-900 text-sm">{formatPrice(item.priceNum)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Unit Price</p>
      </td>
      <td className="py-2 pr-4 align-top">
        <QtyInput value={item.quantity} moq={item.moq} onChange={qty => onUpdate(item.id, qty)} />
      </td>
      <td className="py-2 align-top">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-gray-900 text-sm">{formatPrice(lineTotal)}</p>
          <button
            onClick={() => onRemove(item.id)}
            className="ml-6 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SuggestedCard({
  product,
  onAdd,
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

  // Recompute suggestions whenever cart changes or the client catalog is updated
  useEffect(() => {
    setSuggested(getSuggested(cart));
    const handler = () => setSuggested(getSuggested(cart));
    window.addEventListener("clientCatalogUpdated", handler);
    return () => window.removeEventListener("clientCatalogUpdated", handler);
  }, [cart]);

  const onAddToCart = (p: Omit<CartItem, "quantity">) => addItem(p);

  const totalItems = cart.length;
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  // priceNum is the tax-inclusive final selling price from the Client Price Engine.
  // Extract embedded GST per category rate rather than adding tax on top.
  const { slabs: gstSlabs, totalGst, preTaxSubtotal } = computeCartGST(
    cart.map(i => {
      const discountPct = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
      const effectivePrice = discountPct > 0 ? i.priceNum * (1 - discountPct / 100) : i.priceNum;
      return { inclusiveAmount: effectivePrice * i.quantity, category: i.category };
    })
  );
  const subtotal = preTaxSubtotal;
  const total = preTaxSubtotal + totalGst;

  const visibleCount = 4;
  const maxScroll = Math.max(0, suggested.length - visibleCount);

  return (
    <div className="min-h-screen bg-white px-2 py-2">
      <div className=" ">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cart ({totalItems})</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review your items and proceed to checkout</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Items table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShoppingCart size={48} className=" mb-3 opacity-30" />
                  <p className="font-medium">Your cart is empty</p>
                  <button
                    onClick={() => navigate("/shop")}
                    className="mt-3 text-blue-600 text-sm hover:underline"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-3">Item</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Price</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Quantity</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="px-2">
                    {cart.map((item) => {
                      const discountPct = item.clientId
                        ? getSlabDiscountPct(item.clientId, item.category || "", item.quantity)
                        : 0;
                      const effectivePrice = discountPct > 0 ? item.priceNum * (1 - discountPct / 100) : item.priceNum;
                      const lineTotal = effectivePrice * item.quantity;
                      return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2">
                          <div className="flex items-start gap-3">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm mb-1">{item.name}</p>
                              <ul className="space-y-0.5">
                                {item.specs.map((s) => (
                                  <li key={s} className="text-xs text-gray-500 flex items-start gap-1">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-gray-400 mt-2">MOQ: {item.moq}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-4 align-top">
                          {discountPct > 0 ? (
                            <>
                              <p className="text-xs text-gray-400 line-through">{formatPrice(item.priceNum)}</p>
                              <p className="font-semibold text-green-600 text-sm">{formatPrice(effectivePrice)}</p>
                              <p className="text-[10px] text-green-600 font-medium mt-0.5">{discountPct}% slab discount</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-900 text-sm">{formatPrice(item.priceNum)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Unit Price</p>
                            </>
                          )}
                        </td>
                        <td className="py-2 pr-4 align-top">
                          <QtyInput value={item.quantity} moq={item.moq} onChange={qty => onUpdateQuantity(item.id, qty)} />
                        </td>
                        <td className="py-2 pr-5 align-top">
                          <div className="flex items-start justify-between">
                            <p className="font-semibold text-gray-900 text-sm">{formatPrice(lineTotal)}</p>
                            <button onClick={() => onRemove(item.id)} className="ml-6 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* You may also like */}
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

          {/* Right sidebar */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Cart Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-2">
              <h2 className="font-semibold text-gray-900 mb-4">Cart Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-medium text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity</span>
                  <span className="font-medium text-gray-900">{totalQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {gstSlabs.map(sl => (
                  <div key={sl.rate} className="flex justify-between">
                    <span className="text-gray-600">GST ({sl.rate}%)</span>
                    <span className="font-medium text-gray-900">{formatPrice(sl.gst)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900 text-base">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/shop/checkout")}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Why shop with NIDO */}
            <div className="bg-white border border-gray-200 rounded-xl p-2">
              <h2 className="font-semibold text-gray-900 mb-4">Why shop with NIDO?</h2>
              <div className="space-y-4">
                {[
                  { icon: Shield, label: "100% Secure Transactions", sub: "Your data is always protected" },
                  { icon: Shield, label: "GST Compliant Invoices", sub: "Automatically generated" },
                  { icon: Truck, label: "Fast Delivery", sub: "Across India" },
                  { icon: RotateCcw, label: "Easy Returns", sub: "Hassle-free returns" },
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
            <div className="bg-white border border-gray-200 rounded-xl p-2">
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
    </div>
  );
}
