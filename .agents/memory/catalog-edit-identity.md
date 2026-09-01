---
name: Catalog edit identity
description: Master catalog records may carry legacy IDs with inconsistent runtime types.
---

Master catalog edit and duplicate checks must normalize record IDs before comparing them.

**Why:** A record loaded from older local storage can have an ID whose runtime type differs from the route or newly built record. Strict comparison then treats the record being edited as a separate duplicate.

**How to apply:** Use a normalized ID comparison for lookup, duplicate exclusion, and in-place update; continue checking names against other records.