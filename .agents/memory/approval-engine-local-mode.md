---
name: Approval engine local mode
description: Local approval workflow execution is the current pre-database mode and preserves the backend service contract.
---

The approval workflow service defaults to browser-local persistence so the complete workflow can be exercised before the database is connected. The same exported service functions retain the backend response shapes, and backend mode is enabled explicitly with `VITE_APPROVAL_BACKEND=true`.

**Why:** The imported NIDO application currently has backend approval routes but no configured approval database, while the workflow needs to be validated end-to-end before backend integration.

**How to apply:** Keep workflow configuration, requests, version history, condition evaluation, sequential approvals, and action timelines behind the shared approval service. Do not add separate module-specific approval stores; switch the adapter flag when persistent backend testing begins.