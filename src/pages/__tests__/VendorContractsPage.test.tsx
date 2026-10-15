import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorContractsPage from "@/pages/VendorContractsPage";

function renderVendorContractsPage() {
  return render(
    <MemoryRouter>
      <VendorContractsPage />
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
});
