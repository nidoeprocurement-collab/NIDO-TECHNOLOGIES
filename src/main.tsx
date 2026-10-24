import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import App from "./App.tsx";
import "./index.css";
import AppErrorBoundary from "@/components/shared/AppErrorBoundary";

window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global runtime error", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection", event.reason);
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.');
}

createRoot(rootElement).render(
  <ClerkProvider
    publishableKey={publishableKeyFromHost(
      window.location.hostname,
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    )}
    proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}
    appearance={{
      baseTheme: shadcn,
      layout: {
        logoImageUrl: "/logo.svg",
        logoLinkUrl: "/",
        logoPlacement: "inside",
      },
      variables: {
        colorPrimary: "#2563eb",
        colorBackground: "#ffffff",
        colorText: "#111827",
        colorTextSecondary: "#64748b",
        fontFamily: "Inter, sans-serif",
        borderRadius: "0.75rem",
      },
      elements: {
        rootBox: "w-full",
        cardBox:
          "w-full rounded-2xl border border-slate-200 bg-white shadow-xl",
        card: "bg-white shadow-none",
        headerTitle: "text-2xl font-semibold tracking-tight text-slate-900",
        headerSubtitle: "text-sm text-slate-500",
        formFieldLabel: "text-sm font-medium text-slate-700",
        formFieldInput:
          "h-11 rounded-lg border-slate-300 shadow-none focus:ring-2 focus:ring-blue-500/20",
        formButtonPrimary:
          "h-11 rounded-lg bg-blue-600 font-medium text-white shadow-none hover:bg-blue-700",
        socialButtonsBlockButton:
          "h-11 rounded-lg border border-slate-300 shadow-none",
        footer: "hidden",
        footerActionLink: "font-medium text-blue-600 hover:text-blue-700",
      },
    }}
  >
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </ClerkProvider>,
);
