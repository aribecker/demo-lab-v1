# Requirement traceability

The specification was published before any of the implementation paths below existed. Tests exercise behavior using HTTP fixtures and browser DOM interactions.

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| R1, R12: fresh start, specifications first | specifications-only commit d41ef099; independent source tree | Git tree and ordered commits; release report |
| R2: two independently deployed components | frontend/; weather-service/; render.yaml | Separate Render IDs, URLs and live deployments |
| R3: exact stable React, Java/Maven | frontend/package.json + package-lock.json; weather-service/pom.xml | npm ci; actual React.version in UI; Maven package |
| R4: providers, units, dates, nearest forecast | WeatherService.java | primaryNormalizesDataAndCorrelatesResponse; invalidPrimaryUsesNearestForecast; primaryTimeoutCanRecoverWithFallback |
| R5: normalized JSON and request ID | WeatherReading.java; RequestLogFilter.java | primaryNormalizesDataAndCorrelatesResponse; real JAR smoke |
| R6: bounded failures, health, no-store | WeatherService.java; WeatherController.java; application.properties | bothFailuresAreSafeAndNotRetryable; twoTimeoutsReturn504WithinBound; healthDoesNotFetchWeather; unsupportedMethodsAndPathsAreRejected |
| R7: exact CORS, safe logs | WebConfiguration.java; RequestLogFilter.java; WeatherService.java | corsSupportsOnlyConfiguredOriginAndExposesRequestId; live CORS check; stdout provider/request entries |
| R8: simple responsive weather page | App.jsx; styles.css | App.test.jsx presentation/forecast/text tests; deployed screenshot |
| R9: one interaction, slots, accessibility, cleanup | useWeather.js; App.jsx; styles.css | mount, refresh/duplicates, error/manual retry and strict-mode stale-result tests; reduced-motion CSS inspection |
| R10: bounded startup retries | weatherClient.js | weatherClient.test.js: HTML, network, transient statuses, explicit API errors, invalid JSON/data, timeout/deadline, cap and cancellation |
| R11: full endpoint, dev proxy, local bundle | weatherClient.js; vite.config.js; render.yaml | client fetch assertion; production bundle; independent Render builds |
| R12: package/build/deploy validation | scripts/smoke_jar.py; Weather-Dockerfile; render.yaml | 14 backend tests; 25 frontend tests; JAR smoke; production build; docs/release.md |

The deployment report supplies the final external evidence. A local Docker-engine build and pixel comparison with the old page are not claimed.

## Header navigation grounding

Original specifications updated first in commit 9392be8c916699cb371aa558babf4ade040ca8a1. The existing `App.jsx` owns the masthead and the continuously mounted `#weather` section, so the menu belongs in that component. Local disclosure state must not change `useWeather` or its loader identity. Native `href="#weather"` navigation is sufficient for the only view. Scope the existing weather-button CSS to `.actions` so a new header control does not inherit refresh-button dimensions. Update existing button queries to distinguish Menu from Get weather; verify disclosure, Escape focus and destination selection without another load. No provider, Java, API contract or runtime dependency change is needed.

## Routed application grounding

Specifications published first in 7bde53b3b4257896b3d18b771d598c3cfb0a84bf, after checkpoint/tag v2.0.1 at 541da9ecf1af8ce14eabacad1ab67d100e6d0a16. App.jsx currently combines the masthead, useWeather and the weather card: extract the card unchanged into WeatherWidget.jsx and move useWeather ownership into WeatherDemo.jsx. App becomes the shared routed shell. Home and ComponentGallery never mount useWeather. main.jsx owns BrowserRouter; tests use MemoryRouter. render.yaml already contains the necessary /* → /index.html rewrite, so no infrastructure change is needed. Retain the existing HTTP client/API version 2.0.0; independently increment frontend package/badge to 2.1.0. React Router declarative BrowserRouter/Routes/Route and NavLink match the official installation/routing documentation (https://reactrouter.com/start/declarative/installation and https://reactrouter.com/start/declarative/routing). Verify route lifecycle, active links, gallery isolation/timer cleanup and direct reloads, alongside existing widget regressions.

| Routed requirement | Implementation | Verification |
| --- | --- | --- |
| R8: Home, shell, routes and active navigation | App.jsx, Home.jsx, main.jsx | Routing.test.jsx: home isolation, active route, focus, Escape, history and not-found |
| R9: live weather ownership and reusable display | WeatherDemo.jsx, WeatherWidget.jsx, unchanged useWeather.js | Existing App.test.jsx regressions; route cancellation and same-route preservation |
| R11: direct entry and reload | BrowserRouter and existing render.yaml rewrite | Live HTTP path checks and browser route reloads |
| R12: checkpoint/specification sequence | v2.0.1 tag and 7bde53b3 specification commit | GitHub tag points to checkpoint before specification commit |
| R13: isolated component gallery | ComponentGallery.jsx and shared WeatherWidget.jsx | Routing.test.jsx: all display states, no live loader, local refresh and timer cleanup |

## Compact layout grounding
R14 was specified before code in 938505ec604a12ce68aa2ba73404bdc54ad559c4. All three pages share styles.css: .page/.masthead/.intro/footer define the shell, Home uses .home-intro/.feature-card, WeatherWidget supplies both weather cards, and gallery adds .gallery-description/.preview-toolbar/.component-notes. Adjust those existing vertical values and their max-width:600px overrides directly, keeping font sizes and routing/network code unchanged. Maintain reserved state slots and a 44px action height. Compare .page content height before/after at the same available browser viewport; explicitly distinguish that desktop measurement from mobile CSS inspection.


## Login v2.2.0 R15–R18
| Requirement | Implementation | Evidence |
| --- | --- | --- |
| R15 navigation/profile | App/Home/Login.jsx | Routing.test.jsx, Login.test.jsx |
| R16 three providers/secret boundary | AuthConfiguration, GitHubUserService, Profiles | OAuthBoundaryTest, DemoSessionsTest, docs/login-setup.md |
| R17 one-use bound handoff | DemoSessions, AuthController, authClient.js | DemoSessionsTest, OAuthBoundaryTest, authClient.test.js |
| R18 restore/logout/failures | Login, authClient, AuthController | AuthApiTest, Login.test.jsx, authClient.test.js |
Real external consent awaits the owner's OAuth registrations and environment configuration.


## R19 — Hello World branch

Requirement: requirements.md R19. Architecture: isolated Hello World environment. Source: frontend/src/HelloWorld.jsx, App.jsx and frontend/scripts/static-routes.mjs. Validation: existing routing/frontend regression suite, production build, live direct route and API health. Infrastructure: render.yaml with two new service names and branch `proximo-desarrollo-hello-world`. Login setup: docs/login-setup.md remains applicable with environment-specific origins.



## Bitcoin grounding (R20–R23)
Specifications committed separately in ac7222060ea3221cb06e07528532ae6c72e47b84 before generating this feature. Grounding: App.jsx already owns Routes/NavLink destinations and Home.jsx links feature cards. Extend those boundaries with BitcoinTracker.jsx; keep the existing weather loader isolated. Reuse shared intro/card styles and add scoped bitcoin CSS. static-routes.mjs must emit bitcoin/index.html for Render direct reloads. A browser-side Coinbase client needs no backend mutation: verified HTTPS GET returned 200 with Access-Control-Allow-Origin:* and JSON data.amount/base/currency. Primary reference verified: https://docs.cdp.coinbase.com/coinbase-app/track-apis/prices (spot endpoint requires no authentication). The endpoint supplies no market timestamp; label browser retrieval time explicitly. Provider caching can yield identical successive quotes.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| R20 guided route and quote history | App/Home, BitcoinTracker/BitcoinWidget | Bitcoin tests, direct-route build |
| R21 10-second lifecycle and no overlap | useBitcoin.js | fake timers, pause/visibility/abort tests |
| R22 validated live source and stale errors | bitcoinClient.js | deterministic client/error tests, live CORS request |
| R23 SDD and parallel deployment | original specs, separate specification commit, static routes | npm test/build, Render deploy status and live checks |


## Simulator grounding R24–R28
Master specification published first in 579aa057a0f8b0368302a214dd18106c69cd87fe. Existing useBitcoin owns request cancellation/generation and successful sample count: add reset that clears history/counters and aborts old generation. The route owns local simulation reducer and settings; each new successful count is an idempotent engine event, edits alone cannot fill. Existing BitcoinWidget accepts optional current thresholds for chart overlays, while a SimulationPanel renders virtual balances/ledger next to it. Public Binance market-data GET verified HTTP 200, Access-Control-Allow-Origin:* with symbol BTCUSDT and price string. Official reference: https://developers.binance.com/en/docs/products/spot/rest-api recommends data-api.binance.vision for public market data. Binance standard fee table (https://www.binance.com/en/fee/trading) verified 0.100% regular-user maker/taker without BNB discount; official calculation reference https://www.binance.com/en/support/faq/detail/e85d6e703b874674840122196b89780a explains received-asset fees. Use that model, configurable because account rates/promotions differ. No authentication/trade endpoint is introduced.

| Requirement | Code | Check |
| --- | --- | --- |
| R24 fresh virtual reset/start | useBitcoin.reset, simulator reducer, SimulationPanel | fresh-reset UI and initial balance tests |
| R25 BTCUSDT source/lifecycle | bitcoinClient.js, existing polling owner | symbol/price tests, live CORS |
| R26 live thresholds | BitcoinTracker/SimulationPanel, chart lines | invalid inputs, +/- and edit/no-fill tests |
| R27 fee math and alternating crossings | simulation.js | exact round-trip math, equality/duplicate/idempotence cases |
| R28 delivery/disclosures | specs, docs, simulation UI | full tests/build, parallel Render/browser evidence |
