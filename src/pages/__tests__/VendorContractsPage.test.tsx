import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VendorContractsPage from "@/pages/VendorContractsPage";

describe("Vendor contract detail page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("edits contract sections in a dialog and updates the detail view", () => {
    render(<VendorContractsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Contract Overview" }));
    fireEvent.change(screen.getByLabelText("Contract Name"), {
      target: { value: "Updated Vendor Supply Agreement" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByRole("heading", { name: "Updated Vendor Supply Agreement" })).toBeTruthy();
  });

  it("offers contract download from the matching three-dot actions menu", () => {
    render(<VendorContractsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Contract actions" }));

    expect(screen.getByRole("button", { name: "Download Contract" })).toBeTruthy();
  });

  it("uses the client contract three-column shell while retaining vendor contract sections", () => {
    render(<VendorContractsPage />);

    const layout = screen.getByTestId("vendor-contract-layout-grid");
    expect(layout.className).toContain("xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]");
    expect(layout.children).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Contract Overview" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Contract Governance" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Commercial Terms" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Vendor Information" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Contacts" })).toBeTruthy();
    expect(screen.getAllByText("Rahul Sharma").length).toBeGreaterThan(0);
  });
});
