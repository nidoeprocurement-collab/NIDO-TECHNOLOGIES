---
name: Local auto-assignment configuration
description: Tier rules for order assignment and the isolated browser-only test bench.
---

Real-order tier rules and round-robin position are stored in the current browser. Keep the test bench and its sample history separate so simulations do not advance operational assignment rotation.

**Why:** The user requested a local-only prototype with no backend connections; order creation must therefore assign using the same browser's saved rules.

**How to apply:** Save and resolve live rules in browser storage. Do not describe browser-side assignments as secure or shared across users/devices. Keep simulations and demo history isolated from real-order assignment state.
