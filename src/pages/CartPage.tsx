import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Minus, Plus, Bookmark, ChevronLeft, ChevronRight,
  Shield, Truck, RotateCcw, Star, ArrowRight, Mail, Phone, ShoppingCart
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { getSlabDiscountPct } from "@/lib/priceEngineStore";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const SUGGESTED: {
  id: number; name: string; image: string; priceNum: number; moq: number; specs: string[];
}[] = [
  { id: 101, name: "Logitech Wireless Mouse", image: "/products/mouse.png", priceNum: 1299, moq: 1, specs: ["Wireless", "Ergonomic"] },
  { id: 102, name: "Canon PIXMA G3010 Printer", image: "/products/printer.png", priceNum: 11990, moq: 1, specs: ["All-in-One", "Ink Tank"] },
  { id: 103, name: "APC Back-UPS 1100VA", image: "/products/ups.png", priceNum: 7499, moq: 1, specs: ["1100VA", "Power Backup"] },
  { id: 104, name: 'Samsung 24" Monitor', image: "/products/monitor.png", priceNum: 8999, moq: 1, specs: ["Full HD", "IPS Panel"] },
];

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
      <td className="py-5 pr-4">
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
      <td className="py-5 pr-4 align-top">
        <p className="font-semibold text-gray-900 text-sm">{formatPrice(item.priceNum)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Unit Price</p>
      </td>
      <td className="py-5 pr-4 align-top">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(item.id, Math.max(item.moq, item.quantity - 1))}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </td>
      <td className="py-5 align-top">
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
  product: (typeof SUGGESTED)[number];
  onAdd: (p: Omit<CartItem, "quantity">) => void;
}) {
  const [added, setAdded] = useState(false);
  return (
    <div className="min-w-[170px] max-w-[170px] border border-gray-200 rounded-xl bg-white p-3 flex flex-col">
      <img src={product.image} alt={product.name} className="w-full h-28 object-cover rounded-lg mb-2 bg-gray-100" />
      <p className="text-xs font-medium text-gray-800 mb-1 line-clamp-2">{product.name}</p>
      <p className="text-sm font-bold text-gray-900 mb-2">{formatPrice(product.priceNum)}</p>
      <button
        onClick={() => {
          onAdd({ id: product.id, name: product.name, image: product.image, specs: product.specs, moq: product.moq, priceNum: product.priceNum });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className={`flex items-center justify-center gap-1 text-xs font-medium rounded-lg py-1.5 transition-colors ${added ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
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
  const [scrollIdx, setScrollIdx] = useState(0);

  const onAddToCart = (p: Omit<CartItem, "quantity">) => addItem(p);

  const totalItems = cart.length;
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => {
    const discountPct = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
    const effectivePrice = discountPct > 0 ? i.priceNum * (1 - discountPct / 100) : i.priceNum;
    return s + effectivePrice * i.quantity;
  }, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const rewardPoints = Math.floor(total / 1000);

  const visibleCount = 4;
  const maxScroll = Math.max(0, SUGGESTED.length - visibleCount);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <button onClick={() => navigate("/shop")} className="hover:text-blue-600 transition-colors">Home</button>
          <ChevronRight size={14} />
          <span>Shopping</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">My Cart</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cart ({totalItems})</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review your items and proceed to checkout</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
            <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Bookmark size={14} />
              Save as Request
            </button>
          </div>
        </div>

        <div className="flex gap-5 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Items table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
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
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Item</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Price</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Quantity</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="px-5">
                    {cart.map((item) => {
                      const discountPct = item.clientId
                        ? getSlabDiscountPct(item.clientId, item.category || "", item.quantity)
                        : 0;
                      const effectivePrice = discountPct > 0 ? item.priceNum * (1 - discountPct / 100) : item.priceNum;
                      const lineTotal = effectivePrice * item.quantity;
                      return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-5 px-5">
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
                        <td className="py-5 pr-4 align-top">
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
                        <td className="py-5 pr-4 align-top">
                          <div className="flex items-center gap-2">
                            <button onClick={() => onUpdateQuantity(item.id, Math.max(item.moq, item.quantity - 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="py-5 pr-5 align-top">
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
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">You may also like</h2>
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
                    {SUGGESTED.map((p) => (
                      <SuggestedCard key={p.id} product={p} onAdd={onAddToCart} />
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
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Cart Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(gst)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900 text-base">{formatPrice(total)}</span>
                </div>
              </div>

              {rewardPoints > 0 && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                  <Star size={15} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">
                    You will earn <strong>{rewardPoints.toLocaleString("en-IN")}</strong> reward points on this order
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate("/shop/checkout")}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Why shop with NIDO */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
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
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-blue-600 text-sm mb-1">Need help with your order?</p>
              <p className="text-xs text-gray-500 mb-3">Contact our support team</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={13} className="text-gray-400" />
                  support@nido.com
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  +91 1800 123 4567
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
