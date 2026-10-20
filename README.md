# Weather, full stack. — Iteration 2

A fresh application generated from the specifications in this branch: one React page directly calls one Java weather microservice. No code, builds or tests from the previous application are retained in this tree.

The specifications-only commit is [`d41ef09988567cbcf63c1ead7462098fb0320d02`](https://github.com/aribecker/0080-prueba-SDD-full-stack/commit/d41ef09988567cbcf63c1ead7462098fb0320d02). Read [requirements](specs/requirements.md), [architecture](specs/architecture.md), [acceptance](specs/acceptance.md) and [traceability](specs/traceability.md). Deployment evidence is recorded separately in `docs/release.md` after validation.

## Local development

Use Java 17, Maven 3.9+ and Node 22+.

```sh
mvn -f weather-service/pom.xml spring-boot:run
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite proxies `/api/weather` to localhost:8080. The microservice queries Open-Meteo and, on failure, MET Norway. All weather is for Buenos Aires. Provider data is labeled as current model data or forecast, with its actual timestamp.

## Validation

```sh
mvn -B -f weather-service/pom.xml package
python3 scripts/smoke_jar.py
cd frontend
npm ci
npm test
npm run build
```

The Java integration tests and JAR smoke check use local HTTP provider fixtures; no live provider or credentials are needed. Mockito uses its subclass mock maker so the tests do not require JVM agent attachment. Client tests cover lifecycle cleanup, presentation and bounded cold-start retries. `frontend/dist` is the static production build.

## Deployment

`render.yaml` describes the existing Render workspace's two iteration-2 services. Both use branch `iteracion-2`, with component-specific build filters. The Dockerfile's Maven stage compiles and tests the Java source; the final JRE stage receives only its executable JAR.

- React: https://ariel-weather-iteration-2.onrender.com
- API: https://ariel-weather-api-iteration-2.onrender.com/api/weather
- Readiness: https://ariel-weather-api-iteration-2.onrender.com/health

Set `VITE_WEATHER_API_URL` to the full deployed API endpoint before building the frontend. Set the API's `ALLOWED_ORIGINS` to the actual frontend origin plus `http://localhost:5173`. These are public demo URLs, not secrets. Provider URLs and `weather.provider-timeout-ms` can be overridden with Spring server configuration.

Render Free can suspend an inactive Java service. The static React page remains independently available and retries startup/network failures for up to 180 seconds or 20 attempts, with a maximum 45-second request and 2–8-second delays. A structured provider failure stops the interaction and enables manual retry. There is no periodic refresh.

The API is intentionally public and has no authentication. CORS configures browser access; it does not stop non-browser clients. No database, separate gateway, login flow or additional backend is part of this iteration.
