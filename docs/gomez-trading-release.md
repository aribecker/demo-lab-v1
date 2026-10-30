# R48 — Gómez BTC cycle simulator · validation and handoff

Date: 2026-10-29, Buenos Aires. Frontend version: 2.15.0 on this branch only.

## Delivery boundary

Repository: aribecker/0080-prueba-SDD-full-stack. Branch: feature/gomez-btc-cycles. Based on integrated branch proximo-desarrollo-hello-world at 31441d3ddaf3733e2c2b128986c4db3fbf2b857e. No merge, production deploy, environment changes, paid plan changes, live Reset or exchange account operations were performed. The separate aribecker/demo-lab repository is outside this change.

Specification commit: 0f47babef11ae53961d210120db6f791bfc0f3f0. Code-grounding commit: 29d082f6befbd6b425a591bdd93259168177ae13. Source of truth: specs/gomez-trading.md, cross-referenced by requirements, architecture, acceptance, database and traceability specifications. Normal Classic and Adaptive runs keep their original behavior.

## Behavior and traceability

| Spec behavior | Implementation | Verification |
| --- | --- | --- |
| Default BTC allocation and first SELL on a new quote; optional initial BUY | SimulationEngine.reset; GomezTrading.start/ready | GomezTradingTest; frontend start-parameter interaction |
| Symmetric percentage/USDT delta; equality and observed-price fills | GomezTrading.updateTarget/ready; existing fee-aware trade ledger | Engine boundary, gap-fill and two-fee cycle tests |
| Preserve funds and last fill when reducing a pending rebuy margin | SimulationService relaunch command | Persistence/restart test and frontend relaunch interaction |
| Complete SELL→BUY before deferred stop | GomezTrading.filled; finish-cycle command | Engine pause/stop test, service restart test, UI arm/cancel interaction |
| Prevent accidental Reset of a pending rebuy | SimulationEngine.reset; disabled Reset UI | Engine/service rejection and UI test |
| Polling interval, error retry, backward/forward clock changes | Durable nextPollAt; existing audited public ticker request | Service poll-slot, malformed-response and clock tests |
| Idempotent concurrent controls | Existing command IDs, expectedControlRevision and PostgreSQL row lock | Existing SharedSimulationTest regressions and new relaunch replay test |
| Didactic next action, formulas, price reciprocal, cycles and BTC result | GomezTrading.jsx; SharedBitcoinTracker; SimulationPanel | Five frontend interaction/display tests |
| Keep schema and existing data | Additive SharedState JSON; no SQL/migration changes | Legacy deserialization, PostgreSQL restart and full regression suite |

## Final verification

- Java 17.0.21 compiler/runtime; PostgreSQL 17.11 in a disposable loopback-only database. PostgreSQL client tools were provided locally for the existing Treasury backup/restore regression. No deployed database was used.
- Backend: Maven package succeeded with **114 tests, 0 failures, 0 errors, 0 skipped**. Includes the 11 new Gómez engine/service tests, all existing authorization, persistence, market audit and Treasury backup/restore checks. Executable Spring Boot JAR generated successfully.
- Frontend: **146 tests passed across 21 files**, including 5 new Gómez interactions. Central style contract passed: BEM/import boundaries, design tokens and contrast pairs. Production Vite build succeeded.
- Initial H2-only backend run passed 104 tests with 10 PostgreSQL checks omitted; the final PostgreSQL run supersedes it and skips none. The new audit assertion was corrected to measure the increase over an existing immutable history rather than assume an empty table.
- A separate headless Chromium visual check could not start under the execution environment's socket restrictions. Browser screenshots are not claimed as validated. DOM interaction tests and production compilation passed.

## How to exercise after an authorized deployment

1. Sign in with the account authorized for the integrated simulator and open /trading-simulator.
2. Select Gómez in Next strategy. Choose SELL, initial virtual BTC, delta/unit and polling interval (default 120 seconds). Start explicitly replaces the virtual run; the first sale waits for a new successful quote. A pre-existing pending Gómez rebuy blocks Reset.
3. After a sale, adjust Active Delta margin and press Relaunch. Check that reference fill and USDT funds remain, and the rebuy target changes. Relaunch resumes and schedules the next request after the interval; Refresh now is an explicit extra provider request.
4. Arm Stop after completing SELL→BUY. On rebuy, verify the run pauses holding BTC and the completed-cycle result includes both simulated fees.

There are no real Binance orders or private API keys. BTC/USDT is a real sampled public quote; USDT/BTC is its reciprocal, not a USD valuation. BNB balances/payment and account-specific discounts are not modeled. The configured fee is an estimate. Sampling, spread and lot-size omissions prevent this simulator from guaranteeing actual trading results. Continuous unattended processing still depends on backend/database hosting; this branch changes no hosting plan.
