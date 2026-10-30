# Canonical Bitcoin trading implementation validation — 2026-10-30

Repository/branch: `aribecker/demo-lab/main`. Scope: complete code grounding and implementation against the reconciled archived trading specifications.

## SDD checkpoints

1. `649653a`: specification follow-through and accurate group-permission text.
2. `88e8b0e`: canonical code grounding with source/test mapping and concrete discrepancy.
3. `9d2ead3`: correct the obsolete owner-only banner to “Shared simulator · virtual funds.” Existing server processing, hosting explanation and permission behavior remain.

Classic, Adaptive and Gómez algorithms, configurable cadence, relaunch, deferred stop, fees, durable state, history and configurable authorization were already integrated before this task. The audit found no missing strategy feature to regenerate. Reusing that implementation preserves existing behavior and data. Current source/test mapping is recorded in `docs/bitcoin-trading-canonical-grounding.md`.

## Verification completed

- Frontend: 163 tests passed across 24 files after the banner change. Includes strategy controls, formulas, pending-reset rejection, navigation, permissions, shared state, query history and specification catalog.
- Central style guard: passed all 14 CSS modules, BEM/import/token boundaries and nine contrast pairs.
- Frontend production build and static routes: passed, including the updated integration specification in the bundled viewer.
- Backend: Java 17.0.21, Maven 3.9.9, PostgreSQL 17.11. Offline Maven package passed: 123 tests, zero failures, errors or skips. Includes Gómez cycle/service/restart cases and PostgreSQL persistence, audit, authorization, session, explorer and backup regressions. Spring Boot executable JAR generated.
- PostgreSQL test cluster was created exclusively for this task on loopback port 55439 and stopped after validation. Unit fixtures also use their existing in-memory databases. No deployed database was used.
- Initial backend attempt lost access to the test PostgreSQL process between execution calls. Rerunning startup and Maven in the same managed process resolved the environment issue; the final complete successful run supersedes that attempt.
- `git diff --check` passed. No schema/migration, hosting configuration, stored permissions, balances or active cycles changed.

## Delivery boundary

Changes are committed on canonical main. No production deployment or live trading command was issued; commits carry `[skip render]`. The frontend build is verified locally, but no new hosted version or browser visual validation is claimed. No real exchange orders or private trading keys are involved.
