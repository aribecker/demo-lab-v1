# Public market connection recovery — 2026-10-27

The market client now allows 90 seconds for a GET instead of 12, normalizes timeout/network/startup-JSON failures into a connection message, and retains immediate navigation cancellation. Initial tracker text explains backend startup; existing polling retries without simulation commands.

Validation: 146 frontend tests passed across 21 files, including five new connection regressions; style contract and production build passed. Before rollout, the live market endpoint returned HTTP 200 after 8.86 seconds on a warmed backend. No database or simulation command was issued. Deployment verification follows the main-branch push.
