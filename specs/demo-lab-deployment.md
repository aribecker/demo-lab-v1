# Demo Lab dedicated repository deployment

Date: 2026-10-27. User authorized deployment in Ariel's workspace.

- Both services deploy https://github.com/aribecker/demo-lab, branch main.
- Frontend service demo-lab publishes frontend/dist after npm ci, npm test and npm run build in frontend. Render assigned https://demo-lab-jeov.onrender.com.
- Backend demo-lab-api uses Weather-Dockerfile, context ., Oregon, free compute and port 8080. Its public origin is https://demo-lab-api.onrender.com.
- Frontend application/auth requests use the new backend; live weather retains its independent existing service.
- Backend CORS and OAuth frontend URL use the actual assigned frontend origin.
- Reuse the existing ariel-sdd-people-db via SIMULATION_DATABASE_URL. Never reset simulation, run test suites against deployed data, create replacement storage or expose credentials in Git.
- Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET plus registration of https://demo-lab-api.onrender.com/login/oauth2/code/google with the OAuth provider. Other enabled providers require their corresponding credentials and callback URLs.
- Chat delivery requires OPENROUTER_API_KEY. Authentication defaults to the simulation database unless AUTH_DATABASE_URL is explicitly configured.
- Original services remain in place because Treasury and other clients can depend on the integrated API.
- Free compute can sleep. Continuous trading requires a separately authorized paid-plan change.
- Successful builds and health checks do not imply login, database or chatbot activation. Verify these independently after secrets are supplied.

Grounding: frontend/src/backendConfig.js, frontend/src/authClient.js, weather-service/src/main/resources/application.properties, weather-service/src/main/java/ariel/iteration2/weather/auth/AuthConfiguration.java and SimulationService.java. Source imported unchanged from db22fbccfc95ebb6020341ea10f860dc943e3bfb into eb0cc74780de39618236851e830077d06e3b605b.
