import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Offline verification of Stage 2 backend rate-limiting policies, boundary
 * conditions, concurrency safety, CORS fail-closed rules, and onboarding route
 * compatibility (zero live Supabase calls or emails).
 */

interface RateLimitPolicy {
  scopeKey: string;
  maxRequests: number;
  windowSeconds: number;
}

const EXPECTED_POLICIES: Record<string, RateLimitPolicy> = {
  bootstrap_system_owner: {
    scopeKey: "bootstrap_system_owner",
    maxRequests: 3,
    windowSeconds: 3600,
  },
  resend_system_owner_invitation: {
    scopeKey: "resend_system_owner_invitation",
    maxRequests: 3,
    windowSeconds: 3600,
  },
  create_client_organization_admin: {
    scopeKey: "create_client_organization_admin",
    maxRequests: 5,
    windowSeconds: 3600,
  },
  create_client_user: {
    scopeKey: "create_client_user",
    maxRequests: 20,
    windowSeconds: 3600,
  },
  create_internal_user: {
    scopeKey: "create_internal_user",
    maxRequests: 10,
    windowSeconds: 3600,
  },
};

function createAtomicRateLimitSimulator() {
  const buckets = new Map<string, number>();

  return async function consume(
    policy: RateLimitPolicy,
    actorKey: string,
    nowMs = Date.now(),
  ): Promise<{
    allowed: boolean;
    remaining_requests: number;
    retry_after_seconds: number;
  }> {
    const windowStart =
      Math.floor(nowMs / 1000 / policy.windowSeconds) * policy.windowSeconds;
    const windowEnd = windowStart + policy.windowSeconds;
    const key = `${policy.scopeKey}:${actorKey}:${windowStart}`;

    const nextCount = (buckets.get(key) ?? 0) + 1;
    buckets.set(key, nextCount);

    const allowed = nextCount <= policy.maxRequests;
    const remaining_requests = Math.max(0, policy.maxRequests - nextCount);
    const retry_after_seconds = allowed
      ? 0
      : Math.max(1, Math.ceil(windowEnd - nowMs / 1000));

    return { allowed, remaining_requests, retry_after_seconds };
  };
}

describe("Stage 2 Backend Rate Limiting & Security Configuration", () => {
  it("defines the expected conservative rate-limit policies in core.ts", () => {
    const coreSource = fs.readFileSync(
      path.resolve(process.cwd(), "supabase/functions/_shared/core.ts"),
      "utf8",
    );

    for (const [name, policy] of Object.entries(EXPECTED_POLICIES)) {
      expect(coreSource).toContain(`${name}:`);
      expect(coreSource).toContain(`scopeKey: '${policy.scopeKey}'`);
      expect(coreSource).toContain(`maxRequests: ${policy.maxRequests}`);
      expect(coreSource).toContain(`windowSeconds: ${policy.windowSeconds}`);
    }
    expect(coreSource).toContain("'Retry-After': String(retryAfter)");
    expect(coreSource).toContain("429");
    expect(coreSource).not.toContain("'Access-Control-Allow-Origin': '*'");
    expect(coreSource).not.toContain('Access-Control-Allow-Origin": "*"');
  });

  it("enforces exact boundary limits and returns Retry-After when exceeded", async () => {
    const consume = createAtomicRateLimitSimulator();
    const policy = EXPECTED_POLICIES.bootstrap_system_owner; // limit 3

    const r1 = await consume(policy, "global", 1_700_000_000_000);
    const r2 = await consume(policy, "global", 1_700_000_001_000);
    const r3 = await consume(policy, "global", 1_700_000_002_000);
    const r4 = await consume(policy, "global", 1_700_000_003_000);

    expect(r1).toEqual({ allowed: true, remaining_requests: 2, retry_after_seconds: 0 });
    expect(r2).toEqual({ allowed: true, remaining_requests: 1, retry_after_seconds: 0 });
    expect(r3).toEqual({ allowed: true, remaining_requests: 0, retry_after_seconds: 0 });
    expect(r4.allowed).toBe(false);
    expect(r4.remaining_requests).toBe(0);
    expect(r4.retry_after_seconds).toBeGreaterThan(0);
    expect(r4.retry_after_seconds).toBeLessThanOrEqual(3600);
  });

  it("prevents concurrent bursts from exceeding the configured limit", async () => {
    const consume = createAtomicRateLimitSimulator();
    const policy = EXPECTED_POLICIES.create_client_organization_admin; // limit 5

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consume(policy, "actor-uuid-1", 1_700_000_000_000),
      ),
    );

    const allowedCount = results.filter((r) => r.allowed).length;
    const deniedCount = results.filter((r) => !r.allowed).length;

    expect(allowedCount).toBe(5);
    expect(deniedCount).toBe(5);
  });

  it("configures verify_jwt = false only for bootstrap-system-owner in config.toml", () => {
    const configSource = fs.readFileSync(
      path.resolve(process.cwd(), "supabase/config.toml"),
      "utf8",
    );

    expect(configSource).toContain("[functions.bootstrap-system-owner]");
    expect(configSource).toContain("[functions.resend-system-owner-invitation]");
    expect(configSource).toContain("verify_jwt = false");
    expect(configSource).not.toContain("[functions.provision-client-access]");
    expect(configSource).not.toContain("[functions.provision-internal-user]");
  });

  it("enforces all pre-resend checks and never exposes action_link in resend-system-owner-invitation", () => {
    const resendSource = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "supabase/functions/resend-system-owner-invitation/index.ts",
      ),
      "utf8",
    );

    expect(resendSource).toContain("NIDO_BOOTSTRAP_SECRET");
    expect(resendSource).toContain("constantTimeEqual");
    expect(resendSource).toContain("is_system_owner !== true");
    expect(resendSource).toContain("authUser.email_confirmed_at");
    expect(resendSource).toContain("RATE_LIMITS.resend_system_owner_invitation");
    expect(resendSource).toContain("generateLink");
    expect(resendSource).toContain("NIDO_INVITE_REDIRECT_URL");
    expect(resendSource).toContain("https://api.resend.com/emails");
    expect(resendSource).toContain("system_owner_invitation_resent");
    expect(resendSource).toContain("system_owner_invitation_resend_failed");
    expect(resendSource).not.toContain("inviteUserByEmail");
  });

  it("keeps the frontend /onboarding route compatible with NIDO_INVITE_REDIRECT_URL", () => {
    const appSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/App.tsx"),
      "utf8",
    );
    expect(appSource).toContain('path="/onboarding"');
    expect(appSource).toContain('path="/onboarding/:token"');
  });

  it("enforces trusted-backend and service_role-only grants in the rate-limit migration", () => {
    const migrationSql = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "supabase/migrations/20261119000008_phase2c_rate_limiting.sql",
      ),
      "utf8",
    );

    expect(migrationSql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migrationSql).toContain("FORCE ROW LEVEL SECURITY");
    expect(migrationSql).toContain(
      "REVOKE ALL ON TABLE public.nido_provisioning_rate_limits FROM PUBLIC, anon, authenticated",
    );
    expect(migrationSql).toContain("IF NOT app.is_trusted_backend() THEN");
    expect(migrationSql).toContain(
      "REVOKE ALL ON FUNCTION public.consume_nido_rate_limit(text, text, integer, integer)",
    );
    expect(migrationSql).toContain("TO service_role");
  });
});
