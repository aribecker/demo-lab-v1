# Bitcoin trading specification integration — 2026-10-30

## Scope and source evidence

User requested integration of the archived 008 Bitcoin trading specifications into canonical Demo Lab main, with a change summary. Source refs were fetched read-only from `aribecker/0080-prueba-SDD-full-stack` and all 18 source branches were inventoried for Bitcoin/trading contracts. The branch named `microservices-v008` has weather-only work; integrated trading requirements live on `proximo-desarrollo-hello-world` and `feature/gomez-btc-cycles`.

Baseline main: `963717b0fcb7d3479e4fb2478bf58f0cb5972ad2`. Specification checkpoint: `f503cdd8cb8d0937ba20a973b95928609bbeff63`.

All nonempty lines of source feature-branch requirements, Adaptive and Gómez specifications were already in baseline main. Earlier integrated-branch requirements were also present. The meaningful differences were historical navigation/access rules and obsolete instructions to wait for a merge. Destination configurable access and completed R50 consolidation explicitly supersede those rules. No missing strategy implementation was inferred or fabricated.

## Grounding in existing code

- `SimulationEngine.java` validates Classic/Adaptive/Gómez, captures next-run strategy on Reset, dispatches fresh quotes and rejects Reset of a pending Gómez rebuy.
- `GomezTrading.java` owns fill-reference delta targets, inclusive thresholds, completed SELL/BUY cycles and deferred stop with BTC retained.
- `SimulationService.java` owns durable polling cadence, command replay/revisions, relaunch and finish-cycle controls.
- `SharedState.java` holds backward-compatible strategy JSON; no table/migration change is needed.
- `auth/SimulatorAccess.java` delegates every request to `AccessAuthorization` with persisted SIMULATOR permission; historical fixed-owner prose cannot override current configurable access.
- `frontend/src/specifications.js` discovers every `specs/**/*.md` file at build time. The new integration entry needs no viewer code change.

## Result

Added `specs/bitcoin-trading-integration.md` as the consolidated entry point: provenance, authority, strategy comparison, controls, fees, persistence, history and validation scope. Updated requirements, architecture, acceptance, database, traceability and Gómez references to completed canonical integration. Marked R46 owner-only clauses as historical and pointed to current group permissions. Existing source algorithm details and historical Git refs remain available.

## Validation

- Original Adaptive source matches canonical content byte-for-byte.
- Classic/shared requirements R20 through the start of R46 are retained verbatim from the Gómez source branch.
- Original Gómez purpose, controls, fees, resilience and persistence/API sections are retained verbatim; only historical promotion instructions were reconciled.
- Relative links in changed specifications resolve; all first-checkpoint files are specification Markdown only; `git diff --check` passes.
- Existing Specifications suite: 6 tests passed, including recursive catalog completeness and exact file contents.
- `npm run build`: passed; generated bundle includes `bitcoin-trading-integration` and static route generation.

No backend suite was rerun because this change only edits Markdown specifications and this evidence. No runtime source, balances, permissions, schema or active cycle changed. No production command or deployment was issued. Commits use `[skip render]`; the hosted viewer will receive the new build-snapshot specifications on a subsequent frontend deployment. Current deliverable is the specifications committed to main, not a claim that the new viewer bundle is live.
