import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ClientDetailPageRedesigned from "@/pages/ClientDetailPageRedesigned";
import * as clientOrganizationsApi from "@/lib/clientOrganizationsApi";
import * as clientAccessApi from "@/lib/clientAccessApi";
import { addClient } from "@/lib/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/PermissionsContext", () => ({
  usePermissions: vi.fn(),
}));

describe("ClientDetailPageRedesigned Supabase portal integration", () => {
  const clientAId = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
  const clientBId = "d15533db-4e9a-42d3-957e-2bf06b3c4b68";

  const mockOrgA = {
    id: clientAId,
    clientCode: "CL-00001",
    name: "Suraj Technologie",
    category: "Enterprise",
    tier: "Gold",
    rep: "Suraj",
    email: "nidotechnologies@gmail.com",
    status: "Active" as const,
  };

  function setupAuth(options?: {
    clientId?: string;
    userType?: "nido_admin" | "client_admin" | "client_user";
    permittedModules?: string[];
  }) {
    const allowed = new Set(
      options?.permittedModules ?? [
        "Dashboard",
        "Overview - Total Orders",
        "Overview - Total Spent",
        "Overview - Products",
        "Overview - Invoices",
        "Overview - Open Support Tickets",
        "Company Information",
        "Orders Overview",
        "Account Summary",
      ],
    );

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "cu-1",
        email: "pavannido+client1@gmail.com",
        name: "Pavan",
        userType: options?.userType ?? "client_user",
        clientId: options?.clientId ?? clientAId,
        clientName: "Suraj Technologie",
      },
      hasClientPortalPermission: (moduleKey: string, action = "view") =>
        action === "view" && allowed.has(moduleKey),
    } as never);

    vi.mocked(usePermissions).mockReturnValue({
      hasRoutePermission: () => true,
      hasPermission: () => true,
      getModulePermissions: () => ({}),
      isSuperAdmin: false,
      roleName: "Procurement",
    } as never);
  }

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    setupAuth();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("1-3. loads client organization and portal users from Supabase on a clean browser with empty localStorage", async () => {
    const orgSpy = vi
      .spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase")
      .mockResolvedValue(mockOrgA);
    const accessSpy = vi
      .spyOn(clientAccessApi, "loadClientAccessDataFromSupabase")
      .mockResolvedValue({
        roles: [],
        users: [
          {
            id: "cu-1",
            auth_user_id: "auth-1",
            client_id: clientAId,
            client_employee_code: "EMP-1",
            user_type: "client_user",
            client_role_id: "role-1",
            role_name: "Procurement",
            name: "Pavan",
            email: "pavannido+client1@gmail.com",
            phone: "9876543210",
            department: "Ops",
            designation: "Buyer",
            status: "Active",
          },
        ],
        permissionsByRoleId: {},
        modules: [],
      });

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <Routes>
          <Route path="/portal/dashboard" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Pavan!/i)).toBeTruthy();
    });

    expect(orgSpy).toHaveBeenCalledTimes(1);
    expect(orgSpy).toHaveBeenCalledWith(clientAId);
    expect(accessSpy).toHaveBeenCalledWith(clientAId);
    expect(screen.getByText("Suraj Technologie")).toBeTruthy();
    expect(screen.getByText("pavannido+client1@gmail.com")).toBeTruthy();
  });

  it("4. prevents Client A from retrieving Client B data via URL params and handles RLS denial cleanly", async () => {
    const orgSpy = vi
      .spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase")
      .mockImplementation(async (id) => (id === clientAId ? mockOrgA : null));
    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    render(
      <MemoryRouter initialEntries={[`/clients/${clientBId}`]}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Suraj Technologie")).toBeTruthy();
    });
    expect(orgSpy).toHaveBeenCalledWith(clientAId);
    expect(orgSpy).not.toHaveBeenCalledWith(clientBId);

    cleanup();

    // Non-portal route when RLS returns null for Client B
    render(
      <MemoryRouter initialEntries={[`/clients/${clientBId}`]}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPageRedesigned />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeTruthy();
    });
  });

  it("5-6. enforces dashboard widget permissions and hides unauthorized modules", async () => {
    setupAuth({
      permittedModules: ["Dashboard", "Overview - Total Orders"],
    });
    vi.spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase").mockResolvedValue(
      mockOrgA,
    );
    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <Routes>
          <Route path="/portal/dashboard" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Total Orders").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Total Spent")).toBeNull();
    expect(screen.queryByText("Company Information")).toBeNull();
    expect(screen.queryByText("Account Summary")).toBeNull();
  });

  it("7. does not leak stale localStorage orders for Supabase UUID clients", async () => {
    localStorage.setItem(
      "nido_client_orders_v1",
      JSON.stringify({
        [clientAId]: [
          {
            id: "LOCAL-ORD-999",
            clientId: clientAId,
            date: "2026-11-20",
            status: "Delivered",
            amountNum: 5000,
            items: [],
          },
        ],
      }),
    );

    vi.spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase").mockResolvedValue(
      mockOrgA,
    );
    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <Routes>
          <Route path="/portal/dashboard" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Total Orders").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("LOCAL-ORD-999")).toBeNull();
  });

  it("8. displays loading state and Retry recovery when Supabase fails", async () => {
    const orgSpy = vi
      .spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase")
      .mockRejectedValueOnce(new Error("Supabase connection failed"))
      .mockResolvedValueOnce(mockOrgA);
    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <Routes>
          <Route path="/portal/dashboard" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading client dashboard...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Unable to load client dashboard")).toBeTruthy();
      expect(screen.getByText("Supabase connection failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText("Suraj Technologie")).toBeTruthy();
    });
    expect(orgSpy).toHaveBeenCalledTimes(2);
  });

  it("9. preserves legacy localStorage behavior for non-UUID client IDs", async () => {
    const legacyId = "CLT-001";
    addClient({
      id: legacyId,
      name: "Legacy Acme Corp",
      status: "Active",
    });
    setupAuth({ clientId: legacyId });
    const orgSpy = vi.spyOn(clientOrganizationsApi, "loadClientOrganizationByIdFromSupabase");

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <Routes>
          <Route path="/portal/dashboard" element={<ClientDetailPageRedesigned portalMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Legacy Acme Corp")).toBeTruthy();
    });
    expect(orgSpy).not.toHaveBeenCalled();
  });
});

