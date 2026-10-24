# Weather separation v2.9.0

Status: all three retained services live and verified. Cleanup explicitly deferred by the user; no service was deleted.

## Source and SDD
Integrated specifications commit 35ae7c5d1d3c17816ac76a0cfa7418d528e1d8f6 preceded grounding 25b8c363b3cae4d9ff6d4c9611f413b8c63642a9 and generated source 4438ea4a40e493f0166e9ea5dbd4791bea1427cf. Retained Weather branch specifications fc296c214e809e54805e8f65a5e988fdff65b3b2 preceded grounding 415e034c99b3464164b4f2265843de1e3c6fa899 and source e05252cefcd294f8164467069baac6bffd4bb9b1.

Canonical weather-only module: weather-microservice/ on proximo-desarrollo-hello-world. The retained service deploys its equivalent generated module at weather-service/ on microservices-v008 through Weather-Dockerfile. Its existing URL and service identity are preserved. Integrated backend keeps its historical weather-service/ directory but contains no weather provider/controller/record or provider properties. /health remains200; /api/weather is404.

## Live URLs and deploys
- Frontend: https://ariel-demo-integrated.onrender.com ; dep-dbeginon74is73elqj8g.
- Integrated backend: https://ariel-demo-integrated-api.onrender.com ; dep-dbegjf67bikc738cql90.
- Independent Weather: https://ariel-sdd-weather-microservice.onrender.com ; dep-dbeghk3ncjis73e69aj0.

VITE_BACKEND_API_URL directs People/chat/auth/simulation to integrated backend. VITE_WEATHER_API_URL directs only weather to retained service. Browser /weather rendered v2.9.0 and real MET Norway weather; displayed request ID 2a99328f-bb37-44db-a12f-e1e79eee6425 was found in retained microservice logs. CORS permits integrated frontend. Local Vite split proxies mirror production separation.

## Verification
103 frontend tests,31 integrated backend tests and14 weather-only tests pass in Render, zero failures/skips. Local backend ran28 plus3 PostgreSQL cases skipped; Docker reran all31 against disposable PostgreSQL. Build outputs generated all direct routes. Existing People records match exactly (4); simulation start/control revision/balances preserved, running=true, readings 5462->5498, new scheduler cycle status ok. Chat model catalog still lists18 models with credentials pending.

Database and backend secrets were preserved. No production reset, test person insert, new database, new service or paid-plan change. Root NEXT render.yaml was removed to avoid accidental recreation; current connector deployment configuration lives in deploy/integrated-zone.json.

## Cleanup decision
Ten obsolete project services are listed in the evidence as candidates, not as removed. User explicitly deferred cleanup after rollout. Preserve all current services until a future cleanup request; unrelated React playground and Git history remain outside retirement scope. No browser session is required to view this deployed application.
