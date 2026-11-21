import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { supabase } from "@/lib/supabase";
import ResetPasswordPage from "../ResetPasswordPage";

function renderResetPage(initialPath = "/reset-password") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <ConfigProvider>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage mode="reset" />} />
            <Route path="/forgot-password" element={<ResetPasswordPage mode="request" />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage recovery flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/reset-password");
    vi.clearAllMocks();
  });

  it("denies normal authenticated sessions when no recovery flow is active", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u-1" } } as Session },
      error: null,
    });

    renderResetPage("/reset-password");

    await waitFor(() => {
      expect(screen.getByText("Recovery Link Expired")).toBeTruthy();
    });
    expect(screen.queryByText("Choose a New Password")).toBeNull();
  });

  it("allows password update when PASSWORD_RECOVERY event fires and signs out on success", async () => {
    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: "u-1" } as never },
      error: null,
    });

    renderResetPage("/reset-password");

    await waitFor(() => {
      expect(authCallbacks.length).toBeGreaterThanOrEqual(2);
    });

    const recoverySession = { user: { id: "u-1" } } as Session;
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: recoverySession },
      error: null,
    });

    act(() => {
      authCallbacks.forEach((cb) => cb("PASSWORD_RECOVERY", recoverySession));
    });

    await waitFor(() => {
      expect(screen.getByText("Choose a New Password")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "NewSecurePass123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "NewSecurePass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "NewSecurePass123!",
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(screen.getByText("Password Updated")).toBeTruthy();
    });
  });

  it("verifies token_hash recovery links via verifyOtp", async () => {
    window.history.replaceState(
      {},
      "",
      "/reset-password?token_hash=test-hash-123&type=recovery",
    );
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: { user: { id: "u-2" } } as Session, user: null },
      error: null,
    });

    renderResetPage("/reset-password");

    await waitFor(() => {
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: "test-hash-123",
        type: "recovery",
      });
      expect(screen.getByText("Choose a New Password")).toBeTruthy();
    });
  });

  it("shows expired message and link to /forgot-password when URL contains an error", async () => {
    window.history.replaceState(
      {},
      "",
      "/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );

    renderResetPage("/reset-password");

    await waitFor(() => {
      expect(screen.getByText("Recovery Link Expired")).toBeTruthy();
      expect(screen.getByText("Email link is invalid or has expired")).toBeTruthy();
      expect(
        screen.getByRole("link", { name: "Request a New Recovery Link" }),
      ).toBeTruthy();
    });
  });

  it("processes PKCE recovery callbacks with ?code=test-code and recognizes the valid session", async () => {
    window.history.replaceState({}, "", "/reset-password?code=test-code");
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u-pkce" } } as Session },
      error: null,
    });

    renderResetPage("/reset-password?code=test-code");

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(screen.getByText("Choose a New Password")).toBeTruthy();
    });
    expect(screen.queryByText("Recovery Link Expired")).toBeNull();
  });

  it("does not overwrite a valid PASSWORD_RECOVERY session when an in-flight getSession check resolves with null", async () => {
    window.history.replaceState({}, "", "/reset-password?code=test-code");
    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never;
    });

    let resolveGetSession!: (value: { data: { session: Session | null }; error: null }) => void;
    const pendingSessionPromise = new Promise<{
      data: { session: Session | null };
      error: null;
    }>((resolve) => {
      resolveGetSession = resolve;
    });
    vi.mocked(supabase.auth.getSession).mockImplementation(() => pendingSessionPromise as never);

    renderResetPage("/reset-password?code=test-code");

    await waitFor(() => {
      expect(authCallbacks.length).toBeGreaterThanOrEqual(2);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    const recoverySession = { user: { id: "u-race" } } as Session;
    act(() => {
      authCallbacks.forEach((cb) => cb("PASSWORD_RECOVERY", recoverySession));
    });

    await waitFor(() => {
      expect(screen.getByText("Choose a New Password")).toBeTruthy();
    });

    await act(async () => {
      resolveGetSession({ data: { session: null }, error: null });
      await pendingSessionPromise;
    });

    expect(screen.getByText("Choose a New Password")).toBeTruthy();
    expect(screen.queryByText("Recovery Link Expired")).toBeNull();
  });

  it("unsubscribes from auth state listeners on unmount", async () => {
    const unsubscribeSpy = vi.fn();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(() => ({
      data: { subscription: { unsubscribe: unsubscribeSpy } },
    }) as never);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderResetPage("/reset-password");

    await waitFor(() => {
      expect(screen.getByText("Recovery Link Expired")).toBeTruthy();
    });

    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
  });
});
