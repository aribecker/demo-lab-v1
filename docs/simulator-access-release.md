# R46 validation and deployment

Specification: f2370ae38b44e24e57e13ef6f785f77447bd36ef. Grounding: 4451438019e14ab79e70d0c77a18981ac2d3d480. Runtime release: frontend v2.13.0.

Local validation: 138 frontend tests, central BEM/style/token/contrast checks and production build pass. Java suite: 71 tests, zero failures/errors; 7 PostgreSQL-specific tests skip locally without the dedicated test database. Render's existing Docker build provisions a disposable PostgreSQL 17 instance and runs the complete suite before packaging.

Behavior: /bitcoin exposes only public market data and history; /trading-simulator requires a server-issued session for the verified Google owner. Simulator state/commands/history and raw simulation_state reads enforce the permission in Java. Login/logout and session expiry update navigation and route access. Database schema, durable state, trading engine and Google OAuth settings are preserved. Production verification must use read-only checks; no reset/start/pause commands.

Rollout: deploy the existing integrated API first, verify public market GET and anonymous/forged private denial, then deploy the existing integrated static frontend and verify direct route/menu behavior. A fresh Google sign-in is required because server sessions are in memory. No new service or paid plan change.

## Live verification — 2026-10-25
API deployment dep-dbf434l9fdbs738okpb0 and initial frontend deployment dep-dbf44qm7bikc73c47edg reached live on source 459d3b194e5f00761a525a9d72703667bfc0a491. Render API build: 71 tests, 0 failures/errors/skips (PostgreSQL 17 included). Frontend: 138 tests and production build passed.

Live public market, rate queries and period endpoints returned 200; the market projection omitted simulation/settings/controlRevision/runMetrics. Anonymous private state/history and Database Explorer simulation-state rows returned 401. Browser direct entry showed the login icon and link; the anonymous menu included Bitcoin Tracker and hid Trading Simulator. Public tracker opened without balances, adaptive controls or simulation actions. Owner and other-account flows, greeting, expiry, logout, revoked tokens and verified-email semantics passed automated tests; interactive Google login is left to the account owner. No production command or schema mutation was issued.

The final frontend-only correction labels the simulator footer with its Java API source; behavior and backend code are unchanged. The specification task checklist and this evidence are bundled into that frontend deployment.
