import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock the Supabase client in tests so suites never require .env.development
// credentials and never make live network requests.
vi.mock('@/lib/supabase', () => {
  const unsubscribe = vi.fn();
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe } },
    })),
    signInWithPassword: vi.fn(async () => ({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    })),
    signOut: vi.fn(async () => ({ error: null })),
    updateUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    verifyOtp: vi.fn(async () => ({
      data: { session: null, user: null },
      error: null,
    })),
  };

  return {
    supabase: {
      auth,
      rpc: vi.fn(async () => ({
        data: { authenticated: false, reason: 'unauthenticated' },
        error: null,
      })),
    },
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
