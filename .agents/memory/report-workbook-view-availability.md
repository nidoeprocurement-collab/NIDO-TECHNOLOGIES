---
name: Report workbook view availability
description: Scope and ordering rules for report views defined by the NIDO workbook.
---

Only expose a workbook report view when an existing platform data source can populate it. Keep columns in exact workbook order, and hide any field that has no nonblank value in current source records. Never fabricate unavailable fields or present source documents as posted ledger entries.

**Why:** The workbook lists more report views and fields than the current platform stores support, and the user chose to show only data backed by current records.

**How to apply:** Before exposing a view or field, connect it to a real store or a calculation over live records. Keep unsupported views out of selectable module lists and unsupported fields out of selection, preview, and export. Preserve report-run metadata columns and workbook order.

In every report module, item-list columns show product names only; remove duplicate column labels from the module selector, preview, exports, and saved report downloads.

**Why:** The user asked for names-only item columns and no duplicated report columns across modules.

**How to apply:** Keep this output rule centralized so the same columns and values appear in report previews, new downloads, and historical downloads.
