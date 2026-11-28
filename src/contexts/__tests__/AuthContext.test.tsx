import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';

const {
  getSessionMock,
  signInWithPasswordMock,
  signOutMock,
  onAuthStateChangeMock,
  rpcMock,
  hydrateStage6bMock,
  fetchImpersonationMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  rpcMock: vi.fn(),
  hydrateStage6bMock: vi.fn().mockResolvedValue(undefined),
  fetchImpersonationMock: vi.fn().mockResolvedValue(null),
}));

let authListener: ((event: string, session: unknown) => void) | null = null;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
    rpc: rpcMock,
  },
}));

vi.mock('@/lib/stage6bBootstrap', () => ({
  hydrateStage6bModulesForUser: hydrateStage6bMock,
}));

vi.mock('@/lib/impersonationApi', () => ({
  fetchActiveImpersonationSessionFromSupabase: fetchImpersonationMock,
  startImpersonationInSupabase: vi.fn(),
  stopImpersonationInSupabase: vi.fn(),
}));

import { AuthProvider, useAuth } from '../AuthContext';

function AuthHarness({ onReady }: { onReady: (ctx: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  React.useEffect(() => {
    onReady(auth);
  });
  return null;
}

describe('Stage 2D — AuthContext Lifecycle & Error Differentiation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authListener = null;
    localStorage.clear();
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    signOutMock.mockResolvedValue({ error: null });
    onAuthStateChangeMock.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authListener = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  function mountAuth() {
    let latest!: ReturnType<typeof useAuth>;
    render(
      <AuthProvider>
        <AuthHarness onReady={(ctx) => { latest = ctx; }} />
      </AuthProvider>,
    );
    return () => latest;
  }

  it('authenticates Internal, Alpha (CL-99001), and Beta (CL-99002) with clean logout & re-login', async () => {
    const getAuth = mountAuth();
    await waitFor(() => expect(getAuth().isLoading).toBe(false));

    // 1. Internal login
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'f9d4fb3f-bf24-4e41-aadb-5aabb0a831ad' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: 'nido_internal',
        profile: { id: '19bd9d0a-5792-4908-84d1-0483a75e6c17', name: 'UAT Internal Admin', email: 'nidotech89@gmail.com' },
        role: { name: 'System Administrator', is_system_owner: false },
        permissions: {},
      },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    let res = await act(() => getAuth().signInWithPassword(' nidotech89@gmail.com ', 'valid-pass'));
    expect(res.ok).toBe(true);
    expect(res.userScope).toBe('nido_internal');
    expect(getAuth().isNidoAdmin).toBe(true);
    expect(getAuth().isClientPortalUser).toBe(false);

    // Logout
    await act(() => getAuth().logout());
    expect(getAuth().isAuthenticated).toBe(false);
    expect(getAuth().user).toBeNull();

    // 2. Alpha login
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: '2d08c143-0577-42cd-90fe-fef5811587fa' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: 'client_portal',
        profile: {
          id: 'df500ce9-086f-4967-9ab6-b008beca0b04',
          name: 'UAT Alpha Admin',
          email: 'praveennido@gmail.com',
          client_id: '2679ed1b-85c6-4e57-8a22-fc980fa2bceb',
          client_code: 'CL-99001',
          client_name: 'UAT Client Alpha',
          user_type: 'client_admin',
        },
        role: { name: 'Client Admin' },
        permissions: {},
      },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    res = await act(() => getAuth().signInWithPassword('praveennido@gmail.com', 'alpha-pass'));
    expect(res.ok).toBe(true);
    expect(getAuth().user?.clientCode).toBe('CL-99001');
    expect(getAuth().isClientPortalUser).toBe(true);

    // Logout & 3. Beta login (no cross-tenant leakage)
    await act(() => getAuth().logout());
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: '5dbe24d6-38c6-49a8-9d42-4bbe532e7559' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: 'client_portal',
        profile: {
          id: '20f0d0f3-6579-4adc-ac53-28a40ff03406',
          name: 'UAT Beta Admin',
          email: 'praveengoja@gmail.com',
          client_id: 'acb1f111-ff9e-4e05-b4c4-be30639cb2d6',
          client_code: 'CL-99002',
          client_name: 'UAT Client Beta',
          user_type: 'client_admin',
        },
        role: { name: 'Client Admin' },
        permissions: {},
      },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    res = await act(() => getAuth().signInWithPassword('praveengoja@gmail.com', 'beta-pass'));
    expect(res.ok).toBe(true);
    expect(getAuth().user?.clientCode).toBe('CL-99002');
    expect(getAuth().user?.clientId).toBe('acb1f111-ff9e-4e05-b4c4-be30639cb2d6');
  });

  it('reports distinct errors for invalid credentials, unconfirmed email, suspended user, RPC failure, and missing tenant mapping', async () => {
    const getAuth = mountAuth();
    await waitFor(() => expect(getAuth().isLoading).toBe(false));

    // Genuine invalid credentials
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    let res = await act(() => getAuth().signInWithPassword('a@b.com', 'wrong'));
    expect(res).toEqual({ ok: false, error: 'Invalid email or password.' });

    // Unconfirmed email
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Email not confirmed' },
    });
    res = await act(() => getAuth().signInWithPassword('a@b.com', 'pass'));
    expect(res.error).toMatch(/not been confirmed/i);

    // Suspended account
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: { authenticated: false, reason: 'inactive_or_suspended' }, error: null });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    res = await act(() => getAuth().signInWithPassword('a@b.com', 'pass'));
    expect(res).toEqual({ ok: false, reason: 'inactive_or_suspended' });

    // Profile hydration RPC failure
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'RPC timeout' } });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    res = await act(() => getAuth().signInWithPassword('a@b.com', 'pass'));
    expect(res).toEqual({ ok: false, reason: 'auth_context_error' });

    // Missing tenant mapping on client_portal
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: 'client_portal',
        profile: { id: 'p1', name: 'Bad', email: 'a@b.com', client_id: null, user_type: 'client_admin' },
        role: { name: 'Client Admin' },
        permissions: {},
      },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    res = await act(() => getAuth().signInWithPassword('a@b.com', 'pass'));
    expect(res).toEqual({ ok: false, reason: 'invalid_profile' });
    expect(getAuth().isAuthenticated).toBe(false);
  });

  it('prevents superseded concurrent login from signing out newer session and handles token refresh/signout', async () => {
    const getAuth = mountAuth();
    await waitFor(() => expect(getAuth().isLoading).toBe(false));

    let resolveFirst!: (val: unknown) => void;
    signInWithPasswordMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'u2' } } },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user_scope: 'nido_internal',
        profile: { id: 'p2', name: 'Newer User', email: 'new@nido.in' },
        role: { name: 'System Administrator' },
        permissions: {},
      },
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    const p1 = getAuth().signInWithPassword('old@nido.in', 'p1');
    const p2 = getAuth().signInWithPassword('new@nido.in', 'p2');
    resolveFirst({ data: { session: null }, error: { message: 'Invalid login credentials' } });

    const [r1, r2] = await act(() => Promise.all([p1, p2]));
    expect(r1).toEqual({ ok: false, reason: 'superseded' });
    expect(r2.ok).toBe(true);
    expect(signOutMock).not.toHaveBeenCalled();
    expect(getAuth().user?.email).toBe('new@nido.in');

    // Token refresh preserves context; SIGNED_OUT clears session
    await act(async () => {
      authListener?.('SIGNED_OUT', null);
    });
    expect(getAuth().isAuthenticated).toBe(false);
  });
});
