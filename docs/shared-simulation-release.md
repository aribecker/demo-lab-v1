# Shared simulation v2.5.1 — autonomous backend

Branch: `proximo-desarrollo-hello-world`.

## SDD

Specifications R33 committed first in `1db68a8fe0a57f116e442c3785ffb6ca4af7b5fc`; code grounding committed next in `df05501ee4cda4c15b690115cde5cb9d826526ea`. Existing R29–R32 implementation is retained.

## Behavior

The Java scheduler alone samples Binance and applies threshold crossings, fees and trades. React reads snapshots and sends explicit commands. Browser close/hide/reload never pauses or resets the shared engine. State remains in `bitcoin_shared.simulation_state` within the existing People database. No People tables are changed. Row locks and durable poll slots serialize instances; commands use UUID idempotence and control revisions.

New execution metadata reports process start, completed scheduler cycle/status, interval and configured hosting mode. Temporary storage failures retry; safe log categories omit credentials. PostgreSQL transaction lock waits are bounded. Graceful shutdown allows current work to finish. A gap over 30 seconds or explicit resume clears only the crossing reference, so no simulated fill spans unobserved downtime.

## Validation

Local Java suite: 31 tests passed, including unattended scheduler-only trading, restart restore, paused holdings, gaps/resume, two-instance locking, idempotence, rollback and provider failure. Fast local storage uses isolated H2. Frontend: 82 tests passed; production build passed.

The Docker build additionally starts disposable PostgreSQL 17 and runs the storage suite against it using SIMULATION_TEST_DATABASE_URL. This test database is never the deployment database. Record remote Docker build outcome in rollout evidence.

## Deployment constraints

Activate backend and verify real PostgreSQL before publishing frontend. SIMULATION_DATABASE_URL is backend-only. Live configuration is managed through Render Dashboard/MCP; credentials do not appear in the repository. SIMULATION_HOSTING_MODE defaults to free, and only becomes always-on after the owner approves and applies a non-sleeping compute plan.

Render Free sleeps after 15 idle minutes, so continuous unattended execution is not satisfied on the current plan. No keep-alive workaround or paid upgrade is performed. PostgreSQL trial expires 2026-11-21T03:09:14Z (2026-11-21 00:09:14 Buenos Aires). Preserve the saved row when upgrading/migrating storage.
