# Unified application promotion to the original Java environment

User request: deploy the integrated application currently on NEXT to the oldest original Java environment, retaining its public URLs.

## Requirements
- Preserve application URL https://ariel-sdd-weather-java.onrender.com and backend URL https://ariel-sdd-weather-microservice.onrender.com.
- Publish all eight existing routes: /, /weather, /components, /login, /hello-world, /bitcoin, /people, /chatbot.
- Retain Spring backend logic, background simulation, run counters, reset semantics, People persistence, optional OAuth, and Spring AI chatbot.
- Reuse the existing shared PostgreSQL database and existing rows/state. Do not reset, recreate, or migrate data into a new database.
- Reuse the existing two Docker web services and free plans; do not create or delete services.
- Serve the frontend from a Docker image compatible with the original Render-Dockerfile configuration; use the original API origin at build time.
- Configure backend allowed origins and OAuth URLs for the original frontend/backend.
- Preserve NEXT until original deployment is verified. Database row locking and persisted nextPollAt must continue to prevent duplicate simulation quotes across overlapping backends.
- Missing OAuth/OpenRouter credentials remain explicit configuration requirements.

## Acceptance
Both original services must become live with the reviewed source. Verify all eight frontend paths, API health, People/database health, simulation continuity and model/provider status without changing user data. Record deployment IDs, source commit, and elapsed time. A build or queued deploy is not success.
