# R47 persistent login — validation and activation

Version: frontend 2.14.0. Authoritative specification: specs/persistent-login.md; database contract: specs/database.md R47; grounding: docs/persistent-login-grounding.md.

Local validation: 141 frontend tests, central style checks and production build passed. Full Java suite: 75 tests, zero failures/errors, eight skipped because they require disposable PostgreSQL; 67 passed locally. An additional focused HTTP check verifies safe 503 on unavailable authentication storage. Render's existing Docker build runs all 75 against a disposable PostgreSQL 17 instance before packaging.

Behavior: opaque application token persists in browser localStorage for an absolute seven-day server session. PostgreSQL stores only token hash, validated profile, creation/expiry/revocation timestamps. API restarts do not remove active sessions. Logout revokes on the server and updates other tabs. Provider passwords and OAuth tokens are not persisted. Existing owner-only simulator permissions remain enforced. Authentication schema is never exposed through Database Explorer.

Deployment uses the existing integrated API and frontend. AUTH_DATABASE_URL is optional; the existing SIMULATION_DATABASE_URL is reused automatically. Flyway creates auth_private tables independently; existing people, simulator and audit records are untouched. Google credentials, redirect URI and scopes are unchanged. No manual SQL or new cloud setup is required.

Owner activation: open the existing /login page, refresh after rollout, sign in with Google once, then close all normal Chrome windows and reopen the same application URL using the same Chrome profile. The application validates and restores the stored session automatically. Sign out or expiry ends it. Incognito or clearing/automatically deleting site storage prevents persistence. Browser-specific storage restrictions, if enabled by the owner, must allow this application's site storage.

Live rollout verification: API then frontend; metadata/privacy checks and denied unauthenticated simulator requests only. No production trading command. The owner performs the final real-account close/reopen check after signing in; automated tests cover persistence without creating test accounts or sessions in production.
