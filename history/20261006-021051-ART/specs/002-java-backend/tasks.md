# Tasks

- [x] Tag v002 and create backend-java worktree.
- [x] Archive prior specs with timestamp.
- [x] Define Java contract, build and hosting plan.
- [x] Implement asynchronous Java service and preserve frontend.
- [x] Add Dockerfile and Render Free configuration.
- [x] Compile and execute API tests.
- [x] Connect deployable repository/image to Render.
- [x] Deploy and verify separate Java URL.

## Deployment verification — 20261006-013758-ART

Render Free service `ariel-sdd-weather-java` is Live from GitHub commit `75b34332cdf2f2a69019efad7dd30448b93490a5`, branch `backend-java`. Maven/Docker build succeeded. Public URL: https://ariel-sdd-weather-java.onrender.com/ . Browser displayed version 004 / Java 17 and a real MET Norway response (15 °C, humidity 73.9%, wind 16.6 km/h). Render health check configured at `/health`; direct browser navigation to that endpoint was blocked by the browser client.

- [x] Define versioned Hello World JSON and browser display.
- [x] Implement APP_VERSION and assertions for version/message.
- [x] Verify versioned message deployment on Render (003 verified before this change).

- [x] Set version 004 and halve responsive title size.
- [x] Verify version 004 deployment on Render.

- [x] Define version 005 reserved line counts and accessible shimmer states.
- [x] Implement fixed result slots, skeleton overlays and loading lifecycle.
- [ ] Verify version 005 deployment and stable loading geometry.
