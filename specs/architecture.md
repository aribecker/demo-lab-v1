# Architecture and deployment contract

Browser React page → HTTPS GET /api/weather on the Java microservice → Open-Meteo, with MET Norway fallback.

## Boundaries
- frontend/: React 19.3.1, Vite, plain CSS and browser tests. Static output goes to dist.
- weather-service/: Java 17, Spring Boot 3.5.16, typed JSON DTO, provider normalization, HTTP API, CORS and request logging.
- Weather-Dockerfile: Maven build/test stage followed by a JRE image containing weather-service-2.0.0.jar.
- render.yaml: declarative description of both deployments from iteracion-2, with component-specific build filters.
- scripts/: reproducible validation against the packaged JAR.

## Intended service names
- React Static Site: ariel-weather-iteration-2.
- Java Free Web Service: ariel-weather-api-iteration-2.
Use the actual URLs returned by Render when configuring CORS and VITE_WEATHER_API_URL. Record any hostname difference in deployment documentation before validation.

## Provider configuration
Open-Meteo endpoint:
https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires

MET Norway endpoint:
https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-34.6037&lon=-58.3816

Identify the application in User-Agent. References: https://open-meteo.com/en/docs and https://api.met.no/weatherapi/locationforecast/2.0/documentation.

## Navigation and component boundaries
- BrowserRouter in frontend/src/main.jsx; Routes in App.jsx with /, /weather, /components and a not-found page.
- App owns the shared shell, accessible hamburger and NavLink destinations. Route changes close navigation and focus the route heading. Keep frontend version 2.1.1 separate from the existing weather API contract 2.0.0.
- Home introduces the multi-feature demo and links both features, without mounting useWeather.
- WeatherDemo owns useWeather and renders the reusable presentational WeatherWidget. Leaving the route cancels an active request; navigating to the same route preserves it.
- ComponentGallery renders that exact widget with labeled sample data and controlled Success/Loading/Error states. A local preview timer may demonstrate the loading-to-success transition; it is cleaned up on unmount. No network provider access in Home or gallery.
- Existing Render /* rewrite to /index.html supports direct BrowserRouter entry and reload on /weather and /components. A frontend-only deployment reuses the existing Java API.
- Lightweight in-app gallery rather than a standalone Storybook service/dependency, appropriate for one reusable widget.

## Failure boundaries
The static page is available independently of Java startup. Browser retry logic handles infrastructure startup/HTML responses. Once Java answers with a structured provider error and retryable=false, the UI allows a manual retry. Provider timeouts and browser cold-start deadlines are separate settings. CORS limits browser origins; it is not authentication for this public API.

## SDD sequence
1. Publish a new tree containing specifications only, excluding all previous project files.
2. Derive the code and executable tests from requirements and acceptance criteria.
3. Validate and publish the implementation.
4. Create/configure both Render services, verify readiness and real end-to-end interaction.
5. Publish release evidence and final specification status.

## Compact layout
Use the existing shared styles.css selectors and mobile breakpoint. Compact the shell, page introductions, feature cards, shared WeatherWidget and gallery notes by adjusting vertical spacing only; retain font sizes and responsive flow. Do not change routes, weather requests, providers or gallery behavior.
