# Release 0.0.8 — completed

Application commit: 0656f3a8eca05daff97a776376b3daa4f3d3ae70.

## Deployments
- Main API: https://ariel-sdd-weather-java.onrender.com/ — Render service srv-db27ln67bikc73covi50, branch java-fuentes, deployment dep-db2rm9m0tbcc738n30j0.
- Weather service: https://ariel-sdd-weather-microservice.onrender.com/api/weather — Render service srv-db2rlbnlk1mc738gjtfg, branch microservices-v008, deployment dep-db2rlcvlk1mc738gk1lg.
- Both services are Live on Free compute in Oregon.
- Main API WEATHER_SERVICE_URL uses the public weather REST endpoint. Build filters isolate each module/Dockerfile from the other service and documentation-only changes.

## Acceptance evidence — 2026-10-07, Buenos Aires
Both modules passed deterministic Spring HTTP integration tests and executable JAR packaging. A local two-process smoke test verified two fresh provider queries via the main API and independent weather service.

After deployment, the weather service returned MET Norway data (17.1 °C). The browser then verified Hello World · Version 0.0.8, Open-Meteo data (17.2 °C, humidity 80%, wind 18.4 km/h), and Browser → Spring Boot API → Weather microservice → Open-Meteo → JSON → Browser.

A repeated browser request retained identical card height 441.578125 px, message height 70.71875 px and button y=696.5 px. Loading placeholders and disabled button were verified.

Render administration used its authenticated REST API. No credentials were committed or embedded in application configuration. Existing SDD specifications were archived at history/20261006-195112-ART/specs/002-java-backend/.
