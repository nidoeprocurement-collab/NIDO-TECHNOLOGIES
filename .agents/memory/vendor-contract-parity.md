---
name: Vendor contract page parity
description: Vendor contract details follow the client contract page's shell and in-place section editing pattern.
---

Keep the vendor contract detail view aligned with the client contract page's header, metadata bar, section-card styling, top-right download menu, and section-level edit dialogs. Contract-owned fields can be edited there and saved to the vendor contract record; vendor directory details are read-only and should not display misleading edit controls.

**Why:** The vendor and client contract views should behave consistently, but vendor contact/address data belongs to the vendor directory rather than the contract record.

**How to apply:** For future contract detail changes, preserve the shared visual and interaction pattern while keeping vendor-specific labels and fields. Route vendor master-data changes through vendor management, not contract edits.
