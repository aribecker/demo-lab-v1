# Shared simulation v2.5.0 — implementation ready, activation pending storage

Branch: proximo-desarrollo-hello-world. Master specifications R29–R32 were published before implementation in a9522be4a9fac3c4426570b2626bed610e225322. Grounding is in specs/traceability.md; rollout prerequisites are in docs/shared-simulation-setup.md.

## Implemented

- One PostgreSQL singleton document with the complete settings/run-pause/holding state, funds, fees, history, ledger, previous price and command revisions.
- Server scheduling independent of clients; atomic received-asset fee/trade updates, row-lock serialization, poll-slot guard, command UUID idempotence and control-revision conflict detection.
- Browser read-only lifecycle; explicit central commands for controls/reset/start/pause/refresh, valid field persistence and shared-action notice.
- Missing storage returns safe503 with no volatile/local fallback. Existing weather/auth contracts and readiness remain available.

## Local validation

- All29 Java tests passed, including JDBC state re-creation, two service instances, duplicate/concurrent poll slots/commands, persisted pause and settings, whole-document rollback, provider errors, cash-only reset/crossing math and the missing-storage HTTP boundary.
- All81 frontend tests passed, including two-client pause/read consistency, reconnect/restored BTC holdings, no auto-command on mount/exit, central +/- and field edits, stale-control conflict handling and no fake session when storage is absent.
- Maven executable-JAR packaging and production Vite/static-route build succeeded.
- Packaged JAR smoke: health200; missing-storage simulation503 with the safe public error, without creating a volatile session.

## Pending live prerequisites

SIMULATION_DATABASE_URL is not yet configured for ariel-demo-next-api. The connected Render API lists the existing same-region database but does not expose its connection credential. The browser Render Dashboard is signed out. Authenticate securely in the task browser to copy the internal database connection directly into backend environment settings; never paste the credential into chat. Then deploy/verify backend PostgreSQL first and activate frontend only after that check passes.

Implementation commits use [skip render] while this prerequisite is pending. The currently published frontend remains v2.4.1; do not report shared persistence as live before the connection/rollout is completed. Local JDBC tests use isolated H2 in PostgreSQL mode, not the production Render database. Actual Render PostgreSQL schema/two-client/restart validation remains pending.

Existing Free Postgres expiry: 2026-11-21T03:09:14Z. Free backend sleeps after15 idle minutes; persistence survives but uninterrupted execution does not. No paid resource/upgrade was created. Previous per-browser runs were not durably saved and are not automatically imported.
