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
