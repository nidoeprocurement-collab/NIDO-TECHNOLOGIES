# Phase 2C Review Notes

## Source-specific observations

The reviewed NIDO archive already has Phase 1, Phase 2A, and Phase 2B migrations. The current schema includes `auth_identity_registry`, `nido_users`, `client_users`, `nido_roles`, `client_roles`, `client_organizations`, `nido_login_history`, `get_my_auth_context()`, and the protected user/role triggers.

The archive does not include a Supabase client dependency or deployed Edge Function source. Its `UserInvitationPage.tsx` and `UserOnboardingPage.tsx` are placeholder components. The current AuthContext and user stores remain localStorage-based, including legacy plaintext-password handling. This package does not modify those files.

## Why the email confirmation change is included

The Phase 2B `app.has_verified_auth_email(uuid,text,jsonb)` helper checked that the Auth email matched the profile email, but did not require `auth.users.email_confirmed_at` to be non-null. Phase 2C migration 000007 adds that check. New invitation profiles therefore cannot obtain an authenticated NIDO context before email confirmation.

This is a behavior change and must be reviewed and applied as a new migration, not by editing a previously applied migration.

## Why the client creation RPC is included

The existing deferred trigger `app.trg_client_admin_invariant()` requires every Active or Inactive client organization to have at least one active Client Admin. Creating the organization and admin in separate REST transactions would fail the invariant or risk an incomplete workflow. The new service-role-only `public.provision_client_org_admin(...)` performs registry, organization, and first-admin inserts in one PostgreSQL transaction. Similarly, `public.bootstrap_nido_system_owner(...)` creates the System Owner role, identity registry row, profile, and audit event in one transaction because the deferred System Owner invariant rejects a role without an active owner profile at commit.

## Security model in this package

- Supabase Auth owns credentials and invitation lifecycle.
- Edge Functions own privileged account provisioning.
- Browser callers supply their current user JWT; functions validate it and call `get_my_auth_context()` to determine the caller's NIDO scope and permissions.
- The service/secret key is read only by server-side Edge Functions.
- Internal RBAC and Client Portal RBAC remain separate.
- Internal role assignment requires both `users.create` and `users.manage`; System Owner bypasses those checks but cannot be assigned through the ordinary internal-user endpoint.
- Client Admin provisioning is constrained to the caller's own `client_id`.
- Audit records omit credentials and invitation tokens.

## Items to validate in a staging run

1. Supabase Edge Function runtime key environment variable format for the specific `nido-dev` project (the helper supports both current JSON key maps and legacy single-key variables).
2. Auth invite email delivery and redirect allow-list configuration.
3. The System Owner role trigger/invariant behavior with the actual `nido-dev` state.
4. Whether current internal UI permission labels map exactly to the `users` and `clients` module keys (the database catalogue includes those keys).
5. End-to-end onboarding callback before sending any real invitation.
6. Audit rollback and cleanup behavior under simulated Auth or database failures.

## Explicitly not certified

The package has not been deployed, run through Deno type-checking, or subjected to live Supabase integration tests. Its SQL and TypeScript require review and a controlled `nido-dev` staging test before use with real users. Structural migration verification is not a substitute for runtime tenant-isolation or authorization testing.
