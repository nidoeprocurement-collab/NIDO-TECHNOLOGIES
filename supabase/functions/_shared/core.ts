import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type AuthContext = Record<string, unknown> & {
  authenticated?: boolean;
  user_scope?: 'nido_internal' | 'client_portal';
  effective_admin_scope?: boolean;
  profile?: Record<string, unknown>;
  role?: Record<string, unknown>;
  permissions?: Record<string, Record<string, boolean>>;
};

function parseDefaultKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed.default ?? Object.values(parsed)[0] as string | undefined;
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
  const secret = parseDefaultKey(envValue('SUPABASE_SECRET_KEYS'))
    ?? envValue('SUPABASE_SERVICE_ROLE_KEY')
    ?? envValue('SUPABASE_SECRET_KEY');
  if (!url || !secret) throw new Error('Supabase server credentials are not configured');
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  const url = envValue('SUPABASE_URL');
  const publishable = parseDefaultKey(envValue('SUPABASE_PUBLISHABLE_KEYS'))
    ?? envValue('SUPABASE_ANON_KEY')
    ?? envValue('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !publishable) throw new Error('Supabase public API credentials are not configured');
  return createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const baseCors = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '';
  const allowed = (envValue('NIDO_ALLOWED_ORIGINS') ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const allowOrigin = allowed.length === 0 ? '*' : (allowed.includes(origin) ? origin : 'null');
  return { ...baseCors, 'Access-Control-Allow-Origin': allowOrigin };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response('ok', { headers: corsHeaders(req) });
}

export function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser server-to-server invocation
  const allowed = (envValue('NIDO_ALLOWED_ORIGINS') ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin);
}

export async function requireCaller(req: Request): Promise<{
  admin: SupabaseClient;
  authUserId: string;
  email: string;
  context: AuthContext;
}> {
  const authorization = req.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('A valid signed-in user session is required');

  const userClient = createUserClient(match[1]);
  const { data: userData, error: userError } = await userClient.auth.getUser(match[1]);
  if (userError || !userData.user?.id || !userData.user.email) {
    throw new Error('The supplied user session is invalid or expired');
  }
  const { data: context, error: contextError } = await userClient.rpc('get_my_auth_context');
  if (contextError || !context?.authenticated) {
    throw new Error('The signed-in account is not an active, provisioned NIDO user');
  }
  return {
    admin: createAdminClient(),
    authUserId: userData.user.id,
    email: userData.user.email,
    context: context as AuthContext,
  };
}

export function isSystemOwner(context: AuthContext): boolean {
  return context.user_scope === 'nido_internal' && context.role?.is_system_owner === true;
}

export function hasPermission(context: AuthContext, moduleKey: string, action: string): boolean {
  return context.permissions?.[moduleKey]?.[action] === true;
}

export function requireInternalPermission(
  context: AuthContext,
  moduleKey: string,
  action: string,
): void {
  if (isSystemOwner(context)) return;
  if (context.user_scope !== 'nido_internal' || !hasPermission(context, moduleKey, action)) {
    throw new Error(`Not authorized: requires internal ${moduleKey}.${action}`);
  }
}

export function requireString(value: unknown, field: string, max = 200): string {
  if (typeof value !== 'string') throw new Error(`${field} is required`);
  const result = value.trim();
  if (!result || result.length > max) throw new Error(`${field} is invalid`);
  return result;
}

export function optionalString(value: unknown, max = 200): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new Error('An optional text field is invalid');
  return value.trim() || null;
}

export function validateEmail(value: unknown): string {
  const email = requireString(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email is invalid');
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
  if (error || !data.user?.id) throw new Error(error?.message ?? 'Supabase Auth invitation could not be created');
  return data.user.id;
}

export async function cleanupAuthUser(
  admin: SupabaseClient,
  authUserId: string,
  scope: 'nido_internal' | 'client_portal',
): Promise<void> {
  if (scope === 'nido_internal') {
    await admin.from('nido_users').delete().eq('auth_user_id', authUserId);
  } else {
    await admin.from('client_users').delete().eq('auth_user_id', authUserId);
  }
  await admin.from('auth_identity_registry').delete().eq('auth_user_id', authUserId);
  await admin.auth.admin.deleteUser(authUserId);
}

export async function writeAudit(
  admin: SupabaseClient,
  row: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from('nido_provisioning_audit').insert(row);
  if (error) console.error('Provisioning audit write failed:', error.message);
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  // Avoid reflecting credential-like values or raw backend payloads.
  return message.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]').slice(0, 300);
}
