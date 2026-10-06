import { beforeEach, describe, expect, it } from "vitest";
import {
  addPortalUser,
  createPortalRolePermission,
  findPortalUser,
  getPortalModuleForPath,
  getPortalRoles,
  hasPortalPermission,
  PORTAL_MODULES,
  provisionPortalUser,
  savePortalRoles,
  updatePortalUser,
  type PortalRole,
} from "@/lib/portalUserStore";

const clientId = "client-auth-test";

function seedUser(overrides: Partial<Parameters<typeof addPortalUser>[0]> = {}) {
  addPortalUser({
    id: "portal-client-auth-test-user",
    email: "user@example.com",
    password: "Correct@123",
    name: "Portal User",
    userType: "client_user",
    clientId,
    clientName: "Authentication Test Client",
    role: "Employee",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}

describe("client portal authentication", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("accepts a provisioned active user with normalized email input", () => {
    seedUser();

    expect(findPortalUser("  USER@EXAMPLE.COM ", "Correct@123")?.id).toBe(
      "portal-client-auth-test-user",
    );
  });

  it("rejects incorrect passwords, inactive users, and inactive roles", () => {
    seedUser();
    expect(findPortalUser("user@example.com", "Wrong@123")).toBeNull();

    updatePortalUser("portal-client-auth-test-user", { status: "inactive" });
    expect(findPortalUser("user@example.com", "Correct@123")).toBeNull();

    localStorage.clear();
    seedUser();
    const roles = getPortalRoles(clientId).map(role =>
      role.name === "Employee" ? { ...role, status: "inactive" as const } : role,
    );
    localStorage.setItem(`nido_portal_roles_${clientId}`, JSON.stringify(roles));
    expect(findPortalUser("user@example.com", "Correct@123")).toBeNull();
  });

  it("persists generated credentials so a newly provisioned user can sign in", () => {
    const credentials = provisionPortalUser(clientId, "Authentication Test Client", {
      email: "new.user@example.com",
      name: "New User",
      role: "Employee",
    });

    expect(findPortalUser(credentials.email, credentials.password)?.id).toBe(
      credentials.userId,
    );
  });

  it("keeps only granted modules on default roles and includes distinct sidebar modules", () => {
    const employee = getPortalRoles(clientId).find(role => role.name === "Employee");

    expect(employee?.permissions.map(permission => permission.module)).toContain("Approvals");
    expect(employee?.permissions.map(permission => permission.module)).toContain("My Profile");
    expect(employee?.permissions.map(permission => permission.module)).not.toContain("Invoices");
    expect(PORTAL_MODULES).toContain("Approvals");
    expect(PORTAL_MODULES).toContain("My Profile");
  });

  it("persists added modules, including a module with no permissions enabled yet", () => {
    const role: PortalRole = {
      id: "role-with-new-modules",
      name: "Module Test",
      description: "",
      status: "active",
      permissions: [
        createPortalRolePermission("Approvals"),
        createPortalRolePermission("My Profile", { view: true }),
      ],
    };

    savePortalRoles(clientId, [role]);
    const savedRole = getPortalRoles(clientId)[0];

    expect(savedRole.permissions.map(permission => permission.module)).toEqual(["Approvals", "My Profile"]);
    expect(hasPortalPermission(clientId, role.name, "Approvals", "view")).toBe(false);
    expect(hasPortalPermission(clientId, role.name, "My Profile", "view")).toBe(true);
  });

  it("migrates legacy sidebar permissions and removes empty scaffold rows", () => {
    const oldModules = PORTAL_MODULES.filter(module => module !== "Approvals" && module !== "My Profile");
    const legacyRole: PortalRole = {
      id: "legacy-role",
      name: "Legacy Employee",
      description: "",
      status: "active",
      permissions: oldModules.map(module => createPortalRolePermission(module, {
        view: module === "Dashboard" || module === "Orders",
      })),
    };
    localStorage.setItem(`nido_portal_roles_${clientId}`, JSON.stringify([legacyRole]));

    const migratedRole = getPortalRoles(clientId)[0];

    expect(migratedRole.permissions.map(permission => permission.module)).toEqual([
      "Dashboard",
      "Orders",
      "Approvals",
      "My Profile",
    ]);
    expect(hasPortalPermission(clientId, legacyRole.name, "Approvals", "view")).toBe(true);
    expect(hasPortalPermission(clientId, legacyRole.name, "My Profile", "view")).toBe(true);
  });

  it("resolves portal routes to the permission module used by the sidebar", () => {
    expect(getPortalModuleForPath("/portal/approvals")).toBe("Approvals");
    expect(getPortalModuleForPath("/portal/profile")).toBe("My Profile");
    expect(getPortalModuleForPath("/portal/my-services/requests/request-1")).toBe("Services");
    expect(getPortalModuleForPath("/portal/unmapped")).toBeNull();
  });
});