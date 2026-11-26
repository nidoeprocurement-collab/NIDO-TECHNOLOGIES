import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const CLIENT_A_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
const CLIENT_B_ID = "d15533db-4e9a-42d3-957e-2bf06b3c4b68";
const CLIENT_A_USER_ID = "173389f2-f977-4f2b-b39f-88f103812259";
const CLIENT_B_USER_ID = "284490a3-0a88-4c3c-a40a-99a214923360";

let servedHandler: ((req: Request) => Promise<Response> | Response) | null = null;
let mockAuthContext: Record<string, unknown> | null = null;
const updateClientUsersSpy = vi.fn();

const mockAdminClient = {
  from: vi.fn((table: string) => {
    if (table === "client_users") {
      return {
        update: vi.fn((payload: unknown) => {
          updateClientUsersSpy(payload);
          const chain = {
            eq: vi.fn(() => chain),
            select: vi.fn(() => chain),
            maybeSingle: vi.fn(async () => ({
              data: {
                id: CLIENT_A_USER_ID,
                auth_user_id: "auth-target",
                client_id: CLIENT_A_ID,
                client_employee_code: "CU-001",
                user_type: "client_user",
                client_role_id: null,
                name: "Updated User",
                email: "user@example.com",
                phone: null,
                department: "",
                designation: null,
                status: "active",
                updated_at: "2026-11-25T10:00:00Z",
              },
              error: null,
            })),
          };
          return chain;
        }),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(async () => ({ data: null, error: null })),
    };
  }),
};

class MockHttpError extends Error {
  public readonly status: number;
  public readonly publicMessage: string;
  public readonly reason: string;
  public readonly headers?: Record<string, string>;

  constructor(
    status: number,
    publicMessage: string,
    reason = "error",
    _internalDetail?: string,
    headers?: Record<string, string>,
  ) {
    super(publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
    this.reason = reason;
    this.headers = headers;
  }
}

vi.mock("../../../supabase/functions/_shared/core.ts", () => ({
  HttpError: MockHttpError,
  RATE_LIMITS: { manage_client_access: { action: "manage_client_access", limit: 30, windowSeconds: 60 } },
  createAdminClient: () => mockAdminClient,
  enforceRateLimit: vi.fn(async () => undefined),
  originAllowed: () => true,
  preflight: (req: Request) => (req.method === "OPTIONS" ? new Response(null, { status: 204 }) : null),
  parseJsonBody: async (req: Request) => (await req.json()) as Record<string, unknown>,
  json: (_req: Request, body: unknown, status = 200, headers?: Record<string, string>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    }),
  requireString: (value: unknown, field: string, maxLen = 120) => {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLen) {
      throw new MockHttpError(400, `${field} is required`, "invalid_input");
    }
    return value.trim();
  },
  optionalString: (value: unknown, maxLen = 250) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLen) : null;
  },
  isSystemOwner: (ctx: Record<string, unknown>) =>
    ctx.user_scope === "nido_internal" &&
    Boolean((ctx.role as { is_system_owner?: boolean } | undefined)?.is_system_owner),
  requireCaller: async (req: Request) => {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ") || !auth.slice(7).trim()) {
      throw new MockHttpError(401, "Authentication required", "missing_auth_token");
    }
    if (!mockAuthContext) {
      throw new MockHttpError(401, "Invalid or expired session", "invalid_session");
    }
    return {
      admin: mockAdminClient,
      authUserId: "auth-caller",
      context: mockAuthContext,
    };
  },
  writeAudit: vi.fn(async () => undefined),
  safeLogMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  mapErrorToHttpResponse: (err: unknown) => {
    if (err instanceof MockHttpError) {
      return {
        status: err.status,
        publicMessage: err.publicMessage,
        reason: err.reason,
        headers: err.headers,
      };
    }
    return {
      status: 500,
      publicMessage: "Internal server error",
      reason: "internal_error",
    };
  },
}));

describe("manage-client-access cross-tenant authorization", () => {
  beforeAll(async () => {
    vi.stubGlobal("Deno", {
      env: { get: () => undefined },
      serve: (fn: (req: Request) => Promise<Response> | Response) => {
        servedHandler = fn;
      },
    });

    await import("../../../supabase/functions/manage-client-access/index.ts");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext = {
      authenticated: true,
      user_scope: "client_portal",
      effective_admin_scope: true,
      profile: {
        id: "cu-admin-a",
        client_id: CLIENT_A_ID,
        user_type: "client_admin",
      },
      role: { id: "role-admin-a", name: "Client Admin" },
      permissions: {},
    };
  });

  function makeRequest(body: Record<string, unknown>, authHeader?: string) {
    return new Request(
      "https://eicjhhmkpqcnmwrfztit.supabase.co/functions/v1/manage-client-access",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:8080",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );
  }

  it("1-2. returns HTTP 403 forbidden_client_scope when Client A attempts to manage Client B users", async () => {
    const res = await servedHandler!(
      makeRequest(
        {
          action: "update_client_user",
          client_id: CLIENT_B_ID,
          client_user_id: CLIENT_B_USER_ID,
          name: "Cross Tenant Attempt",
          status: "Active",
        },
        "Bearer valid-client-a-jwt",
      ),
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.reason).toBe("forbidden_client_scope");
    expect(updateClientUsersSpy).not.toHaveBeenCalled();
  });

  it("3. rejects non-admin Client A user managing users even within its own organization", async () => {
    mockAuthContext = {
      authenticated: true,
      user_scope: "client_portal",
      effective_admin_scope: false,
      profile: {
        id: "cu-user-a",
        client_id: CLIENT_A_ID,
        user_type: "client_user",
      },
      role: { id: "role-proc-a", name: "Procurement" },
      permissions: {},
    };

    const res = await servedHandler!(
      makeRequest(
        {
          action: "update_client_user",
          client_id: CLIENT_A_ID,
          client_user_id: CLIENT_A_USER_ID,
          name: "Unauthorized Update",
          status: "Active",
        },
        "Bearer valid-client-a-user-jwt",
      ),
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.reason).toBe("forbidden_client_scope");
    expect(updateClientUsersSpy).not.toHaveBeenCalled();
  });

  it("4. allows authorized Client A admin to manage a user within its own organization", async () => {
    const res = await servedHandler!(
      makeRequest(
        {
          action: "update_client_user",
          client_id: CLIENT_A_ID,
          client_user_id: CLIENT_A_USER_ID,
          name: "Updated User",
          status: "Active",
        },
        "Bearer valid-client-a-admin-jwt",
      ),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(updateClientUsersSpy).toHaveBeenCalledTimes(1);
  });

  it("5. rejects unauthenticated requests", async () => {
    const res = await servedHandler!(
      makeRequest({
        action: "update_client_user",
        client_id: CLIENT_A_ID,
        client_user_id: CLIENT_A_USER_ID,
        name: "No Auth",
        status: "Active",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.reason).toBe("missing_auth_token");
    expect(updateClientUsersSpy).not.toHaveBeenCalled();
  });

  it("6. allows authorized internal NIDO user to manage Client B users", async () => {
    mockAuthContext = {
      authenticated: true,
      user_scope: "nido_internal",
      profile: { id: "nu-1", user_type: "nido_admin" },
      role: { id: "nr-1", name: "Client Ops", is_system_owner: false },
      permissions: {
        clients: { view: true, edit: true },
      },
    };

    const res = await servedHandler!(
      makeRequest(
        {
          action: "update_client_user",
          client_id: CLIENT_B_ID,
          client_user_id: CLIENT_B_USER_ID,
          name: "Internal Managed User",
          status: "Active",
        },
        "Bearer valid-nido-internal-jwt",
      ),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(updateClientUsersSpy).toHaveBeenCalledTimes(1);
  });
});
