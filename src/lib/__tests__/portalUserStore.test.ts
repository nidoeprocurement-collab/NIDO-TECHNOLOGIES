import { beforeEach, describe, expect, it } from "vitest";
import {
  addPortalUser,
  findPortalUser,
  getPortalRoles,
  provisionPortalUser,
  updatePortalUser,
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
});