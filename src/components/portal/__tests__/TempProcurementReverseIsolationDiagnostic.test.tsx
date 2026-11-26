import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TempProcurementReverseIsolationDiagnostic from "@/components/portal/TempProcurementReverseIsolationDiagnostic";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const SURAJ_TECH_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
const BETA_CORP_ID = "383a71f8-1d78-4454-8c5b-631374e3cac0";

describe("TempProcurementReverseIsolationDiagnostic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockSurajProcurementAuth() {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isImpersonating: false,
      user: {
        id: "cu-proc-1",
        email: "pavannido+client1@gmail.com",
        name: "Pavan",
        userType: "client_user",
        clientId: SURAJ_TECH_ID,
        role: "Procurement",
      },
    } as never);
  }

  function mockSupabase(
    rpcResponse: { data: unknown; error: unknown; status?: number },
    queryResponse?: { data: unknown; error: unknown; status: number },
  ) {
    vi.mocked(supabase.rpc).mockResolvedValueOnce(rpcResponse as never);
    const eqMock = vi.fn().mockResolvedValue(
      queryResponse ?? { data: [], error: null, status: 200 },
    );
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ select: selectMock }));
    (supabase as unknown as { from: unknown }).from = fromMock;
    return { fromMock, selectMock, eqMock };
  }

  it("is hidden for Beta Corp Viewer, Client Admin, internal NIDO users, and impersonation", () => {
    const nonMatching = [
      { isAuthenticated: true, isImpersonating: false, user: { userType: "client_user", clientId: BETA_CORP_ID, role: "Viewer" } },
      { isAuthenticated: true, isImpersonating: false, user: { userType: "client_admin", clientId: SURAJ_TECH_ID, role: "Client Admin" } },
      { isAuthenticated: true, isImpersonating: false, user: { userType: "nido_admin", role: "System Owner" } },
      { isAuthenticated: true, isImpersonating: true, user: { userType: "client_user", clientId: SURAJ_TECH_ID, role: "Procurement" } },
      { isAuthenticated: false, isImpersonating: false, user: null },
    ];

    for (const authState of nonMatching) {
      vi.mocked(useAuth).mockReturnValue(authState as never);
      const { container } = render(<TempProcurementReverseIsolationDiagnostic />);
      expect(container.firstChild).toBeNull();
    }
  });

  it("verifies get_my_auth_context and reports PASS when 0 Beta Corp rows are returned", async () => {
    mockSurajProcurementAuth();
    const { fromMock, selectMock, eqMock } = mockSupabase(
      {
        data: {
          authenticated: true,
          user_scope: "client_portal",
          profile: { client_id: SURAJ_TECH_ID, user_type: "client_user" },
          role: { name: "Procurement" },
        },
        error: null,
        status: 200,
      },
      { data: [], error: null, status: 200 },
    );

    render(<TempProcurementReverseIsolationDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Run Reverse Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("PASS")).toBeTruthy();
    });

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_auth_context");
    expect(fromMock).toHaveBeenCalledWith("client_organizations");
    expect(selectMock).toHaveBeenCalledWith("id, client_code");
    expect(eqMock).toHaveBeenCalledWith("id", BETA_CORP_ID);
    expect(screen.getByText("HTTP 200")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("reports FAIL without exposing row data if Beta Corp row is returned", async () => {
    mockSurajProcurementAuth();
    mockSupabase(
      {
        data: {
          authenticated: true,
          user_scope: "client_portal",
          profile: { client_id: SURAJ_TECH_ID, user_type: "client_user" },
          role: { name: "Procurement" },
        },
        error: null,
        status: 200,
      },
      { data: [{ id: BETA_CORP_ID, client_code: "CL-00002" }], error: null, status: 200 },
    );

    render(<TempProcurementReverseIsolationDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Run Reverse Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("FAIL")).toBeTruthy();
    });

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("CL-00002")).toBeNull();
  });

  it("reports ERROR when get_my_auth_context fails or query errors", async () => {
    mockSurajProcurementAuth();
    const { fromMock } = mockSupabase({
      data: { authenticated: false },
      error: { message: "context failed", code: "42501" },
      status: 401,
    });

    render(<TempProcurementReverseIsolationDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Run Reverse Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("ERROR")).toBeTruthy();
    });

    expect(fromMock).not.toHaveBeenCalled();
    expect(screen.queryByText("PASS")).toBeNull();
    expect(screen.getByText("HTTP 401 (42501)")).toBeTruthy();
  });
});
