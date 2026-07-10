import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ArrowLeft, Lock, CreditCard, Landmark, Wallet,
  Banknote, Clock, Info, CheckCircle2, Smartphone, QrCode, AlertCircle
} from "lucide-react";
import CheckoutStepper from "./CheckoutStepper";
import OrderSummaryPanel from "./OrderSummaryPanel";
import { useCart } from "@/contexts/CartContext";

const ADDRESSES: Record<number, { label: string; line1: string; line2: string; line3: string; phone: string }> = {
  1: { label: "Office (Default)", line1: "No. 45, 3rd Floor, Embassy Tech Village,", line2: "Outer Ring Road, Bangalore - 560103,", line3: "Karnataka, India", phone: "+91 98765 43210" },
  2: { label: "Warehouse", line1: "Plot No. 12, KIADB Industrial Area,", line2: "Hoskote, Bangalore - 562114,", line3: "Karnataka, India", phone: "+91 99887 66556" },
  3: { label: "Home", line1: "No. 24, 2nd Floor, MG Road,", line2: "Bangalore - 560001, Karnataka, India", line3: "", phone: "+91 91234 56789" },
};

const PAYMENT_METHODS = [
  { id: "card",       label: "Credit / Debit Card",  sub: "Visa, Mastercard, Rupay",       icon: CreditCard, badge: null    },
  { id: "netbanking", label: "Net Banking",           sub: "All major banks",               icon: Landmark,   badge: null    },
  { id: "upi",        label: "UPI",                   sub: "Pay using any UPI app",         icon: null,       badge: "UPI"   },
  { id: "wallets",    label: "Wallets",               sub: "PhonePe, Paytm, Amazon Pay",    icon: Wallet,     badge: null    },
  { id: "neft",       label: "NEFT / RTGS",           sub: "Direct bank transfer",          icon: Banknote,   badge: null    },
  { id: "bnpl",       label: "Buy Now, Pay Later",    sub: "Easy EMI & credit options",     icon: Clock,      badge: "Zest"  },
];

const NET_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda",
  "Yes Bank", "IndusInd Bank", "IDFC First Bank", "Canara Bank", "Union Bank of India",
];

const WALLETS = [
  { id: "phonepe",   label: "PhonePe",    color: "bg-purple-600" },
  { id: "paytm",     label: "Paytm",      color: "bg-blue-500"   },
  { id: "amazonpay", label: "Amazon Pay", color: "bg-orange-500" },
  { id: "googlepay", label: "Google Pay", color: "bg-green-500"  },
  { id: "mobikwik",  label: "MobiKwik",   color: "bg-sky-500"    },
];

const BNPL_TENURES = [
  { months: "3",  label: "3 Months"  },
  { months: "6",  label: "6 Months"  },
  { months: "9",  label: "9 Months"  },
  { months: "12", label: "12 Months" },
];

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function SecurityNote() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
      <Lock size={12} className="text-gray-400 shrink-0" />
      Your payment information is secure and encrypted
    </div>
  );
}

function FieldInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors ${props.className ?? ""}`}
      />
    </div>
  );
}

type PaymentState = {
  paymentMethod: string;
  cardNumber: string; cardName: string; expiryDate: string; cvv: string; saveCard: boolean;
  netBankingBank: string;
  upiId: string;
  selectedWallet: string; walletMobile: string;
  neftAccountName: string; neftAccountNumber: string; neftIfscCode: string; neftBankName: string;
  bnplTenure: string;
  promoCode: string;
};

function CardPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
        <div className="relative">
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={state.cardNumber}
            onChange={(e) => onChange({ cardNumber: formatCardNumber(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 pr-10"
          />
          <CreditCard size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      <FieldInput label="Name on Card" type="text" placeholder="John Doe" value={state.cardName} onChange={(e) => onChange({ cardName: (e.target as HTMLInputElement).value })} />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
          <input
            type="text" placeholder="MM / YY" value={state.expiryDate} maxLength={7}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "");
              if (val.length >= 3) val = val.slice(0, 2) + " / " + val.slice(2, 4);
              onChange({ expiryDate: val });
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
          <div className="relative">
            <input
              type="password" placeholder="123" value={state.cvv} maxLength={4}
              onChange={(e) => onChange({ cvv: e.target.value.replace(/\D/g, "") })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 pr-10"
            />
            <Info size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={state.saveCard} onChange={(e) => onChange({ saveCard: e.target.checked })} className="w-4 h-4 accent-blue-600" />
        <span className="text-sm text-gray-700">Save card for faster payments</span>
      </label>
      <SecurityNote />
    </div>
  );
}

function NetBankingPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select Your Bank</label>
        <select value={state.netBankingBank} onChange={(e) => onChange({ netBankingBank: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
          <option value="">-- Choose a bank --</option>
          {NET_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {NET_BANKS.slice(0, 6).map((bank) => (
          <button key={bank} onClick={() => onChange({ netBankingBank: bank })}
            className={`flex items-center gap-1.5 border rounded-lg px-2 py-2 text-xs font-medium transition-colors ${state.netBankingBank === bank ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
            <Landmark size={11} className="shrink-0" />
            <span className="truncate">{bank.replace("Bank", "").trim()}</span>
          </button>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-700">
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
        You will be redirected to your bank's secure login page to complete the payment.
      </div>
      <SecurityNote />
    </div>
  );
}

function UpiPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  const valid = state.upiId.includes("@");
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">UPI ID</label>
        <div className="relative">
          <input type="text" placeholder="yourname@upi" value={state.upiId} onChange={(e) => onChange({ upiId: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 pr-10" />
          {state.upiId && <CheckCircle2 size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 ${valid ? "text-green-500" : "text-gray-300"}`} />}
        </div>
        <p className="text-xs text-gray-400 mt-1">e.g. 9876543210@okaxis, name@paytm, name@ybl</p>
      </div>
      <div className="text-center text-xs text-gray-400 font-medium">— OR —</div>
      <div className="border border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-3">
        <QrCode size={56} className="text-gray-300" />
        <p className="text-sm font-medium text-gray-700">Scan QR Code</p>
        <p className="text-xs text-gray-400 text-center">Open any UPI app and scan the QR code to pay</p>
        <div className="flex gap-2 mt-1">
          {["PhonePe", "GPay", "Paytm", "BHIM"].map((app) => (
            <span key={app} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app}</span>
          ))}
        </div>
      </div>
      <SecurityNote />
    </div>
  );
}

function WalletsPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Select Wallet</p>
        <div className="grid grid-cols-2 gap-2">
          {WALLETS.map((w) => (
            <button key={w.id} onClick={() => onChange({ selectedWallet: w.id })}
              className={`flex items-center gap-3 border rounded-xl p-3 transition-colors ${state.selectedWallet === w.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className={`w-8 h-8 rounded-lg ${w.color} flex items-center justify-center shrink-0`}>
                <Wallet size={14} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{w.label}</p>
                {state.selectedWallet === w.id && <p className="text-xs text-blue-600">Selected</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
      {state.selectedWallet && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Registered Mobile Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
            <input type="tel" placeholder="9876543210" maxLength={10} value={state.walletMobile}
              onChange={(e) => onChange({ walletMobile: e.target.value.replace(/\D/g, "") })}
              className="w-full border border-gray-200 rounded-lg pl-12 pr-10 py-2.5 text-sm outline-none focus:border-blue-400" />
            <Smartphone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Enter the mobile number linked to your {WALLETS.find((w) => w.id === state.selectedWallet)?.label} account</p>
        </div>
      )}
      <SecurityNote />
    </div>
  );
}

function NeftPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  return (
    <div className="space-y-4">
      <FieldInput label="Account Holder Name" type="text" placeholder="Full name as on bank account" value={state.neftAccountName} onChange={(e) => onChange({ neftAccountName: (e.target as HTMLInputElement).value })} />
      <FieldInput label="Account Number" type="text" placeholder="Enter your account number" value={state.neftAccountNumber} onChange={(e) => onChange({ neftAccountNumber: (e.target as HTMLInputElement).value.replace(/\D/g, "") })} />
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldInput label="IFSC Code" type="text" placeholder="SBIN0001234" value={state.neftIfscCode} onChange={(e) => onChange({ neftIfscCode: (e.target as HTMLInputElement).value.toUpperCase() })} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
          <select value={state.neftBankName} onChange={(e) => onChange({ neftBankName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
            <option value="">-- Select bank --</option>
            {NET_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
        <Info size={13} className="shrink-0 mt-0.5" />
        NEFT transfers are processed within 2–4 hours on working days. RTGS is processed in real-time for amounts above ₹2 lakh.
      </div>
      <SecurityNote />
    </div>
  );
}

function BnplPanel({ state, onChange }: { state: PaymentState; onChange: (d: Partial<PaymentState>) => void }) {
  const { items } = useCart();
  const subtotal = items.reduce((s, i) => s + i.priceNum * i.quantity, 0);
  const total = subtotal + Math.round(subtotal * 0.18);

  const emiAmount = (months: string) => {
    const interest = parseInt(months) <= 3 ? 0 : parseInt(months) <= 6 ? 0.12 : 0.15;
    return Math.ceil((total * (1 + interest)) / parseInt(months));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-gray-700">Select EMI Tenure</p>
      <div className="grid grid-cols-2 gap-3">
        {BNPL_TENURES.map(({ months, label }) => {
          const emi = emiAmount(months);
          const isNoInterest = parseInt(months) <= 3;
          return (
            <button key={months} onClick={() => onChange({ bnplTenure: months })}
              className={`border rounded-xl p-4 text-left transition-colors ${state.bnplTenure === months ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                {isNoInterest && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">0% Interest</span>}
              </div>
              <p className="text-base font-bold text-blue-600">{formatPrice(emi)}<span className="text-xs text-gray-500 font-normal">/mo</span></p>
              {!isNoInterest && <p className="text-xs text-gray-400 mt-0.5">Includes processing fee</p>}
            </button>
          );
        })}
      </div>
      <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-800">Selected plan: {state.bnplTenure} months</p>
        <p>Monthly EMI: <strong>{formatPrice(emiAmount(state.bnplTenure))}</strong></p>
        <p>Total payable: <strong>{formatPrice(emiAmount(state.bnplTenure) * parseInt(state.bnplTenure))}</strong></p>
      </div>
      <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-xs text-green-700">
        <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
        Instant approval with no credit card needed. Powered by Zest Money.
      </div>
      <SecurityNote />
    </div>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PaymentState>({
    paymentMethod: "card",
    cardNumber: "", cardName: "", expiryDate: "", cvv: "", saveCard: true,
    netBankingBank: "",
    upiId: "",
    selectedWallet: "", walletMobile: "",
    neftAccountName: "", neftAccountNumber: "", neftIfscCode: "", neftBankName: "",
    bnplTenure: "3",
    promoCode: "",
  });

  const onChange = (d: Partial<PaymentState>) => setState((prev) => ({ ...prev, ...d }));
  const addr = ADDRESSES[1];

  function renderDetailsPanel() {
    switch (state.paymentMethod) {
      case "card":       return <CardPanel state={state} onChange={onChange} />;
      case "netbanking": return <NetBankingPanel state={state} onChange={onChange} />;
      case "upi":        return <UpiPanel state={state} onChange={onChange} />;
      case "wallets":    return <WalletsPanel state={state} onChange={onChange} />;
      case "neft":       return <NeftPanel state={state} onChange={onChange} />;
      case "bnpl":       return <BnplPanel state={state} onChange={onChange} />;
      default:
        return (
          <div className="flex-1 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm h-40">
            Select a payment method to continue
          </div>
        );
    }
  }

  const panelTitle: Record<string, string> = {
    card: "Card Details", netbanking: "Net Banking", upi: "UPI Payment",
    wallets: "Wallet Payment", neft: "NEFT / RTGS Details", bnpl: "EMI Options",
  };

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
          <button onClick={() => navigate("/shop/checkout")} className="hover:text-blue-600">Checkout</button>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Payment</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a payment method and complete your purchase securely</p>

        <CheckoutStepper current={2} />

        <div className="flex gap-5 items-start">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Payment methods + details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 text-base mb-4">Select Payment Method</h2>
              <div className="flex gap-4">
                {/* Methods list */}
                <div className="space-y-2.5 w-60 shrink-0">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${state.paymentMethod === m.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="payment" className="accent-blue-600 shrink-0"
                        checked={state.paymentMethod === m.id}
                        onChange={() => onChange({ paymentMethod: m.id })} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.label}</p>
                        <p className="text-xs text-gray-500 truncate">{m.sub}</p>
                      </div>
                      {m.badge && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium shrink-0">{m.badge}</span>}
                      {m.icon && !m.badge && <m.icon size={15} className="text-gray-400 shrink-0" />}
                    </label>
                  ))}
                </div>
                {/* Details panel */}
                <div className="flex-1 border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">{panelTitle[state.paymentMethod] ?? "Payment Details"}</h3>
                  {renderDetailsPanel()}
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-900 text-sm">Billing Address</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Same as delivery address</span>
                <button onClick={() => navigate("/shop/checkout")} className="ml-auto text-xs text-blue-600 hover:underline">Change</button>
              </div>
              <div className="mt-2">
                <p className="font-medium text-sm text-gray-900 mb-0.5">{addr.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {addr.line1}<br />{addr.line2}
                  {addr.line3 && <><br />{addr.line3}</>}<br />{addr.phone}
                </p>
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Promo Code (Optional)</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter promo code" value={state.promoCode}
                  onChange={(e) => onChange({ promoCode: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                <button className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Apply</button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button onClick={() => navigate("/shop/checkout")}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowLeft size={15} />
                Back to Delivery
              </button>
              <button onClick={() => navigate("/shop/checkout/review")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 py-3 text-sm transition-colors">
                Review Order
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
