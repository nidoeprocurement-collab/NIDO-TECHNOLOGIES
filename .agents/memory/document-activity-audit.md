---
name: Document activity audit
description: Successful document uploads and downloads should appear in the matching order or PO Notes feed.
---

Successful document uploads and downloads from Order Details or PO Details must create an activity entry in that page's Notes feed, alongside status changes.

When an order or PO reaches Delivered, lock uploads, deletes, and new notes, but keep every existing document visible and downloadable and preserve the authorized Notes conversation history. Delivered is read-only, not hidden.

**Why:** The user asked for file actions to be traceable in the notes below the document sections, and clarified that Delivered should lock edits without hiding files or prior conversation.

**How to apply:** Keep the document and note history rendered in both detail pages while conditionally hiding or disabling mutation controls after delivery. Log the filename and document type with the acting user and timestamp only after an upload is saved or a download is triggered. Store PO activity on the PO and order activity in the order's note feed.
