import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorContractsPage from "@/pages/VendorContractsPage";

function renderVendorContractsPage(scope: { vendorId?: string; vendorName?: string } = {}) {
  return render(
    <MemoryRouter>
      <VendorContractsPage {...scope} />
    </MemoryRouter>,
  );
}

describe("Vendor contract detail page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("edits contract sections in a dialog and updates the detail view", () => {
    renderVendorContractsPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit Contract Overview" }));
    fireEvent.change(screen.getByLabelText("Contract Name"), {
      target: { value: "Updated Vendor Supply Agreement" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByRole("heading", { name: "Updated Vendor Supply Agreement" })).toBeTruthy();
  });

  it("offers contract download from the matching three-dot actions menu", () => {
    renderVendorContractsPage();

    fireEvent.click(screen.getByRole("button", { name: "Contract actions" }));

    expect(screen.getByRole("button", { name: "Download Contract" })).toBeTruthy();
  });

  it("shows the contract-detail sections from the reference layout", () => {
    renderVendorContractsPage();

    for (const heading of [
      "Contract Overview",
      "2. Response & Resolution Targets",
      "1. Commercial Terms",
      "3. Services Covered",
      "5. Data Security & Compliance",
      "6. Confidentiality Clause",
      "7. Support & Escalation Matrix",
      "8. Renewal & Termination",
      "2. Subscription & Licensing",
      "4. SLA Commitments",
      "Renewal Information",
      "Support Information",
      "Key Contacts",
      "Reminders",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }

    expect(screen.getByRole("button", { name: "Create Support Ticket" })).toBeTruthy();
  });

  it("shows a blank vendor detail view without changing saved contract data", () => {
    const storageKey = "nido_vendor_contracts_V-TEST";
    const savedContract = {
      id: "CONTRACT-SECRET",
      name: "Secret Contract Title",
      type: "Supply Agreement",
      startDate: "Jan 1, 2025",
      endDate: "Jan 1, 2026",
      value: "₹20,000",
      paymentTerms: "Net 30",
      status: "Active",
      autoRenewal: true,
      renewalReminder: "30 Days",
      expiryIn: null,
      contacts: {
        owner: "Hidden Owner",
        vendor: "Hidden Vendor Contact",
        vendorPhone: "1111111111",
        procurement: "Hidden Procurement",
        procurementPhone: "2222222222",
      },
      terms: {
        priceValidity: "Hidden price term",
        deliveryTerm: "FOB",
        warrantyPeriod: "Hidden warranty",
        slaUptime: "99%",
        penaltyClause: "Hidden penalty",
        governingLaw: "Hidden governing law",
      },
      details: {
        purpose: "Hidden contract purpose",
        billingModel: "Hidden billing model",
      },
    };
    const serialized = JSON.stringify([savedContract]);
    localStorage.setItem(storageKey, serialized);

    renderVendorContractsPage({ vendorId: "V-TEST", vendorName: "Test Vendor" });

    expect(screen.getByRole("heading", { name: "Contract Overview" })).toBeTruthy();
    expect(screen.queryByText("Secret Contract Title")).toBeNull();
    expect(screen.queryByText("Hidden contract purpose")).toBeNull();
    expect(screen.queryByText("Hidden Vendor Contact")).toBeNull();
    expect(screen.queryByRole("button", { name: "Contract actions" })).toBeNull();
    expect(localStorage.getItem(storageKey)).toBe(serialized);
  });

  it("shows the blank detail layout when a vendor has no saved contracts", () => {
    renderVendorContractsPage({ vendorId: "V-EMPTY", vendorName: "Empty Vendor" });

    expect(screen.getByRole("heading", { name: "Contract Overview" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "All Contracts" })).toBeNull();
  });
});
