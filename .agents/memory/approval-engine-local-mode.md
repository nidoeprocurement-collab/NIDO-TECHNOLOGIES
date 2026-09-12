---
name: Approval engine local mode
description: Local approval workflow execution is the current pre-database mode and preserves the backend service contract.
---

The approval workflow service defaults to browser-local persistence so the complete workflow can be exercised before the database is connected. The same exported service functions retain the backend response shapes, and backend mode is enabled explicitly with `VITE_APPROVAL_BACKEND=true`.

**Why:** The imported NIDO application currently has backend approval routes but no configured approval database, while the workflow needs to be validated end-to-end before backend integration.

**How to apply:** Keep workflow configuration, requests, version history, condition evaluation, sequential approvals, and action timelines behind the shared approval service. Do not add separate module-specific approval stores; switch the adapter flag when persistent backend testing begins.

## Client order PO gate

Client portal orders that match an active approval workflow must not create vendor purchase orders while the request is pending. The shared approval action completes the workflow first, then releases the order's Draft POs idempotently after the final `Approved` status. Client orders with no matching workflow continue directly to Draft PO creation.

**Why:** Creating a Draft PO before client approval lets procurement work begin on an order that may still be rejected, and repeated approval actions must never duplicate POs.

**How to apply:** Keep the gate in the shared order/approval services rather than only in a page button. Both owner approvals and client-portal approvals call the same approval action path, so both release behavior and duplicate protection stay consistent.