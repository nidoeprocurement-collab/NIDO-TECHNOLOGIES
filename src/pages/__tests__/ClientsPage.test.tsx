import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ClientsPage from "@/pages/ClientsPage";
import * as clientOrganizationsApi from "@/lib/clientOrganizationsApi";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/PermissionsContext", () => ({
  usePermissions: vi.fn(),
}));

describe("ClientsPage Client ID display", () => {
  const clientUuid = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      authContext: { user_scope: "nido_internal" },
    } as never);
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: () => true,
      hasRoutePermission: () => true,
      getModulePermissions: () => ({ view: true }),
      isSuperAdmin: true,
      roleName: "System Owner",
    });
  });

  it("displays human-readable client_code (CL-00001) instead of UUID while navigating by UUID", async () => {
    vi.spyOn(
      clientOrganizationsApi,
      "loadClientOrganizationsFromSupabase",
    ).mockResolvedValue([
      {
        id: clientUuid,
        clientCode: "CL-00001",
        name: "Suraj Technologie",
        category: "Enterprise",
        tier: "Gold",
        rep: "Suraj",
        email: "nidotechnologies@gmail.com",
        status: "Active",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/clients"]}>
        <Routes>
          <Route path="/clients" element={<ClientsPage />} />
          <Route
            path="/clients/:id"
            element={<div data-testid="navigated-uuid">Detail Route</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("CL-00001")).toBeTruthy();
    });

    expect(screen.queryByText(clientUuid)).toBeNull();

    fireEvent.click(screen.getByText("CL-00001"));
    await waitFor(() => {
      expect(screen.getByTestId("navigated-uuid")).toBeTruthy();
    });
  });
});
