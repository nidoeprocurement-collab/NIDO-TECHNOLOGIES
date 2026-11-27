import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminOnlyRoute } from "@/App";
import ClientDetailPageRedesigned from "@/pages/ClientDetailPageRedesigned";
import * as clientOrganizationsApi from "@/lib/clientOrganizationsApi";
import * as clientAccessApi from "@/lib/clientAccessApi";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/PermissionsContext", () => ({
  PermissionsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePermissions: vi.fn(),
}));

describe("AdminOnlyRoute client portal route protection", () => {
  const clientAId = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
  const clientBId = "d15533db-4e9a-42d3-957e-2bf06b3c4b68";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isClientPortalUser: true,
      isNidoAdmin: false,
      isLoading: false,
      user: {
        id: "cu-a",
        email: "pavannido+client1@gmail.com",
        name: "Pavan",
        userType: "client_user",
        clientId: clientAId,
        clientName: "Suraj Technologie",
      },
      hasClientPortalPermission: () => true,
    } as never);
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: () => false,
      hasRoutePermission: () => false,
      getModulePermissions: () => ({}),
      isSuperAdmin: false,
      roleName: "",
    });
  });

  it("redirects a client portal user navigating to /clients/<other-client-id> to /portal/dashboard and scopes queries to own clientId", async () => {
    const orgSpy = vi
      .spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase")
      .mockResolvedValue({
        id: clientAId,
        clientCode: "CL-00001",
        name: "Suraj Technologie",
        status: "Active",
      });
    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    render(
      <MemoryRouter initialEntries={[`/clients/${clientBId}`]}>
        <Routes>
          <Route
            path="/clients/:id"
            element={
              <AdminOnlyRoute>
                <div data-testid="admin-client-detail">Admin Client Detail</div>
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/portal/dashboard"
            element={<ClientDetailPageRedesigned portalMode />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Suraj Technologie")).toBeTruthy();
    });

    expect(screen.queryByTestId("admin-client-detail")).toBeNull();
    expect(orgSpy).toHaveBeenCalledWith(clientAId);
    expect(orgSpy).not.toHaveBeenCalledWith(clientBId);
  });
});
