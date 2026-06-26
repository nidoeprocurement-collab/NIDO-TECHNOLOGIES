import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Pencil, MapPin, Lock, Info } from "lucide-react";
import CheckoutStepper from "./CheckoutStepper";
import OrderSummaryPanel from "./OrderSummaryPanel";
import type { CartItem } from "./App";
import type { CheckoutData } from "./App";

const ADDRESSES: Record<number, { label: string; line1: string; line2: string; line3: string; phone: string }> = {
  1: { label: "Office (Default)", line1: "No. 45, 3rd Floor, Embassy Tech Village,", line2: "Outer Ring Road, Bangalore - 560103,", line3: "Karnataka, India", phone: "+91 98765 43210" },
  2: { label: "Warehouse", line1: "Plot No. 12, KIADB Industrial Area,", line2: "Hoskote, Bangalore - 562114,", line3: "Karnataka, India", phone: "+91 99887 66556" },
  3: { label: "Home", line1: "No. 24, 2nd Floor, MG Road,", line2: "Bangalore - 560001, Karnataka, India", line3: "", phone: "+91 91234 56789" },
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Credit / Debit Card",
  netbanking: "Net Banking",
  upi: "UPI",
  wallets: "Wallets",
  neft: "NEFT / RTGS",
  bnpl: "Buy Now, Pay Later",
};

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function ReviewPage({
  cart,
  checkout,
}: {
  cart: CartItem[];
  checkout: CheckoutData;
}) {
  const [, navigate] = useLocation();
  const [placed, setPlaced] = useState(false);

  const addr = ADDRESSES[checkout.selectedAddressId] || ADDRESSES[1];
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.priceNum * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const rewardPoints = Math.floor(total / 1000);

  const last4 = checkout.cardNumber.replace(/\s/g, "").slice(-4) || "****";

  if (placed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-sm text-gray-500 mb-1">Your order has been placed and is being processed.</p>
          <p className="text-sm text-gray-500 mb-6">You will earn <strong>{rewardPoints.toLocaleString("en-IN")}</strong> reward points.</p>
          <p className="text-2xl font-bold text-gray-900 mb-6">{formatPrice(total)}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <button onClick={() => navigate("/")} className="hover:text-blue-600">Home</button>
          <ChevronRight size={14} />
          <span>Shopping</span>
          <ChevronRight size={14} />
          <button onClick={() => navigate("/cart")} className="hover:text-blue-600">My Cart</button>
          <ChevronRight size={14} />
          <button onClick={() => navigate("/checkout")} className="hover:text-blue-600">Checkout</button>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Review &amp; Place Order</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Review &amp; Place Order</h1>
        <p className="text-sm text-gray-500 mb-6">Please review your order details before placing the order</p>

        <CheckoutStepper current={3} />

        <div className="flex gap-5 items-start">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Delivery Details card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Delivery Details</h2>
                <button onClick={() => navigate("/checkout")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Pencil size={11} />
                  Edit
                </button>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{addr.label}</span>
                    {checkout.selectedAddressId === 1 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {addr.line1}<br />
                    {addr.line2}
                    {addr.line3 && <><br />{addr.line3}</>}
                    <br />
                    {addr.phone}
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs font-medium text-gray-700 mb-1">Delivery Instructions</p>
                  <p className="text-xs text-gray-500">{checkout.deliveryInstructions || "—"}</p>
                </div>
              </div>
            </div>

            {/* Billing + Payment row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Billing Address */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 text-sm">Billing Address</h2>
                    {checkout.billingSameAsDelivery && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Same as delivery address</span>
                    )}
                  </div>
                  <button onClick={() => navigate("/checkout")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Pencil size={11} />
                    Edit
                  </button>
                </div>
                <p className="font-medium text-sm text-gray-900 mb-1">{addr.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {addr.line1}<br />
                  {addr.line2}
                  {addr.line3 && <><br />{addr.line3}</>}
                  <br />
                  {addr.phone}
                </p>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Payment Method</h2>
                  <button onClick={() => navigate("/payment")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Pencil size={11} />
                    Edit
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{PAYMENT_LABELS[checkout.paymentMethod] || "Credit / Debit Card"}</p>
                    {checkout.paymentMethod === "card" && (
                      <>
                        <p className="text-xs text-gray-500">Visa ending with {last4}</p>
                        {checkout.cardName && <p className="text-xs text-gray-500">{checkout.cardName}</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Order Items ({cart.length})</h2>
                <button onClick={() => navigate("/cart")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Pencil size={11} />
                  Edit Cart
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Item</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Price</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">Quantity</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-6">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0" />
                          <div>
                            <p className="font-medium text-sm text-gray-900 mb-1">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.specs.map((s, i) => (
                                <span key={s}>{i > 0 ? " • " : ""}{s}</span>
                              ))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">MOQ: {item.moq}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 align-top text-sm font-medium text-gray-900">{formatPrice(item.priceNum)}</td>
                      <td className="py-4 pr-4 align-top text-sm text-gray-700">{item.quantity}</td>
                      <td className="py-4 pr-6 align-top text-sm font-semibold text-gray-900">{formatPrice(item.priceNum * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rewardPoints > 0 && (
                <div className="mx-6 mb-5 mt-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-gray-700">
                  <Info size={14} className="text-blue-500 shrink-0" />
                  You will earn <strong className="ml-1">{rewardPoints.toLocaleString("en-IN")}</strong>&nbsp;reward points on this order
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate("/payment")}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={15} />
                Back to Payment
              </button>
              <button
                onClick={() => setPlaced(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 py-3 text-sm transition-colors"
              >
                Place Order
                <Lock size={15} />
              </button>
            </div>
          </div>

          {/* Right */}
          <OrderSummaryPanel cart={cart} showItemList={false} />
        </div>
      </div>
    </div>
  );
}
