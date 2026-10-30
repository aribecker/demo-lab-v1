# R48 code grounding

Baseline integrated branch: 31441d3ddaf3733e2c2b128986c4db3fbf2b857e. Scope: specs/gomez-trading.md. Independent development branch, no production merge/deploy.

The existing source was compared by Git blob SHA with the remote tree. Current Java changes from Treasury were downloaded before implementation; unrelated frontend sources matched. The newer demo-lab deployment uses a separate repository, inaccessible to the current GitHub connection (404). This branch deliberately targets the integrated simulator linked in this conversation; it does not modify the separate Demo Lab.

- SharedState.Settings/Simulation: additive JSON fields, existing document table and transaction locking retained. No schema migration.
- SimulationEngine: add Gómez dispatch before Classic/Adaptive, retain existing fee-aware trade ledger. New GomezTrading encapsulates active cycle/target calculations and records completed rebuy cycles.
- SimulationService: honor active poll interval via nextPollAt; add atomic relaunch and finish-cycle commands with existing UUID replay/conflict guards. Retain audit reservation-before-network and error handling. No signed APIs or API keys.
- SharedBitcoinTracker / SimulationPanel / AdaptiveSettings: add next-run mode and parameters, distinct live relaunch form, cycle decision panel; retain existing strategies. Existing CSS blocks provide metrics, fieldsets and responsive layout.
- Engine and service tests: market fixtures on loopback, disposable H2/PostgreSQL only. Frontend RTL interactions and full regressions/build.

Compatibility: default Simulation.strategy remains classic for old documents. New settings do not change active runs. Reset protects an open Gómez SELL→BUY cycle. No live reset, trading action, paid plan change, external SQL access or environment change is needed.
