import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { supabase } from "@/lib/supabase";
import {
  captureAuthRedirectSnapshot,
  clearCapturedAuthRedirectSnapshot,
} from "@/lib/authRedirectSnapshot";
import UserOnboardingPage from "../UserOnboardingPage";

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.sig`;
}

function renderOnboardingPage(initialPath = "/onboarding") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <ConfigProvider>
          <Routes>
            <Route path="/onboarding" element={<UserOnboardingPage />} />
            <Route path="/onboarding/:token" element={<UserOnboardingPage />} />
            <Route path="/dashboard" element={<div>Internal Dashboard</div>} />
            <Route path="/portal/dashboard" element={<div>Portal Dashboard</div>} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("UserOnboardingPage invitation and session-collision protection", () => {
  const systemOwnerSession = {
    access_token: "owner-token",
    user: {
      id: "9a88e195-73b1-4a3b-b30f-2d16b7af1bf5",
      email: "nidoeprocurement@gmail.com",
      email_confirmed_at: "2026-11-19T08:02:21Z",
    },
  } as unknown as Session;

  const invitedUserSession = {
    access_token: "invited-token",
    user: {
      id: "3270e808-247e-4118-b1a3-91b6be44394e",
      email: "invited.user@example.com",
      email_confirmed_at: "2026-11-25T05:00:00Z",
    },
  } as unknown as Session;

  const unverifiedInvitedSession = {
    access_token: "unverified-token",
    user: {
      id: "3270e808-247e-4118-b1a3-91b6be44394e",
      email: "invited.user@example.com",
      email_confirmed_at: null,
    },
  } as unknown as Session;

  const authMock = supabase.auth as unknown as {
    exchangeCodeForSession?: ReturnType<typeof vi.fn>;
    setSession?: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    clearCapturedAuthRedirectSnapshot();
    window.history.replaceState({}, "", "/onboarding");
    vi.clearAllMocks();
    authMock.exchangeCodeForSession = vi.fn(async () => ({
      data: { session: null },
      error: { message: "Invalid code" },
    }));
    authMock.setSession = vi.fn(async () => ({
      data: { session: null },
      error: { message: "Invalid token" },
    }));
  });

  function mockPortalAuthContext() {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        authenticated: true,
        user_scope: "client_portal",
        effective_admin_scope: false,
        profile: {
          id: "cu-1",
          client_id: "c04422ca-3d89-41c2-846d-1ae95a2b3a57",
          user_type: "client_user",
          name: "Invited User",
          email: "invited.user@example.com",
        },
        role: { id: "cr-1", name: "Viewer" },
        permissions: {},
      },
      error: null,
    } as never);
  }

  function fillAndSubmitPassword() {
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Activate Account/i }));
  }

  it("1. rejects an existing System Owner session when no invitation credential is in the URL", async () => {
    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
    });

    act(() => {
      for (const cb of authCallbacks) {
        cb("INITIAL_SESSION", systemOwnerSession);
      }
    });

    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(screen.queryByText("nidoeprocurement@gmail.com")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("2. rejects an invalid token_hash even when a System Owner session exists and never calls updateUser", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding?token_hash=expired-hash&type=invite",
    );

    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Email link is invalid or has expired" } as never,
    });

    renderOnboardingPage("/onboarding?token_hash=expired-hash&type=invite");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(screen.getByText("Email link is invalid or has expired")).toBeTruthy();
    });

    act(() => {
      for (const cb of authCallbacks) {
        cb("INITIAL_SESSION", systemOwnerSession);
        cb("SIGNED_IN", systemOwnerSession);
      }
    });

    expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("3. rejects an invalid PKCE code even when a System Owner session exists and never calls updateUser", async () => {
    window.history.replaceState({}, "", "/onboarding?code=bad-pkce-code");

    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });
    authMock.exchangeCodeForSession!.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "PKCE code expired" },
    });

    renderOnboardingPage("/onboarding?code=bad-pkce-code");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(screen.getByText("PKCE code expired")).toBeTruthy();
    });

    act(() => {
      for (const cb of authCallbacks) {
        cb("INITIAL_SESSION", systemOwnerSession);
        cb("SIGNED_IN", systemOwnerSession);
      }
    });

    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("4. rejects an invalid #access_token even when a System Owner session exists and never calls updateUser", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding#access_token=bad-access-token&refresh_token=bad-refresh&type=invite",
    );

    const authCallbacks: Array<(event: string, session: Session | null) => void> = [];
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authCallbacks.push(cb as (event: string, session: Session | null) => void);
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });
    authMock.setSession!.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Invalid invitation token" },
    });

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(screen.getByText("Invalid invitation token")).toBeTruthy();
    });

    act(() => {
      for (const cb of authCallbacks) {
        cb("INITIAL_SESSION", systemOwnerSession);
        cb("SIGNED_IN", systemOwnerSession);
      }
    });

    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("5. completes a valid token_hash invitation and updates only the invited user's password", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding?token_hash=invite-hash-123&type=invite",
    );

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { user: invitedUserSession.user as never, session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: invitedUserSession.user as never },
      error: null,
    });
    mockPortalAuthContext();

    renderOnboardingPage("/onboarding?token_hash=invite-hash-123&type=invite");

    await waitFor(() => {
      expect(screen.getByText("Complete Your Account Setup")).toBeTruthy();
    });
    expect(screen.getByText("invited.user@example.com")).toBeTruthy();
    expect(screen.queryByText("nidoeprocurement@gmail.com")).toBeNull();

    fillAndSubmitPassword();

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Portal Dashboard")).toBeTruthy();
    });
  });

  it("6. completes a valid PKCE ?code= invitation for the verified invited user", async () => {
    window.history.replaceState({}, "", "/onboarding?code=valid-pkce-code");

    authMock.exchangeCodeForSession!.mockResolvedValueOnce({
      data: { session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: invitedUserSession.user as never },
      error: null,
    });
    mockPortalAuthContext();

    renderOnboardingPage("/onboarding?code=valid-pkce-code");

    await waitFor(() => {
      expect(screen.getByText("Complete Your Account Setup")).toBeTruthy();
    });
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("valid-pkce-code");
    expect(screen.getByText("invited.user@example.com")).toBeTruthy();

    fillAndSubmitPassword();

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Portal Dashboard")).toBeTruthy();
    });
  });

  it("7. completes a valid #access_token invitation flow via setSession fallback when getSession is empty", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding#access_token=invited-token&refresh_token=invited-refresh&type=invite",
    );

    vi.mocked(supabase.auth.getSession)
      .mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })
      .mockResolvedValue({
        data: { session: invitedUserSession },
        error: null,
      });
    authMock.setSession!.mockResolvedValueOnce({
      data: { session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: invitedUserSession.user as never },
      error: null,
    });
    mockPortalAuthContext();

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Complete Your Account Setup")).toBeTruthy();
    });
    expect(authMock.setSession).toHaveBeenCalledWith({
      access_token: "invited-token",
      refresh_token: "invited-refresh",
    });
    expect(screen.getByText("invited.user@example.com")).toBeTruthy();

    fillAndSubmitPassword();

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Portal Dashboard")).toBeTruthy();
    });
  });

  it("8. blocks password update when the invited user's email is unverified", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding?token_hash=unverified-hash&type=invite",
    );

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: {
        user: unverifiedInvitedSession.user as never,
        session: unverifiedInvitedSession,
      },
      error: null,
    });

    renderOnboardingPage("/onboarding?token_hash=unverified-hash&type=invite");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(
        screen.getByText(
          "Your account email is not verified yet. Please use a valid invitation link.",
        ),
      ).toBeTruthy();
    });

    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("9. blocks updateUser if the active Supabase session changes to another user before submit", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding?token_hash=invite-hash-123&type=invite",
    );

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { user: invitedUserSession.user as never, session: invitedUserSession },
      error: null,
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });

    renderOnboardingPage("/onboarding?token_hash=invite-hash-123&type=invite");

    await waitFor(() => {
      expect(screen.getByText("Complete Your Account Setup")).toBeTruthy();
    });

    fillAndSubmitPassword();

    await waitFor(() => {
      expect(
        screen.getByText(
          "Active session does not match the invited user. Please re-open your invitation link.",
        ),
      ).toBeTruthy();
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("10. completes onboarding when GoTrue initializes, processes #access_token, and clears window.location.hash before mount", async () => {
    const initialInviteJwt = createUnsignedJwt({
      sub: "3270e808-247e-4118-b1a3-91b6be44394e",
      email: "invited.user@example.com",
    });
    const rotatedSession = {
      access_token: "rotated-session-jwt-after-gotrue-init",
      user: {
        id: "3270e808-247e-4118-b1a3-91b6be44394e",
        email: "invited.user@example.com",
        email_confirmed_at: "2026-11-25T05:00:00Z",
      },
    } as unknown as Session;

    // 1. Browser lands on /onboarding#access_token=...&type=invite
    window.history.replaceState(
      {},
      "",
      `/onboarding#access_token=${initialInviteJwt}&refresh_token=single-use-refresh&type=invite`,
    );
    // 2. Synchronous capture before GoTrueClient._initialize() clears the hash
    captureAuthRedirectSnapshot();
    // 3. GoTrue processes hash, establishes session, and clears window.location.hash
    window.history.replaceState({}, "", "/onboarding");
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: rotatedSession },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: rotatedSession.user as never },
      error: null,
    });
    mockPortalAuthContext();

    // 4. Lazy-loaded UserOnboardingPage mounts with empty window.location.hash
    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Complete Your Account Setup")).toBeTruthy();
    });
    // Must not re-submit the already-consumed refresh token
    expect(authMock.setSession).not.toHaveBeenCalled();
    expect(screen.getByText("invited.user@example.com")).toBeTruthy();

    fillAndSubmitPassword();

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "StrongPass123!",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Portal Dashboard")).toBeTruthy();
    });
  });

  it("11. rejects a pre-existing System Owner session when captured invite JWT belongs to another user", async () => {
    const invitedJwt = createUnsignedJwt({
      sub: "3270e808-247e-4118-b1a3-91b6be44394e",
      email: "invited.user@example.com",
    });

    window.history.replaceState(
      {},
      "",
      `/onboarding#access_token=${invitedJwt}&refresh_token=expired-refresh&type=invite`,
    );
    captureAuthRedirectSnapshot();
    window.history.replaceState({}, "", "/onboarding");

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: systemOwnerSession },
      error: null,
    });
    authMock.setSession!.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Invalid Refresh Token: Already Used" },
    });

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
    });
    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(screen.queryByText("nidoeprocurement@gmail.com")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("12. keeps invitation onboarding separate from password recovery links", async () => {
    const recoveryJwt = createUnsignedJwt({
      sub: "3270e808-247e-4118-b1a3-91b6be44394e",
      email: "invited.user@example.com",
    });

    window.history.replaceState(
      {},
      "",
      `/onboarding#access_token=${recoveryJwt}&refresh_token=rec-refresh&type=recovery`,
    );
    captureAuthRedirectSnapshot();
    window.history.replaceState({}, "", "/onboarding");

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: invitedUserSession },
      error: null,
    });

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(
        screen.getByText(
          "This link is for password recovery, not invitation onboarding. Please use the password reset page.",
        ),
      ).toBeTruthy();
    });
    expect(screen.queryByText("Complete Your Account Setup")).toBeNull();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("13. surfaces captured URL error even if hash is cleared before mount", async () => {
    window.history.replaceState(
      {},
      "",
      "/onboarding#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    captureAuthRedirectSnapshot();
    window.history.replaceState({}, "", "/onboarding");

    renderOnboardingPage("/onboarding");

    await waitFor(() => {
      expect(screen.getByText("Invitation Unavailable")).toBeTruthy();
      expect(screen.getByText("Email link is invalid or has expired")).toBeTruthy();
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
});
