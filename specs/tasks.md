# Tasks

- [x] Define this fresh application's scope, API, UI, versions and deployment boundaries.
- [x] Publish the specifications-only tree to iteracion-2.
- [x] Generate independent Java microservice and provider tests.
- [x] Generate React page, cold-start handling and UI tests.
- [x] Generate Maven, Vite, Docker and Render build configuration.
- [x] Pass deterministic tests, executable-JAR smoke and production build.
- [x] Publish implementation and requirement traceability.
- [x] Deploy both components in the existing Render workspace.
- [x] Verify real API calls, initial UI load and manual refresh.
- [x] Publish release evidence and final acceptance status.

## Header navigation

- [x] Directly update the original requirements, architecture and acceptance criteria first.
- [x] Ground the navigation change in the existing React header and weather section.
- [x] Implement the single Weather demo option with native fragment navigation.
- [x] Validate, publish and verify the menu in Render.

## Routed application and gallery

- [x] Preserve the functional single-page version in a checkpoint commit and tag v2.0.1.
- [x] Directly update original specifications before grounding and implementation.
- [x] Ground router, home and gallery in the existing shell, weather hook and card.
- [x] Generate routed shell, Home, Weather demo and reusable-widget gallery.
- [x] Validate regressions, route lifecycle and gallery isolation.
- [x] Publish, deploy and verify all three direct URLs and route refreshes.
- [x] Record acceptance evidence and final URLs.

## Compact layout
- [x] Update the original specifications first.
- [x] Ground and apply compact vertical spacing across all three pages.
- [x] Build, deploy and inspect the three routes.
- [x] Record measured evidence and limitations.



## Multi-provider login
- [x] Define R15–R18 and architecture/acceptance before implementation.
- [x] Implement server OAuth registrations, bound one-use handoff and expiring demo sessions.
- [x] Implement Login route, profile, provider configuration states and logout.
- [x] Validate Java auth boundaries, React regression and production build.
- [x] Deploy and verify unauthenticated behavior.
- [ ] Configure the owner's three OAuth applications and verify real consent.



## Bitcoin tracker
- [x] Specify R20–R23 in original master documents before source generation.
- [x] Ground the implementation in the existing router, shell and static route generator.
- [x] Implement quote client, bounded polling widget and guided route.
- [x] Pass frontend regression/lifecycle tests and production build.
- [x] Publish parallel branch, verify Render live and record evidence (docs/bitcoin-release.md).


## Virtual simulator
- [x] Specify R24–R28, fee math, sample crossings and reset semantics before generation.
- [x] Ground in existing quote lifecycle, chart, router and official Binance docs.
- [x] Implement virtual balances, all-in crossing engine, fees, live limits and ledger.
- [x] Pass deterministic/regression tests and production build.
- [x] Publish parallel branch and record verified release evidence (docs/bitcoin-simulator-release.md).


## Cash-only Reset v2.4.1
- [x] Update master requirements/architecture/acceptance before implementation: default 10000 USDT, no initial buy, first sample as reference.
- [x] Ground and update reset state, crossing guard, UI and tests.
- [x] Pass frontend regressions/build, publish parallel environment and verify cash-only Reset.


## Shared simulation v2.5.0
- [x] Specify durable shared authority, lifecycle/control persistence and concurrency before generation.
- [x] Ground in existing Java service, polling/math/UI and PostgreSQL.
- [x] Implement/test durable server loop and shared-client controls (29 backend tests, 81 frontend tests, builds).
- [ ] Configure backend database access, deploy/verify server, then activate frontend.
- [ ] Verify two-client state and restart persistence; record release evidence.


## Autonomous shared simulator R33
- [x] Commit updated master requirements/architecture/acceptance before code.
- [x] Commit code grounding separately.
- [x] Retain backend-only trading and isolated shared PostgreSQL table.
- [x] Add scheduler metadata, bounded lock waits, graceful shutdown and gap/resume reference handling.
- [x] Prove unattended scheduler cycles, restart persistence and unrelated-table preservation with PostgreSQL 17 build tests.
- [x] Pass 31 backend tests, 82 frontend tests and production build.
- [x] Verify configured live backend and then activate frontend; process restart preserved shared state.
- [ ] Owner approval for always-on compute, apply it and verify unattended operation beyond the Free idle limit.


## R42 — Specifications viewer
- [x] Define the complete build-time specs inventory, safe viewer, R41 styling and no-backend boundary before generation.
- [x] Ground the current router/Home/static-routes and central CSS.
- [x] Generate catalog/viewer, tests and responsive BEM styles.
- [x] Run full frontend validation (116 tests, style contract and production build).
- [ ] Deploy and verify live direct entry/file content.

## R46 — Separate tracker and restricted simulator
- [x] Commit authoritative specification before grounding and code.
- [x] Commit grounding separately.
- [x] Implement shared identity/capability, separate routes/menu, server API restriction and public market projection.
- [x] Cover owner/non-owner/anonymous, expiry/logout/denial and database-state bypass with tests.
- [ ] Complete full validation, deploy backend then frontend and verify live behavior without production commands.
