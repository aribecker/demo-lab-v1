# R48 — Validation and rollout

Specification: specs/demo-lab-access.md. Grounding: docs/demo-lab-access-grounding.md.

Frontend: 155 tests across 23 files pass, including anonymous Everyone access, independent admin gates, user CRUD, membership editing, revocation, expired identity fallback and malformed capability denial. Production build passes.

Backend: 111 tests, no failures or errors, 11 PostgreSQL-dependent checks skipped locally. Maven compiles with Eclipse Java compiler targeting Java 17 on local JRE 21. The production Docker build uses native JDK 17 and disposable loopback PostgreSQL 17 to execute the complete suite, including the new additive migration/restart/private-schema test.

Migration is additive in demo_lab, preserving treasury, bitcoin_shared, public and auth_private. Everyone bootstrap is guarded by a persisted transaction lock and never repeated after edits. Access mutations serialize on the same lock and roll back if the last named Groups administrator would be removed.

Release order: push with Render auto-deploy skip marker, deploy backend, verify anonymous capabilities and administration denial, then deploy frontend. Read-only production checks must not change simulator state, issue trades or edit memberships. Google OAuth administration login remains dependent on credentials configured in Render; no alternate identity bypass is introduced.
