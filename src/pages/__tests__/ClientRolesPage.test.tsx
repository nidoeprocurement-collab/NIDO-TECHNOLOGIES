import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ClientRolesPage from "@/pages/ClientRolesPage";
import {
  createPortalRolePermission,
  addPortalUser,
  getPortalRoles,
  hasPortalPermission,
  savePortalRoles,
} from "@/lib/portalUserStore";

const clientId = "client-role-module-test";

describe("client role module editor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("adds a sidebar module, lets the admin grant access, and saves it", () => {
    savePortalRoles(clientId, [{
      id: "limited-role",
      name: "Limited Role",
      description: "",
      status: "active",
      permissions: [createPortalRolePermission("Dashboard", { view: true })],
    }]);

    render(
      <MemoryRouter initialEntries={[`/clients/${clientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit role" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Approvals" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));

    const approvalsRow = screen.getByRole("row", { name: /Approvals/ });
    fireEvent.click(within(approvalsRow).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const savedRole = getPortalRoles(clientId).find(role => role.id === "limited-role");
    expect(savedRole?.permissions.find(permission => permission.module === "Approvals")?.view).toBe(true);
    expect(hasPortalPermission(clientId, "Limited Role", "Approvals", "view")).toBe(true);
  });

  it("shows only saved roles and refreshes assigned-user counts from live client users", async () => {
    render(
      <MemoryRouter initialEntries={[`/clients/${clientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("No roles configured")).toBeTruthy();
    expect(screen.queryByText("Procurement Manager")).toBeNull();

    act(() => savePortalRoles(clientId, [{
      id: "actual-role",
      name: "Actual Role",
      description: "Read from this client's saved role data",
      status: "active",
      permissions: [createPortalRolePermission("Dashboard", { view: true })],
    }]));
    const roleButton = () => screen.getByRole("button", { name: /Actual Role/ });
    await waitFor(() => expect(within(roleButton()).getByText(/0\s+assigned users/)).toBeTruthy());

    act(() => addPortalUser({
      id: "actual-client-user",
      email: "person@example.com",
      password: "not-used",
      name: "Actual Person",
      userType: "client_user",
      clientId,
      clientName: "Role Test Client",
      role: "Actual Role",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    await waitFor(() => expect(within(roleButton()).getByText(/1\s+assigned user$/)).toBeTruthy());
  });

  it("downloads an empty CSV template with only header columns from the 3-dot menu", async () => {
    let capturedBlob: Blob | undefined;
    const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockImplementation((obj: Blob | MediaSource) => {
      if (obj instanceof Blob) capturedBlob = obj;
      return "blob:mock-template-url";
    });
    const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    try {
      render(
        <MemoryRouter initialEntries={[`/clients/${clientId}/roles`]}>
          <Routes>
            <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Role and permission actions" }));
      fireEvent.click(screen.getByRole("button", { name: "Download Template" }));

      expect(capturedBlob).toBeDefined();
      const csvText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(capturedBlob!);
      });
      const lines = csvText.trim().split(/\r?\n/);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe("role_name,description,status,module,module_description,view,create,edit,delete,approve,export,import,manage,configure");
    } finally {
      createObjectUrlSpy.mockRestore();
      revokeObjectUrlSpy.mockRestore();
      anchorClickSpy.mockRestore();
    }
  });

  it("bulk uploads a CSV matching the downloaded template format and persists roles and permissions", async () => {
    render(
      <MemoryRouter initialEntries={[`/clients/${clientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const csvContent = [
      "\uFEFFrole_name,description,status,module,module_description,view,create,edit,delete,approve,export,import,manage,configure",
      "Procurement Manager,Approves purchase orders,Active,Dashboard,View dashboard,true,false,false,false,false,false,false,false,false",
      "Procurement Manager,Approves purchase orders,Active,Orders,Manage orders,true,true,true,false,true,true,false,false,false",
      ",,,Approvals,,yes,0,false,false,1,false,false,false,false",
      "Read Only Auditor,Reviews invoices only,Active,Invoices,,false,false,false,false,false,false,false,false,false",
    ].join("\r\n");

    fireEvent.click(screen.getByRole("button", { name: "Role and permission actions" }));

    const file = new File([csvContent], "client-role-permissions-template.csv", { type: "text/csv" });
    const fileInput = screen.getByLabelText("Bulk Upload CSV") as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const roles = getPortalRoles(clientId);
      expect(roles).toHaveLength(2);
    });

    const savedRoles = getPortalRoles(clientId);
    const procurementRole = savedRoles.find(r => r.name === "Procurement Manager");
    expect(procurementRole).toBeDefined();
    expect(procurementRole?.status).toBe("active");
    expect(procurementRole?.description).toBe("Approves purchase orders");
    expect(procurementRole?.permissions).toHaveLength(3);
    expect(hasPortalPermission(clientId, "Procurement Manager", "Orders", "approve")).toBe(true);
    expect(hasPortalPermission(clientId, "Procurement Manager", "Approvals", "view")).toBe(true);
    expect(hasPortalPermission(clientId, "Procurement Manager", "Approvals", "approve")).toBe(true);

    const auditorRole = savedRoles.find(r => r.name === "Read Only Auditor");
    expect(auditorRole).toBeDefined();
    expect(auditorRole?.permissions.map(p => p.module)).toEqual(["Invoices"]);
  });
});
