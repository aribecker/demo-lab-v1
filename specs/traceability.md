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
