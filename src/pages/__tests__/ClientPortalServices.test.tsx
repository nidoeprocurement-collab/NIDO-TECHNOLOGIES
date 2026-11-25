import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PORTAL_MODULES, getPortalModuleForPath } from "@/lib/portalUserStore";
import ServicesPage from "../ServicesPage";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("Client Portal Services Hub", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows My Services button above service cards in client portal and navigates to /portal/my-services and /portal/services/*", () => {
    render(
      <MemoryRouter initialEntries={["/portal/services"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/portal/services"
              element={
                <>
                  <ServicesPage />
                  <LocationDisplay />
                </>
              }
            />
            <Route path="/portal/my-services" element={<LocationDisplay />} />
            <Route path="/portal/services/amc/new" element={<LocationDisplay />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("One Place for AMC, Repair Service, Recycle / Disposal, Rental Service and Regular Purchase"),
    ).toBeTruthy();

    const myServicesBtn = screen.getByRole("button", { name: /My Services/i });
    expect(myServicesBtn).toBeTruthy();

    fireEvent.click(myServicesBtn);
    expect(screen.getByTestId("location").textContent).toBe("/portal/my-services");
  });

  it("navigates to /portal/services/amc/new when clicking AMC card in client portal", () => {
    render(
      <MemoryRouter initialEntries={["/portal/services"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/portal/services"
              element={
                <>
                  <ServicesPage />
                  <LocationDisplay />
                </>
              }
            />
            <Route path="/portal/services/amc/new" element={<LocationDisplay />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("AMC"));
    expect(screen.getByTestId("location").textContent).toBe("/portal/services/amc/new");
  });

  it("keeps Nido portal /services behavior unchanged without My Services button", () => {
    render(
      <MemoryRouter initialEntries={["/services"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/services"
              element={
                <>
                  <ServicesPage />
                  <LocationDisplay />
                </>
              }
            />
            <Route path="/services/amc/new" element={<LocationDisplay />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: /My Services/i })).toBeNull();
    fireEvent.click(screen.getByText("AMC"));
    expect(screen.getByTestId("location").textContent).toBe("/services/amc/new");
  });

  it("exposes individual overview, tab, and service modules in PORTAL_MODULES and maps service sub-routes", () => {
    expect(PORTAL_MODULES).toContain("Company Information");
    expect(PORTAL_MODULES).toContain("Orders Overview");
    expect(PORTAL_MODULES).toContain("Account Summary");
    expect(PORTAL_MODULES).toContain("Business & Tax Details");
    expect(PORTAL_MODULES).toContain("Financial & Bank Details");
    expect(PORTAL_MODULES).toContain("Billing Address");
    expect(PORTAL_MODULES).toContain("Shipping Address");
    expect(PORTAL_MODULES).toContain("Documents");
    expect(PORTAL_MODULES).toContain("Top Products");
    expect(PORTAL_MODULES).toContain("Recent Orders");
    expect(PORTAL_MODULES).toContain("Quick Links");
    expect(PORTAL_MODULES).toContain("Services - My Services");
    expect(PORTAL_MODULES).toContain("Services - AMC");
    expect(PORTAL_MODULES).toContain("Services - Repair Service");
    expect(PORTAL_MODULES).toContain("Services - Recycle / Disposal");
    expect(PORTAL_MODULES).toContain("Services - Rental Service");
    expect(PORTAL_MODULES).toContain("Services - Regular Purchase");

    expect(getPortalModuleForPath("/portal/services")).toBe("Services");
    expect(getPortalModuleForPath("/portal/my-services")).toBe("Services - My Services");
    expect(getPortalModuleForPath("/portal/services/amc/new")).toBe("Services - AMC");
    expect(getPortalModuleForPath("/portal/services/rental/new")).toBe("Services - Rental Service");
  });

  it("hides individual service cards and My Services button when the client role lacks permission", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: "auth-u-1" } } as never },
      error: null,
    });
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: "client_portal",
        effective_admin_scope: false,
        profile: {
          id: "u-1",
          client_id: "client-1",
          client_name: "Acme",
          user_type: "client_user",
          name: "Limited User",
          email: "limited@acme.com",
        },
        role: { id: "r-svc", name: "Limited Service User" },
        permissions: {
          Services: { view: true },
          "Services - AMC": { view: true },
        },
      },
      error: null,
    } as never);

    render(
      <MemoryRouter initialEntries={["/portal/services"]}>
        <AuthProvider>
          <Routes>
            <Route path="/portal/services" element={<ServicesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Rental Service")).toBeNull();
    });
    expect(screen.getByText("AMC")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /My Services/i })).toBeNull();
  });
});

