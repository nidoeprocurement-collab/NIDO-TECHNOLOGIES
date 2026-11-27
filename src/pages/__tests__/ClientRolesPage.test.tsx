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

import * as clientAccessApi from "@/lib/clientAccessApi";

const clientId = "client-role-module-test";

describe("client role module editor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("adds a sidebar module, lets the admin grant access, and saves it", { timeout: 15000 }, () => {
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
    const viewBtn = within(approvalsRow).getByRole("button", { name: "view Approvals" });
    if (viewBtn.getAttribute("aria-pressed") !== "true") {
      fireEvent.click(viewBtn);
    }
    fireEvent.click(within(approvalsRow).getByRole("button", { name: "create Approvals" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const savedRole = getPortalRoles(clientId).find(role => role.id === "limited-role");
    expect(savedRole?.permissions.find(permission => permission.module === "Approvals")?.view).toBe(true);
    expect(savedRole?.permissions.find(permission => permission.module === "Approvals")?.create).toBe(true);
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
    const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => { });
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });

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

describe("Supabase-backed client roles synchronization and editing", () => {
  const supabaseClientId = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
  const adminRoleId = "e9487641-0bb2-4858-b383-c8ebc8b55672";
  const viewerRoleId = "11111111-1111-4111-8111-111111111111";

  const catalogModules: clientAccessApi.SupabaseClientModule[] = [
    { module_key: "Dashboard", label: "Dashboard", description: "Dashboard" },
    { module_key: "Orders", label: "Orders", description: "Orders" },
    { module_key: "Approvals", label: "Approvals", description: "Approvals" },
  ];

  const baseAdminRole: clientAccessApi.SupabaseClientRole = {
    id: adminRoleId,
    client_id: supabaseClientId,
    name: "Client Admin",
    description: "Default full-access role",
    status: "Active",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("syncs once from Supabase without dispatching nidoPortalRolesUpdated and clears loading state", async () => {
    const updatedEvents = vi.fn();
    window.addEventListener("nidoPortalRolesUpdated", updatedEvents);

    const loadSpy = vi
      .spyOn(clientAccessApi, "loadClientAccessDataFromSupabase")
      .mockResolvedValue({
        roles: [baseAdminRole],
        users: [],
        permissionsByRoleId: {
          [adminRoleId]: { Dashboard: { view: true, manage: true } },
        },
        modules: catalogModules,
      });

    try {
      render(
        <MemoryRouter initialEntries={[`/clients/${supabaseClientId}/roles`]}>
          <Routes>
            <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Client Admin" })).toBeTruthy();
      });

      expect(screen.queryByText(/Syncing with Supabase/i)).toBeNull();
      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledWith(supabaseClientId);
      expect(updatedEvents).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("nidoPortalRolesUpdated", updatedEvents);
    }
  });

  it("clears loading state on failure, shows Retry, and recovers on retry", async () => {
    const loadSpy = vi
      .spyOn(clientAccessApi, "loadClientAccessDataFromSupabase")
      .mockRejectedValueOnce(new Error("Network timeout loading roles"))
      .mockResolvedValueOnce({
        roles: [baseAdminRole],
        users: [],
        permissionsByRoleId: {
          [adminRoleId]: { Dashboard: { view: true } },
        },
        modules: catalogModules,
      });

    render(
      <MemoryRouter initialEntries={[`/clients/${supabaseClientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Network timeout loading roles")).toBeTruthy();
    });
    expect(screen.queryByText(/Syncing with Supabase/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Client Admin" })).toBeTruthy();
    });
    expect(screen.queryByText("Network timeout loading roles")).toBeNull();
    expect(loadSpy).toHaveBeenCalledTimes(2);
  });

  it("creates, edits, adds/removes modules, saves permissions to Supabase, preserves Client Admin, and persists on reload", { timeout: 15000 }, async () => {
    let serverRoles: clientAccessApi.SupabaseClientRole[] = [baseAdminRole];
    let serverPerms: Record<string, Record<string, Record<string, boolean>>> = {
      [adminRoleId]: { Dashboard: { view: true, manage: true } },
    };

    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockImplementation(
      async () => ({
        roles: serverRoles.map((r) => ({ ...r })),
        users: [],
        permissionsByRoleId: JSON.parse(JSON.stringify(serverPerms)),
        modules: catalogModules,
      }),
    );

    const createSpy = vi
      .spyOn(clientAccessApi, "createClientRoleInSupabase")
      .mockImplementation(async (_cid, values) => {
        const created: clientAccessApi.SupabaseClientRole = {
          id: viewerRoleId,
          client_id: supabaseClientId,
          name: values.name,
          description: values.description,
          status: values.status,
        };
        serverRoles = [...serverRoles, created];
        serverPerms[viewerRoleId] = {};
        return created;
      });

    const updateSpy = vi
      .spyOn(clientAccessApi, "updateClientRoleInSupabase")
      .mockImplementation(async (_cid, rid, values) => {
        const updated: clientAccessApi.SupabaseClientRole = {
          id: rid,
          client_id: supabaseClientId,
          name: values.name,
          description: values.description,
          status: values.status,
        };
        serverRoles = serverRoles.map((r) => (r.id === rid ? updated : r));
        return updated;
      });

    const savePermsSpy = vi
      .spyOn(clientAccessApi, "saveClientRolePermissionsInSupabase")
      .mockImplementation(async (_cid, rid, perms) => {
        serverPerms[rid] = perms as Record<string, Record<string, boolean>>;
      });

    const { unmount } = render(
      <MemoryRouter initialEntries={[`/clients/${supabaseClientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Client Admin" })).toBeTruthy();
    });

    // Create new limited role
    fireEvent.click(screen.getByRole("button", { name: "Role and permission actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Role" }));
    fireEvent.change(screen.getByLabelText("New role name"), {
      target: { value: "Portal Viewer" },
    });
    fireEvent.change(screen.getByLabelText("New role description"), {
      target: { value: "Read-only portal user" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Role" }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(supabaseClientId, {
        name: "Portal Viewer",
        description: "Read-only portal user",
        status: "Active",
      });
    });

    // Edit role name, description, add Orders & Approvals, remove Approvals, set Orders permissions
    fireEvent.click(screen.getByRole("button", { name: "Edit role" }));
    fireEvent.change(screen.getByLabelText("Role name"), {
      target: { value: "Portal Buyer" },
    });
    fireEvent.change(screen.getByLabelText("Role description"), {
      target: { value: "Can create orders" },
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Orders" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Approvals" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));

    expect(screen.getByRole("row", { name: /Approvals/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Select modules/i }));
    const approvalsLabel = screen.getByText("Approvals", { selector: "span" });
    const approvalsDropdownRow = approvalsLabel.closest("div.cursor-pointer") as HTMLElement;
    const approvalsCheckbox = approvalsDropdownRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(approvalsCheckbox);
    expect(screen.queryByRole("row", { name: /Approvals/ })).toBeNull();

    const ordersRow = screen.getByRole("row", { name: /Orders/ });
    fireEvent.click(within(ordersRow).getByRole("button", { name: "create Orders" }));
    fireEvent.click(within(ordersRow).getByRole("button", { name: "export Orders" }));

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(supabaseClientId, viewerRoleId, {
        name: "Portal Buyer",
        description: "Can create orders",
        status: "Active",
      });
      expect(savePermsSpy).toHaveBeenCalledWith(supabaseClientId, viewerRoleId, {
        Orders: {
          view: true,
          create: true,
          edit: false,
          delete: false,
          approve: false,
          export: true,
          import: false,
          manage: false,
          configure: false,
        },
      });
    });

    // Client Admin remains untouched
    expect(serverPerms[adminRoleId]).toEqual({ Dashboard: { view: true, manage: true } });

    // Simulate page reload and verify persisted state from Supabase
    unmount();
    render(
      <MemoryRouter initialEntries={[`/clients/${supabaseClientId}/roles`]}>
        <Routes>
          <Route path="/clients/:id/roles" element={<ClientRolesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Portal Buyer/ })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /Portal Buyer/ }));
    expect(screen.getByText("Can create orders")).toBeTruthy();
    const persistedOrdersRow = screen.getByRole("row", { name: /Orders/ });
    expect(
      within(persistedOrdersRow).getByRole("button", { name: "create Orders" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(persistedOrdersRow).getByRole("button", { name: "export Orders" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
