# Code grounding: original Java promotion

Specification: specs/original-java-promotion.md (committed before this grounding).

Observed source: 87584daaeb78b073545374da44f12b31a4203913 on proximo-desarrollo-hello-world, integrated UI v2.8.0.
Observed target: ariel-sdd-weather-java (srv-db27ln67bikc73covi50) uses ./Render-Dockerfile; ariel-sdd-weather-microservice (srv-db2rlbnlk1mc738gjtfg) uses ./Weather-Dockerfile. Both currently track microservices-v008 and use free Docker web services in Oregon.

## Mapping
- frontend/src/App.jsx declares eight routes; frontend/scripts/static-routes.mjs emits entry HTML.
- frontend/*Client.js derive API origin from VITE_WEATHER_API_URL and VITE_AUTH_API_URL. Build with original API URLs; no client logic changes required.
- Add Render-Dockerfile: Node22 build executes existing frontend tests/build, nginx serves output on Render PORT and /health. SPA route entry remains supported.
- Reuse Weather-Dockerfile without changing tested Spring code.
- application.properties already supports ALLOWED_ORIGINS, AUTH_FRONTEND_URL, AUTH_BACKEND_URL, SIMULATION_DATABASE_URL.
- SimulationStore.locked uses PostgreSQL transaction/row locks; SimulationService checks durable nextPollAt inside lock. Overlapping deployment reads do not create independent balances or duplicate scheduled quotes.
- Existing shared database is ariel-sdd-people-db. Credentials must transfer through supported secret configuration, never source/logs.
- Target service branch changes require Dashboard/API: connected Render tools expose no service-settings update operation. Browser fallback requires user approval under browser tool policy.

## Validation
Use frontend's existing 101-test suite and production build with original API origins. Reuse backend implementation from the already verified release; Docker backend build reruns its tests. After settings are applied and deploys live, verify target routes and APIs, data continuity, and source commit.
