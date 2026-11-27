import {
  canStartImpersonation,
  endImpersonation,
  getImpersonationAudit,
  getImpersonationSession,
  startImpersonation,
} from "@/lib/impersonationStore";
import type { User } from "@/contexts/AuthContext";

const admin: User = {
  id: "admin-1",
  email: "admin@nidotech.com",
  name: "Mark Adams",
  role: "System Admin",
  userType: "nido_admin",
};

const procurementManager: User = {
  ...admin,
  id: "manager-1",
  role: "Procurement Manager",
};

const portalUser: User = {
  id: "portal-client-a-user",
  email: "john@client-a.com",
  name: "John Doe",
  role: "Client User",
  userType: "client_user",
  clientId: "client-a",
  clientName: "Client A",
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("impersonationStore", () => {
  it("requires explicit server permission and denies unauthorized internal roles or non-client targets", () => {
    expect(canStartImpersonation(admin, portalUser, true)).toBe(true);
    expect(canStartImpersonation(admin, portalUser, false)).toBe(false);
    expect(canStartImpersonation(procurementManager, portalUser)).toBe(false);
    expect(canStartImpersonation(admin, { ...portalUser, userType: "nido_admin" }, true)).toBe(false);
  });

  it("keeps browser-only impersonation disabled and creates no session in sessionStorage", () => {
    const session = startImpersonation(admin, portalUser, true);

    expect(session).toBeNull();
    expect(sessionStorage.getItem("nido_impersonation_session")).toBeNull();
    expect(localStorage.getItem("nido_impersonation_session")).toBeNull();
    expect(getImpersonationSession()).toBeNull();
  });

  it("invalidates leftover browser impersonation sessions while preserving existing audit history", () => {
    const existingAudit = [
      {
        eventType: "IMPERSONATION_STARTED",
        originalUserId: admin.id,
        impersonatedUserId: portalUser.id,
        clientId: "client-a",
        impersonationSessionId: "imp-legacy-1",
        timestamp: "2026-11-18T00:00:00.000Z",
        startedAt: "2026-11-18T00:00:00.000Z",
        mode: "VIEW_ONLY",
        status: "active",
      },
    ];
    localStorage.setItem("nido_impersonation_audit", JSON.stringify(existingAudit));
    sessionStorage.setItem(
      "nido_impersonation_session",
      JSON.stringify({
        id: "imp-legacy-1",
        originalUser: admin,
        impersonatedUser: portalUser,
        clientId: "client-a",
        mode: "VIEW_ONLY",
        startedAt: "2026-11-18T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z",
        status: "active",
      }),
    );

    expect(getImpersonationSession()).toBeNull();
    expect(sessionStorage.getItem("nido_impersonation_session")).toBeNull();

    endImpersonation();
    const audit = getImpersonationAudit();
    expect(audit.some((entry) => entry.impersonationSessionId === "imp-legacy-1" && entry.eventType === "IMPERSONATION_STARTED")).toBe(true);
    expect(audit.some((entry) => entry.impersonationSessionId === "imp-legacy-1" && entry.eventType === "IMPERSONATION_ENDED")).toBe(true);
  });
});
