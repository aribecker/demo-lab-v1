# Iteration 2 — weather microservice and React test page

Status: specified before code generation.
Repository: aribecker/0080-prueba-SDD-full-stack.
Branch: iteracion-2. Frontend application version: 2.1.1. Weather API contract/version: 2.0.0.

## Fresh start
R1. This branch's first project tree contains only these specifications. Do not copy previous implementation, tests, build files, generated assets or historical source snapshots. Generate this application from the requirements below. The older branches remain separate.

## Minimal product
R2. Provide exactly two application components: an independently deployable Java weather microservice and a React browser page that calls its public GET /api/weather directly. Use the existing Render workspace: one Free web service and one static site. No database, login, main API intermediary or scheduled refresh is needed.

R3. Use React and react-dom 19.3.1, the npm latest stable versions verified on 2026-10-19; exclude canary, experimental, beta and RC channels. Pin exact versions and commit package-lock.json. React's version page identifies the 19.3 stable line: https://react.dev/versions. Registry dist-tags/latest identifies patch 19.3.1 for both packages. Use Java 17, Spring Boot 3.5.16 and Maven for the microservice; Vite builds the client. Use React Router 7.18.4 in declarative mode, pinned exactly in package.json and the lockfile.

## Weather API
R4. GET /api/weather retrieves fresh data for Buenos Aires, Argentina, latitude -34.6037 and longitude -58.3816. Query Open-Meteo first; on HTTP error, timeout, invalid JSON, missing fields or invalid values, try MET Norway Locationforecast compact. Normalize Celsius, relative humidity percent, wind km/h and timestamps as UTC ISO-8601. Convert MET Norway wind from m/s and choose its forecast hour closest to now. Clearly distinguish current model data from forecast data; never present a forecast as an observation.

R5. Success is HTTP 200 application/json with this contract:
- version: 2.0.0
- city: Buenos Aires, Argentina
- temperatureC: finite number
- feelsLikeC: finite number or null
- humidityPercent: number in [0,100]
- windKmh: nonnegative finite number
- observedAt: valid UTC ISO-8601 instant for the selected data time
- requestedAt: valid UTC ISO-8601 instant for the request
- timezone: America/Argentina/Buenos_Aires
- provider: Open-Meteo or MET Norway
- providerUrl: the provider's attribution website
- dataType: current model data or nearest-hour forecast
- requestId: safe correlation identifier, also returned as X-Request-Id

R6. Limit each provider HTTP request to five seconds, with at most one primary and one fallback attempt per API request. If both fail, return a safe JSON error with code PROVIDER_UNAVAILABLE, message, requestId and retryable=false. Use HTTP 504 if both failures are timeouts, otherwise 502. Never substitute fabricated or cached demonstration data. GET /health returns JSON status UP and version 2.0.0 without querying providers. API and health responses use Cache-Control: no-store. Provider endpoint URLs and timeouts are server configuration, not request parameters.

R7. The API is a public, non-sensitive demonstration. Configure CORS for the exact deployed frontend origin and localhost:5173 through ALLOWED_ORIGINS; allow GET/OPTIONS, expose X-Request-Id and do not use credentials. Record request ID, provider, status/failure and elapsed milliseconds to standard application logs. Do not put credentials in the browser, repository, logs or specifications.

## React page
R8. Provide a responsive English demo application with three React Router BrowserRouter routes: / is Home, /weather is Weather demo and /components is Component gallery. Home explains that this is a demo application with multiple features, shows brief descriptions and direct links to both feature pages, and does not render or fetch live weather. The shared dark navy header includes the hamburger Menu, brand linking Home and frontend version badge. Navigation contains Home, Weather demo and Component gallery. Use NavLink to mark only the current route, keep the menu closed initially, toggle by button, close on selection or Escape, restore button focus on Escape and expose aria-expanded/aria-controls. Navigation works without full document reloads, including browser Back/Forward. Route changes close navigation, scroll to the top and focus the new page heading; an unknown path shows a readable Page not found with a Home link. Use a responsive dark navy layout, light text and cyan accents. Footer shows actual React version and provider attribution.

R9. Weather demo at /weather retains title Weather, full stack., existing normalized weather fields, attribution, timestamps, request ID, loading/error UI and Get weather button. Extract the existing card into one reusable presentational WeatherWidget used by both the live page and gallery. Live requests are owned only by the Weather demo page: load when it mounts, refresh manually, and cancel/ignore stale requests when leaving it. Opening/closing the shared menu or selecting the already active weather destination must not remount the page or trigger another request. Keep fixed result-slot space, skeletons, role=status, aria-live=polite, aria-busy, disabled pending button and reduced-motion support. Errors restore readable manual retry.

R10. Tolerate the Render Free API's cold start without displaying its HTML as weather data. Request application/json. Retry network errors, per-attempt timeouts, platform HTTP 429/502/503/504 and HTML startup responses within a total 180-second budget, at most 20 attempts, delays increasing from 2 to at most 8 seconds and a per-attempt ceiling of 45 seconds. Tell the user when retrying/waking the service. A structured API error with retryable=false fails immediately. A valid application/json success with invalid data fails clearly. No periodic background polling after an interaction completes.

R11. VITE_WEATHER_API_URL contains the full weather endpoint in production; development defaults to /api/weather with Vite proxying /api to localhost:8080. Bundle React locally; no runtime CDN scripts are required. The client static build and Java deployment are independent. BrowserRouter must use real path URLs; Render rewrites /* to /index.html so direct entry and refresh work for all routes. Home and gallery must not query the weather microservice. A frontend-only change can reuse the deployed API version 2.0.0.

## Delivery
R12. Before this routed version, preserve the working single-page application in a checkpoint commit and Git tag v2.0.1. Commit the specifications before any source/build/test generation. Generate Maven, package manifests, Dockerfile, Render configuration, tests and documentation next. Run deterministic backend and frontend checks, an executable-JAR smoke test and a production frontend build. Deploy both components to separate URLs in the current Render workspace, verify real weather in the published page and the refresh button, and record exact commit, service IDs, URLs and evidence in a release report.

## Component gallery
R13. /components is a lightweight in-app component gallery, not a separate Storybook installation. Explain that it showcases reusable UI components. Catalog the Weather widget currently used by the live demo, with a short description and accessible state controls for Success, Loading and Error. Render the same WeatherWidget implementation in an isolated preview. Use explicitly labeled sample data (never presented as live weather); selecting a state or retrying a preview has no network effects. A preview Get weather action switches to Loading and then Success with an abortable/local timer, allowing interaction without a provider. Clear the timer on leaving the gallery. Show concise state/props guidance and a link to the live Weather demo. Gallery loading and error previews reserve the same result slots as success. Do not add a UI framework or extra demo components that are not used by the application.

## Compact layout
R14. Make Home, Weather demo and Component gallery approximately 10% shorter than frontend 2.1.0, prioritizing phone widths of 320–600 px. Reduce vertical padding, margins, gaps and oversized reserved blocks consistently across the shared shell and all pages. Keep body text sizes readable, maintain all content and the existing fixed weather slots across states, and keep the Menu and weather action at least 44 px high. Use natural responsive CSS flow, without page zoom, transform scaling, clipping or fixed viewport heights. Desktop spacing follows the same more compact rhythm. The target is approximate because text wrapping and live error messages vary. Verify the three routes and production build; record any measurement limits honestly.

## Acceptance evidence
Use acceptance.md and traceability.md to map every requirement to code and a check. Keep failures and limits visible; do not claim a Docker-engine or pixel comparison unless performed. Subsequent requirement changes must directly update these original specifications before grounding and the corresponding implementation. Do not create separate specification patches.



## R15 — Real multi-provider login (v2.2.0)
Add /login to the compact shared navigation and Home. Offer Google, GitHub and Microsoft. After consent show a greeting, display name, email or explicit unavailable value, provider, provider account ID, and optional picture/locale/profile URL. Never invent missing attributes. Signing out clears the demo session; it does not sign the user out of the identity provider. Weather remains public.

R16 — Authentication boundary: use Spring Security authorization-code login (Google OIDC; GitHub OAuth2; Microsoft OAuth2 + Graph User.Read). Secrets and provider access/refresh tokens stay on the Java server. Separate OAuth app registrations are required; ChatGPT connectors are unrelated. Enable each provider only when both client ID and secret are configured. Unconfigured providers are visible but disabled with an honest setup status.

R17 — Cross-site handoff: OAuth runs as top-level navigation to the existing API. After validated login redirect only to the configured frontend /login, with a random single-use 60-second ticket in the fragment, bound to a SHA-256 challenge generated by that browser. Exchange requires its original verifier. Remove fragment before network calls. Return an opaque 30-minute demo bearer token and normalized profile; store only the demo token in sessionStorage. No provider token or personal data in URLs. Server stores hashes of bearer/ticket values, bounded in-memory records, and deletes expired/revoked entries. Redeploy invalidates sessions. Reject forged, expired, replayed and wrong-verifier tickets. OAuth state remains Spring-managed.

R18 — Session and failure behavior: restore profile on /login via bearer /auth/me; expire after 30 minutes and allow sign out via bearer POST /auth/logout. No cookie credentials in cross-origin frontend requests. Cancel/denial uses generic error codes, no provider error details. Network errors must not pretend to log out server-side or show a false success; allow retry. Explicitly distinguish local automated validation from real consent with each provider, which requires the owner's app registrations.
