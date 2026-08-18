import { useNavigate } from "react-router-dom";
import { Shield, Truck, RotateCcw, Mail, Phone, Pencil } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { computeCartGST } from "@/lib/cartGstHelper";
import { useOrgConfig } from "@/contexts/ConfigContext";
import { getSlabDiscountPct } from "@/lib/priceEngineStore";
import { useI18n } from "@/i18n/I18nProvider";
import { formatCurrency } from "@/lib/formatters";

function formatPrice(n: number) {
  return formatCurrency(n, undefined, { decimals: 0 });
}

export default function OrderSummaryPanel({
  showItemList = true,
}: {
  showItemList?: boolean;
}) {
  useI18n();
  const navigate = useNavigate();
  const { items: cart } = useCart();
  const org = useOrgConfig();

  const totalItems = cart.length;
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  // priceNum is tax-inclusive — extract embedded GST, don't add on top.
  // Apply slab discount (same logic as CartPage) before computing GST.
  const { slabs: gstSlabs, totalGst, preTaxSubtotal } = computeCartGST(
    cart.map(i => {
      const discountPct = i.clientId ? getSlabDiscountPct(i.clientId, i.category || "", i.quantity) : 0;
      const effectivePrice = discountPct > 0 ? i.priceNum * (1 - discountPct / 100) : i.priceNum;
      return { inclusiveAmount: effectivePrice * i.quantity, category: i.category };
    })
  );
  const subtotal = preTaxSubtotal;
  const total = preTaxSubtotal + totalGst;
  return (
    <div className="w-72 shrink-0 space-y-4">
      {/* Order Summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Order Summary</h2>
        </div>

        {showItemList ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{totalItems} Items in Cart</span>
              <button
                onClick={() => navigate("/shop/cart")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Pencil size={11} />
                Edit Cart
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 shrink-0">
                    {formatPrice(item.priceNum * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {gstSlabs.map(sl => (
                <div key={sl.rate} className="flex justify-between">
                  <span className="text-gray-500">GST ({sl.rate}%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(sl.gst)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items</span>
                <span className="font-medium text-gray-900">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Quantity</span>
                <span className="font-medium text-gray-900">{totalQty}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST</span>
                <span className="font-medium text-gray-900">{formatPrice(totalGst)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="font-bold text-gray-900 text-base">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-0">
              <button
                onClick={() => navigate("/shop/cart")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Pencil size={11} />
                Edit Cart
              </button>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
