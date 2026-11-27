import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type AuthContext = Record<string, unknown> & {
  authenticated?: boolean;
  user_scope?: 'nido_internal' | 'client_portal';
  effective_admin_scope?: boolean;
  profile?: Record<string, unknown>;
  role?: Record<string, unknown>;
  permissions?: Record<string, Record<string, boolean>>;
};

export class HttpError extends Error {
  public readonly status: number;
  public readonly publicMessage: string;
  public readonly reason: string;
  public readonly headers?: Record<string, string>;

  constructor(
    status: number,
    publicMessage: string,
    reason: string,
    internalDetail?: string,
    headers?: Record<string, string>,
  ) {
    super(internalDetail ?? publicMessage);
    this.name = 'HttpError';
    this.status = status;
    this.publicMessage = publicMessage;
    this.reason = reason;
    this.headers = headers;
  }
}

export interface RateLimitPolicy {
  scopeKey: string;
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMITS: Record<
  | 'bootstrap_system_owner'
  | 'resend_system_owner_invitation'
  | 'create_client_organization_admin'
  | 'create_client_user'
  | 'create_internal_user'
  | 'manage_nido_roles'
  | 'manage_nido_users'
  | 'manage_client_access'
  | 'manage_impersonation',
  RateLimitPolicy
> = {
  bootstrap_system_owner: {
    scopeKey: 'bootstrap_system_owner',
    maxRequests: 3,
    windowSeconds: 3600,
  },
  resend_system_owner_invitation: {
    scopeKey: 'resend_system_owner_invitation',
    maxRequests: 3,
    windowSeconds: 3600,
  },
  create_client_organization_admin: {
    scopeKey: 'create_client_organization_admin',
    maxRequests: 5,
    windowSeconds: 3600,
  },
  create_client_user: {
    scopeKey: 'create_client_user',
    maxRequests: 20,
    windowSeconds: 3600,
  },
  create_internal_user: {
    scopeKey: 'create_internal_user',
    maxRequests: 10,
    windowSeconds: 3600,
  },
  manage_nido_roles: {
    scopeKey: 'manage_nido_roles',
    maxRequests: 60,
    windowSeconds: 3600,
  },
  manage_nido_users: {
    scopeKey: 'manage_nido_users',
    maxRequests: 60,
    windowSeconds: 3600,
  },
  manage_client_access: {
    scopeKey: 'manage_client_access',
    maxRequests: 60,
    windowSeconds: 3600,
  },
  manage_impersonation: {
    scopeKey: 'manage_impersonation',
    maxRequests: 30,
    windowSeconds: 3600,
  },
};

function parseDefaultKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed.default ?? (Object.values(parsed)[0] as string | undefined);
    }
  } catch {
    return raw;
  }
  return undefined;
}

export function envValue(name: string): string | undefined {
  return Deno.env.get(name)?.trim() || undefined;
}

export function createAdminClient(): SupabaseClient {
  const url = envValue('SUPABASE_URL');
  const secret =
    parseDefaultKey(envValue('SUPABASE_SECRET_KEYS')) ??
    envValue('SUPABASE_SERVICE_ROLE_KEY') ??
    envValue('SUPABASE_SECRET_KEY');
  if (!url || !secret) {
    throw new HttpError(
      500,
      'Server configuration is unavailable',
      'missing_server_credentials',
      'Supabase server credentials are not configured',
    );
  }
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  const url = envValue('SUPABASE_URL');
  const publishable =
    parseDefaultKey(envValue('SUPABASE_PUBLISHABLE_KEYS')) ??
    envValue('SUPABASE_ANON_KEY') ??
    envValue('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !publishable) {
    throw new HttpError(
      500,
      'Server configuration is unavailable',
      'missing_public_credentials',
      'Supabase public API credentials are not configured',
    );
  }
  return createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const baseCors: Record<string, string> = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-request-id, x-nido-bootstrap-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

function getAllowedOrigins(): string[] {
  return (envValue('NIDO_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin')?.trim() ?? '';
  const allowed = getAllowedOrigins();
  if (allowed.length > 0 && origin && allowed.includes(origin)) {
    return { ...baseCors, 'Access-Control-Allow-Origin': origin };
  }
  // Fail closed: never emit a wildcard origin or reflect unapproved origins.
  return { ...baseCors };
}

export function json(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      ...(extraHeaders ?? {}),
    },
  });
}

export function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin')?.trim();
  if (!origin) return true; // non-browser server-to-server invocation
  const allowed = getAllowedOrigins();
  return allowed.length > 0 && allowed.includes(origin);
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  if (!originAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
  return new Response('ok', { status: 200, headers: corsHeaders(req) });
}

export async function requireCaller(req: Request): Promise<{
  admin: SupabaseClient;
  authUserId: string;
  email: string;
  context: AuthContext;
}> {
  const authorization = req.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1].trim()) {
    throw new HttpError(
      401,
      'Authentication is required',
      'missing_bearer_token',
      'A valid signed-in user session is required',
    );
  }

  const token = match[1].trim();
  const userClient = createUserClient(token);
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user?.id || !userData.user.email) {
    throw new HttpError(
      401,
      'Your session is invalid or expired',
      'invalid_or_expired_session',
      userError?.message ?? 'The supplied user session is invalid or expired',
    );
  }

  const { data: context, error: contextError } = await userClient.rpc(
    'get_my_auth_context',
  );
  if (contextError) {
    throw new HttpError(
      500,
      'Unable to verify account access',
      'auth_context_lookup_failed',
      contextError.message,
    );
  }
  if (!context?.authenticated) {
    throw new HttpError(
      403,
      'Your account is not authorized for this operation',
      'unprovisioned_or_inactive_caller',
      'The signed-in account is not an active, provisioned NIDO user',
    );
  }

  return {
    admin: createAdminClient(),
    authUserId: userData.user.id,
    email: userData.user.email,
    context: context as AuthContext,
  };
}

export function isSystemOwner(context: AuthContext): boolean {
  return (
    context.user_scope === 'nido_internal' &&
    context.role?.is_system_owner === true
  );
}

export function hasPermission(
  context: AuthContext,
  moduleKey: string,
  action: string,
): boolean {
  return context.permissions?.[moduleKey]?.[action] === true;
}

export function requireInternalPermission(
  context: AuthContext,
  moduleKey: string,
  action: string,
): void {
  if (isSystemOwner(context)) return;
  if (
    context.user_scope !== 'nido_internal' ||
    !hasPermission(context, moduleKey, action)
  ) {
    throw new HttpError(
      403,
      'You do not have permission to perform this action',
      `forbidden_${moduleKey}_${action}`,
      `Not authorized: requires internal ${moduleKey}.${action}`,
    );
  }
}

export async function parseJsonBody(
  req: Request,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, 'Invalid JSON request body', 'invalid_json');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object', 'invalid_body');
  }
  return body as Record<string, unknown>;
}

export function requireString(
  value: unknown,
  field: string,
  max = 200,
): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} is required`, `missing_${field}`);
  }
  const result = value.trim();
  if (!result || result.length > max) {
    throw new HttpError(400, `${field} is invalid`, `invalid_${field}`);
  }
  return result;
}

export function optionalString(value: unknown, max = 200): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new HttpError(
      400,
      'An optional text field is invalid',
      'invalid_optional_field',
    );
  }
  return value.trim() || null;
}

export function validateEmail(value: unknown): string {
  const email = requireString(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'email is invalid', 'invalid_email');
  }
  return email;
}

export async function inviteAuthUser(
  admin: SupabaseClient,
  email: string,
  name: string,
  scope: 'nido_internal' | 'client_portal',
): Promise<string> {
  const redirectTo = envValue('NIDO_INVITE_REDIRECT_URL');
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    ...(redirectTo ? { redirectTo } : {}),
    data: { display_name: name, nido_scope: scope },
  });
  if (error || !data.user?.id) {
    const msg = error?.message ?? 'Supabase Auth invitation could not be created';
    if (/already been registered|already exists|duplicate/i.test(msg)) {
      throw new HttpError(
        409,
        'An account with this email already exists',
        'duplicate_auth_email',
        msg,
      );
    }
    throw new HttpError(
      500,
      'Unable to send user invitation',
      'invite_creation_failed',
      msg,
    );
  }
  return data.user.id;
}

export async function cleanupAuthUser(
  admin: SupabaseClient,
  authUserId: string,
  scope: 'nido_internal' | 'client_portal',
): Promise<void> {
  try {
    if (scope === 'nido_internal') {
      await admin.from('nido_users').delete().eq('auth_user_id', authUserId);
    } else {
      await admin.from('client_users').delete().eq('auth_user_id', authUserId);
    }
    await admin
      .from('auth_identity_registry')
      .delete()
      .eq('auth_user_id', authUserId);
    await admin.auth.admin.deleteUser(authUserId);
  } catch (cleanupErr) {
    console.error('Auth cleanup failed:', safeLogMessage(cleanupErr));
  }
}

export async function writeAudit(
  admin: SupabaseClient,
  row: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await admin.from('nido_provisioning_audit').insert(row);
    if (error) {
      console.error('Provisioning audit write failed:', safeLogMessage(error));
    }
  } catch (auditErr) {
    console.error('Provisioning audit write threw:', safeLogMessage(auditErr));
  }
}

export function safeLogMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Unexpected server error';
  return raw
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
    .replace(/(apikey|secret|password|token)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 400);
}

export async function enforceRateLimit(
  admin: SupabaseClient,
  policy: RateLimitPolicy,
  actorKey: string,
): Promise<void> {
  const normalizedActor = actorKey.trim();
  if (!normalizedActor) {
    throw new HttpError(
      500,
      'Unable to verify rate limit',
      'rate_limit_invalid_actor',
    );
  }

  const { data, error } = await admin.rpc('consume_nido_rate_limit', {
    p_scope_key: policy.scopeKey,
    p_actor_key: normalizedActor,
    p_max_requests: policy.maxRequests,
    p_window_seconds: policy.windowSeconds,
  });

  if (error || !data || typeof data !== 'object') {
    throw new HttpError(
      500,
      'Unable to verify rate limit',
      'rate_limit_check_failed',
      error?.message ?? 'Empty rate limit response',
    );
  }

  const payload = data as {
    allowed?: boolean;
    retry_after_seconds?: number;
  };

  if (payload.allowed !== true) {
    const retryAfter = Math.max(
      1,
      Math.ceil(Number(payload.retry_after_seconds ?? policy.windowSeconds)),
    );
    throw new HttpError(
      429,
      'Too many requests. Please try again later.',
      'rate_limit_exceeded',
      `Rate limit exceeded for ${policy.scopeKey}`,
      { 'Retry-After': String(retryAfter) },
    );
  }
}

export function mapErrorToHttpResponse(error: unknown): {
  status: number;
  publicMessage: string;
  reason: string;
  headers?: Record<string, string>;
} {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      publicMessage: error.publicMessage,
      reason: error.reason,
      headers: error.headers,
    };
  }

  const pgCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (pgCode === '23505') {
    return {
      status: 409,
      publicMessage: 'A conflicting record already exists',
      reason: 'unique_violation',
    };
  }
  if (pgCode === '42501') {
    return {
      status: 403,
      publicMessage: 'You are not authorized to perform this operation',
      reason: 'insufficient_privilege',
    };
  }
  if (
    pgCode === '22023' ||
    pgCode === '22P02' ||
    pgCode === '23502' ||
    pgCode === '23514'
  ) {
    return {
      status: 400,
      publicMessage: 'One or more provided values are invalid',
      reason: 'invalid_input',
    };
  }
  if (pgCode === '23503') {
    return {
      status: 404,
      publicMessage: 'Referenced resource was not found or is inactive',
      reason: 'missing_reference',
    };
  }

  return {
    status: 500,
    publicMessage: 'An unexpected server error occurred',
    reason: 'internal_error',
  };
}
