---
name: Report workbook view availability
description: Scope and ordering rules for report views defined by the NIDO workbook.
---

Only expose a workbook report view in Create Report when an existing platform data source can populate it. Keep its columns in the exact workbook order, including report-run metadata columns.

**Why:** The workbook lists more report views than the current platform stores support, and the user chose to include only views with live platform data rather than offer empty or fabricated reports.

**How to apply:** Before exposing another workbook view, connect it to a real store or a calculation over live records. Keep unsupported views out of the selectable module lists until then.

In every report module, item-list columns show product names only; remove duplicate column labels from the module selector, preview, exports, and saved report downloads.

**Why:** The user asked for names-only item columns and no duplicated report columns across modules.

**How to apply:** Keep this output rule centralized so the same columns and values appear in report previews, new downloads, and historical downloads.
