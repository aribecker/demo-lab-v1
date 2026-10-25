# R46 — Separate market tracker and owner-only simulator

This specification is authoritative for R46 and supersedes earlier statements in R15–R18, R32 and R35 that simulator access and commands are public. Other feature and database contracts remain in force.

## Navigation and views
- `/bitcoin` remains the public **Bitcoin Tracker** menu destination. Show the server's market prices, chart, successful readings and durable market-query history (Latest 25, View All, Resumido). Do not mount the simulation panel, adaptive decisions, balances, settings or simulator commands. Its polling is read-only and does not start/stop/reset the engine.
- `/trading-simulator` is the separate **Trading Simulator** menu destination, visible only after a valid server session grants `canUseSimulator`. Show existing virtual balances, settings, adaptive tracking, timing, start/reset, pause/resume and manual refresh. Do not duplicate the Bitcoin Tracker panel here; link to it.
- Direct entry/reload is supported on both routes. Anonymous simulator entry shows a login icon and a link to Login. Signed-in users without permission see `Hello, <name>.` and exactly `You are not authorized to use this feature.` No protected reads or controls are mounted before authorization. Login and logout update menu and route permissions without a page reload. Session expiry/revocation removes access; errors fail closed with retry.
- Login remains available to other users. Its text and Home must reflect these separate permissions; simulator links/cards are owner-only. Successful login offers an owner simulator link. Logout/route changes never reset funds or pause the engine.

## Identity and API authority
- Only the Google account with verified email `aribecker2@gmail.com` may use the simulator. Match the complete email case-insensitively; do not strip dots, plus suffixes or match display names. Google `email_verified` must be true. Other providers, missing/unverified email, invalid/expired/revoked tokens deny access.
- Preserve existing server-owned opaque bearer sessions and PKCE exchange. Add server-computed boolean `canUseSimulator` to exchange and `/auth/me`; never trust email/capabilities submitted by the browser. Google identity comes only from the validated OAuth/OIDC principal.
- Require this permission before all `/api/simulation` reads, commands and nested history endpoints. Return no-store JSON 401 for missing/invalid sessions, 403 for authenticated users without permission, before parsing/executing commands or database access. Preserve CORS preflight.
- Add GET-only public `/api/bitcoin`, `/api/bitcoin/rate-queries` and `/api/bitcoin/rate-periods`. The first is an explicit market-only projection: revision, running, samples, baseline, range, count, lastPollAt, error and rateQueries. Never serialize simulation/settings, balances, ledger or controlRevision through it. History reuses the existing audit and paging semantics. No public command alias.
- The Database Explorer remains available. Reading `bitcoin_shared.simulation_state` through its row endpoint requires the same permission, preventing a bypass through raw stored JSON. Other database features retain their current contract.
- Simulator clients attach the existing bearer token. On 401/403 discard protected UI data and revalidate identity. Revalidate on route entry, tab focus and periodically; handle the declared session expiry immediately. Public tracker uses no bearer token.

## Persistence and rollout
No schema/migration or data changes. Preserve all existing tables, snapshots, balances, settings, run state and rate audit. Sessions remain in-process and expire after 30 minutes; deploy/restart requires a fresh login. Deploy backend before frontend, keep current Google credentials and OAuth callback URLs, and do not issue production simulation commands as verification.

## Acceptance
Test anonymous/forged/expired/revoked sessions, another verified email, unverified owner email, another provider, verified owner, exact email normalization, protected GET/POST/history and database-row bypass. Check that denial has no simulation effect, public projection omits protected fields, history stays public/read-only and owner commands still work. Test menu visibility, direct URL states, greeting, login/logout, expiry, permission failure/retry, separate panels and preserved state on navigation. Run full frontend and Java regressions, style contract, production builds and disposable PostgreSQL checks; verify live public GETs and denied private requests without resetting state.
