# Bitcoin trading simulator — canonical specification integration

Date: 2026-10-30. Repository and target: `aribecker/demo-lab`, `main`.
Scope: integrate the Bitcoin tracker/trading specifications from archived `aribecker/0080-prueba-SDD-full-stack`. This is a specification reconciliation, with no new trading algorithm, runtime/API change, migration or production command.

## Provenance and completeness

| Source branch | Source head | Result on canonical main |
|---|---|---|
| `microservices-v008` | `e05252cefcd294f8164467069baac6bffd4bb9b1` | No Bitcoin/trading specification; latest work concerns the retained weather provider. |
| `proximo-desarrollo-hello-world` | `31441d3ddaf3733e2c2b128986c4db3fbf2b857e` | Historical tracker, Classic, durable state, Adaptive, audit, navigation and session requirements already incorporated. |
| `feature/gomez-btc-cycles` | `f1467296497de77e0145306c72c97a2346ce1194` | Gómez contract already incorporated; implementation source is `26d20a05733b0ef5c5915754fbf3dda7b07d9d4b`. |

Comparison baseline: canonical main `963717b0fcb7d3479e4fb2478bf58f0cb5972ad2`. All nonempty lines of the Gómez source's master requirements, Gómez strategy and Adaptive strategy were present in that baseline. Historical access differences were superseded by destination navigation and configurable permission requirements, rather than missing requirements. Source branches remain preserved under `legacy-0080/*`; do not overwrite destination-specific work with the archived tree.

## Authority and precedence

1. [demo-lab-consolidation.md](demo-lab-consolidation.md) governs completed promotion to canonical main. Earlier independent-branch holds and repository-access blockers are historical.
2. [demo-lab-access.md](demo-lab-access.md) governs current permissions. SIMULATOR grants are read from persisted groups per request; Everyone can grant anonymous access. Verified registered identities use existing Google sessions. Fixed-owner rules in historical R46 do not override this model. Temporary Everyone administration review remains explicitly governed by that document; no grant is added or removed by this integration.
3. [persistent-login.md](persistent-login.md) governs seven-day durable sessions, superseding the earlier in-memory 30-minute lifetime.
4. [gomez-trading.md](gomez-trading.md), [adaptive-trading.md](adaptive-trading.md) and requirements R24–R34 govern their respective algorithms and durable engine, subject to later superseding clauses. Strategy-specific start, equality and polling rules must not be applied to other strategies.
5. [database.md](database.md) governs snapshots and query audit/history. [design-system.md](design-system.md) governs centralized BEM styling, palette and responsive behavior.

R48 labels were reused historically for Gómez and configurable access, and R50 for more than one change. Resolve authority by the named specification and explicit supersession, not by the numeric label alone.

## Unified current behavior

- `/bitcoin` is the market-only tracker: real public Binance BTCUSDT quotes, chart and retained query history. USDT is not labelled USD. Public reads never reset, start or pause the simulator.
- `/trading-simulator` is the separate virtual trading view with an always-visible navigation entry. Gate protected data and commands with current SIMULATOR permission, including the raw database snapshot path. Fail closed on unavailable authorization storage. Route changes, reload and login/logout do not mutate a run.
- One Java-owned simulation persists in `bitcoin_shared.simulation_state.document`. PostgreSQL locking, command UUID replay and control-revision checks govern commands. Browsers render server snapshots and do not run a second trading engine.
- Existing runs keep balances, fees, history, strategy, targets, pending cycles and paused/running state across application releases. Draft next-run settings apply only on explicit Start / Reset. Never reset a deployed run as part of integration or verification.

## Strategy contracts

| Rule | Classic | Adaptive | Gómez |
|---|---|---|---|
| Start | Virtual USDT; first fresh quote establishes crossing reference, without buying. | Virtual USDT; completed-candle warmup precedes entry. | Default virtual BTC and first SELL on the next fresh quote; explicit first BUY starts with virtual USDT. |
| Entry / next action | Downward crossing strictly below minimum; sell on upward crossing strictly above maximum. | Dip, rebound and EMA trend filter using completed one-minute sampled candles and ATR. | Alternate SELL/BUY from the last actual fill using positive percent or USDT delta; equality triggers. |
| Exit / cycle | Alternate all-in buys and sells, no duplicate crossing orders. | Hard stop and upward-ratcheting trailing stop; fresh quotes may exit after gaps. | Completed cycle is SELL then BUY; initial BUY alone is not a cycle. |
| Sampling | Existing 10-second server cadence. | Existing 10-second server cadence; sampled candles are not exchange-complete OHLC. | Configurable 10–3600 seconds, default 120; scheduler never polls before durable due time. |
| Live controls | Valid threshold edits affect later quotes without a reset or immediate order. | Next-run parameters stay separate from active captured strategy settings. | Relaunch changes only delta/unit/polling, preserves funds and last fill, then resumes; stop-after-cycle pauses holding BTC after rebuy. |

All strategies execute at observed fresh successful quotes, at most one order per reading. Fees are deducted from the received asset and recorded separately in BTC and USDT; equivalent totals must not charge fees twice. Balances and orders are virtual. No exchange account, signed requests, real orders, BNB/account discount modeling or guaranteed profit is introduced.

For Gómez, reject Reset while a SELL awaits BUY; pause retains the pending rebuy. Relaunch never trades by itself or replaces the last fill with the current market quote. Nonpositive absolute-delta rebuy targets block trading with an explanation and preserved funds. Show completed cycles, BTC gain/loss including both fees, BTC-equivalent total, pending target/formula and active versus draft parameters.

## Persistence, history and presentation

Reuse existing schemas, tables and applied migrations. Gómez adds backward-compatible JSON fields only; missing Gómez fields never convert an existing Classic/Adaptive run. Keep `auth_private` and `demo_lab` hidden from the public explorer; raw simulator data uses SIMULATOR permission.

Retain durable market-attempt audit, Latest 25 / View All / Resumido and Buenos Aires timestamps with tenths. Group successful activity only when adjacent readings are strictly less than 60 seconds apart; activity periods do not prove uninterrupted uptime. Retry provider failures without trading from stale/cached failure data or generating catch-up orders. Public tracker recovery retains the existing 90-second request allowance.

Use centralized CSS tokens/BEM and the current turquoise design system. Preserve chart, balances, ledger, accessible decision explanations and separate tracker/simulator navigation. All `specs/**/*.md` files are discovered automatically by the existing Specifications viewer.

## Verification boundary

For this documentation-only integration: verify source coverage and link targets, review the diff for unintended runtime changes, run existing Specifications viewer coverage and build the frontend to confirm the new catalog entry is bundled. No backend behavior changed, so no new algorithm tests or production trading commands are required. A future functional change must follow the algorithm-specific acceptance suites and normal SDD implementation/deployment workflow.


## Implementation follow-through — 2026-10-30

The user requests code grounding and completion against this reconciled contract. Audit the current canonical implementation before generating replacements: retain already implemented strategies and durable data. Simulator-facing text must describe configured group permissions, including Everyone when granted, rather than claim fixed owner-only access. Validate the complete frontend suite/style contract/build and backend package against disposable loopback PostgreSQL, then record source mapping, corrections and remaining limitations. This follow-through supersedes the earlier documentation-only verification boundary for the present implementation task.
