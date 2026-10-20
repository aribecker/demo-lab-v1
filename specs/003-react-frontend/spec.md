# Feature 003 — React frontend with visual and API parity

Status: specified before implementation.
Baseline: microservices-v008, commit 79d118576a702cae04b38be6f9776b7fe5c784bf.
Working branch: react-frontend-sdd.

## Goal and boundaries
Replace the handwritten DOM frontend with React. Preserve the weather page's English copy, look, dimensions, reserved slots, loading skeletons, error and refresh behavior. Keep both Java services, provider logic, REST contracts and contractual version 0.0.8 unchanged. This is an implementation migration, not a new weather feature. Do not change the live Render services as part of this branch-only request.

## Requirements
- R1: React owns the page under one root. Use components for the page, weather card and result slots; React state drives loading, success and error rendering. Do not retain a parallel imperative frontend.
- R2: Copy the baseline stylesheet byte for byte. Preserve its selectors, semantic elements, IDs, classes and card structure: badge and version badge, title and lead, label and live status, two-line message/weather slots, one-line architecture/timestamp slots, skeleton markup, refresh button and attribution footer. Only add React to the technology footer.
- R3: On mount and on Get weather, call same-origin GET /api/hello with cache: no-store. Render the existing message, numeric weather values, source, optional forecast label, architecture and Buenos Aires timestamps exactly as before. A null apparent temperature omits Feels like. Render API text as text, never HTML.
- R4: While pending, clear previous results, display Fetching weather…, set aria-busy=true and class is-loading, show skeletons and disable the button. Maintain reserved slot geometry in every state. Permit only one active request per mounted card. Unmount cleanup aborts or invalidates a pending request; a stale response must not change a new lifecycle's state.
- R5: On success display ✓ Weather updated. On HTTP failure display the backend error, or HTTP <status> when absent; on network/parse failure display the error message. In every error state, show Use the button to try again., clear prior result text, hide skeletons, clear aria-busy, and enable retry. Do not introduce automatic retries or change the backend's cold-start policy.
- R6: Preserve role=status, aria-live=polite, native button interaction, document language and title, responsive CSS and reduced-motion behavior. The initial HTML must still contain Version 0.0.8 and a loading shell before JavaScript runs.
- R7: Keep the browser and API on one origin. Vite builds /app.js and /styles.css, with all assets bundled locally and no CDN runtime. Spring Boot serves the generated files from the same executable weather-java-0.0.8.jar. Keep /health and /api/hello unchanged. The weather microservice does not require Node or React.
- R8: Commit package-lock.json. A normal Maven build of java-backend installs, tests and builds the frontend during generate-resources using Node/npm available on PATH, then packages dist as public resources. The Docker build uses a Node stage for the same install/test/build and copies dist into the Maven stage with frontend.prebuilt=true. Both main Dockerfiles stay equivalent. No generated bundle, node_modules, credentials or build output is versioned.
- R9: Preserve every pre-existing test source byte for byte. Add deterministic frontend tests for initial request, loading, success, refresh, HTTP/network/malformed-response errors and recovery, null fields, optional provider data, duplicate-request suppression and lifecycle cleanup. Both Java suites and a two-JAR smoke test must still pass. Add an explicit comparison against the baseline shell and stylesheet to substantiate visual parity without claiming an unperformed screenshot comparison.
- R10: The first branch commit contains specifications and their timestamped archive only. Subsequent implementation references these requirements. Record tests, limitations and requirement-to-code/test traceability in the branch. Preserve original/ and the other branches.

## Acceptance
All R1–R10 requirements must be covered by the migration plan, new UI tests, unchanged Java tests, packaged-process checks and parity evidence. Keep application version 0.0.8 to avoid altering the frozen API tests. Documentation identifies frontend/src as the editable UI source and explains Maven, npm and Docker entry points. No production deployment is implied by successful local validation.
