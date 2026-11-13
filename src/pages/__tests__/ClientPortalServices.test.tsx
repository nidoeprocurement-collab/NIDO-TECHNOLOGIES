import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PORTAL_MODULES, getPortalModuleForPath, savePortalRoles, createPortalRolePermission } from "@/lib/portalUserStore";
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

  it("hides individual service cards and My Services button when the client role lacks permission", () => {
    savePortalRoles("client-1", [
      {
        id: "r-svc",
        name: "Limited Service User",
        description: "Only AMC",
        status: "active",
        permissions: [
          createPortalRolePermission("Services", { view: true }),
          createPortalRolePermission("Services - AMC", { view: true }),
        ],
      },
    ]);
    localStorage.setItem(
      "nido_user",
      JSON.stringify({
        id: "u-1",
        email: "limited@acme.com",
        name: "Limited User",
        role: "Limited Service User",
        userType: "client_user",
        clientId: "client-1",
        clientName: "Acme",
      }),
    );

    render(
      <MemoryRouter initialEntries={["/portal/services"]}>
        <AuthProvider>
          <Routes>
            <Route path="/portal/services" element={<ServicesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("AMC")).toBeTruthy();
    expect(screen.queryByText("Rental Service")).toBeNull();
    expect(screen.queryByRole("button", { name: /My Services/i })).toBeNull();
  });
});

