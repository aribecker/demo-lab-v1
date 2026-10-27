# Grounding: separate integrated deployment zone

Requirement source: specs/integrated-deployment-zone.md, commit e63b17e00ff1bdf39b039d353e522f052e1d1fec.
Application baseline: c6625749345253bc7406d4a6e8ee4f8da2962531 (v2.8.0).

- frontend/src/App.jsx and scripts/static-routes.mjs already expose eight direct-entry routes. No UI/business-logic change is needed.
- Frontend weather/auth/simulation/people/chat clients resolve URLs from VITE_WEATHER_API_URL / VITE_AUTH_API_URL; new deployment must supply its own backend origin.
- Weather-Dockerfile runs backend unit/integration tests against disposable local PostgreSQL before packaging. Reuse it unchanged.
- application.properties accepts ALLOWED_ORIGINS, AUTH_FRONTEND_URL, AUTH_BACKEND_URL and SIMULATION_DATABASE_URL.
- DatabaseConnections, People migrations and SimulationStore already reuse public.people and bitcoin_shared on the same database; row locks plus durable nextPollAt prevent independent simulations during parallel deployments.
- Connected create_static_site/create_web_service support branch selection and environment variables at creation. Use user-requested connector creation, not Dashboard Blueprint application.
- Existing database ID dpg-dbcnsmivcj2c73f9iucg-a, Oregon, workspace tea-db1drlhsrm7s73b7qmhg. get_postgres returns metadata only, not password/connection URL. No connector operation reads existing service secret values. Library search/recent-image inventory did not resolve the user-mentioned database screenshot. Do not invent credentials or create another database as fallback.
- Record exact API creation parameters in deploy/integrated-zone.json with secret omitted and a required-secret declaration. This is a deployment manifest, not a Render Blueprint.
- Existing Render-Dockerfile added for prior Java promotion is not used by this static frontend. Existing original services remain unchanged.
- Validate frontend tests/build with new origin, then both live deploys, CORS, all pages, health/provider endpoints. Missing storage must remain explicit503; do not report it working. Copying SIMULATION_DATABASE_URL into the new backend through Render remains a required owner configuration if no credential becomes available.
