---
name: Digital fulfillment status authority
description: The linked PO line is the source of truth for digital fulfillment progress.
---

Order Details must not let a digital item advance beyond the status saved on its linked confirmed PO line. After the PO line reaches that stage, Order Details may catch up; partial provisioning must reuse the exact completed quantity already recorded on the PO. A single-unit order cannot be partially provisioned.

**Why:** The user explicitly requires the PO detail status to be updated before the same fulfillment status can be applied in Order Details, to prevent the two views from diverging.

**How to apply:** Keep the check in both the visible Order Details status menu and its update handler. Compare normalized digital stages so saved partial quantities still match their stage, and copy the PO's partial count rather than prompting for a second value.
