# R38 grounding: retained independent Weather service

Latest specifications committed before this grounding: integrated 35ae7c5d1d3c17816ac76a0cfa7418d528e1d8f6; retained branch fc296c214e809e54805e8f65a5e988fdff65b3b2.

Observed: retained service srv-db2rlbnlk1mc738gjtfg tracks microservices-v008 at Weather-Dockerfile, with weather-service/** build filtering. That legacy module returns WeatherData and plain-text /health, incompatible with the normalized React contract. Keep URL and service; replace only its weather-service module with the extracted current tested weather implementation. Canonical extracted module lives at weather-microservice/ on integrated branch.

Integrated WeatherController combines /api/weather and /health. Move weather controller/service/record and provider fixture tests to the independent module; keep a separate HealthController and CORS/no-store/request-ID infrastructure in the integrated backend. Remove provider properties and backend WeatherApiTest, replacing with health/CORS/weather404 boundary coverage. Retain shared HttpClient and Clock used by auth/chat/simulation. Package/directory names may remain historical to avoid unnecessary migration.

Frontend authClient, simulationClient, peopleClient and chatClient currently derive their backend origin from VITE_WEATHER_API_URL. Introduce backendConfig.js reading only VITE_BACKEND_API_URL. Keep existing explicit VITE_AUTH_API_URL / VITE_SIMULATION_API_URL overrides. Weather client remains independent. Production split-origin test must prove unrelated clients never send requests to the weather origin. Local Vite proxies /api/weather to standalone localhost8081 and remaining /api + /auth to backend8080.

Retained microservice uses no database, auth or Spring AI dependency. Extract WebConfiguration, RequestLogFilter, WeatherApplication, WeatherController/Reading/Service and WeatherApiTest; application.properties contains only server/CORS/weather settings. Maven SpringBoot3.5.16/Java17 matches current integrated source. Canonical Dockerfile and retained Weather-Dockerfile package the same weather-only module from different directory paths. No credentials copied into that service.

Environment rollout: set retained ALLOWED_ORIGINS to integrated frontend plus original service consumers, deploy weather module; set integrated frontend VITE_BACKEND_API_URL and VITE_WEATHER_API_URL separately; preserve backend secrets. Deploy backend removal only with verified frontend split. Verify all retained API dependencies and database continuity before cleanup.

Connected Render tools have no delete_service or suspend operation. Cleanup therefore requires Dashboard/browser, with sign-in and permanent-deletion confirmation under browser policy. Do not mark any obsolete service removed merely because code/configuration changes succeeded. Preserve integrated pair, original weather service, PostgreSQL, unrelated playground and Git history.
