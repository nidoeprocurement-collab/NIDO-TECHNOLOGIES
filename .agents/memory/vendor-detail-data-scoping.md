---
name: Vendor detail data scoping
description: Rules for keeping vendor detail tabs isolated to the selected vendor's live records.
---

Vendor detail tabs use explicit vendor ID/name references as the ownership boundary. Records without a vendor reference are excluded from scoped views rather than inferred from client, location, contact, or other unrelated fields.

**Why:** Several legacy stores contain global or demo data and do not consistently record vendor ownership. Inferring ownership can expose another vendor's data.

**How to apply:** Preserve optional global-page behavior, but when a selected vendor is passed to a detail tab, filter live stores strictly by vendor ID/name and show empty or zeroed states when no matching records exist.