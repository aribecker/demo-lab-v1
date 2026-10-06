# Feature Specification: Asynchronous Buenos Aires Weather

Each initial load and accepted button click calls GET /api/hello. The backend awaits a fresh HTTP request to Open-Meteo for Buenos Aires (-34.6037, -58.3816); no application response cache is used. The provider may return the same weather observation on successive calls.

JSON includes message, timestamp, architecture and weather: location, temperature, apparentTemperature, humidity, windSpeed, weatherCode, observedAt, timezone, source, sourceUrl and units. Display Celsius, percent humidity and km/h wind. Show observation time separately from request time and attribute Open-Meteo. Current conditions are weather-model data.

Disable the button during loading. Clear stale values on each request. Failed provider HTTP, invalid JSON/data and network errors return 502; a 10-second timeout returns 504. Never fabricate weather or silently substitute previous results. Show a retryable Spanish error. Preserve Node local runtime and Worker hosted runtime.

Acceptance: two calls make two upstream requests; validate output fields; test provider failure, malformed response and timeout; static assets remain served. Archive previous specs before changing them in history/20261004-192754-ART (America/Buenos_Aires).

Fallback: on non-timeout Open-Meteo failure, await MET Norway Locationforecast with the same deadline. Return nearest forecast hour labelled as forecast, source and validity time. Missing apparent temperature and weather code are null; omit apparent temperature display. Convert m/s to km/h. Both providers failing returns 502; deadline is 504. Reference: https://api.met.no/doc/GettingStarted

## Version 002 — visible release indicator

The page MUST display a small additional icon and the exact label “🔖 Versión 002” near the SDD heading. Preserve weather interactions, responsive layout and accessibility. This version is an application release label, independent from hosting version numbers.
