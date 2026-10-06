import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ClientRolesPage from "@/pages/ClientRolesPage";
import {
  createPortalRolePermission,
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
});
