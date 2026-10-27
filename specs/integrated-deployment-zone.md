# Integrated deployment zone

## Authorized scope
Create a new frontend and backend in the confirmed Ariel Render workspace. Keep the integrated application v2.8.0 and its eight routes unchanged. Deploy the existing proximo-desarrollo-hello-world branch. Keep all existing environments and plans unchanged.

## Configuration
- New static frontend: ariel-demo-integrated.
- New Docker Java/Spring backend: ariel-demo-integrated-api, Weather-Dockerfile, Oregon, free plan.
- Reuse existing ariel-sdd-people-db, public.people and bitcoin_shared.simulation_state, with no reset or schema/data copy.
- Set frontend API URLs to the newly created backend.
- Set backend CORS and optional OAuth frontend/backend origins to the new URLs.
- Preserve optional-provider configuration status; missing OAuth/OpenRouter credentials must not be described as working authentication/chat.
- Keep database credential exclusively in backend SIMULATION_DATABASE_URL. Do not expose it to build/frontend/source/chat.
- Backend simulation locking continues to coordinate simultaneous instances against the shared singleton.
- Free-service sleep behavior remains unchanged; this configuration does not promise uninterrupted execution.

## Acceptance
Track source commit and deploy IDs. Both services must become live. Verify all frontend routes, backend health, model/provider status, CORS, and production API origins. Declare persistence working only after People health/list and simulation APIs confirm the existing shared data. If the connector cannot transfer the existing secret, report that exact remaining configuration step and keep storage failure explicit (no volatile fallback).
