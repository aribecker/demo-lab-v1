# SDD Feature 002: Java backend variant

Keep hosted version 002 intact and develop on backend-java in a separate workspace checkout. Backend MUST run on Java 17 and expose GET /api/hello with the existing weather JSON contract. Serve the same frontend from Java; no browser-side weather-provider requests. Each accepted click triggers an asynchronous HttpClient request, with MET Norway fallback for primary failure. Entire operation has a 10-second deadline. Return 502 for provider/format failure, 504 for timeout, clear stale values and permit retry. Preserve provider attribution, units, source and distinction between current model data and nearest forecast.

Display Version 004 · Java. Provide GET /health. Respond 404 to unknown routes and 405 to unsupported methods. Bind 0.0.0.0 and use Render PORT. Build an executable JAR in Docker and deploy only Render Free. Do not update OneDrive during iterations. Do not overwrite the existing Sites application. Do not publish sources or weaken access permissions without user authorization.

Acceptance: compile Java, test response and static assets, test repeated calls, fallback and failures with fixtures, prepare Docker build inputs and separate Render deployment. Deployment requires an accessible connected repository or container registry.

## Versioned Hello World response

GET /api/hello MUST return `version: "004"` and `message: "Hello World · Versión 004"` alongside the weather contract. The browser MUST display this backend message with the weather result on initial load and every successful click. Keep the version at 004.

## Version 004 title size

The title Clima, full stack. MUST use exactly half the previous responsive font size: clamp(1.5rem, 4.5vw, 3.25rem), replacing clamp(3rem, 9vw, 6.5rem). Badge and backend Hello World message MUST identify version 004.
