# Integrated deployment zone release

The integrated v2.8.0 application is deployed with configuration changes only. Specification: specs/integrated-deployment-zone.md. Grounding: docs/integrated-deployment-zone-grounding.md. Generated deployment configuration: deploy/integrated-zone.json. Existing environments remain unchanged.

## Live services
- Frontend: https://ariel-demo-integrated.onrender.com ; srv-dbeg1ics728c73c4h61g ; deploy dep-dbeg1iks728c73c4h7a0.
- Backend: https://ariel-demo-integrated-api.onrender.com ; srv-dbeg1f8ae00c73d1mkrg ; database activation deploy dep-dbeg8givcj2c73cs0odg, live, source f60e134b818843bc2e859bd039a339b3d9b63094.
- Both track proximo-desarrollo-hello-world. Free backend in Oregon; static frontend.

## Verification
101 frontend tests and43 backend tests passed in the original rollout; no application code changed for database activation. All eight frontend paths return200. Live /health, weather, auth provider status and chat catalog work with the new origin. Database activation configured SIMULATION_DATABASE_URL exclusively through the backend environment, without committing or recording its secret value.

/api/people/health now returns PostgreSQL UP, /api/people returns the same4 records, and /api/simulation returns the shared active simulation. Control revision, simulation start, balances and trade count were preserved. Readings advanced from 5342 to 5356; the new backend reports schedulingEnabled=true and lastCycleStatus=ok. Browser People page renders the4 existing rows. No reset, added test person or other simulation command was issued.

## Remaining optional setup and hosting behavior
OAuth providers remain disabled until credentials are configured. Chat catalog has18 free options but sending requires OPENROUTER_API_KEY, as in the prior demo. Free backend can sleep; continuous24/7 execution is not guaranteed. Existing database expiry is unchanged.

The connector uses default TCP readiness; /health and storage APIs were independently verified. Secret values must remain absent from deployment manifests and frontend variables.

Evidence: docs/evidence/integrated-deployment-zone.json (initial rollout including then-pending storage), docs/evidence/integrated-database-activation.json (successful activation, supersedes the initial storage status).
