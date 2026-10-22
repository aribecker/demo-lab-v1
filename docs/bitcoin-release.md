# Bitcoin tracker release — 2026-10-22

Environment: parallel only. Branch: proximo-desarrollo-hello-world. Frontend v2.3.0.

## SDD sequence
1. Master requirements R20–R23, architecture, acceptance and task specifications committed and published before implementation: ac7222060ea3221cb06e07528532ae6c72e47b84.
2. Grounding records the existing router/Home/static route boundaries and Coinbase public spot API documentation and live CORS/JSON check in specs/traceability.md.
3. Implementation commit: 33392e01cae781777ef5f8f2506d9274f33b2e4e.

## Validation
- npm ci, npm test: all 60 tests passed (18 Bitcoin cases plus existing regressions).
- npm run build passed; bitcoin/index.html emitted for direct entry/reload.
- Render frontend service srv-dbcnmkgm7kps73cb9p1g, deploy dep-dbcvjavavr4c73d3ti5g, status live, finished 2026-10-22T11:55:55Z. Render independently ran tests and built assets successfully.
- https://ariel-demo-next.onrender.com/bitcoin returned HTTP 200 and the v2.3.0 bundle contains the new menu/route and exact Coinbase endpoint.
- Live cloud-browser verification: direct route rendered guided panel and real Coinbase USD quotes; successful readings advanced at 10-second intervals (08:56:15, 08:56:25, 08:56:35 Buenos Aires); chart updated with actual changes. Pause held count at 3; Resume immediately retrieved a fourth quote.
- Screenshot inspected: chart, summary and controls visible. Responsive CSS supports 320px+; mobile viewport rendering was not separately measured. Local Playwright browser download unavailable, so actual UI verification used the cloud browser.
- No backend source, original branch or original service configuration changed. Existing parallel API auto-deploy may rebuild on this branch commit; no manual deploy or configuration change was requested.

## Data semantics
Quotes are Coinbase BTC/USD spot responses without credentials. Timestamp means browser retrieval time, not exchange observation time. Polling targets 10 seconds while the route is active, visible and not paused; browser throttling, latency, failures and provider caching can prevent a new value at every tick. At most 180 successful samples stay in component memory; session baseline and min/max include all successful quotes since route entry. Leaving/reloading resets the session.
