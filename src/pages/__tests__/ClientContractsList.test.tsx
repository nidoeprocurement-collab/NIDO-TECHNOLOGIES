import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ClientContractsList from "@/pages/ClientContractsList";
import { getClientContracts } from "@/lib/clientDataStore";

describe("ClientContractsList", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("creates a contract with its ID, name, and contract dates", () => {
    const onCreated = vi.fn();
    render(
      <ClientContractsList
        clientId="client-contract-list-test"
        clientName="Acme"
        contracts={[]}
        onOpenContract={vi.fn()}
        onCreated={onCreated}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Contract" }));
    fireEvent.change(screen.getByLabelText("Contract ID"), { target: { value: "ACME-2026" } });
    fireEvent.change(screen.getByLabelText("Contract name"), { target: { value: "Managed Services" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2027-10-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Contract" }));

    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({
      clientId: "client-contract-list-test",
      contractId: "ACME-2026",
      contractTitle: "Managed Services",
      startDate: "2026-11-01",
      endDate: "2027-10-31",
    }));
    expect(getClientContracts("client-contract-list-test")).toHaveLength(1);
  });

  it("opens the existing overview when a contract ID is selected", () => {
    const onOpenContract = vi.fn();
    render(
      <ClientContractsList
        clientId="client-contract-list-test"
        clientName="Acme"
        contracts={[{
          clientId: "client-contract-list-test",
          contractId: "ACME-2026",
          contractTitle: "Managed Services",
          startDate: "2026-11-01",
          endDate: "2027-10-31",
          data: {},
          updatedAt: "2026-10-20T00:00:00.000Z",
        }]}
        onOpenContract={onOpenContract}
        onCreated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ACME-2026" }));

    expect(onOpenContract).toHaveBeenCalledWith("ACME-2026");
  });
});
