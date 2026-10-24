# Original Java environment promotion

Prepared for existing services ariel-sdd-weather-java and ariel-sdd-weather-microservice. No new resources or plan changes.

## Reviewed deployment configuration
Both services: source branch proximo-desarrollo-hello-world.
Frontend: keep Dockerfile ./Render-Dockerfile, context ., health /health; Docker image builds the eight-route v2.8.0 UI with original backend URLs.
Backend: keep ./Weather-Dockerfile, context ., health /health. Set ALLOWED_ORIGINS=https://ariel-sdd-weather-java.onrender.com,https://ariel-demo-next.onrender.com,http://localhost:5173 ; AUTH_FRONTEND_URL=https://ariel-sdd-weather-java.onrender.com ; AUTH_BACKEND_URL=https://ariel-sdd-weather-microservice.onrender.com . Transfer SIMULATION_DATABASE_URL from the existing NEXT backend through Render secret controls without recording its value. Preserve optional provider credentials/configuration.
If frontend has build filters, include frontend/** and Render-Dockerfile; backend retains weather-service/** and Weather-Dockerfile.

## Validation before rollout
101 frontend tests passed with original API origins. Production frontend build succeeded. Backend code is unchanged from the previously verified integrated release; its Docker build reruns backend tests.
Docker engine is unavailable locally, so nginx image must be validated in the real Render build and /health check.

## Pending rollout
Connected Render tools cannot modify source branch settings or copy an existing secret. Browser fallback approval is required before using the Render Dashboard. Services have not yet been switched. After applying settings, record live deploy IDs and verify routes, API health and persistent data before declaring promotion complete.
