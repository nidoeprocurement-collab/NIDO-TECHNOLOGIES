---
name: Global currency display
description: Currency display must follow the saved General Settings localization currency across commerce, accounting, and generated documents.
---

The saved `localization.currency` and `localization.currencySymbol` values are the single source of truth for displayed amounts. Accounting/procurement defaults should be synchronized to that setting, and UI components should use the live i18n formatter so a saved change updates without a reload. Non-React PDF generators should read the saved config at generation time and format their totals from the same source.

**Why:** A separate hardcoded INR path caused shop, accounting pages, and downloaded documents to disagree after a currency change.

**How to apply:** Use `useI18n()` plus the shared formatter in React screens; use `loadConfig()` plus the shared formatter in PDF/data helpers. Do not add new `₹`, `INR`, or fixed `en-IN` amount formatters.