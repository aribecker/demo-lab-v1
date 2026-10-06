# Implementation plan — 0.0.8

1. Archive active SDD files with timestamp.
2. Extract provider adapter to independently buildable weather-service.
3. Replace main provider adapter with typed asynchronous REST client.
4. Preserve frontend geometry and update version and architecture labels.
5. Test both applications with deterministic HTTP fixtures and build JARs.
6. Commit both services, specifications, Dockerfiles and Render configuration.
7. Deploy weather microservice, configure WEATHER_SERVICE_URL on existing API, deploy API.
8. Verify real weather end to end and publish deployment evidence.

Use two public Free web services for the demonstration because Free services cannot receive private network traffic. Keep provider timeouts separate from cold-start timeout. Each service can be deployed independently from the same repository.

## Deployment checkpoint
Stage the tested release on microservices-v008 while Render authentication is unavailable. Promote to java-fuentes only after the weather service exists and WEATHER_SERVICE_URL is configured, preserving the working 0.0.7 deployment during setup.
