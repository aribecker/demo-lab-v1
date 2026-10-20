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

## Application navigation
- The Menu hamburger button initially reports aria-expanded=false and controls a hidden navigation region.
- Opening it displays exactly one link, Weather demo, marked current.
- Button toggle and Escape close the disclosure; Escape restores focus to Menu.
- Selecting Weather demo closes navigation, focuses the weather section and preserves weather data without another provider request.
- Check the deployed menu visually and by keyboard.

## Build and deployment checks
- Exact stable React/react-dom versions and a lockfile are committed.
- npm ci, npm test and npm run build pass.
- mvn package passes all generated Java tests and creates an executable JAR.
- Start the JAR with local provider fixtures and verify a real JSON response plus health.
- Deploy the two components from the same implementation commit; inspect terminal deployment status.
- Verify CORS and real provider data through the public API.
- Verify initial load and button refresh in the deployed React page and capture a non-sensitive screenshot.
- Release report links the branch, deployed commit and exact public URLs.

## Verification status — 2026-10-20

Accepted against the generated checks: 14 backend tests, 25 frontend tests, packaged-JAR HTTP smoke, clean frontend production build and both live Render deployments. Initial browser load, visible startup retry and manual refresh were verified using real weather providers. See [release report](../docs/release.md), [traceability](traceability.md) and [captured evidence](../docs/evidence/).

Navigation acceptance verified in the live frontend deployed from cae61c61405d31e8f2b908de40a4093b45a2c7ce: disclosure, single option, keyboard Tab/Escape, destination focus and unchanged request ID. Existing 25 frontend checks and production build passed. See navigation evidence in the release report.
