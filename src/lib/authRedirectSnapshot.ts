export interface AuthRedirectSnapshot {
  pathname: string;
  search: string;
  hash: string;
  capturedAt: number;
}

export interface JwtIdentityClaims {
  sub?: string;
  email?: string;
}

let capturedSnapshot: AuthRedirectSnapshot | null = null;

export function captureAuthRedirectSnapshot(): AuthRedirectSnapshot | null {
  if (typeof window === "undefined" || !window.location) {
    capturedSnapshot = null;
    return null;
  }

  capturedSnapshot = {
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || "",
    capturedAt: Date.now(),
  };

  return capturedSnapshot;
}

export function getCapturedAuthRedirectSnapshot(
  expectedPathname?: string
): AuthRedirectSnapshot | null {
  if (!capturedSnapshot) {
    return null;
  }

  if (expectedPathname && capturedSnapshot.pathname !== expectedPathname) {
    return null;
  }

  return capturedSnapshot;
}

export function clearCapturedAuthRedirectSnapshot(): void {
  capturedSnapshot = null;
}

/**
 * Extracts `sub` and `email` claims from a JWT payload without verifying its
 * cryptographic signature. Only use this to correlate an already-authenticated
 * Supabase session against the token captured from the initial redirect URL.
 */
export function parseJwtClaims(token: string): JwtIdentityClaims | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;

    return {
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

// Capture synchronously at module evaluation time before GoTrueClient._initialize()
// processes and clears window.location.hash.
captureAuthRedirectSnapshot();

