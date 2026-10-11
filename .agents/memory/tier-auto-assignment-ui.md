---
name: Tier auto-assignment UI boundary
description: Keep tier-based configuration drafts isolated from current order assignment until server-side support is authorized and implemented.
---

The Premium, Medium, and Standard configuration UI is a browser-local prototype only. It must not change the existing department/role assignment rules or trigger order assignment. Live round-robin position, assignment history, authorization, fallback actions, and order integration require later backend work.

**Why:** The user explicitly deferred backend connections; blending draft tier settings into the existing resolver could silently change assignments before durable server-side behavior exists.

**How to apply:** Keep future tier configuration isolated from `autoAssignmentStore` and the order creation path until the user requests backend implementation. Clearly label previews and local saves as non-live.
