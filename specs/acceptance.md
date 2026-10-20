# Acceptance checklist and test plan

## Deterministic microservice checks
- A real local HTTP fixture verifies primary request, units, timestamps and correlation headers.
- Primary HTTP failure, malformed JSON, invalid numbers and invalid timestamps trigger fallback.
- MET Norway is normalized to nearest-hour forecast; feels-like is null and wind is converted.
- Both provider failures produce safe 502 JSON; two timeouts produce 504 within the configured bounds.
- /health never calls a provider. GET/OPTIONS CORS allow the configured frontend; an unlisted origin is rejected by browser CORS handling.
- Unsupported routes/methods return appropriate HTTP status. Responses are no-store.

## Deterministic browser checks
- Mount loads weather; success displays the complete normalized contract and attribution.
- Loading/refresh reserves all slots, disables the button and clears stale values.
- Errors and incomplete/malformed JSON restore manual retry without crashing.
- Render startup HTML and transient infrastructure/network errors cause bounded retries and a visible progress message.
- Explicit non-retryable application errors fail immediately.
- Cancellation, deadline expiry, attempt cap, duplicate suppression and stale lifecycle responses are tested.
- Null feels-like is omitted and forecast labeling remains visible.
- External strings are rendered as text. Accessibility and reduced-motion rules are present.

## Build and deployment checks
- Exact stable React/react-dom versions and a lockfile are committed.
- npm ci, npm test and npm run build pass.
- mvn package passes all generated Java tests and creates an executable JAR.
- Start the JAR with local provider fixtures and verify a real JSON response plus health.
- Deploy the two components from the same implementation commit; inspect terminal deployment status.
- Verify CORS and real provider data through the public API.
- Verify initial load and button refresh in the deployed React page and capture a non-sensitive screenshot.
- Release report links the branch, deployed commit and exact public URLs.
