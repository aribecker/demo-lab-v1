# SDD Feature 002 — Spring Boot REST weather application, version 0.0.7

## Architecture and language
Use Java 17, Spring Boot 3.5.16 and Spring MVC REST, with embedded Tomcat. All active UI, API strings, specifications and source documentation remain in English. Preserve historical snapshots and the original Sites version. Identify the application as 0.0.7.

Separate WeatherApplication (startup), WeatherController (HTTP endpoints), WeatherService (asynchronous provider calls and normalization), WeatherData/WeatherResponse (typed JSON DTOs), WeatherErrorHandler (provider failures) and NoCacheFilter (HTTP cache policy). Use constructor injection and Spring-managed @Service and @RestController components. Serve frontend assets from classpath:/public/.

## REST contract
GET /api/hello returns JSON with version 0.0.7, message Hello World · Version 0.0.7, weather, timestamp and architecture. Preserve all weather fields, null values, units, provider attribution and Buenos Aires timezone. Each accepted request independently queries Open-Meteo asynchronously using Java HttpClient, with MET Norway fallback. Use a total 10-second deadline and a 12-second Spring MVC async timeout. Report nearest-hour forecasts accurately. Return 502 for provider/format failures and 504 for provider deadlines, with an English error and Cache-Control: no-store. GET /health returns ok. Unknown routes return 404; unsupported POST /api/hello returns 405.

## Interface
Keep the English Weather, full stack. title and its half-size responsive font. Keep two reserved lines each for the message and weather details, one each for architecture and timestamps, grey animated loading skeletons, stable card/button positions, aria-busy, polite loading status and reduced-motion support. Show Spring Boot REST API in the request path and technology footer.

## Deployment and acceptance
Build an executable weather-java-0.0.7.jar with the Spring Boot Maven plugin. Docker must run the integration tests during package and start the executable JAR on Render PORT. Limit Tomcat worker threads for the Free instance. Deploy java-fuentes to the existing Render Free service. Do not synchronize OneDrive during iterations.

Verify the real Spring application with deterministic HTTP fixtures: repeated successful calls, exact version/message/JSON, fallback, wind conversion, English descriptions, null fields, 502, 504, static assets, health, 404 and 405. After deploying, verify Spring Boot startup, English UI and real weather, and unchanged loading geometry. Archive previous spec/plan/tasks with a timestamp.
