---
name: Platform data storage
description: The selected shared database and preservation requirements for platform data migration.
---

Use Replit PostgreSQL as the shared source of truth for persistent platform data. Preserve existing records until their migration is verified.

**Why:** The user selected Replit PostgreSQL for shared platform data.

**How to apply:** New persistent features should use the shared Replit database. Migrate existing data without deleting the source, and enforce tenant and role permissions on the server.
