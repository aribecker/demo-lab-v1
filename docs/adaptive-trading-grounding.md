# R43 code grounding — before generation

Verified remote branch proximo-desarrollo-hello-world at0bf8c5f5141c16c2fa08412bf188d6141bde449d; relevant local source synchronized by blob hashes and connector file reads. No AGENTS.md in remote inventory.

SimulationEngine owns quote crossing and received-asset fees; SharedState is Jackson JSON persisted as one locked PostgreSQL document by SimulationStore. Extend those POJOs with compatible field initializers (old active runs classic). New AdaptiveTrading engine owns sampled-minute OHLC, indicators and observable rules. SimulationService accepts validated strategy/settings, copies next-run configuration on Reset, and invalidates indicator continuity on pause/resume/gaps. Keep store schema, scheduler and API ownership.

SharedBitcoinTracker reads snapshots only; SimulationPanel renders balances/settings; add AdaptiveTracking as a server-data teaching panel. Extend next-run controls there with live settings save, but no trading logic in React. Central styles/simulation.css and tokens are authoritative. Specs viewer discovers new document automatically. Chart's existing minimum/maximum are explicitly classic reference lines, not adaptive triggers.

Regression surface: SharedSimulationTest retains classic fixture explicitly; new AdaptiveTradingTest covers deterministic paths and JSON roundtrip; extend integration tests for active-config isolation, invalid commands/rollback and restarted adaptive state. New frontend tests exercise teaching panel and shared form payload; existing suite and BEM checker remain required. Remote write auto-review blocked before specification commit; changes remain local until user explicitly authorizes the named repository destination. No deploy or production commands during local QA.
