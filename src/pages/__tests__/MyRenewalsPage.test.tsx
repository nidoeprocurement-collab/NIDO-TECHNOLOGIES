import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MyOrdersProvider } from "@/contexts/MyOrdersContext";
import MyRenewalsPage from "@/pages/MyRenewalsPage";

function renderRenewalsPage() {
  return render(
    <MyOrdersProvider>
      <MyRenewalsPage />
    </MyOrdersProvider>,
  );
}

function openCreateRenewal() {
  fireEvent.click(screen.getByRole("button", { name: "New Renewal" }));
}

describe("Create New Renewal live data", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows an empty state instead of sample clients and orders when no live records exist", () => {
    renderRenewalsPage();
    openCreateRenewal();

    expect(screen.getByText(/No saved client records are available/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Next/ })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("option", { name: "Raj Manufacturing" })).toBeNull();
  });

  it("explains when a live client has no eligible delivered orders", () => {
    localStorage.setItem("nido_clients_v3:anonymous", JSON.stringify([
      { id: "client-live", name: "Live Customer", status: "active", email: "buyer@example.com" },
    ]));

    renderRenewalsPage();
    openCreateRenewal();

    expect(screen.getByText(/No delivered, renewal-eligible order items/)).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Raj Manufacturing" })).toBeNull();
  });

  it("loads the selected customer's delivered product and its saved order values", () => {
    localStorage.setItem("nido_clients_v3:anonymous", JSON.stringify([
      { id: "client-live", name: "Live Customer", status: "active", email: "buyer@example.com" },
    ]));
    localStorage.setItem("nido_my_orders", JSON.stringify([
      {
        id: "ORD-LIVE-1",
        clientId: "client-live",
        client: "Live Customer",
        status: "Delivered",
        orderDate: "2026-10-10",
        deliveryDate: "2026-10-11",
        cartItems: [{
          id: 1,
          name: "Live SaaS License",
          image: "",
          priceNum: 125,
          quantity: 7,
          category: "Software",
          specs: [],
          moq: 1,
          clientId: "client-live",
          productType: "Subscription",
          fulfillmentType: "digital",
          subOrderId: "SO-LIVE-1",
        }],
      },
    ]));

    renderRenewalsPage();
    openCreateRenewal();

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0].value).toBe("");
    expect(Array.from(selects[0].options).map(option => option.text)).toContain("Live Customer");
    expect(Array.from(selects[0].options).map(option => option.text)).not.toContain("Raj Manufacturing");

    fireEvent.change(selects[0], { target: { value: "Live Customer" } });
    fireEvent.change(selects[1], { target: { value: "ORD-LIVE-1" } });
    fireEvent.change(selects[2], { target: { value: "SO-LIVE-1" } });
    fireEvent.change(selects[3], { target: { value: "Live SaaS License" } });

    expect((document.querySelector('input[type="number"]') as HTMLInputElement).value).toBe("125");
    expect(Array.from(selects[1].options).map(option => option.text)).toContain("ORD-LIVE-1");
  });
});
