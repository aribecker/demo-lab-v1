# R49 — canonical Demo Lab repository migration

Status: specified, awaiting GitHub connection access to the existing private target repository. User authorized migration, consolidation into main, reconfiguration and deployment on 2026-10-29 (Buenos Aires). Do not mark this migration complete until the target source and production deploys have been verified.

## Canonical destination

- Repository: https://github.com/aribecker/demo-lab
- Default development and production branch: main.
- Existing frontend: https://demo-lab-jeov.onrender.com (Render srv-dbge9jt9el5s738tcjr0).
- Existing Java backend: https://demo-lab-api.onrender.com (Render srv-dbge9g0u01pc73fl3f7g).
- Both services already reference this repository and main. Reuse them, preserving their URLs, database and Google login configuration.
- Do not create a differently cased duplicate or replace an existing private repository blindly.

## Source preservation and consolidation

The historical source is aribecker/0080-prueba-SDD-full-stack. The integrated application branch proximo-desarrollo-hello-world is at 31441d3ddaf3733e2c2b128986c4db3fbf2b857e. The reviewed Gomez strategy implementation is at 26d20a05733b0ef5c5915754fbf3dda7b07d9d4b on feature/gomez-btc-cycles.

1. Read and snapshot the current demo-lab/main before any mutation. Preserve all target work, including any later Users/Groups, permissions, styling and schema changes.
2. Preserve the source repository history, branches, tags and files. Use a migration branch and merge/reconcile source history with the existing destination. Resolve colliding legacy branch/tag names explicitly without force-overwriting target refs.
3. Consolidate the integrated application plus the Gomez implementation into destination main after comparing the latest heads. The old 0080/main is not the newest integrated application source.
4. Preserve other application code carried by 0080 as historical/source content as requested; do not alter the separate treasury or contaconmigo repositories or their deployments.
5. Re-run the SDD grounding against the actual target before adapting code. The prior 260 passing tests establish the source implementation baseline, not validation of a destination merge.

## Deployment and data requirements

- Keep current databases, schemas, migrations, sessions, user permissions, balances, rate audit and pending trading cycles. Never reset a deployed run as part of migration.
- Audit service repo/branch/build origins and frontend API URL variables; use the canonical Java API URL for Demo Lab.
- Preserve Google OAuth credentials and registered callback URLs. Check the existing target configuration before proposing a new callback.
- Verify whether old and canonical backends share a simulation schema. Prevent duplicate active schedulers when moving engine responsibility. Do not enable a second engine against a different state or silently split history.
- Once canonical deployment is healthy, reconfigure or redirect the legacy integrated frontend/API appropriately. Audit the old People and Weather dependencies before changing their branch/build references; retain a working Weather provider where still used.
- Do not delete or archive 0080 or its services yet. The user describes it as a historical experiment to discard later; deletion requires a separate, concrete cleanup step.

## Verification gates

- Compare destination branch heads before publishing, preserve target-specific features, and reject stale updates.
- Run full frontend tests/build and Java package tests including disposable PostgreSQL checks.
- Deploy canonical API and frontend, verify exact deployed commit SHAs, health, market data, simulator access, login restoration, database isolation, and the Gomez controls.
- Verify old entry points lead to the canonical application without introducing API redirect/CORS/auth failures.
- Record source and target SHAs, Render service/deploy IDs and successful checks.

## Persistent project guidance after successful verification

Add a root AGENTS.md and repository/deployment specification to the canonical repository stating:
"Demo Lab lives in aribecker/demo-lab, branch main. All new Demo Lab and trading-simulator work must start there. aribecker/0080-prueba-SDD-full-stack is a legacy experiment retained temporarily; do not develop new Demo Lab features there."

Record the same verified mapping in any available persistent project memory. Until verification succeeds, record it as the intended destination, not an accomplished migration.

## Observed blocker

The GitHub connector can list/read/write 0080 but returns 404 for aribecker/demo-lab, and lists no accessible demo-lab repository. GitHub CLI has no authenticated host. The browser tool failed to initialize twice. Render confirms the target source URL exists in its configuration. Required user step: grant the current ChatGPT/Codex GitHub installation access to demo-lab and refresh the connection. Do not ask for a token in chat.
