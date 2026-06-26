/// <reference path="./types/react-query-shim.d.ts" />

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

import AppLayout from "@/components/layout/AppLayout";
import PageErrorBoundary from "@/components/shared/PageErrorBoundary";

import { Suspense, lazy, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";

import { I18nProvider } from "@/i18n/I18nProvider";
import { PreferencesProvider } from "@/store/preferencesStore";

const queryClient = new QueryClient();


// =========================
// CHECKOUT TYPES
// =========================
export type CheckoutData = {
  selectedAddressId: number;
  deliveryInstructions: string;
  billingSameAsDelivery: boolean;
  orderNotes: string;
  paymentMethod: string;

  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  saveCard: boolean;

  netBankingBank: string;
  upiId: string;

  selectedWallet: string;
  walletMobile: string;

  neftAccountName: string;
  neftAccountNumber: string;
  neftIfscCode: string;
  neftBankName: string;

  bnplTenure: string;
  promoCode: string;
};

const DEFAULT_CHECKOUT: CheckoutData = {
  selectedAddressId: 1,
  deliveryInstructions: "",
  billingSameAsDelivery: true,
  orderNotes: "",
  paymentMethod: "card",

  cardNumber: "",
  cardName: "",
  expiryDate: "",
  cvv: "",
  saveCard: true,

  netBankingBank: "",
  upiId: "",

  selectedWallet: "",
  walletMobile: "",

  neftAccountName: "",
  neftAccountNumber: "",
  neftIfscCode: "",
  neftBankName: "",

  bnplTenure: "3",
  promoCode: "",
};


// =========================
// FLOATING CART BUTTON
// =========================
function FloatingCartButton() {
  const navigate = useNavigate();
  const { cart } = useCart();

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <button
      onClick={() => navigate("/shop/cart")}
      className="fixed top-5 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full shadow-lg"
    >
      <div className="relative">
        <ShoppingCart size={20} />
        {totalQty > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalQty > 99 ? "99+" : totalQty}
          </span>
        )}
      </div>
      Cart
    </button>
  );
}


// =========================
// AUTH ROUTE
// =========================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}


// =========================
// LAZY PAGES
// =========================
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const MainDashboard = lazy(() => import("@/pages/MainDashboard"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));


// =========================
// ROUTES
// =========================
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [checkout, setCheckout] = useState<CheckoutData>(DEFAULT_CHECKOUT);

  const updateCheckout = (data: Partial<CheckoutData>) => {
    setCheckout((prev) => ({ ...prev, ...data }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <FloatingCartButton />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        }
      >
        <Routes>

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" /> : <LoginPage />
            }
          />

          {/* MAIN APP */}
          <Route
            path="/"
            element={
              isAuthenticated ? <AppLayout /> : <Navigate to="/login" />
            }
          >
            <Route index element={<MainDashboard />} />

            {/* SHOP FLOW */}
            <Route path="shop" element={<ShopPage />} />

            <Route path="shop/cart" element={<CartPage />} />

            <Route
              path="shop/checkout"
              element={
                <CheckoutPage
                  checkout={checkout}
                  onCheckoutChange={updateCheckout}
                />
              }
            />

            <Route
              path="shop/payment"
              element={
                <PaymentPage
                  checkout={checkout}
                  onCheckoutChange={updateCheckout}
                />
              }
            />

            <Route
              path="shop/review"
              element={<ReviewPage checkout={checkout} />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </>
  );
}


// =========================
// MAIN APP
// =========================
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeProvider>
            <I18nProvider>
              <PreferencesProvider>
                <NotificationProvider>
                  <AuthProvider>
                    <EnhancedAuthProvider>
                      <DataProvider>
                        <CartProvider>
                          <OrganizationProvider>
                            <AppRoutes />
                          </OrganizationProvider>
                        </CartProvider>
                      </DataProvider>
                    </EnhancedAuthProvider>
                  </AuthProvider>
                </NotificationProvider>
              </PreferencesProvider>
            </I18nProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}