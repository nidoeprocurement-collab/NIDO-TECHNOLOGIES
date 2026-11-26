import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TempViewerIsolationDiagnostic from "@/components/portal/TempViewerIsolationDiagnostic";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const BETA_CORP_ID = "383a71f8-1d78-4454-8c5b-631374e3cac0";
const SURAJ_TECH_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";

describe("TempViewerIsolationDiagnostic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockSupabaseQuery(response: { data: unknown; error: unknown; status: number }) {
    const eqMock = vi.fn().mockResolvedValue(response);
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ select: selectMock }));
    (supabase as unknown as { from: unknown }).from = fromMock;
    return { fromMock, selectMock, eqMock };
  }

  it("is hidden for Client Admin, internal NIDO users, other tenants, and impersonation sessions", () => {
    const unauthorizedProfiles = [
      { isAuthenticated: true, isImpersonating: false, user: { userType: "client_admin", clientId: BETA_CORP_ID, role: "Client Admin" } },
      { isAuthenticated: true, isImpersonating: false, user: { userType: "nido_admin", role: "System Owner" } },
      { isAuthenticated: true, isImpersonating: false, user: { userType: "client_user", clientId: SURAJ_TECH_ID, role: "Viewer" } },
      { isAuthenticated: true, isImpersonating: true, user: { userType: "client_user", clientId: BETA_CORP_ID, role: "Viewer" } },
      { isAuthenticated: false, isImpersonating: false, user: null },
    ];

    for (const authState of unauthorizedProfiles) {
      vi.mocked(useAuth).mockReturnValue(authState as never);
      const { container } = render(<TempViewerIsolationDiagnostic />);
      expect(container.firstChild).toBeNull();
    }
  });

  it("renders for Beta Corp Viewer and reports PASS when 0 rows are returned", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isImpersonating: false,
      user: {
        id: "viewer-1",
        email: "drpraveengojanur@gmail.com",
        name: "Viewer",
        userType: "client_user",
        clientId: BETA_CORP_ID,
        role: "Viewer",
      },
    } as never);

    const { fromMock, selectMock, eqMock } = mockSupabaseQuery({
      data: [],
      error: null,
      status: 200,
    });

    render(<TempViewerIsolationDiagnostic />);

    expect(
      screen.getByText("Temporary Security Diagnostic – Viewer Tenant Isolation"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Run Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("PASS")).toBeTruthy();
    });

    expect(fromMock).toHaveBeenCalledWith("client_organizations");
    expect(selectMock).toHaveBeenCalledWith("id, client_code");
    expect(eqMock).toHaveBeenCalledWith("id", SURAJ_TECH_ID);
    expect(screen.getByText("HTTP 200")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("reports FAIL without exposing row details if another tenant row is returned", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isImpersonating: false,
      user: {
        id: "viewer-1",
        email: "drpraveengojanur@gmail.com",
        name: "Viewer",
        userType: "client_user",
        clientId: BETA_CORP_ID,
        role: "Viewer",
      },
    } as never);

    mockSupabaseQuery({
      data: [{ id: SURAJ_TECH_ID, client_code: "CL-00001" }],
      error: null,
      status: 200,
    });

    render(<TempViewerIsolationDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Run Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("FAIL")).toBeTruthy();
    });

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("CL-00001")).toBeNull();
  });

  it("reports ERROR and never PASS when Supabase returns an error", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isImpersonating: false,
      user: {
        id: "viewer-1",
        email: "drpraveengojanur@gmail.com",
        name: "Viewer",
        userType: "client_user",
        clientId: BETA_CORP_ID,
        role: "Viewer",
      },
    } as never);

    mockSupabaseQuery({
      data: null,
      error: { message: "permission denied", code: "42501" },
      status: 403,
    });

    render(<TempViewerIsolationDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Run Tenant Isolation Test" }));

    await waitFor(() => {
      expect(screen.getByText("ERROR")).toBeTruthy();
    });

    expect(screen.queryByText("PASS")).toBeNull();
    expect(screen.getByText("HTTP 403 (42501)")).toBeTruthy();
  });
});
