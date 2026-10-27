# Market connection recovery grounding — 2026-10-27

Reported screenshot: /bitcoin shows signal is aborted without reason and Loading market readings.

frontend/src/marketClient.js aborts after 12,000 ms and has no catch to distinguish its timeout from navigation cancellation. frontend/src/useSharedSimulation.js displays failure.message directly and retries every three seconds when no request is active. This allows browser DOMException text to become UI. MarketTracker.jsx has no explanation of backend wake-up while no snapshot is available.

Fix only the public market read timeout/error handling and the initial connection text. Retain server-owned state, GET-only behavior, HTTP origin and authentication boundaries. No API, database, paid hosting or simulation-control changes are required.
