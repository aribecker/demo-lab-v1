# R47 grounding — before generation

Authoritative contract: specs/persistent-login.md (ff6cafd359e37e75c1c857f25654c89a62f87471) and specs/database.md R47. Base runtime b07c5056892475ce26b3745598259fa8b72861c4.

DemoSessions currently keeps both exchange tickets and 30-minute sessions in maps. Keep bounded one-minute PKCE-bound tickets, replace the session map with AuthSessionStore JDBC operations and independent Flyway migrations. Inject Clock and store into DemoSessions; update standalone unit fixtures to real isolated H2 stores. Production connection defaults to existing simulation.database-url, with optional AUTH_DATABASE_URL override. Do not create a volatile fallback. Shared simulator engine and schema remain untouched.

AuthController exchange/me/logout and SimulatorAccess already depend on DemoSessions; persistence therefore preserves the permission boundary. Add safe no-store storage-failure advice. Store profile JSON plus timestamps/hash only; calculate canUseSimulator using the existing policy on read. Filter auth_private at DatabaseExplorerRepository's common table query, protecting catalog and explicit row paths together.

authClient currently stores the bearer in sessionStorage. Move only that token to localStorage, retaining sessionStorage for the OAuth verifier. Continue server validation before UI access, preserve token on transport errors, clear on 401 and only clear after confirmed logout. AuthProvider listens for cross-tab token changes. Show seven-day persistence and sign-out behavior in Login; no Google provider scope/config changes.

Add store restart/revoke/expiry/hash/migration tests with H2 and disposable PostgreSQL, exact lifetime checks and unavailable storage behavior. Extend browser-client and cross-tab tests while preserving all owner-only simulator tests. Deploy API then frontend on existing integrated Render services with secrets unchanged. Existing pre-rollout sessions require one fresh login. Verify new schema metadata and denied public access without querying profile/token data or issuing simulation commands.
