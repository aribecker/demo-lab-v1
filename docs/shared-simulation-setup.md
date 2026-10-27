# Shared simulation v2.5.0 — deployment and state

The parallel Bitcoin page now has a server-owned singleton. Browsers only read saved snapshots and submit explicit shared commands. Connecting, reloading or disconnecting never starts, resets or pauses it. The PostgreSQL record stores the started/holding phase, run/pause flag, settings, balances, fees, previous quote, history, ledger and revisions. No browser localStorage/sessionStorage is used for authority.

## Storage prerequisite

Configure **SIMULATION_DATABASE_URL** on **ariel-demo-next-api** using the existing PostgreSQL database's **Internal Database URL** from Render Dashboard. Keep it only in backend environment variables. Never put it in VITE_* variables, a repository, a screenshot or chat. The application accepts Render postgresql:// connection URLs and JDBC URLs.

The existing database is ariel-sdd-people-db (PostgreSQL17, Oregon, same workspace). Only the isolated **bitcoin_shared** schema is created; the People application tables are untouched. SQL lives at weather-service/src/main/resources/db/shared-simulation.sql. Schema creation and the single-row insert are idempotent and never overwrite an existing snapshot. Database role needs permission to create this schema/table. No paid resources or account upgrades are authorized or required for this trial.

This existing Free database expires on **2026-11-21 at 03:09 UTC**. Its account settings/expiry are not changed by this feature. Persistence after that date needs an owner-chosen database/plan; do not treat Free Postgres as indefinite storage.

## Safe rollout order

1. Keep the v2.4.1 frontend live until storage is ready.
2. Publish/test v2.5.0 code using a [skip render] commit while configuration is pending.
3. Set SIMULATION_DATABASE_URL in the backend through the authenticated Render Dashboard; save and deploy the backend's latest commit.
4. Verify GET https://ariel-demo-next-api.onrender.com/api/simulation returns schemaVersion1/revisions/settings/simulation with no-store, not SIMULATION_STORAGE_UNAVAILABLE.
5. Check database row, two-client consistent reads, idempotent commands and persisted pause/run settings. Do not reset an existing row for a read-only check.
6. Deploy the frontend's latest commit. Its simulation URL is derived from the existing VITE_WEATHER_API_URL origin; optional VITE_SIMULATION_API_URL can override the full /api/simulation endpoint.
7. Verify reload/new browser preserves exact state. Test restart with the current persisted run/pause flag and balances. Record deploy IDs and commit before reporting activation.

Until step4 passes, do not activate the new frontend: database errors intentionally produce a clear error rather than falling back to a local/volatile simulation. The existing weather/auth APIs and /health remain usable without simulation storage.

## Shared controls and concurrency

GET /api/simulation reads the singleton. POST /api/simulation/commands requires a UUID id, expectedControlRevision and type (settings/reset/running/refresh). Settings uses numeric changes; running uses a boolean. Reset may atomically apply validated changes and then seed configured USDT with zero BTC/fees/trades, waiting for a real downward crossing. Capital/fee setting edits affect the next Reset, not the active run. Controls are public demo controls and affect all viewers; there are no private funds/account credentials here.

SELECT FOR UPDATE locks the singleton while commands/polls run. Snapshot and command ID commit together; matching recent IDs are idempotent, stale control revisions get409. Market quotes advance revision but not controlRevision. History is bounded to180 quotes/100 trades/128 command IDs. All fills and fees are local math based on the public Binance price; no exchange order endpoint exists. Provider errors retain balances and last good quote. Database exceptions roll back the entire update.

## Free backend execution limits

The server scheduler targets10-second samples while running and awake, regardless of whether a browser is visible. Render Free can suspend the service after15 minutes without inbound traffic and can restart it at any time. PostgreSQL preserves the state; execution resumes after wake-up, without invented historical prices or catch-up fills. Uninterrupted24/7 execution is not guaranteed on Free. No self-ping is used to prevent sleep.

Earlier v2.4.1 browser-only sessions were not centrally saved and cannot be reconstructed automatically. The database initializes a single new inactive simulation only once. From then on all clients share it.


## v2.5.1 autonomous operation

All price/trade logic executes in the backend; views only read or issue commands. The API snapshot includes an execution object with hostingMode, schedulingEnabled, pollIntervalMs, processStartedAt, lastCycleAt and lastCycleStatus. These are process heartbeat metadata, not persisted balances. After a >30-second observation gap or pause/resume, the first quote establishes a new crossing reference; no downtime trade is fabricated.

For continuous operation, approve and change the existing ariel-demo-next-api compute plan to a non-sleeping plan, then set SIMULATION_HOSTING_MODE=always-on. The marker describes the configured plan; it cannot prevent Free suspension. Do not create an additional worker for this single-instance demo. Check progress with two isolated snapshots separated by a period without browser/API requests, then restart and confirm state survives. The current Free setup is suitable for persistence verification but cannot satisfy continuous execution.

Tests: optional SIMULATION_TEST_DATABASE_URL points only to a disposable local/build PostgreSQL database; the suite drops its own simulation_state table between cases. Never use a deployed database for this test variable. Docker builds provision a dedicated disposable cluster automatically.
