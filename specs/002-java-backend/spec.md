# SDD Feature 002: Java weather application — Version 0.0.6

## Scope and language
All active application UI, API messages, source comments, specifications, and project documentation must be in English. Use the exact version string `0.0.6` in the Java API and frontend badge. Keep historical snapshots unchanged. Preserve the original hosted version 002 and its archived source.

## Weather contract
Java 17 serves the frontend and GET `/api/hello`. Every accepted click initiates an asynchronous HttpClient request to Open-Meteo with MET Norway fallback. The entire operation has a 10-second deadline. A successful JSON response contains `version: "0.0.6"`, `message: "Hello World · Version 0.0.6"`, weather, timestamp, and architecture. Weather includes location, temperature, apparent temperature, humidity, wind speed, units, provider attribution, timezone, and data timestamp. MET Norway data is described as `Forecast for the nearest hour`. Return 502 for provider/format failures and 504 for timeouts, with the English error `Unable to retrieve the weather. Please try again.` Clear stale values and allow retry.

## Stable interface
Use `Weather, full stack.` as the heading, retaining `clamp(1.5rem, 4.5vw, 3.25rem)`. Reserve exactly two lines for the Hello World/weather heading and two for weather details; reserve one line each for architecture and timestamps. Keep slot dimensions, spacing, card and button positions stable across initial loading, repeated requests, success and failure. Show grey shimmer skeletons with two/two/one/one bars during loading. Use aria-busy and a polite English status, hide decorative skeletons from assistive technology, and respect reduced-motion preferences. Narrow-screen overflow may scroll inside its fixed slot.

## Runtime and deployment
Serve GET `/health`; return 404 for unknown routes and 405 for unsupported methods. Bind to 0.0.0.0 and use Render PORT. Build Maven artifact `weather-java-0.0.6.jar` in Docker. Deploy the private repository branch `java-fuentes` to the existing Render Free service using `Render-Dockerfile` and Auto-Deploy. Do not copy to OneDrive during iterations or modify the original Sites app.

## Acceptance
Compile Java and test success, exact version/message, English forecast attribution, fallback, unit conversion, errors, assets, health and methods. Verify English content and a real weather response on Render, and check that loading geometry remains stable. Archive prior active SDD documents with a timestamp before modifying them.
