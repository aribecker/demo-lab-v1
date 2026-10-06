# Release 0.0.8 — deployment checkpoint

Implemented and verified: separate Spring Boot REST main API and weather microservice, preserved frontend, timestamped SDD history, independent Docker builds, integration tests for both services, executable JAR builds, and real two-process REST smoke test with two fresh provider queries.

Pending: Render deployment. The current browser is signed out. GitHub is connected for deployment but not login; Google sign-in currently returns 502 Bad Gateway / connection refused. No deployment of 0.0.8 is claimed.

Next steps after authentication:
1. Create Free web service from this repository and branch microservices-v008 using Weather-Dockerfile, health /health.
2. Wait for Live and verify GET /api/weather with real provider data; record exact service URL.
3. Set WEATHER_SERVICE_URL on ariel-sdd-weather-java to the deployed weather URL plus /api/weather.
4. Promote tested commit to java-fuentes; both service Dockerfiles build tests during package.
5. Verify 0.0.8 greeting, real weather, architecture path and stable loading UI at the existing app URL.
6. Record deployed URLs and completed acceptance in SDD and release evidence.

The existing java-fuentes branch and Render 0.0.7 remain unchanged during this checkpoint.
