import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Copy, Check, ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import FloatingCartButton from "@/components/FloatingCartButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfirmationState = {
  orderNumber: string;
  orderDate: string;
  items: {
    id: number;
    name: string;
    image: string;
    priceNum: number;
    quantity: number;
    category?: string;
  }[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  address: { label: string; line1: string; line2: string; line3: string; phone: string };
  paymentMethod: string;
  cardLast4: string;
  paymentTerms: string;
  clientEmail: string;
  clientName: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [copied, setCopied] = useState(false);

  const state = location.state as ConfirmationState | null;

  // Fallback if page is accessed directly without state
  const orderNumber = state?.orderNumber ?? orderId ?? "—";
  const items = state?.items ?? [];
  const subtotal = state?.subtotal ?? 0;
  const shipping = state?.shipping ?? 0;
  const total = state?.total ?? 0;
  const address = state?.address ?? {
    label: "Office (Default)",
    line1: "No. 45, 3rd Floor, Embassy Tech Village,",
    line2: "Outer Ring Road, Bangalore - 560103,",
    line3: "Karnataka, India",
    phone: "+91 98765 43210",
  };
  const clientEmail = state?.clientEmail ?? "owner@nidotech.com";
  const clientName = state?.clientName ?? "Nido Tech CorpEssentials";
  const paymentMethod = state?.paymentMethod ?? "Credit Card";
  const cardLast4 = state?.cardLast4 ?? "****";
  const paymentTerms = state?.paymentTerms ?? "Net 30 (Payment due in 30 days)";
  const orderDate = state?.orderDate ?? new Date().toISOString().split("T")[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <FloatingCartButton />

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 40%, #c7d2fe 100%)",
          minHeight: 140,
        }}
      >
        {/* decorative blurred circles to mimic blurred office image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-10 top-0 w-64 h-64 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute right-20 -top-10 w-80 h-80 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute left-1/2 bottom-0 w-48 h-48 rounded-full bg-blue-200/30 blur-2xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 pt-5 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-blue-700/80 mb-6 font-medium">
            <ShoppingBag size={14} className="text-blue-600 shrink-0" />
            <button onClick={() => navigate("/shop")} className="hover:underline">Catalog</button>
            <ChevronRight size={12} />
            <span>Checkout</span>
            <ChevronRight size={12} />
            <span className="text-blue-900 font-semibold">Order Confirmation</span>
          </div>

          {/* Thank you heading */}
          <div className="flex items-center justify-center flex-col gap-3">
            <div className="flex items-center gap-4">
              {/* Green check circle */}
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-md shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thank You For Your Order!</h1>
                <p className="text-sm text-gray-600 mt-0.5">Your order has been successfully placed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Confirmation card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              {/* Order ID */}
              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900">
                  Order ID:{" "}
                  <span className="text-blue-600 font-bold">#{orderNumber}</span>
                </p>
              </div>

              <p className="text-sm text-gray-700 mb-1">Your order has been successfully placed.</p>
              <p className="text-sm text-gray-500 mb-5">
                A confirmation email has been sent to{" "}
                <a href={`mailto:${clientEmail}`} className="text-blue-600 hover:underline font-medium">
                  {clientEmail}
                </a>
              </p>

              {/* Track Order button */}
              <button
                onClick={() => navigate("/procure/orders")}
                className="w-full max-w-xs bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-3 text-sm transition-colors mb-6"
              >
                Track Order
              </button>

              {/* Bullet info */}
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                  <span>
                    Check{" "}
                    <strong className="text-gray-800">your order status</strong> or{" "}
                    <strong className="text-gray-800">track</strong> your shipping progress.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                  <span>
                    Order updates and shipment details will be sent to{" "}
                    <a href={`mailto:${clientEmail}`} className="text-blue-600 hover:underline">
                      {clientEmail}
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                  <span>
                    If you need assistance, contact customer support at{" "}
                    <a href="mailto:support@nidotech.com" className="text-blue-600 hover:underline">
                      support@nidotech.com
                    </a>{" "}
                    or{" "}
                    <strong className="text-gray-800">+91 98765 43210</strong>
                  </span>
                </li>
              </ul>

              {/* Back to Catalog */}
              <button
                onClick={() => navigate("/shop")}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Catalog
              </button>
            </div>

            {/* Need Help card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Need help? Contact our support team for assistance:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <a href="mailto:support@nidotech.com" className="text-blue-600 hover:underline">
                    support@nidotech.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Order Details panel ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Order Details</h3>
            </div>

            <div className="px-6 py-4 border-b border-gray-100">
              {/* Order ID with copy */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Order ID: <span className="font-semibold text-gray-800">#{orderNumber}</span></span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy order ID"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Line items */}
              <div className="space-y-2 mb-3">
                {items.length > 0 ? (
                  items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700 truncate mr-3 flex-1">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="text-gray-400 ml-1">×{item.quantity}</span>
                        )}
                      </span>
                      <span className="text-gray-800 font-medium shrink-0">
                        {formatPrice(item.priceNum * item.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-400 italic">No items</div>
                )}

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Standard Shipping</span>
                  <span className="text-gray-800 font-medium">{formatPrice(shipping)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Shipping to */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Shipping to:</span>
              </div>
              <div className="text-sm text-gray-600 space-y-0.5 pl-5">
                <p className="font-medium text-gray-800">{clientName}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                {address.line3 && <p>{address.line3}</p>}
                <p className="text-gray-400 text-xs mt-1">{address.phone}</p>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="px-6 py-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Payment Terms</p>
              <p className="text-sm text-gray-600 mb-1">{paymentTerms}</p>
              <p className="text-sm text-gray-600">
                {paymentMethod}{" "}
                <span className="tracking-widest text-gray-400">••••</span>{" "}
                {cardLast4}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
