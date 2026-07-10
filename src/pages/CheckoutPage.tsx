import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, Building2, Home, Pencil, Plus, ChevronDown } from "lucide-react";
import CheckoutStepper from "./CheckoutStepper";
import OrderSummaryPanel from "./OrderSummaryPanel";

const ADDRESSES = [
  {
    id: 1,
    label: "Office",
    isDefault: true,
    icon: "map",
    line1: "No. 45, 3rd Floor, Embassy Tech Village,",
    line2: "Outer Ring Road, Bangalore - 560103,",
    line3: "Karnataka, India",
    phone: "+91 98765 43210",
  },
  {
    id: 2,
    label: "Warehouse",
    isDefault: false,
    icon: "building",
    line1: "Plot No. 12, KIADB Industrial Area,",
    line2: "Hoskote, Bangalore - 562114,",
    line3: "Karnataka, India",
    phone: "+91 99887 66556",
  },
  {
    id: 3,
    label: "Home",
    isDefault: false,
    icon: "home",
    line1: "No. 24, 2nd Floor, MG Road,",
    line2: "Bangalore - 560001, Karnataka, India",
    line3: "",
    phone: "+91 91234 56789",
  },
];

function AddressIcon({ type }: { type: string }) {
  const cls = "text-blue-500";
  if (type === "building") return <Building2 size={20} className={cls} />;
  if (type === "home") return <Home size={20} className={cls} />;
  return <MapPin size={20} className={cls} />;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [orderNotes, setOrderNotes] = useState("");

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <button onClick={() => navigate("/shop")} className="hover:text-blue-600">Home</button>
          <ChevronRight size={14} />
          <span>Shopping</span>
          <ChevronRight size={14} />
          <button onClick={() => navigate("/shop/cart")} className="hover:text-blue-600">My Cart</button>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Checkout</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Checkout</h1>
        <p className="text-sm text-gray-500 mb-6">Review your order, provide delivery details &amp; choose payment method</p>

        <CheckoutStepper current={1} />

        <div className="flex gap-5 items-start">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Delivery Details card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 text-base mb-4">Delivery Details</h2>

              {/* Delivery Address */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-800">Delivery Address</p>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <Plus size={14} />
                  Add New Address
                </button>
              </div>

              <div className="space-y-3 mb-5">
                {ADDRESSES.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-blue-600"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <AddressIcon type={addr.icon} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
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
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0">
                      <Pencil size={11} />
                      Edit
                    </button>
                  </label>
                ))}
              </div>

              {/* Delivery Instructions */}
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Delivery Instructions (Optional)</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Add delivery instructions, gate entry details, timing preferences, etc."
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none"
                  />
                  <div className="px-4 pb-2 text-right text-xs text-gray-400">{deliveryInstructions.length}/250</div>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 text-base mb-4">Billing Address</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingSameAsDelivery}
                  onChange={(e) => setBillingSameAsDelivery(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">Same as delivery address</span>
              </label>
            </div>

            {/* Order Notes */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setNotesOpen((o) => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Order Notes (Optional)
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${notesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {notesOpen && (
                <div className="px-6 pb-4">
                  <textarea
                    rows={3}
                    placeholder="Add any special notes for this order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => navigate("/shop/checkout/payment")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 py-3 text-sm transition-colors"
              >
                Continue to Payment
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right */}
          <OrderSummaryPanel showItemList />
        </div>
      </div>
    </div>
  );
}
