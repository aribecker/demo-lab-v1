# Implementation Plan

Use Node.js built-in HTTP APIs for the backend and vanilla HTML/CSS/JavaScript for the frontend. This keeps the SDD example transparent and dependency-free while still exercising both application layers.

## Structure
- `src/server.js`: HTTP server, static-file serving, API endpoint.
- `public/`: browser client.
- `test/`: build and API checks.

## Runtime
Default port: `3000`, overridable with `PORT`.
