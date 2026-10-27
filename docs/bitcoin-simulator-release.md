# Virtual Bitcoin simulator v2.4.0 — 2026-10-22

Parallel branch: proximo-desarrollo-hello-world. URL: https://ariel-demo-next.onrender.com/bitcoin

## Specification-first delivery
- Master requirements R24–R28, architecture, acceptance and tasks committed/published before implementation: 579aa057a0f8b0368302a214dd18106c69cd87fe.
- Grounding in specs/traceability.md connects the change to existing quote lifecycle, App/Home, chart and static route. Binance market-data-only endpoint and fee/received-asset documentation verified before implementation.
- Implementation commit: 2332a00b1ec5101c0fbd340b9a23950c555ce1ed.

## Deterministic validation
All 70 frontend tests passed (8 files), including seven pure simulator cases and three new component scenarios. Production Vite build succeeded and emitted bitcoin/index.html.

Verified arithmetic: 1000 USDT at 100000 BTCUSDT with a 0.1% received-asset fee buys 0.00999 BTC; buy fee is 0.00001 BTC (1 USDT at execution). Selling at 102000 gives 1017.96102 USDT net and 1.01898 USDT sell fee. Rebuy uses only those proceeds. Tests cover strict crossings/equality, idempotent sample replay, invalid/live limits, no duplicate orders, reset with 10000 capital/new rate, no stale Reset fill, pause/resume and 100-entry ledger cap. Existing quote timeout/abort/visibility/bounded-history tests and other application routes still pass.

## Model boundaries
All balances, trades and fees are fictitious. Public GET /api/v3/ticker/price?symbol=BTCUSDT is the sole price source; no authenticated exchange/trading API or account is used. Fee is a configurable standard estimate, not account-specific; no BNB/VIP discount, pair promotion, spread/slippage or exchange order filters are modeled. Fees are charged in the received asset; headline USDT fee equivalent uses each execution price and is not charged twice. Fills use successful sampled prices, so crossings between 10-second samples may be missed. Session data is memory-only and cleared on route exit/reset. No backend or original-environment source/configuration change.


## Published verification
Render frontend service srv-dbcnmkgm7kps73cb9p1g, deploy dep-dbd05fe1egvs73f7l90g reached live on implementation commit 2332a00b1ec5101c0fbd340b9a23950c555ce1ed, finished 2026-10-22T12:34:25Z. Direct `/bitcoin` reload rendered v2.4.0 in the cloud browser and received live Binance BTCUSDT quotes.

Initial 1000-USDT virtual purchase at 81700 produced approximately 0.01222766 BTC, 1-USDT fee equivalent, 999-USDT initial marked portfolio and one trade. Live +/- changed both thresholds without an immediate order. Reset with 10000 capital visibly cleared quote history and USDT/BTC/fee/trade counters to zero and waited for a new quote; the next quote at 81691.57 produced approximately 0.12228924 BTC, 10-USDT fee equivalent and one trade. A second Reset restored default 1000-USDT setup. These are fictitious executions; no exchange orders were sent. Local deterministic tests verify sell/rebuy crossings; a full natural-market sell/rebuy cycle is not claimed as a live test. Desktop side-by-side layout inspected; mobile stacking is defined in CSS, not separately measured in the cloud browser.


## v2.4.1 — Cash-only Reset
Master specification b1329a3a7705b37d521b2abbc78033d29b77bc2c was committed/published before source changes. Implementation: 393b022811d142cae5312d2664de37b1112d8aa2. The new default is 10000 configurable USDT. Start/Reset holds the capital as USDT with zero BTC/fees/trades and does not buy. First successful sample only establishes the reference; a later strict downward minimum crossing triggers the first buy. Sell/rebuy behavior and fee accounting remain unchanged.

All 74 frontend tests passed (8 files) and production build succeeded. New regression cases explicitly cover first price already below minimum, equality, no duplicate sample execution, cash restored on Reset after previous buys/sells, configurable capital/fees, failed quote retaining funds and the full downward-buy/upward-sell/downward-rebuy loop. StrictMode component coverage confirms no immediate purchase after Start/Reset.


Live v2.4.1 verification: Render deploy dep-dbd0b6bbc2fs738v3rp0 reached live at 2026-10-22T12:46:46Z on commit 393b022811d142cae5312d2664de37b1112d8aa2. Browser direct reload showed v2.4.1 and default capital 10000. Both Start and Reset simulation retained 10000 USDT, zero BTC, zero fees/trades after fresh Binance quotes (09:47:34 and 09:47:40 Buenos Aires), with state Holding USDT / waiting for a downward buy crossing. No initial virtual order was placed. Engine tests cover later actual crossings; no natural-market full cycle is claimed for this live check.
