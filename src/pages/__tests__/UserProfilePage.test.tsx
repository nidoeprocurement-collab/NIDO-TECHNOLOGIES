import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserProfilePage from "@/pages/UserProfilePage";
import { getInvoices } from "@/lib/invoiceStore";

const mockFetchProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockRefreshAuthContext = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "beta@example.com",
      name: "Beta User",
      role: "Client Admin",
      userType: "client_admin",
      clientId: "client-beta",
      clientCode: "CL-99002",
      clientName: "Client Beta Org",
    },
    refreshAuthContext: mockRefreshAuthContext,
  }),
}));

vi.mock("@/lib/clientProfileApi", () => ({
  fetchMyClientProfile: (...args: unknown[]) => mockFetchProfile(...args),
  updateMyClientProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

describe("Phase 4.4 Client Profile & Empty Financial State", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockFetchProfile.mockResolvedValue({
      id: "cu-1",
      auth_user_id: "auth-1",
      name: "Beta User",
      email: "beta@example.com",
      phone: "+91 9000000000",
      designation: "Procurement Manager",
      department: "Operations",
      client_employee_code: "EMP-10",
      status: "active",
      user_type: "client_admin",
      last_login_at: null,
      client_id: "client-beta",
      organization_name: "Client Beta Org",
      client_code: "CL-99002",
      role_name: "Client Admin",
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders read-only organisation/email/role and updates permitted personal fields", async () => {
    mockUpdateProfile.mockResolvedValueOnce({
      id: "cu-1",
      auth_user_id: "auth-1",
      name: "Beta User Updated",
      email: "beta@example.com",
      phone: "+91 9111111111",
      designation: "VP Procurement",
      department: "Finance",
      client_employee_code: "EMP-10",
      status: "active",
      user_type: "client_admin",
      last_login_at: null,
      client_id: "client-beta",
      organization_name: "Client Beta Org",
      client_code: "CL-99002",
      role_name: "Client Admin",
    });

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Client Beta Org")).toBeTruthy();
    });
    expect(screen.getByText("beta@example.com")).toBeTruthy();
    expect(screen.getByText("Client Admin")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Display Name/i), {
      target: { value: "Beta User Updated" },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: "+91 9111111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: "Beta User Updated",
        phone: "+91 9111111111",
        designation: "Procurement Manager",
        department: "Operations",
      });
    });
    expect(await screen.findByText("Profile updated successfully.")).toBeTruthy();
  });

  it("returns empty array from invoiceStore when no persisted invoices exist", () => {
    expect(getInvoices()).toEqual([]);
  });
});

