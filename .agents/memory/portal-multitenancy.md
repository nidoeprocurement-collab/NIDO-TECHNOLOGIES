---
name: Multi-tenant Client Portal Architecture
description: How the NIDO Client Portal is layered on top of the Admin Platform — user types, routing, user registry, provisioning.
---

## Architecture

The Client Portal is NOT a separate app. It shares the same React app, routes, and AppLayout. Differentiation is entirely by `userType`.

## User Types (`src/contexts/AuthContext.tsx`)

`User.userType: 'nido_admin' | 'client_admin' | 'client_user'`

- `nido_admin` — existing owner/admin. Back-compat: old sessions without `userType` get `nido_admin`.
- `client_admin` — provisioned client admin, can manage their portal users/roles
- `client_user` — regular client user

`User.clientId` and `User.clientName` are set for client portal users.

## Portal User Registry (`src/lib/portalUserStore.ts`)

localStorage key: `nido_portal_users` — array of `PortalUser` objects (plain-text password for demo).
Functions: `getPortalUsers`, `savePortalUsers`, `addPortalUser`, `updatePortalUser`, `deletePortalUser`, `findPortalUser`, `getPortalUsersByClient`, `isClientProvisioned`, `provisionClientPortal`.

## Login Routing (`src/pages/LoginPage.tsx`)

1. Hardcoded check for `owner@nidotech.com` / `Owner@123` → `nido_admin` → `/dashboard`
2. Lookup in `portalUserStore` → `client_admin`/`client_user` → `/portal/dashboard`

## Route Guards (`src/App.tsx`)

- `ProtectedRoute` — basic auth check (any logged-in user)
- `AdminOnlyRoute` — blocks client portal users, redirects them to `/portal/dashboard`
- `ClientPortalRoute` — blocks NIDO admins, redirects them to `/dashboard`

## Sidebar (`src/components/layout/Sidebar.tsx`)

Reads `isClientPortalUser` from `useAuth()`. Shows `clientNavigationItems` (portal nav) or `adminNavigationItems` (full admin nav). Sign-out button is wired to `logout()` + navigate to `/login`. Profile section shows actual user name/role from context.

## Portal Routes

All under the existing `AppLayout` wrapper, prefixed `/portal/`:
- `/portal/dashboard` → `ClientPortalDashboard`
- `/portal/catalog` → `ShopPage` (reused)
- `/portal/orders` → `MyOrderPage` (reused)
- `/portal/services` → `ServicesPage` (reused)
- `/portal/invoices` → `InvoicePage` (reused)
- `/portal/contracts` → `ClientContractsPage` (reused)
- `/portal/reports` → `AuditTrailPage` (reused)
- `/portal/notifications` → `NotificationsPage` (reused)
- `/portal/support` → `SupportPage` (reused)
- `/portal/profile` → `UserProfilePage` (reused)
- `/portal/users` → `ClientPortalUsersPage` (new)
- `/portal/roles` → `ClientPortalRolesPage` (new)
- `/portal/addresses` → `ClientPortalAddressesPage` (new)

## Client Provisioning (`src/pages/ClientsPage.tsx`)

Dropdown action "Provision Client Portal" on each client row calls `provisionClientPortal(clientId, clientName)`:
- Generates email `admin@{slug}.portal`, password `Admin@{4-digit}!`
- Stores in `nido_portal_users`
- Dialog shows credentials with copy buttons

## Role Persistence

Client portal roles stored in localStorage: `nido_portal_roles_{clientId}`.

## Why

Spec requires single codebase, unlimited clients, full isolation. localStorage is the prototype backend — swap for real DB (Task #2) once MongoDB is connected. All client-scoped data flows through `user.clientId` from the session; never from the frontend directly.
