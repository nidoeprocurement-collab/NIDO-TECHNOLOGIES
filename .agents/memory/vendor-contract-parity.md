---
name: Vendor contract page parity
description: Vendor contract details follow the client contract page's shell and in-place section editing pattern.
---

Keep the vendor contract detail view visually identical to the client contract page's shell: matching identity row and bordered frame, header, metadata bar, three-column grid, and section-card styling. Preserve all vendor-only contract and vendor fields; do not add client-only content or invent missing values. Contract-owned fields can be edited there and saved to the vendor contract record; vendor directory details are read-only and should not display misleading edit controls.

**Why:** The user explicitly corrected an earlier approximate match: the vendor contract must look exactly like the client contract while keeping vendor data. Vendor contact/address data belongs to the vendor directory rather than the contract record.

**How to apply:** Compare the complete vendor contract tab shell against the client contract view, not only the detail panel. Keep vendor-specific labels, values, and edit scope; route vendor master-data changes through vendor management, not contract edits.
