import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import ManageUsersPanel from "../ManageUsersPanel";

const ROLE_UUID = "11111111-1111-4111-8111-111111111111";

describe("ManageUsersPanel invitation-based internal Add User flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const selectMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: ROLE_UUID,
          name: "Procurement Manager",
          department: "Procurement",
          description: "Manages procurement",
          status: "Active",
          is_system_owner: false,
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "System Owner",
          department: "Administration",
          description: "Protected owner",
          status: "Active",
          is_system_owner: true,
        },
      ],
      error: null,
    });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: selectMock,
    }));
    (supabase as unknown as { functions: { invoke: unknown } }).functions = {
      invoke: vi.fn().mockResolvedValue({
        data: {
          success: true,
          profile_id: "33333333-3333-4333-8333-333333333333",
          employee_id: "EMP-00001",
        },
        error: null,
      }),
    };
  });

  it("omits password field, shows Send Invitation Email, provisions via provision-internal-user, and supports Resend Invitation", async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ManageUsersPanel />
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText("Send Invitation Email")).toBeTruthy();
    });

    // No password input in Add User mode
    expect(screen.queryByPlaceholderText(/Min 6 characters/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Leave blank to keep current/i)).toBeNull();

    const checkbox = screen.getByRole("checkbox", {
      name: /Send Invitation Email/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), {
      target: { value: "Alice Tester" },
    });
    fireEvent.change(screen.getByPlaceholderText("jane@nidotech.com"), {
      target: { value: "alice@nidotech.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Procurement"), {
      target: { value: "Procurement" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Send Invitation & Add User/i }),
    );

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("provision-internal-user", {
        body: expect.objectContaining({
          email: "alice@nidotech.com",
          name: "Alice Tester",
          role_id: ROLE_UUID,
          department: "Procurement",
        }),
      });
    });

    const invokePayload = invokeMock.mock.calls[0][1].body;
    expect(invokePayload).not.toHaveProperty("password");

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.getAllByText("Invitation Sent").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /Resend Invitation/i }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "alice@nidotech.com",
        { redirectTo: `${window.location.origin}/onboarding` },
      );
    });

    // Resending must not call provision-internal-user a second time
    expect(invokeMock).toHaveBeenCalledTimes(1);
  }, 15000);
});
