# Login demonstration + persistent trading v2.6.0

## Specification-led integration
Original login requirements R15–R18 from iteracion-2 are reconciled with persistent shared simulation R29–R34 in master R35. Specification commit 0cf85a09744538d0c2612713a44ffdaa967be59a precedes a separate grounding commit and regenerated application code. No ordinary Git merge was performed: the login source was already inherited from merge base 9b1104b.

## Result
Both /login and /bitcoin belong to ariel-demo-next and use ariel-demo-next-api. The original provider/profile/session/logout behavior is preserved, with explicit cross-links and shared-state semantics on both views. Login is optional and does not create a private simulation. View changes/sign-in/sign-out do not issue trading commands. Home introduces the combined application.

Frontend auth now uses explicit VITE_AUTH_API_URL, the configured weather API origin, or local same-origin /auth; it never falls back to the original hosted environment. Local Vite proxies /auth. Branch-specific backend callback defaults point to the target frontend/API. OAuth boundary fixtures use explicit isolated frontend/backend origins. Provider credentials and simulation database settings remain untouched.

## Validation and limitation
86 frontend tests and production build passed, including Login→Bitcoin→Login with restored shared BTC holdings and no implicit trading command. Backend tests include OAuth state/PKCE, forged callback, profile/logout, CORS, public simulator boundary and PostgreSQL persistence.

The live source and target environments list Google, GitHub and Microsoft as disabled. Real OAuth consent is not verified or claimed: the owner must register client IDs/secrets and exact target callbacks before enabling them. Provider setup is separate from integrating the demonstration.

## Timing
Measured start: 2026-10-24T17:43:07Z (14:43:07 Buenos Aires). Completion time is measured after live route verification and reported with the delivered links.
