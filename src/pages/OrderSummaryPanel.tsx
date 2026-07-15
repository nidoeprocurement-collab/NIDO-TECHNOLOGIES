import { useNavigate } from "react-router-dom";
import { Shield, Truck, RotateCcw, Mail, Phone, Pencil } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useOrgConfig } from "@/contexts/ConfigContext";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function OrderSummaryPanel({
  showItemList = true,
}: {
  showItemList?: boolean;
}) {
  const navigate = useNavigate();
  const { items: cart } = useCart();
  const org = useOrgConfig();

  const totalItems = cart.length;
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.priceNum * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
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
              <div className="flex justify-between">
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-medium text-gray-900">{formatPrice(gst)}</span>
              </div>
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
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-medium text-gray-900">{formatPrice(gst)}</span>
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

      {/* Trust badges */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 space-y-4">
        {[
          { icon: Shield, label: "100% Secure Transactions", sub: "Your data is always protected" },
          { icon: Shield, label: "GST Compliant Invoices", sub: "Automatically generated" },
          { icon: Truck, label: "Fast Delivery", sub: "Across India" },
          { icon: RotateCcw, label: "Easy Returns", sub: "Hassle-free returns" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="font-semibold text-blue-700 text-sm mb-0.5">Need help with your order?</p>
        <p className="text-xs text-gray-500 mb-3">Contact our support team</p>
        <div className="space-y-1.5">
          {(org.supportEmail || org.email) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail size={12} className="text-gray-400" />
              <a href={`mailto:${org.supportEmail || org.email}`} className="hover:text-blue-600">
                {org.supportEmail || org.email}
              </a>
            </div>
          )}
          {(org.supportPhone || org.phone) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone size={12} className="text-gray-400" />
              {org.supportPhone || org.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
