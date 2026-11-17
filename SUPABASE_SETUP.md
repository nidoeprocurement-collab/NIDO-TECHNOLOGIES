# NIDO Supabase Setup Guide (Development & Production)

This repository uses **two completely separate Supabase projects** sharing one version-controlled migration directory (`supabase/migrations/`):

1. **`nido-dev`** — Development & testing database (the **only** project linked locally)
2. **`nido-prod`** — Production database (promoted **only** via protected CI/CD deployment)

> **Security Rules**
> - Never commit `.env.development`, `.env.production`, `.env.local`, `supabase/.temp/`, `service_role` keys, or database passwords to GitHub.
> - Never use `nido-prod` credentials during local development or testing.
> - **Never run `supabase link` against `nido-prod` on a developer workstation.**
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
   - Use a separate strong database password stored in protected CI/CD / production secrets only.

---

## 2. Local Migration Validation vs. Remote Application

- **Local Validation (No Remote Changes):**
  - Inspect `supabase/migrations/` ordering, syntax, constraints, RLS, and privilege revocations locally (or against a local Docker Supabase instance via `npx supabase start` / `npx supabase db reset` if Docker is available) before pushing to `nido-dev`.
- **Remote Application (`nido-dev` Only):**
  - `npx supabase db push` applies pending migrations to the linked remote database. Only `nido-dev` may be linked locally:

```powershell
# 1. Authenticate Supabase CLI
npx supabase login

# 2. Link ONLY the development project (never link nido-prod locally)
npx supabase link --project-ref <NIDO_DEV_PROJECT_REF>

# 3. Verify the linked project is nido-dev before pushing
npx supabase projects list

# 4. Apply migrations to nido-dev
npx supabase db push
```

---

## 3. Protected Production Promotion (`nido-prod`)

- Do **not** link `nido-prod` from any developer workstation.
- Promote tested, peer-reviewed migrations from `main` to `nido-prod` exclusively through a protected CI/CD pipeline (using protected `SUPABASE_ACCESS_TOKEN`, `NIDO_PROD_PROJECT_REF`, and `NIDO_PROD_DB_PASSWORD` deployment secrets with manual approval gates).

---

## 4. Phase 1 Security Model

- RLS is **enabled** (default-deny) on `document_sequences`, `platform_settings`, and `migration_batches`, and direct table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`.
- `allocate_document_number(text, text)` is restricted to `service_role` only.
- Browser-facing RLS policies will be added in **Phase 2** and **Phase 4** once `nido_users`, `client_users`, and `SECURITY DEFINER` authorization helpers (`app.is_nido_internal()`, `app.is_system_owner()`) are introduced.
