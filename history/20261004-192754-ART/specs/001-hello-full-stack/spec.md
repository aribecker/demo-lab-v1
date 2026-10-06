# Feature Specification: Full-Stack Hello World

## Overview
A tiny browser application demonstrates a complete request path from frontend to backend. The page loads, calls `/api/hello`, and renders the server response.

## User Scenario
As a visitor, I open the application and see a clear Hello World page. I can press **Call backend** and see a fresh response from the server without reloading the page.

## Functional Requirements
- FR-001: The server MUST serve the browser UI at `/`.
- FR-002: `GET /api/hello` MUST return JSON containing `message`, `timestamp`, and `architecture`.
- FR-003: The UI MUST call the API on initial load and on button press.
- FR-004: The UI MUST visibly distinguish loading, success, and error states.

## Success Criteria
- SC-001: A user can see a backend response within 2 seconds on a healthy local environment.
- SC-002: The API responds with HTTP 200 and valid JSON.
- SC-003: The project starts with one documented command and no external runtime service.
