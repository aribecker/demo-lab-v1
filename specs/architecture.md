# Architecture and deployment contract

Browser React page → HTTPS GET /api/weather on the Java microservice → Open-Meteo, with MET Norway fallback.

## Boundaries
- frontend/: React 19.3.1, Vite, plain CSS and browser tests. Static output goes to dist.
- weather-service/: Java 17, Spring Boot 3.5.16, typed JSON DTO, provider normalization, HTTP API, CORS and request logging.
- Weather-Dockerfile: Maven build/test stage followed by a JRE image containing weather-service-2.0.0.jar.
- render.yaml: declarative description of both deployments from iteracion-2, with component-specific build filters.
- scripts/: reproducible validation against the packaged JAR.

## Intended service names
- React Static Site: ariel-weather-iteration-2.
- Java Free Web Service: ariel-weather-api-iteration-2.
Use the actual URLs returned by Render when configuring CORS and VITE_WEATHER_API_URL. Record any hostname difference in deployment documentation before validation.

## Provider configuration
Open-Meteo endpoint:
https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires

MET Norway endpoint:
https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-34.6037&lon=-58.3816

Identify the application in User-Agent. References: https://open-meteo.com/en/docs and https://api.met.no/weatherapi/locationforecast/2.0/documentation.

## Navigation and component boundaries
- BrowserRouter in frontend/src/main.jsx; Routes in App.jsx with /, /weather, /components and a not-found page.
- App owns the shared shell, accessible hamburger and NavLink destinations. Route changes close navigation and focus the route heading. Keep frontend version 2.1.1 separate from the existing weather API contract 2.0.0.
- Home introduces the multi-feature demo and links both features, without mounting useWeather.
- WeatherDemo owns useWeather and renders the reusable presentational WeatherWidget. Leaving the route cancels an active request; navigating to the same route preserves it.
- ComponentGallery renders that exact widget with labeled sample data and controlled Success/Loading/Error states. A local preview timer may demonstrate the loading-to-success transition; it is cleaned up on unmount. No network provider access in Home or gallery.
- Existing Render /* rewrite to /index.html supports direct BrowserRouter entry and reload on /weather and /components. A frontend-only deployment reuses the existing Java API.
- Lightweight in-app gallery rather than a standalone Storybook service/dependency, appropriate for one reusable widget.

## Failure boundaries
The static page is available independently of Java startup. Browser retry logic handles infrastructure startup/HTML responses. Once Java answers with a structured provider error and retryable=false, the UI allows a manual retry. Provider timeouts and browser cold-start deadlines are separate settings. CORS limits browser origins; it is not authentication for this public API.

## SDD sequence
1. Publish a new tree containing specifications only, excluding all previous project files.
2. Derive the code and executable tests from requirements and acceptance criteria.
3. Validate and publish the implementation.
4. Create/configure both Render services, verify readiness and real end-to-end interaction.
5. Publish release evidence and final specification status.

## Compact layout
Use the existing shared styles.css selectors and mobile breakpoint. Compact the shell, page introductions, feature cards, shared WeatherWidget and gallery notes by adjusting vertical spacing only; retain font sizes and responsive flow. Do not change routes, weather requests, providers or gallery behavior.



## Multi-provider login v2.2.0
Grounding: retain BrowserRouter/App shared shell, add Login.jsx and authClient.js, extend the existing Java service under its scanned weather package with auth/. No new service or database. R15–R18 supersede the earlier no-login scope only for this feature. Public weather DTO/version stay 2.0.0.
Auth endpoints: GET /auth/providers, GET /auth/start/{provider}?challenge=..., GET /login/oauth2/code/{provider}, POST /auth/exchange {ticket,verifier}, GET /auth/me, POST /auth/logout. All auth responses no-store. Spring Security owns state, code exchange and Google OIDC validation. Configure fixed AUTH_BACKEND_URL and AUTH_FRONTEND_URL rather than accepting redirect destinations from requests. Successful OAuth invalidates its cookie session and passes only a one-use ticket to React; browser verifier binds that exchange. Profile/demo sessions live in bounded memory, with a 30-minute absolute lifetime. No user database or automatic account linking.
Only configured registrations are advertised as enabled. A custom empty-capable repository lets weather start without OAuth credentials. Microsoft uses common authorization/token endpoints with Graph /v1.0/me and User.Read; its supported account types must include organizational and personal accounts. GitHub requests read:user,user:email; a verified primary email is fetched server-side only when absent from /user. CORS adds POST and Authorization for existing exact origins without credentialed cookies. CSRF exemptions apply only to bearer/one-use exchange endpoints. Tokens are not used to protect the public weather endpoint.


## Hello World development environment (R19)

`HelloWorld.jsx` is a presentational route in the existing React application and reuses the intro/heading styles. It adds no API, database or service. Keep the existing Java weather/auth API as a separately deployed service. Both new Render services track `proximo-desarrollo-hello-world`; frontend endpoint variables, backend allowed origins and auth callback origins reference only the new environment. `render.yaml` records the new service names. `frontend/scripts/static-routes.mjs` emits route entry HTML plus a custom 404 page because the creation connector cannot configure SPA rewrites. React Router still handles navigation and history. Existing environments remain outside this configuration.



## Bitcoin tracking R20–R23
The new `/bitcoin` route owns its polling hook. A public Coinbase browser client fetches BTC-USD spot JSON without credentials; an 8-second AbortController timeout bounds each fetch. The route stores at most 180 successful samples in component memory. A reusable presentational BitcoinWidget renders quote/summary/chart/table; no database or additional service is needed. App/Home link this route; static-routes emits its index.html. Scoped CSS reuses the dark navy shell. A visibility listener and effect cleanup stop background/abandoned work. An in-flight guard serializes automatic and manual requests. All failure states preserve the last sample as stale.


## Virtual simulator R24–R28
Keep the same route and polling owner. Replace the public quote client with Binance's market-data-only BTCUSDT endpoint; all operations remain local math. Add a pure simulation reducer that consumes unique monotonically numbered successful quotes and validated live limits, preventing duplicate fills under React effect replay. Separate configuration drafts (next Reset capital/fee, live threshold inputs) from the active run. Reset aborts old polling generation, clears chart/history and requests a new quote; simulation restarts holding only its configured USDT. The first fresh sample establishes previousPrice; no purchase occurs without a subsequent strict downward minimum crossing. Use received-asset fee deductions and USDT-at-execution aggregate, not real trade APIs. The sidecar uses the same route/session memory and is removed on route exit. No backend, auth, infrastructure or new dependency.


## Shared server authority R29–R32
Move the simulator and polling loop into the existing Java backend under simulation/. Add PostgreSQL JDBC runtime and H2 test fixtures without changing weather/auth contracts. A singleton JSON document in bitcoin_shared.simulation_state holds the complete state. JDBC transactions SELECT ... FOR UPDATE serialize scheduler and commands; a durable nextPollAt reserves each poll slot and command UUIDs/controlRevision protect retries/concurrent editors. Server HttpClient fetches public Binance price with a bounded timeout, then commits quote, balances/fees/ledger together. Roll back on storage exceptions; no local fallback. Schema bootstrap is idempotent and non-destructive. A single @Scheduled loop checks running/due state; no self-ping to evade Free sleep.
React keeps BitcoinWidget/SimulationPanel presentation, loads server snapshots, and sends explicit setting/start/reset/running/refresh commands. It never calls Binance or computes authoritative fills. Valid fields save centrally on blur; +/- saves immediately. No view lifecycle changes global running state. Connect/reload/poll errors keep the last known server snapshot labeled stale; initial failure must not invent a new session. Separate controlRevision prevents market quotes from invalidating user edits. Existing per-browser historical sessions cannot be recovered from a central source; only the first database row initializes a new shared inactive simulation.


## Autonomous execution R33
Keep the Java scheduler in the existing API process (no extra worker needed for this single shared simulation). Persist state in the existing isolated schema. Expose a read-only execution envelope alongside saved state, reporting configured hosting mode and real scheduler heartbeat without making GET advance the engine. Scheduler exceptions are logged by safe category and retried; secrets never enter logs. After a gap longer than 30 seconds or an explicit resume, clear only the crossing reference, preserving holdings and ledger, so the next real quote cannot invent a downtime fill. Set transaction-local PostgreSQL lock_timeout. Use an actual PostgreSQL test database when supplied; H2 remains the default fast fixture. Browser polling is presentation-only; authoritative calculations stay in Java. Deployment uses Dashboard/MCP for secrets; keep current free plan until paid compute is approved.

## R34 run metrics
Add additive fields startedAt and readingCount to SharedState.Simulation. Explicit reset sets server Clock timestamp; SimulationEngine.quote increments count only after a valid quote for an active run. Expose runMetrics with server-computed elapsedSeconds alongside snapshot execution metadata. SimulationPanel renders server metrics and a one-second presentation timer, with Buenos Aires timezone and explicit pause-inclusive wall time. Existing JSON storage needs no destructive migration. Backward-compatible missing timestamps remain unavailable until Reset.

## R35 login + shared trading reconciliation
Original login is already an ancestor of the target branch (merge base 9b1104b); no incoming source commits are required. Regenerate Login.jsx as readable component code from combined requirements, retaining authClient handoff/session boundaries. Add simulator entry/return links and explicit shared-state semantics to Login and SharedBitcoinTracker; reconcile Home descriptions. Scope authClient to the target API or same-origin dev proxy (/auth), and regenerate branch defaults for auth frontend/backend origins. Reuse existing Java auth classes and persistent simulation scheduler; never bind global simulation ownership to a browser auth session. Test navigation + no implicit simulation commands, disabled provider status, logout behavior and source environment isolation. Preserve PostgreSQL state on rollout.

## R36 People integration grounding target
Extract the already tested URL/credential parser into DatabaseConnections, reused by SimulationStore and a PeopleRepository with its own maximum-three-connection Hikari pool. Configure JDBC transactions and Flyway programmatically; disable automatic datasource/Flyway bootstrapping so absent storage never prevents unrelated weather/login startup. Copy the exact existing V1 SQL into a distinct classpath location but retain public Flyway history/table identity. Lazy idempotent migration checks preserve the existing original People service's records. PeopleController validates API contracts and supplies safe errors/readiness. Regenerate People component/client from reconciled requirements, retaining UI retry UUID semantics and source CSS. Add target route/menu/Home/static entry, keep all trading and login routes intact. PostgreSQL build tests use a separate temporary database; no production migrations/test resets are permitted.

## R37 chatbot integration
Add only Spring AI openai dependency to the existing Java API; retain JDBC/Flyway/Hikari and scheduler. Regenerate ChatController from the source contract, retaining request validation, server-only API key, semaphore, catalog cache and safe errors. No combined-app ChatPageController: this environment already uses independent static React hosting, so emit /chatbot/index.html. Regenerate Chatbot UI/client/CSS/tests with target-origin transport and no-store/HTML startup handling. Preserve source Spanish conversation/voice behavior and all current routes. No app lifecycle effect sends simulation commands or modifies People. Source and target provider configuration are checked via public configuration flags, never by exposing secrets. GitHub branch deletion uses the authenticated UI because the connector has no delete-ref capability.


## Current topology R38
Browser -> integrated backend for People/simulation/auth/chat using VITE_BACKEND_API_URL; browser -> retained independent Weather microservice using VITE_WEATHER_API_URL. PostgreSQL remains owned by shared integrated persistence. Integrated backend has no weather provider code or weather HTTP endpoint. Canonical independent weather module lives in weather-microservice/; its deployment mirror uses the original service's existing branch and weather-service/ path. Preserve health and common HTTP infrastructure in both independent builds.


## R39 Database explorer
frontend/Database.jsx -> databaseClient.js -> integrated /api/database catalog and /api/database/rows queries through VITE_BACKEND_API_URL. Catalog returns database -> schemas -> tables. A table response contains ordered column metadata and one page of rows with representative summaries and typed text/null cells, allowing row disclosure locally without fetching other tables. Backend DatabaseExplorerRepository opens the existing connection in read-only transactions and resolves tables/columns/keys through PostgreSQL catalogs; no arbitrary SQL endpoint or new persistence is introduced. Source weather module and Render Weather service are unaffected.
