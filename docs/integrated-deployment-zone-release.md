# Integrated deployment zone release

Application behavior remains v2.8.0. Only deployment configuration changed, following specification commit e63b17e00ff1bdf39b039d353e522f052e1d1fec, grounding commit f75275bffc8686c940640d8909e0e1d453b354bd, and configuration commit 0dbadf17fc4de89b0c33d12e491280941337e91a.

## Created services
- Frontend: https://ariel-demo-integrated.onrender.com ; srv-dbeg1ics728c73c4h61g; deploy dep-dbeg1iks728c73c4h7a0, live.
- Java/Spring backend: https://ariel-demo-integrated-api.onrender.com ; srv-dbeg1f8ae00c73d1mkrg; deploy dep-dbeg1fgae00c73d1mmg0, live.
- Source branch: proximo-desarrollo-hello-world. Existing environments unchanged. Free backend plan; static frontend. Backend currently uses default TCP readiness because the connector creation tool cannot specify an HTTP health-check path; GET /health was independently verified200.

## Verified
101 frontend tests and 43 backend tests passed, no failures. Backend PostgreSQL integration tests used disposable build storage. All eight frontend routes return200, UI v2.8.0 renders, browser navigation works. Production bundle contains the new API origin and no NEXT API origin. Live /health, /api/weather, /auth/providers and /api/chat/models return200 with the correct CORS origin. Chat catalog has18 free models, configured=false. All OAuth providers disabled.

## Explicit incomplete prerequisite
The new backend lacks SIMULATION_DATABASE_URL. /api/people/health, /api/people and /api/simulation correctly return503, and UI displays storage unavailable. Persistence has NOT been activated in this new environment. Existing NEXT backend remains connected; read-only checks observed4 people and an active shared simulation without issuing commands or adding rows.

Owner configuration: open existing ariel-demo-next-api in Render, Environment, copy SIMULATION_DATABASE_URL directly into the same key on ariel-demo-integrated-api, Environment. Save and deploy. Do not send the value in chat or screenshots. Then verify /api/people/health=200, the same4 records, and existing simulation control/run/balances. No reset is required. Do not create another database.

The connector cannot read existing secrets; recent Library search/inventory did not locate the mentioned PostgreSQL screenshot. No browser login was retried after the user declined that flow. Optional OAuth and chatbot credentials remain prerequisites as in the prior demo.

Detailed non-secret checks: docs/evidence/integrated-deployment-zone.json.
