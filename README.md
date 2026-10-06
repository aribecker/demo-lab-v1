# Weather application — 0.0.7 / Spring Boot REST

Java 17, Spring Boot 3.5.16, Spring MVC REST and embedded Tomcat. English interface with asynchronous provider calls and stable shimmer loading placeholders.

## Source map

- `java-backend/src/main/java/ariel/sdd/weather/WeatherApplication.java`: Spring Boot startup and application version.
- `WeatherController.java` in the same package: REST endpoints `/api/hello` and `/health`.
- `WeatherService.java`: async Open-Meteo request, MET Norway fallback and weather normalization.
- `WeatherData.java` / `WeatherResponse.java`: typed JSON records.
- `WeatherErrorHandler.java`: 502/504 provider errors.
- `NoCacheFilter.java`: no-store responses.
- `java-backend/src/main/resources/public/`: frontend.
- `java-backend/src/main/resources/application.properties`: runtime/provider configuration.
- `java-backend/src/test/java/ariel/sdd/weather/WeatherIntegrationTest.java`: actual Spring HTTP integration tests against local fixtures.
- `specs/002-java-backend/`: active SDD; `history/`: timestamped earlier specifications.

## Build and deploy

Run `cd java-backend && mvn package`, then `java -jar target/weather-java-0.0.7.jar`. Maven executes deterministic integration tests and builds an executable Spring Boot JAR. Docker uses `Render-Dockerfile` and also executes tests before packaging.

Render Free builds branch `java-fuentes` automatically on commit, exposes PORT and checks `/health`. Application URL: https://ariel-sdd-weather-java.onrender.com/ .

For a manual GitHub UI change, edit `java-backend/src/main/resources/public/index.html`, commit directly to `java-fuentes`, wait for Render Live and reload the app. Preserve SDD history before specification changes. Do not copy iterative updates to OneDrive or deploy this variant to the original Sites application.
