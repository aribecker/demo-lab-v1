# R48 — Validation and rollout

Specification: specs/demo-lab-access.md. Grounding: docs/demo-lab-access-grounding.md.

Frontend: 155 tests across 23 files pass, including anonymous Everyone access, independent admin gates, user CRUD, membership editing, revocation, expired identity fallback and malformed capability denial. Production build passes.

Backend: 111 tests, no failures or errors, 11 PostgreSQL-dependent checks skipped locally. Maven compiles with Eclipse Java compiler targeting Java 17 on local JRE 21. The production Docker build uses native JDK 17 and disposable loopback PostgreSQL 17 to execute the complete suite, including the new additive migration/restart/private-schema test.

Migration is additive in demo_lab, preserving treasury, bitcoin_shared, public and auth_private. Everyone bootstrap is guarded by a persisted transaction lock and never repeated after edits. Access mutations serialize on the same lock and roll back if the last named Groups administrator would be removed.

Release order: push with Render auto-deploy skip marker, deploy backend, verify anonymous capabilities and administration denial, then deploy frontend. Read-only production checks must not change simulator state, issue trades or edit memberships. Google OAuth administration login remains dependent on credentials configured in Render; no alternate identity bypass is introduced.

## Render verification — 2026-10-27 UTC

Implementation commit: 67f6cbc7fd3b965021a3657c96ca89b85713c086 on aribecker/demo-lab main.

- Backend deploy dep-dbgiuujbc2fs73bveieg live; native Java 17 / disposable PostgreSQL 17 build: all 111 tests pass, none skipped.
- Production log confirms demo_lab V1 migration applied and access schema ready.
- Anonymous GET /api/access/me: 200, simulator=true, users=false, groups=false.
- Anonymous GET /api/access/users, /users/1, /groups, /groups/1/members: 401.
- Anonymous GET /api/simulation: 200. No simulation commands or membership edits issued.
- GET /api/database lists bitcoin_shared and public only; direct demo_lab.users rows: 404.
- Frontend deploy dep-dbgj0svlk1mc73c20rgg live; /trading-simulator, /users, /groups return 200.
- /auth/providers reports Google disabled. Owner and other named administrators still require GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET configured on demo-lab-api and Google redirect URI https://demo-lab-api.onrender.com/login/oauth2/code/google. This is a configuration prerequisite, not a bypassable identity check.
