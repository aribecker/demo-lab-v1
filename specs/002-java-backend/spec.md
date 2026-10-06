# SDD Feature 002: Java backend variant

Keep hosted version 002 intact and develop on backend-java in a separate workspace checkout. Backend MUST run on Java 17 and expose GET /api/hello with the existing weather JSON contract. Serve the same frontend from Java; no browser-side weather-provider requests. Each accepted click triggers an asynchronous HttpClient request, with MET Norway fallback for primary failure. Entire operation has a 10-second deadline. Return 502 for provider/format failure, 504 for timeout, clear stale values and permit retry. Preserve provider attribution, units, source and distinction between current model data and nearest forecast.

Display Version 003 · Java. Provide GET /health. Respond 404 to unknown routes and 405 to unsupported methods. Bind 0.0.0.0 and use Render PORT. Build an executable JAR in Docker and deploy only Render Free. Do not update OneDrive during iterations. Do not overwrite the existing Sites application. Do not publish sources or weaken access permissions without user authorization.

Acceptance: compile Java, test response and static assets, test repeated calls, fallback and failures with fixtures, prepare Docker build inputs and separate Render deployment. Deployment requires an accessible connected repository or container registry.
