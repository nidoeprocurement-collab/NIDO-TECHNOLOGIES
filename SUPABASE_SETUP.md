# NIDO Supabase Setup Guide (Development & Production)

This repository uses **two completely separate Supabase projects** sharing one version-controlled migration directory (`supabase/migrations/`):

1. **`nido-dev`** — Development & testing database
2. **`nido-prod`** — Production database

> **Security Rules**
> - Never commit `.env.development`, `.env.production`, `.env.local`, `supabase/.temp/`, `service_role` keys, or database passwords to GitHub.
> - Never use `nido-prod` credentials during local development or testing.
> - Never place `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` frontend environment variable.

---

## 1. Create the Two Supabase Projects (Manual Dashboard Steps)

1. Sign in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create **Project 1 (Development)**:
   - Name: `nido-dev`
   - Region: Select your primary region (e.g., `ap-south-1` Mumbai)
   - Store the database password in a secure password manager.
3. Create **Project 2 (Production)**:
   - Name: `nido-prod`
   - Region: Same region as `nido-dev`
   - Use a separate strong database password stored in production secrets only.

---

## 2. Connect & Apply Phase 1 Migrations to `nido-dev` Only

Run from the repository root (`NIDO-TECHNOLOGIES`):

```powershell
# 1. Authenticate Supabase CLI (opens browser login)
npx supabase login

# 2. Link ONLY the development project (replace with your actual nido-dev ref)
npx supabase link --project-ref <NIDO_DEV_PROJECT_REF>

# 3. Verify linked project before pushing
npx supabase projects list

# 4. Apply Phase 1 migrations to nido-dev
npx supabase db push
```

---

## 3. Production Promotion (`nido-prod`)

Do **not** link `nido-prod` on developer laptops. Apply migrations to `nido-prod` only after `nido-dev` passes all Phase tests, via CI/CD or a dedicated release step:

```powershell
npx supabase link --project-ref <NIDO_PROD_PROJECT_REF>
npx supabase db push
```

---

## 4. Phase 1 Security Deferral Note

RLS policies for `document_sequences`, `platform_settings`, and `migration_batches` are intentionally deferred to **Phase 2** and **Phase 4** when `nido_users`, `client_users`, and `SECURITY DEFINER` authorization helpers (`app.is_nido_internal()`, `app.is_system_owner()`) are introduced. This prevents premature policies from locking out database administration during initial setup.
