---
name: Platform data storage
description: The platform currently runs as a browser-only prototype with no shared database connection.
---

Keep application persistence local to the browser. Do not reconnect PostgreSQL or add server-side data APIs unless the user explicitly requests a production backend. Existing database records were not deleted when the application connection was removed.

**Why:** The user requested removal of backend/API code and selected a local-only prototype.

**How to apply:** New prototype features should use browser storage and clearly disclose that data is device-local and not secure. If production functionality is requested later, treat secure server authentication, tenant isolation, shared persistence, and authorization as a separate design task.
