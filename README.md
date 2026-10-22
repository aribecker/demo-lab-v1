# Demo Lab — Iteration 2

A React demo application with a Home page, live Weather demo and Component gallery. Frontend version **2.1.1** uses React 19.3.1 and React Router 7.18.4. The existing independently deployed Java weather API keeps its 2.0.0 contract.

## Direct routes

- Home: https://ariel-weather-iteration-2.onrender.com/
- Weather demo: https://ariel-weather-iteration-2.onrender.com/weather
- Component gallery: https://ariel-weather-iteration-2.onrender.com/components

The hamburger contains all three destinations. React Router handles client navigation and browser history; Render rewrites unknown static paths to index.html for direct entry/reload. Home introduces the demo and links its features. The gallery showcases the same reusable WeatherWidget used by the live page, with clearly labeled sample Success/Loading/Error states and a local refresh simulation. Only the Weather demo calls the microservice.

## SDD and checkpoint

Before adding routes, the working single-page application was preserved in commit `541da9ecf1af8ce14eabacad1ab67d100e6d0a16` and [tag v2.0.1](https://github.com/aribecker/0080-prueba-SDD-full-stack/releases/tag/v2.0.1).

The original requirements, architecture and acceptance criteria were directly updated and published in `7bde53b3b4257896b3d18b771d598c3cfb0a84bf` before grounding or routed source generation. No specification patch documents are used. Read [requirements](specs/requirements.md), [architecture](specs/architecture.md), [acceptance](specs/acceptance.md), [grounding/traceability](specs/traceability.md) and [release evidence](docs/release.md). The initial application's specifications-only commit remains `d41ef09988567cbcf63c1ead7462098fb0320d02`.

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

The 2.1.1 layout reduces vertical spacing across the shell, feature pages and gallery, with additional phone breakpoint adjustments. Text sizes and route behavior remain unchanged. See R14 and release evidence for measurement scope.


## Login (frontend v2.2.0)

New route: https://ariel-weather-iteration-2.onrender.com/login

Google, GitHub and Microsoft use the existing Spring server. Each provider remains visibly disabled until its OAuth client ID/secret pair is configured in Render. See [setup and callbacks](docs/login-setup.md). Actual consent shows the shared name, email/account address, platform, account ID and optional photo/locale/public profile. Sessions last 30 minutes and end on backend restart. Provider tokens never reach React and are discarded after userinfo; no account database is introduced. Weather remains public.

For changed hostnames configure AUTH_FRONTEND_URL, AUTH_BACKEND_URL and ALLOWED_ORIGINS on Java. VITE_AUTH_API_URL optionally overrides the frontend auth API origin, otherwise derived from VITE_WEATHER_API_URL. All client secrets stay server-side. Real consent must be verified after registration; automated tests exercise authentication boundaries with local fixtures only.



## Independent Hello World development branch

Branch: `proximo-desarrollo-hello-world`, based on login checkpoint `9b1104b`. Adds **Hello World** in the hamburger menu at `/hello-world`, retaining the weather microservice, component gallery, compact layout and three login providers.

New environment (configured separately from iteration-2):
- Frontend: https://ariel-demo-next.onrender.com
- Hello World: https://ariel-demo-next.onrender.com/hello-world
- API: https://ariel-demo-next-api.onrender.com

`render.yaml` now describes only these new services. Dashboard/MCP is used for creation; this file records matching deployment settings. OAuth credentials are not copied: activate providers using `docs/login-setup.md` with the new backend callbacks and frontend origin. Existing deployment evidence above describes the source environment.

The new static build emits index entry files for all four subroutes plus a custom 404 document. This supports direct entry/reload using Render static hosting while React Router keeps client navigation and history. A Dashboard rewrite is not required.
