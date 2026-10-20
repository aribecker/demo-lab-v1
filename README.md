# React frontend + Java REST microservices — 0.0.8

Branch: `react-frontend-sdd`, based on `microservices-v008` at `79d1185`.

The original weather page is now implemented with React while preserving its English appearance, fixed result slots, loading skeletons, manual refresh, errors and REST contracts. React assets are built with Vite and included in the main Spring Boot JAR. No Node server runs in production.

## Modules
- `frontend/src`: editable React UI, request lifecycle, formatters and the original stylesheet.
- `frontend/test`: deterministic interaction, lifecycle and baseline-parity tests.
- `java-backend`: unchanged Java API logic; serves the generated React page and `GET /api/hello`.
- `weather-service`: unchanged independent provider adapter, `GET /api/weather`.
- `specs/003-react-frontend`: requirements, plan, task status, traceability and validation report.
- `original/`: the historical source snapshot, preserved.

The API and visible release version remain 0.0.8 so the frozen original Java tests and clients retain their contract.

## Build and test
Requirements: Java 17, Maven and Node 22 or newer with npm.

```bash
mvn -B -f java-backend/pom.xml package
mvn -B -f weather-service/pom.xml package
python3 scripts/smoke-microservices.py
python3 scripts/check-react-artifact.py
```

The main Maven build runs `npm ci`, frontend tests and the Vite build during `generate-resources`. Maven then copies `frontend/dist` into `public/` inside `weather-java-0.0.8.jar` and runs the original Java tests. Generated assets and `node_modules` are not committed.

For frontend-only work:

```bash
cd frontend
npm ci
npm test
npm run build
npm run dev
```

Vite development requests to `/api` and `/health` proxy to the Java backend on `localhost:8080`. Production serves everything from the Java backend's origin; no CORS change is needed.

## Run the packaged services

```bash
PORT=8081 java -jar weather-service/target/weather-service-0.0.8.jar
PORT=8080 java -jar java-backend/target/weather-java-0.0.8.jar
```

Open `http://localhost:8080/`. Set `WEATHER_SERVICE_URL` to a full `/api/weather` URL when using a remote downstream service.

## Docker and Render
`Render-Dockerfile` and `Dockerfile` both use Node → Maven → JRE stages:
1. Node installs locked dependencies, tests and bundles React.
2. Maven packages the supplied assets with `-Dfrontend.prebuilt=true` and runs Java tests.
3. The final image contains the JRE and executable JAR, with no Node, Maven or editable JSX.

`frontend.prebuilt` is only for an already-tested React build at `frontend/dist`; a normal developer Maven build should omit it. `Weather-Dockerfile` stays unchanged.

`render-react.yaml` is an optional separate Render service definition using this branch and the original weather microservice. It includes `frontend/**` in build filters. It has not been applied. The existing live services and other branch pointers are not changed by this migration.

## SDD sequence
Specifications and their timestamped archive were committed first (`f025187`). The implementation follows requirements R1–R10, with code and tests mapped in `specs/003-react-frontend/traceability.md`. The frozen baseline HTML is used only as a test fixture. Validation distinguishes exact CSS/DOM parity and packaged-JAR checks from screenshot comparisons or Docker-engine execution.
