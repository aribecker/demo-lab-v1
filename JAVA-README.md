# Java REST microservices — 0.0.8

Java 17, Spring Boot 3.5.16, Maven and two independent executable JARs.

- java-backend: public frontend and GET /api/hello; asynchronous REST client.
- weather-service: GET /api/weather; asynchronous provider requests and fallback.
- Both: GET /health, typed WeatherData, English errors, no-store responses.

Build each module with `mvn -B package`. Start weather-service with `PORT=8081 java -jar weather-service/target/weather-service-0.0.8.jar`, then API with `java -jar java-backend/target/weather-java-0.0.8.jar`. Override WEATHER_SERVICE_URL with a complete URL ending in /api/weather for remote deployments.

Render-Dockerfile builds the API; Weather-Dockerfile builds the weather service. render.yaml documents two Free deployments. Free cold starts may take about a minute; the API allows 90 seconds for the downstream call. No database or credentials are needed. Integration fixtures test boundaries without external provider access.

SDD: specs/002-java-backend. Timestamped prior specifications: history/.

Run `python scripts/smoke-microservices.py` after building both JARs to test real cross-process REST calls with a deterministic local provider.

Release branches: main API on java-fuentes; weather service on microservices-v008. Both use verified application commit 0656f3a8eca05daff97a776376b3daa4f3d3ae70. Render build filters deploy only changes to the respective module or Dockerfile.

Application: https://ariel-sdd-weather-java.onrender.com/
Weather REST endpoint: https://ariel-sdd-weather-microservice.onrender.com/api/weather

Render administration uses its REST API. Credentials are kept outside the repository; no Render API key is included in the application or documentation.
