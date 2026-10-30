# Canonical Bitcoin trading implementation grounding — 2026-10-30

Baseline: `83575c8`, canonical `aribecker/demo-lab/main`. Specification: `specs/bitcoin-trading-integration.md` and its referenced strategy/access contracts. The code already contains the integrated archived features; generation should complete discrepancies, not duplicate or replace working implementations.

| Contract | Current implementation | Existing verification |
|---|---|---|
| Classic crossings, received-asset fees, fresh Reset reference | SimulationEngine, SharedState | SharedSimulationTest, simulation.test.js |
| Sampled-candle Adaptive dip/rebound, EMA/ATR and stops | AdaptiveTrading, AdaptiveTracking | AdaptiveTradingTest, adaptive frontend tests |
| Gómez first SELL/optional BUY, delta targets, equality and BTC cycle results | GomezTrading, SimulationEngine, GomezTrading.jsx | GomezTradingTest, GomezTrading.test.jsx |
| Relaunch, stop after rebuy, pending-reset rejection | SimulationService, GomezTrading, SimulationPanel | GomezServiceTest, Gómez frontend interactions |
| Durable snapshot, row locks, replay/revisions and poll scheduling | SimulationStore, SimulationService | SharedSimulationTest, GomezServiceTest against disposable PostgreSQL |
| Market-only tracker, audit and activity periods | BitcoinMarketController, RateQueryHistory, MarketTracker | Existing API/history/frontend suites |
| Current persisted group permission and private snapshot protection | SimulatorAccess, AccessAuthorization, SimulatorGate, database explorer | AccessDirectory/AccessApi/SimulatorAccess and frontend access suites |
| Seven-day durable sessions | DemoSessions, AuthSessionStore, AuthContext | Existing auth and PostgreSQL tests |
| Specification catalog | specifications.js, Specifications.jsx | Specifications.test.jsx |

## Concrete discrepancy and implementation plan

`frontend/src/SharedBitcoinTracker.jsx` still displays “Owner-only demo” inside the authorized simulator, although the immediately preceding text and actual server gates use configured groups/Everyone. This contradicts current access specifications. Replace that obsolete banner with accurate shared-simulator wording, preserving virtual-funds, hosting and server-processing explanations. The existing authorization tests remain the functional access checks; no permission/schema/engine changes are required.

All strategy and persistence features requested by the integrated specifications are already present. Validate them together using full frontend tests/build and Maven package against a new disposable loopback-only PostgreSQL cluster; do not reuse a deployed database or issue live simulator commands. Record actual results and any failures before publishing. Historical independent-branch grounding/release documents remain provenance only.
