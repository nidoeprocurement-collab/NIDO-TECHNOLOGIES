# NIDO Phase 2C — Deployment and Testing Guide

## 0. Read before running anything

This package is prepared for `nido-dev` only:

- Development ref: `eicjhhmkpqcnmwrfztit`
- Production ref: `mulwqupmdkekvndiwqvk` — **do not link or deploy this package to it**.

The package is not yet deployed. Do not run the migration or deploy functions until you have reviewed the SQL and function code.

## 1. Add the files to the existing NIDO repository

Copy the package's `supabase/migrations/20261118000007_phase2c_provisioning_foundation.sql` into the existing repository's `supabase/migrations/` folder.

Copy the three function folders and `_shared` folder into the existing repository's `supabase/functions/` folder. Do not replace the existing `supabase/config.toml`, migrations, `src/`, or frontend files.

Expected additions:

```text
supabase/
  migrations/
    20261118000007_phase2c_provisioning_foundation.sql
  functions/
    _shared/core.ts
    bootstrap-system-owner/index.ts
    provision-internal-user/index.ts
    provision-client-access/index.ts
```

## 2. Confirm the linked project before any deployment

From the NIDO repository root in PowerShell:

```powershell
npx.cmd supabase projects list
```

Confirm that the linked project is `nido-dev` with ref `eicjhhmkpqcnmwrfztit`. If it is not, link the development project:

```powershell
npx.cmd supabase link --project-ref eicjhhmkpqcnmwrfztit
npx.cmd supabase projects list
```

Do not continue unless the linked project is `nido-dev`.

## 3. Review the migration before applying

Open `supabase/migrations/20261118000007_phase2c_provisioning_foundation.sql` and verify that it is the exact file from this package.

The migration makes three changes:

- creates `public.nido_provisioning_audit` with RLS enabled and forced, and grants access only to `service_role`;
- strengthens `app.has_verified_auth_email(...)` to require `auth.users.email_confirmed_at IS NOT NULL` as well as an email match;
- creates `public.bootstrap_nido_system_owner(...)` and `public.provision_client_org_admin(...)`, `SECURITY DEFINER` RPCs with fixed search paths and EXECUTE granted only to `service_role`.

This is a forward-only migration. If it has been applied, do not edit it or re-run modified SQL under the same migration name. Prepare a new timestamped corrective migration instead.

After review and explicit approval, apply it to the linked development project:

```powershell
npx.cmd supabase db push --remote
```

Check the output: it should apply only `20261118000007_phase2c_provisioning_foundation.sql` if that is the only pending migration. If other migrations are pending, stop and review them first.

## 4. Verify the migration in the nido-dev SQL Editor

Run these read-only checks in Supabase Dashboard → `nido-dev` → SQL Editor:

```sql
-- A. Audit table and RLS
SELECT
  to_regclass('public.nido_provisioning_audit') AS audit_table;

SELECT relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE oid = 'public.nido_provisioning_audit'::regclass;

-- B. Email-confirmation helper exists as SECURITY DEFINER
SELECT n.nspname, p.proname, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'app'
  AND p.proname = 'has_verified_auth_email';

-- C. Atomic RPC and execute privileges
SELECT
  p.proname,
  p.prosecdef,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('bootstrap_nido_system_owner', 'provision_client_org_admin')
ORDER BY p.proname;
```

Expected: audit table exists, both RLS flags are `true`, the helper and both RPCs are `SECURITY DEFINER`, service_role execute is `true`, authenticated and anon execute are `false` for both RPCs.

## 5. Configure Edge Function secrets in nido-dev

Open Supabase Dashboard → `nido-dev` → Edge Functions → Secrets.

Set these custom secrets:

| Secret | Required value |
|---|---|
| `NIDO_BOOTSTRAP_SECRET` | A newly generated random secret of at least 32 characters. Keep it private. |
| `NIDO_ALLOWED_ORIGINS` | Exact frontend origin(s), comma-separated, e.g. `https://your-dev-domain.example` (replace with your actual development URL). No paths or trailing slash. |
| `NIDO_INVITE_REDIRECT_URL` | Leave unset until the Phase 2D invite/onboarding callback route is implemented and allow-listed. |

Supabase injects project URL and server/public API keys into Edge Function environments. Do not paste a service-role/secret key into frontend `.env` files or this repository. The functions read the injected server secret key only inside Edge Functions.

Also check Supabase Authentication → URL Configuration. The final invitation redirect URL must be allow-listed there once the onboarding callback route exists.

## 6. Deploy Edge Functions only after the migration is verified

From the repository root, with `nido-dev` still linked:

```powershell
npx.cmd supabase functions deploy provision-internal-user
npx.cmd supabase functions deploy provision-client-access
npx.cmd supabase functions deploy bootstrap-system-owner --no-verify-jwt
```

The bootstrap function disables gateway JWT verification because the very first System Owner has no account yet. It performs its own separate secret check. Its SQL RPC creates the System Owner role and profile in one transaction to satisfy the existing deferred System Owner invariant. Never expose the bootstrap secret in browser code. The other two functions retain normal Supabase JWT verification and independently validate the caller and NIDO authorization context.

## 7. Function request contracts (do not call until Phase 2D invite acceptance is ready)

All endpoints are POST requests to:

```text
https://<nido-dev-project-ref>.supabase.co/functions/v1/<function-name>
```

### Bootstrap the first System Owner

Function: `bootstrap-system-owner`

Headers:

```text
Content-Type: application/json
x-nido-bootstrap-secret: <secret stored in nido-dev Edge Function Secrets>
```

Body:

```json
{
  "email": "first.owner@example.com",
  "name": "First System Owner",
  "employee_id": "NIDO-00001",
  "phone": "+91XXXXXXXXXX"
}
```

This is a one-time operation. It creates/reuses the protected System Owner role, sends an Auth invitation, and creates the profile. It refuses to run if a System Owner profile already exists. The example values are placeholders; replace them only when deliberately performing the bootstrap.

### Provision an internal employee

Function: `provision-internal-user`

Headers: `Authorization: Bearer <current-user-access-token>` and `Content-Type: application/json`.

Body:

```json
{
  "email": "employee@example.com",
  "name": "Example Employee",
  "employee_id": "NIDO-00002",
  "role_id": "<existing-active-non-system-owner-role-uuid>",
  "nido_org_id": null,
  "phone": "+91XXXXXXXXXX",
  "department": "Procurement",
  "designation": "Purchase Executive",
  "job_title": "Purchase Executive"
}
```

Requires `users.create` and `users.manage`, or System Owner. System Owner role assignment is prohibited through this ordinary endpoint.

### Create a client organization and its first Client Admin

Function: `provision-client-access`

Headers: `Authorization: Bearer <current-user-access-token>` and `Content-Type: application/json`.

Body:

```json
{
  "action": "create_client_organization_admin",
  "email": "client.admin@example.com",
  "name": "Example Client Admin",
  "phone": "+91XXXXXXXXXX",
  "client_name": "Example Client Private Limited",
  "category": "Manufacturing",
  "tier": "Standard",
  "rep_name": "Example Client Admin",
  "nido_org_id": null
}
```

Requires internal `clients.create`, or System Owner. The database RPC creates the client organization and first active Client Admin in one transaction.

### Add a user to an existing client organization

Function: `provision-client-access`

Body:

```json
{
  "action": "create_client_user",
  "client_id": "<existing-client-organization-uuid>",
  "client_role_id": "<active-role-uuid-from-the-same-client>",
  "email": "requester@example.com",
  "name": "Example Requester",
  "phone": "+91XXXXXXXXXX",
  "client_employee_code": "EMP-001",
  "department": "Purchase",
  "designation": "Requester"
}
```

An internal caller requires `clients.manage`. A Client Admin may provision only within their own client organization. The selected role must belong to that client and be active.

## 8. Testing plan (after the onboarding callback is implemented)

Use dedicated test email addresses and test-only records in `nido-dev`.

1. Bootstrap exactly one System Owner; verify a second bootstrap attempt is rejected.
2. Before invitation acceptance, confirm the Auth user's `email_confirmed_at` is null and `get_my_auth_context()` does not grant NIDO access.
3. Accept invitation, set password through the frontend callback, confirm email, then verify `get_my_auth_context()` returns the expected internal context.
4. Verify an internal user without `users.create` cannot provision another employee.
5. Verify `users.create` without `users.manage` cannot assign a role.
6. Verify ordinary provisioning cannot assign the System Owner role.
7. Create a client organization and first Client Admin; verify the organization and admin both exist and the deferred invariant passes.
8. Verify a Client Admin cannot create users in another client organization.
9. Verify a client role from Client A cannot be assigned to a user in Client B.
10. Verify an internal user without `clients.manage` cannot provision client users.
11. Verify no passwords, access tokens, invite tokens, or recovery codes appear in audit rows or logs.
12. Verify all provisioning events are present in `nido_provisioning_audit` and that browser roles cannot read that table.

Do not use the System Owner bootstrap endpoint as a routine account-creation endpoint. Disable/delete the bootstrap function after the first owner has been successfully established, or at minimum remove `NIDO_BOOTSTRAP_SECRET` from the project secrets after bootstrap.

## 9. Known work intentionally deferred to Phase 2D / later

- Supabase client initialization in the React app.
- Replacing localStorage-based AuthContext and password comparisons.
- Invite callback route, OTP verification, password setup, and recovery UI.
- Login/logout session lifecycle and login-history instrumentation.
- Password reset UX and account recovery integration.
- Frontend permission context cutover and route guards.
- Migration of valid existing business records from local stores to Supabase.
- Runtime tenant-isolation test suite and final security sign-off.

These are not omissions by accident: they require frontend and end-to-end work, and must not be represented as complete merely because the Edge Functions deploy successfully.
