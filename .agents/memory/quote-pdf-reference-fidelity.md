---
name: Quote PDF reference fidelity
description: The visual contract for quotation PDF downloads based on the uploaded estimate reference.
---

Quote downloads must serve the uploaded reference estimate PDF unchanged, byte-for-byte, rather than regenerating a PDF from quote data. The existing Download PDF controls should point to that original asset.

**Why:** The user explicitly requires the attached estimate to be viewed exactly as provided, with no changes to its content or layout.

**How to apply:** Keep the source PDF as a static uploaded asset and stream it directly from the server with its original bytes and a clean download filename. Do not use jsPDF or quote-data rendering for the Download PDF action.