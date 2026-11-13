import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
});

