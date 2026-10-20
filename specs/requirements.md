# Iteration 2 — weather microservice and React test page

Status: specified before code generation.
Repository: aribecker/0080-prueba-SDD-full-stack.
Branch: iteracion-2. Application version: 2.0.0.

## Fresh start
R1. This branch's first project tree contains only these specifications. Do not copy previous implementation, tests, build files, generated assets or historical source snapshots. Generate this application from the requirements below. The older branches remain separate.

## Minimal product
R2. Provide exactly two application components: an independently deployable Java weather microservice and a React browser page that calls its public GET /api/weather directly. Use the existing Render workspace: one Free web service and one static site. No database, login, main API intermediary or scheduled refresh is needed.

R3. Use React and react-dom 19.3.1, the npm latest stable versions verified on 2026-10-19; exclude canary, experimental, beta and RC channels. Pin exact versions and commit package-lock.json. React's version page identifies the 19.3 stable line: https://react.dev/versions. Registry dist-tags/latest identifies patch 19.3.1 for both packages. Use Java 17, Spring Boot 3.5.16 and Maven for the microservice; Vite builds the client.

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
R8. Provide a simple responsive English page visually similar to the previous dark weather demonstration: dark navy background/card, light text, cyan labels, title Weather, full stack., iteration/version badge and a single Get weather button. Show location and temperature, optional feels-like, humidity, wind, provider and data type; show provider attribution links, request ID and data/request times formatted for Buenos Aires. The footer shows the actual React version and the path React → Weather microservice → provider.

R9. Load weather on mount and when the button is pressed. Keep fixed result-slot space in loading, success and error states; show skeletons, role=status, aria-live=polite, aria-busy and a disabled button while pending. Respect reduced-motion settings. Permit one active interaction at a time. On unmount, cancel the request and ignore obsolete callbacks/results. Errors must show a readable message and enable manual retry.

R10. Tolerate the Render Free API's cold start without displaying its HTML as weather data. Request application/json. Retry network errors, per-attempt timeouts, platform HTTP 429/502/503/504 and HTML startup responses within a total 180-second budget, at most 20 attempts, delays increasing from 2 to at most 8 seconds and a per-attempt ceiling of 45 seconds. Tell the user when retrying/waking the service. A structured API error with retryable=false fails immediately. A valid application/json success with invalid data fails clearly. No periodic background polling after an interaction completes.

R11. VITE_WEATHER_API_URL contains the full weather endpoint in production; development defaults to /api/weather with Vite proxying /api to localhost:8080. Bundle React locally; no runtime CDN scripts are required. The client static build and Java deployment are independent.

## Delivery
R12. Commit the specifications before any source/build/test generation. Generate Maven, package manifests, Dockerfile, Render configuration, tests and documentation next. Run deterministic backend and frontend checks, an executable-JAR smoke test and a production frontend build. Deploy both components to separate URLs in the current Render workspace, verify real weather in the published page and the refresh button, and record exact commit, service IDs, URLs and evidence in a release report.

## Acceptance evidence
Use acceptance.md and traceability.md to map every requirement to code and a check. Keep failures and limits visible; do not claim a Docker-engine or pixel comparison unless performed. Subsequent requirement changes must update these specifications before the corresponding implementation.
