# SDD Feature 002 — REST microservices, version 0.0.8

## Requirements
Keep Java 17 and Spring Boot 3.5.16. All active source documentation, UI and API messages remain English. Archive previous specifications with a timestamp. Workspace and GitHub remain the primary sources; do not sync OneDrive during iterations.

## Independently deployable services
The main API in java-backend serves the frontend and GET /api/hello. It must call the weather-service REST endpoint GET /api/weather asynchronously, and must never directly call weather providers. The weather-service independently queries Open-Meteo, falls back to MET Norway, normalizes typed WeatherData JSON, and applies its existing 10-second provider deadline. Both services provide GET /health and Cache-Control: no-store. Independent Dockerfiles, executable JARs and deployment configuration are required. No credentials or user data are exposed by the public weather demonstration endpoint.

## Contract and resilience
GET /api/hello retains message, version, weather, timestamp and architecture. Version and greeting identify 0.0.8. Architecture identifies both Spring Boot API and Weather microservice. WEATHER_SERVICE_URL configures the full downstream endpoint, defaulting to localhost:8081/api/weather for local development. Use a 90-second downstream request timeout and 95-second MVC timeout to tolerate Render Free cold starts. The connection timeout must use the same downstream budget rather than a shorter fixed limit. The UI must retry transient network errors and HTTP 502/503/504 up to two times after three seconds, bounded by a 195-second overall request budget. Keep skeleton slots and the disabled button throughout retries; indicate that the service is waking up. Never report success without valid weather data. Return English 502 errors for downstream failures/invalid responses and 504 for downstream timeouts. Health is independent of downstream availability. Preserve original provider attribution, units and forecast labeling.

## UI
Preserve the half-size title, two-line message and weather slots, single-line architecture and timestamp slots, animated grey skeletons, accessibility and stable layout. Keep the refresh button disabled during a request. Identify REST microservices in the technology footer.

## Acceptance
Run deterministic HTTP integration tests for both service boundaries, provider fallback, deadlines, downstream failures, static resources and HTTP methods. Build two executable JARs. Commit source and SDD changes to java-fuentes. Deploy two Render Free services and verify a real weather request through both. Record exact deployment URLs and commit in the release report. Render Free hours are shared and services can sleep after inactivity.

## Deployment configuration
The weather microservice deploys microservices-v008 through Weather-Dockerfile. The existing main API deploys java-fuentes through Render-Dockerfile. WEATHER_SERVICE_URL points to https://ariel-sdd-weather-microservice.onrender.com/api/weather. Each service uses a build filter for its module and Dockerfile, allowing independent deployment without rebuilding on documentation-only changes.
