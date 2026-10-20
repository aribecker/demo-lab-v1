# Requirement traceability

| Requirement | Implementation | Observable evidence |
| --- | --- | --- |
| R1 | frontend/src/App.jsx, useWeather.js, main.jsx | React component rendering tests; no active DOM-mutating app.js source |
| R2 | frontend/src/styles.css; ResultSlot and WeatherCard | Frozen stylesheet Git blob hash; full semantic-tree comparison with 79d1185 fixture |
| R3 | useWeather.js, weatherPresentation.js | Exact success text, same-origin no-store request, timestamps and fallback attribution tests |
| R4 | useWeather.js, WeatherCard | Initial/refresh loading state, duplicate suppression, abort and late-response lifecycle tests |
| R5 | useWeather.js, WeatherCard | HTTP, status fallback, network, parse and malformed-payload error tests; manual recovery |
| R6 | frontend/index.html, ResultSlot, WeatherCard; preserved CSS | ARIA/disabled/skeleton tests and baseline semantic-tree comparison; built initial shell |
| R7 | vite.config.js, build.mjs, java-backend/pom.xml | Stable /app.js and /styles.css build checks; unchanged Java HTTP asset tests; packaged smoke |
| R8 | package-lock.json, Maven profile, Dockerfile and Render-Dockerfile | Normal Maven generate-resources path and prebuilt Maven packaging path; Dockerfile review |
| R9 | frontend/test/App.test.jsx; existing src/test/ | Sixteen UI cases, preserved test hashes, both Java suites and two-process smoke |
| R10 | specifications/archive and Git history | Specification-only commit f025187 precedes implementation; validation report follows tests |

The retained HTML fixture is the exact baseline index.html blob 089aa800c9ee07132f6f284f754517b002008de0. It is test evidence, not a second editable UI. Screenshot equivalence and Docker engine execution are reported separately from structural and packaged-JAR checks.
