# Acceptance checklist and test plan

## Deterministic microservice checks
- A real local HTTP fixture verifies primary request, units, timestamps and correlation headers.
- Primary HTTP failure, malformed JSON, invalid numbers and invalid timestamps trigger fallback.
- MET Norway is normalized to nearest-hour forecast; feels-like is null and wind is converted.
- Both provider failures produce safe 502 JSON; two timeouts produce 504 within the configured bounds.
- /health never calls a provider. GET/OPTIONS CORS allow the configured frontend; an unlisted origin is rejected by browser CORS handling.
- Unsupported routes/methods return appropriate HTTP status. Responses are no-store.

## Deterministic browser checks
- Mount loads weather; success displays the complete normalized contract and attribution.
- Loading/refresh reserves all slots, disables the button and clears stale values.
- Errors and incomplete/malformed JSON restore manual retry without crashing.
- Render startup HTML and transient infrastructure/network errors cause bounded retries and a visible progress message.
- Explicit non-retryable application errors fail immediately.
- Cancellation, deadline expiry, attempt cap, duplicate suppression and stale lifecycle responses are tested.
- Null feels-like is omitted and forecast labeling remains visible.
- External strings are rendered as text. Accessibility and reduced-motion rules are present.

## Application navigation and gallery
- / renders Home with English app introduction and links to both features, without a weather request.
- /weather renders the live Weather demo; /components renders Component gallery.
- The hamburger contains Home, Weather demo and Component gallery; only the active NavLink has aria-current=page.
- Menu closes on selection or Escape, restores button focus on Escape and focuses the new route heading after navigation. Browser Back/Forward update the page and active link.
- Navigating to the already active weather route preserves its request ID; leaving cancels an active request. Re-entering mounts a new live request.
- Gallery renders the shared WeatherWidget with clearly labeled sample data and Success/Loading/Error controls. A preview refresh demonstrates Loading then Success locally; leaving clears its timer. Gallery never calls the live loader.
- Unknown paths display Page not found and a Home link.
- Direct HTTP entry, browser refresh and client navigation all work at /, /weather and /components through the Render SPA rewrite.

## Build and deployment checks
- Exact stable React/react-dom versions and a lockfile are committed.
- npm ci, npm test and npm run build pass.
- mvn package passes all generated Java tests and creates an executable JAR.
- Start the JAR with local provider fixtures and verify a real JSON response plus health.
- For the initial release, deploy both components from the same implementation commit. For this frontend-only release, inspect its terminal status and verify compatibility with the unchanged deployed API.
- Verify CORS and real provider data through the public API.
- Verify initial load and button refresh in the deployed React page and capture a non-sensitive screenshot.
- Release report links the branch, deployed commit and exact public URLs.

## Previous verification status — before routed version

Accepted against the generated checks: 14 backend tests, 25 frontend tests, packaged-JAR HTTP smoke, clean frontend production build and both live Render deployments. Initial browser load, visible startup retry and manual refresh were verified using real weather providers. See [release report](../docs/release.md), [traceability](traceability.md) and [captured evidence](../docs/evidence/).

Navigation acceptance verified in the live frontend deployed from cae61c61405d31e8f2b908de40a4093b45a2c7ce: disclosure, single option, keyboard Tab/Escape, destination focus and unchanged request ID. Existing 25 frontend checks and production build passed. See navigation evidence in the release report.

## Routed-version delivery gate
Preserve and verify the v2.0.1 checkpoint before implementation. Publish original specification edits before grounding and code. Run routing, gallery and existing weather regressions plus the production build; verify all three public URLs, route reloads, keyboard menu, gallery states and live weather after deployment. Record the source commit, deployment and evidence in the release report.

## Routed-version verification — 2026-10-20 UTC

Accepted: v2.0.1 points to checkpoint 541da9ecf1af8ce14eabacad1ab67d100e6d0a16, created before specification commit 7bde53b3b4257896b3d18b771d598c3cfb0a84bf. Clean npm ci, all 33 frontend tests and production build passed. Frontend commit 1233bd390fc97bd52afe2e38ca816fa804e32bc4 is live in Render. All three routes return HTTP 200 and support browser reloads; Home introduction, gallery states/local preview, keyboard menu, active links and browser history verified. Real weather loaded and manually refreshed on /weather; selecting that active destination preserved the refreshed request ID. See routed evidence in the release report.

## Compact layout acceptance
- All three routes use more compact vertical spacing, with a target of approximately 10% less content height than 2.1.0.
- Existing text sizes, data, route behavior, weather state slots and keyboard navigation remain usable.
- Menu and weather action are at least 44 px high; no scaling/clipping or horizontal overflow is introduced.
- Inspect the existing mobile breakpoint rules and verify the deployed pages. Distinguish desktop measurements from any mobile measurements; do not claim exact mobile percentages without a matching viewport check.

Compact layout verified in deployed frontend 1538a6a9b779d7db669506931e80088824266b7f: 33 regression tests and build passed. At 1363×936, Home/Weather/Gallery content height decreased 9.0%/9.4%/8.7%, with no horizontal overflow. Mobile breakpoint spacing was reviewed; no direct mobile viewport measurement is claimed. See release evidence.



## Login acceptance R15–R18
- /login is directly addressable, accessible through Home and hamburger, keeps compact mobile flow and does not mount weather.
- Three provider choices are present; missing credentials disable a provider. No fake users or simulated sign-in.
- Verified callback normalizes actual profile; missing email/name is handled. No tokens/secrets rendered or logged.
- Handoff succeeds only with matching verifier; replay, wrong verifier and expired ticket are rejected. Invalid starts do not redirect. Callback without a browser challenge fails.
- Profile restore and signout validate the opaque bearer; expiry/revocation is enforced. Signout does not log out the upstream account.
- Existing Java weather and frontend tests pass. Add deterministic auth boundary and UI tests, including no credentials, rejected exchange, logout failure and fallback fields.
- Deployment health, direct /login, provider availability and CORS are checked. Real end-to-end consent for Google/GitHub/Microsoft remains blocked until their app credentials are supplied and must be reported separately.


## R19 — Hello World branch acceptance

- New branch descends from login checkpoint `9b1104b`.
- Hamburger includes Home, Weather demo, Component gallery, Login and Hello World.
- Hello World navigates to `/hello-world`, closes the menu, and focuses the page heading using existing navigation behavior.
- Direct entry/reload at `/hello-world` renders the same page; browser Back/Forward continue to work.
- Hello World displays a heading and makes no weather/auth requests.
- Existing frontend tests and production build pass; Java behavior is inherited without source changes.
- Independent Render frontend and Java API use this branch and new URLs. Verify live route entry and API health. Preserve the prior OAuth activation limitation.



## Bitcoin tracker R20–R23
- Menu and Home open `/bitcoin`; direct entry and reload work in the parallel static site. Other routes retain their behavior.
- Valid fixture quotes populate USD price, retrieval time, baseline delta, minimum/maximum, bounded history/chart and table. No pre-session history is claimed.
- Fake timers prove immediate fetch, 10-second polling, pause/resume, visibility suspension and cleanup/abort on route exit. Pending requests cannot overlap.
- HTTP/429/invalid/non-finite responses and timeouts show honest failure; previous success remains stale; next success recovers.
- Full frontend regression suite and production build pass. Render reports live for the implementation commit; verify the new route and live Coinbase API/CORS, distinguishing automated browser evidence from HTTP checks.


## Virtual simulator R24–R28
- Initial balances/fees/trades are zero until Start. Default Start/Reset restores 10000 USDT, zero BTC/fees/trades and waits without buying. The first fresh sample (above, equal to or below the minimum) establishes a reference only. A later downward crossing executes the first purchase. With configured capital 1000 USDT and a crossing fill at 100000 USDT/BTC at 0.1%, net balances are 0 USDT and 0.00999 BTC with a 0.00001 BTC fee (1 USDT execution equivalent).
- With minimum 99000, maximum 101000, crossing from <=101000 to 102000 sells all: gross 1018.98 USDT, sell fee 1.01898 USDT, net 1017.96102 USDT; a later downward crossing below 99000 buys with that available balance.
- Every trade deducts only its received-asset fee; totals, equity/P&L and ledger reconcile. Repeat/equal quotes and replayed sample sequence do not duplicate trades.
- Reset with changed capital/rate discards old BTC/fees/trades/history, restores configured USDT, and waits for a fresh successful quote to establish the crossing reference; no fill uses a stale pre-Reset quote or happens merely on Reset. Paused/hidden/failed/aborted requests cannot fill orders.
- Invalid/min>=max/negative/NaN settings block Start and trading with readable feedback. +/- controls adjust thresholds while keeping balances. Chart shows both threshold lines with correct USDT labels.
- Deterministic reducer/component tests and all frontend regressions/build pass; live direct route, real quote and cash-only reset and subsequent crossing behavior verified in the published parallel environment.


## Shared simulation R29–R32
- Two independently mounted clients read identical balances, parameters, run/pause state and trade history. Unmount/reload/hidden browser does not reset or pause the engine.
- Persisted snapshot survives service/store re-creation. Shared Pause and Reset remain reflected in a subsequently connected client. Reset remains 10000 configurable USDT/no BTC/no fees/no initial buy; later genuine crossings use existing fee rules.
- Identical command UUID is applied once; stale control revision receives HTTP409 and refreshed state; scheduled quotes do not cause control conflicts. Concurrent poll/command work cannot overwrite another committed snapshot or execute the same crossing twice.
- Provider failure records error while preserving balances/last quote; storage failure returns safe503 without fake local success. Missing SIMULATION_DATABASE_URL must not create a volatile simulator.
- Backend tests use local Binance fixtures and isolated JDBC storage; frontend tests mock shared API. Publish schema and env setup steps. Confirm configured PostgreSQL and both live services before activating the frontend.


## Autonomous execution R33
- Start against a local market fixture; invoke the real scheduled loop without any GET/client calls and observe persistent quote count and a complete buy/sell cycle. Recreate the service/store and verify exact holdings, settings, ledger and running state.
- After a >30-second gap or pause/resume, the first successful quote establishes a reference without filling; a subsequent genuine crossing may fill. No repeated slot is processed twice.
- Run storage/concurrency/idempotence/rollback checks against PostgreSQL in addition to fast H2 tests. Pre-existing unrelated tables remain unchanged.
- The API reports actual scheduler heartbeat and hosting mode; frontend shows last quote/engine heartbeat and public shared control semantics. All existing frontend/backend tests and production build pass.
- Deployment activation requires configured PostgreSQL and a successful live snapshot read before frontend rollout. An always-on claim additionally requires a non-sleeping plan and background progress verification with no viewer requests. Record any outstanding plan approval explicitly; no hidden self-pings or upgrades.

## R34 acceptance
Verify Reset clears readings/renews timestamp, valid quotes increment once, failed provider and reads leave counters unchanged, and store recreation preserves timestamp/count. Elapsed duration is nonnegative and server-clock-derived, including pauses. UI renders count/date/duration, ticks without sending commands and handles legacy missing timing. Run backend/frontend suites and production build; deploy backend before frontend without resetting live state.

## R35 integrated acceptance
- Same deployment exposes /login and /bitcoin via menu/Home and explicit cross-links; profile view also offers simulator navigation.
- Login/logout/view navigation neither require nor issue simulation commands. Existing balances, metrics and settings persist through rollout.
- Three providers are shown, disabled until configured, with an honest environment setup explanation. No source-environment auth fallback.
- Existing OAuth callback/ticket/replay/expiry/logout/CORS checks and simulator persistence tests pass. Add integration navigation tests, run all Java and frontend tests/build, and verify both live routes/provider endpoint. Report missing real OAuth credentials separately from application integration.
- Record measured start time and final verified delivery time in Buenos Aires; report total elapsed time including deployment and verification.

## R36 acceptance
Verify existing public.people and Flyway V1 are readable without reset; add/list/strip/Unicode/SQL-string/idempotent replay/conflict/pagination and restart persistence pass against disposable PostgreSQL17. Invalid names/UUID/cursors return400; storage absence503 does not break weather/login. Existing trading tests still pass after connection-parser extraction. React tests cover list/add/error/uncertain retry UUID/pagination and unified menu/navigation; direct /people reload works. Run backend/frontend suites/build and inspect live People list and health, Login providers and unchanged simulation run/control revision. Do not mutate live People/trading state for smoke checks. Record deployment IDs and remaining OAuth/Free hosting limits.

## R37 acceptance
- Temporary Hello World2/3 branch no longer exists; preserve unified work and source chatbot branch.
- Chatbot is accessible through Home/menu/direct /chatbot with a free model selector, history, new conversation and supported voice controls.
- Spring AI fixture tests verify actual request model/history/output cap; reject paid/unknown models, forged roles, oversized input; missing key503, safe upstream failure, no fabricated replies.
- Production-origin client and React behavior/navigation tests pass; voice mock lifecycle/cleanup pass without requesting a real microphone permission.
- All backend/PostgreSQL and frontend suites/build pass. Deploy and verify live API/catalog/UI. Check People list and simulation settings/run state are retained without live mutation.
- Report real-key or browser-voice verification limitations honestly and measured total duration, not only coding/build time.


## R38 acceptance
Verify distinct configured origins in frontend clients/build. Live weather page must show real normalized data and retained microservice logs must observe its request with the integrated CORS origin. Integrated /api/weather returns404 and /health200. Both Java suites pass (retained weather providers with fixtures; integrated People/PostgreSQL/auth/chat/simulation). Four People records, shared start/control state and balances survive rollout. Cleanup happens only after these checks. Confirm retired services absent from live inventory; retain unrelated playground, repository and database. Missing connector deletion capability or browser authentication must be reported as a concrete remaining blocker.


## R39 acceptance
Database appears on Home/menu and opens directly/reloads at /database. PostgreSQL integration fixture uses multiple schemas/tables, PK ordering, names, NULL, empty string, JSON, large values, unusual quoted identifiers and SQL-like input. Confirm system schemas/views/inaccessible targets cannot be browsed, paging/limits work and reads do not mutate fixtures. HTTP tests reject invalid pagination/write methods, fail safely without storage and leave /health working. UI tests cover lazy table expansion, row/column disclosure, schema grouping, loading/error retry, empty tables, Load more, value escaping and direct routing. Run existing suites and production build; deploy integrated backend then frontend, verify actual public/bitcoin_shared tables and preserved4 People rows/simulation state without writes. Record SDD commits and deployment IDs. Cleanup remains deferred by user.


## R40 visual verification
Build the frontend and retain existing Database interaction/routing coverage. Check representative foreground/background contrast pairs, then inspect the deployed panel with a real table and row expanded. Verify dark surfaces, readable headings/values/types/NULL markers and clearly visible controls, consistent with the rest of the application. No additional behavior tests are required for this scoped CSS change.


## R41 — Central CSS and BEM acceptance
- All nine routes and unknown-route fallback retain existing functionality and direct-entry support.
- Exactly one application CSS import exists in main.jsx; components contain no inline style, style element or literal SVG colors.
- CSS class selectors and rendered class tokens follow BEM, including weather phases, chat roles and price direction; ID selectors do not style the UI.
- Colors are defined only by central tokens; shared typography/spacing/radius tokens drive the UI. Panels/forms/buttons share the same palette and focus treatment; Database remains readable with normal text contrast at least4.5:1 and focus/control boundaries at least3:1.
- Run existing frontend regressions, a style-contract guard and production build; inspect navigation, Home, Weather, gallery states, Login, Hello World, People, Database expanded rows, Chatbot and Bitcoin on desktop/mobile. Do not mutate production data or simulation controls during verification.
