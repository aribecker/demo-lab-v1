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
- Initial balances/fees/trades are zero until Start. Starting with 1000 USDT at 100000 USDT/BTC and 0.1% fee yields 0 USDT, 0.00999 BTC, 0.00001 BTC buy fee and 1 USDT commission equivalent.
- With minimum 99000, maximum 101000, crossing from <=101000 to 102000 sells all: gross 1018.98 USDT, sell fee 1.01898 USDT, net 1017.96102 USDT; a later downward crossing below 99000 buys with that available balance.
- Every trade deducts only its received-asset fee; totals, equity/P&L and ledger reconcile. Repeat/equal quotes and replayed sample sequence do not duplicate trades.
- Reset with changed capital/rate discards old balances/fees/trades/history and waits for a fresh successful quote; no fill uses a stale pre-Reset quote. Paused/hidden/failed/aborted requests cannot fill orders.
- Invalid/min>=max/negative/NaN settings block Start and trading with readable feedback. +/- controls adjust thresholds while keeping balances. Chart shows both threshold lines with correct USDT labels.
- Deterministic reducer/component tests and all frontend regressions/build pass; live direct route, real quote and initial simulation order verified in the published parallel environment.
