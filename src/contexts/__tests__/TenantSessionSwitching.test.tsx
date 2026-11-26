import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionsProvider, usePermissions } from "@/contexts/PermissionsContext";
import ClientDetailPageRedesigned from "@/pages/ClientDetailPageRedesigned";
import * as clientOrganizationsApi from "@/lib/clientOrganizationsApi";
import * as clientAccessApi from "@/lib/clientAccessApi";
import { supabase } from "@/lib/supabase";

const CLIENT_A_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
const CLIENT_B_ID = "d15533db-4e9a-42d3-957e-2bf06b3c4b68";

function SessionHarness() {
  const {
    user,
    authContext,
    impersonationSession,
    signInWithPassword,
    logout,
    hasClientPortalPermission,
  } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <div>
      <button
        type="button"
        onClick={() => void signInWithPassword("pavannido+client1@gmail.com", "pass-a")}
      >
        Login Client A
      </button>
      <button
        type="button"
        onClick={() => void signInWithPassword("clientb@beta-corp.example", "pass-b")}
      >
        Login Client B
      </button>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
      <div data-testid="user-client-id">{user?.clientId ?? "none"}</div>
      <div data-testid="user-client-name">{user?.clientName ?? "none"}</div>
      <div data-testid="ctx-client-id">{authContext?.profile?.client_id ?? "none"}</div>
      <div data-testid="impersonation-state">
        {impersonationSession ? "active" : "none"}
      </div>
      <div data-testid="perm-orders">
        {String(hasClientPortalPermission("Overview - Total Orders", "view"))}
      </div>
      <div data-testid="perm-spent">
        {String(hasClientPortalPermission("Overview - Total Spent", "view"))}
      </div>
      <div data-testid="internal-clients-perm">
        {String(hasPermission("clients", "view"))}
      </div>
    </div>
  );
}

describe("Tenant isolation: Client A -> logout -> Client B session switching", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("clears Client A state and storage on logout and loads only Client B context on subsequent login", async () => {
    let activeTenant: "none" | "A" | "B" = "none";

    const sessionA = {
      access_token: "token-a",
      user: { id: "auth-a", email: "pavannido+client1@gmail.com" },
    } as unknown as Session;
    const sessionB = {
      access_token: "token-b",
      user: { id: "auth-b", email: "clientb@beta-corp.example" },
    } as unknown as Session;

    vi.mocked(supabase.auth.getSession).mockImplementation(async () => ({
      data: {
        session:
          activeTenant === "A" ? sessionA : activeTenant === "B" ? sessionB : null,
      },
      error: null,
    }));

    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(async ({ email }) => {
      if (email === "pavannido+client1@gmail.com") {
        activeTenant = "A";
        return { data: { session: sessionA, user: sessionA.user }, error: null } as never;
      }
      activeTenant = "B";
      return { data: { session: sessionB, user: sessionB.user }, error: null } as never;
    });

    vi.mocked(supabase.auth.signOut).mockImplementation(async () => {
      activeTenant = "none";
      return { error: null };
    });

    vi.mocked(supabase.rpc).mockImplementation(async (fnName) => {
      if (fnName !== "get_my_auth_context") {
        return { data: null, error: null } as never;
      }
      if (activeTenant === "A") {
        return {
          data: {
            authenticated: true,
            user_scope: "client_portal",
            effective_admin_scope: false,
            profile: {
              id: "cu-a",
              client_id: CLIENT_A_ID,
              client_name: "Suraj Technologie",
              user_type: "client_user",
              name: "Pavan",
              email: "pavannido+client1@gmail.com",
            },
            role: { id: "role-a", name: "Procurement" },
            permissions: {
              Dashboard: { view: true },
              "Overview - Total Orders": { view: true },
            },
          },
          error: null,
        } as never;
      }
      if (activeTenant === "B") {
        return {
          data: {
            authenticated: true,
            user_scope: "client_portal",
            effective_admin_scope: false,
            profile: {
              id: "cu-b",
              client_id: CLIENT_B_ID,
              client_name: "Beta Corp",
              user_type: "client_user",
              name: "Bella",
              email: "clientb@beta-corp.example",
            },
            role: { id: "role-b", name: "Finance" },
            permissions: {
              Dashboard: { view: true },
              "Overview - Total Spent": { view: true },
            },
          },
          error: null,
        } as never;
      }
      return {
        data: { authenticated: false, reason: "unauthenticated" },
        error: null,
      } as never;
    });

    vi.spyOn(
      clientOrganizationsApi,
      "loadClientOrganizationByIdFromSupabase",
    ).mockImplementation(async (id) => {
      if (id === CLIENT_A_ID) {
        return {
          id: CLIENT_A_ID,
          clientCode: "CL-00001",
          name: "Suraj Technologie",
          status: "Active",
        };
      }
      if (id === CLIENT_B_ID) {
        return {
          id: CLIENT_B_ID,
          clientCode: "CL-00002",
          name: "Beta Corp",
          status: "Active",
        };
      }
      return null;
    });

    vi.spyOn(clientAccessApi, "loadClientAccessDataFromSupabase").mockResolvedValue({
      roles: [],
      users: [],
      permissionsByRoleId: {},
      modules: [],
    });

    // Seed legacy storage to verify cleanup on login/logout
    localStorage.setItem("nido_user", JSON.stringify({ id: "stale", clientId: CLIENT_A_ID }));

    render(
      <MemoryRouter initialEntries={["/portal/dashboard"]}>
        <AuthProvider>
          <PermissionsProvider>
            <SessionHarness />
            <Routes>
              <Route
                path="/portal/dashboard"
                element={<ClientDetailPageRedesigned portalMode />}
              />
            </Routes>
          </PermissionsProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    // 1. Login as Client A
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Login Client A" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-client-id").textContent).toBe(CLIENT_A_ID);
      expect(screen.getByText("Suraj Technologie")).toBeTruthy();
    });
    expect(screen.getByTestId("ctx-client-id").textContent).toBe(CLIENT_A_ID);
    expect(screen.getByTestId("perm-orders").textContent).toBe("true");
    expect(screen.getByTestId("perm-spent").textContent).toBe("false");
    expect(screen.getByTestId("internal-clients-perm").textContent).toBe("false");
    expect(localStorage.getItem("nido_user")).toBeNull();

    // 2. Logout Client A
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-client-id").textContent).toBe("none");
      expect(screen.getByTestId("ctx-client-id").textContent).toBe("none");
    });
    expect(screen.getByTestId("impersonation-state").textContent).toBe("none");
    expect(localStorage.getItem("nido_user")).toBeNull();
    expect(localStorage.getItem("nido_auth_user")).toBeNull();
    expect(localStorage.getItem("nido_impersonation_v1")).toBeNull();

    // 3. Login as Client B
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Login Client B" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-client-id").textContent).toBe(CLIENT_B_ID);
      expect(screen.getByText("Beta Corp")).toBeTruthy();
    });
    expect(screen.getByTestId("ctx-client-id").textContent).toBe(CLIENT_B_ID);
    expect(screen.getByTestId("user-client-name").textContent).toBe("Beta Corp");
    expect(screen.getByTestId("impersonation-state").textContent).toBe("none");
    expect(screen.getByTestId("perm-orders").textContent).toBe("false");
    expect(screen.getByTestId("perm-spent").textContent).toBe("true");
    expect(screen.getByTestId("internal-clients-perm").textContent).toBe("false");
    expect(screen.queryByText("Suraj Technologie")).toBeNull();
    expect(localStorage.getItem("nido_auth_user")).toBe(JSON.stringify({ id: "cu-b" }));
  });
});
