# Integrated Demo Lab v2.9.0

Current frontend: https://ariel-demo-integrated.onrender.com
Application backend: https://ariel-demo-integrated-api.onrender.com
Independent Weather: https://ariel-sdd-weather-microservice.onrender.com

People, the shared trading simulator, login and chatbot use the application backend. Only live weather uses the independent weather service. PostgreSQL remains the same existing database; never reset it during deployment.

## Configuration
Frontend VITE_BACKEND_API_URL is the integrated backend origin. VITE_WEATHER_API_URL is the independent full /api/weather URL. Optional VITE_AUTH_API_URL and VITE_SIMULATION_API_URL remain explicit overrides. No application API derives its origin from weather anymore. Database/provider secrets belong only on the relevant backend.

Canonical configuration: deploy/integrated-zone.json, applied through Render connector operations. The obsolete root render.yaml describing NEXT was retired so it cannot accidentally recreate those services. Deployment provenance and pending/confirmed cleanup are recorded in docs/weather-separation-release.md.

## Source layout and local execution
- frontend/: React v2.9.0; npm ci, npm test, npm run dev.
- weather-service/: integrated Java backend (historical directory name), no weather endpoint. Run mvn -f weather-service/pom.xml spring-boot:run on8080.
- weather-microservice/: independent Java weather provider. Run mvn -f weather-microservice/pom.xml spring-boot:run on8081. Vite routes local /api/weather to8081 and all other /api and /auth to8080.
- Weather-Dockerfile: integrated backend, including disposable PostgreSQL build tests.
- Weather-Microservice-Dockerfile: canonical weather-only build. The retained service still tracks microservices-v008 and its equivalent generated module at weather-service/ through that branch's Weather-Dockerfile.

SDD order is specification commit, grounding commit, generated implementation/tests, verified deployment and cleanup evidence. Existing source history is preserved in Git.
