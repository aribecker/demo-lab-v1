# Gómez BTC / USDT cycle simulator — R48

This specification is the source of truth for the optional `gomez` strategy. Existing Classic and Adaptive runs are unchanged. Implementation starts on `feature/gomez-btc-cycles`, based on integrated branch commit `31441d3ddaf3733e2c2b128986c4db3fbf2b857e`. Do not merge or deploy this parallel development until the user requests it.

## Purpose and explicit semantics

- Use real public BTCUSDT spot quotes, virtual balances and simulated orders only. No exchange account, credentials, signed requests, real orders, Google changes or system-clock changes.
- Product is fixed to BTC / USDT for this release. The same observed rate also gives USDT / BTC as its reciprocal. Do not label USDT as USD or claim a separate dollar valuation.
- Default first action is SELL. An explicit Start / Reset allocates `initialBtc` virtual Bitcoin, zero USDT, and schedules a sale at the next fresh successful quote. Starting does not execute on an old displayed quote.
- An optional first BUY starts with the configured virtual USDT capital instead. This is an explicit entry mode, not a completed sell/rebuy cycle. UI explains the starting asset for each choice.
- First action executes once on the next successful quote. Subsequent orders alternate. After SELL at S, BUY when price <= S − delta (USDT mode), or S × (1 − delta/100) (percent mode). After BUY at B, SELL when price >= B + delta, or B × (1 + delta/100). Threshold equality triggers. Execute at observed price, never at an invented target price, at most one order per reading.
- Delta is a gross price movement, not guaranteed net profit. `deltaUnit` is `percent` (default) or `usdt`; `delta` defaults to 1. Percent must be >0 and <100; USDT >0 and <=1e9. Absolute delta giving a nonpositive rebuy target blocks the next order and displays an explanation; it never silently clamps the target.
- A cycle is SELL followed by BUY. Track completed cycles, BTC held before sale and BTC gained/lost after rebuy including both fees. Initial BUY does not increment cycles. Base objective is BTC accumulation; show current BTC-equivalent portfolio and change from starting BTC equivalent, separately from USDT mark-to-market.
- Configurable `pollSeconds`, integer 10–3600, default 120 for Gómez, applies to scheduled provider calls. The scheduler may check every 10 seconds, so it must never poll before the durable due time; execution can be up to a scheduler interval late. Explicit Refresh now requests a fresh sample separately and is clearly identified. Existing strategies retain 10-second polling.

## Operator controls

- Start / Reset is explicitly destructive of this virtual run and must not be confused with Relaunch. Never reset a deployed simulation automatically. Switching strategy or starting side applies only on explicit Start / Reset.
- Pause preserves balances, last fill, next action, reference price, cycle counters and history. Resume does not issue an order; the next fresh quote may fill an already reached target.
- `relaunch` accepts only delta, deltaUnit and pollSeconds, atomically and with normal command UUID/control-revision checks. Preserve balances, fees, trades, cycle state and last fill. Recompute target from the last actual fill, schedule the next poll, and resume. Do not reset reference to the current market. This lets a smaller delta bring a pending rebuy closer. Relaunch itself never fills an order, and must not accept a side flip or new capital.
- Stop after cycle arms a durable flag. If a SELL is pending, complete that SELL and its BUY; if a BUY is pending, complete that BUY. On completed rebuy, pause while holding BTC. Operator may cancel the flag. Immediate Pause remains available, including while holding USDT; it does not erase the pending rebuy.
- Prevent Reset of an active Gómez run while a SELL awaits BUY; return an actionable validation error so the cycle cannot be accidentally discarded. Operator can pause, relaunch or finish the cycle.

## Fees and resilience

Use the existing configurable per-order fee estimate, fixed for a run, deducted from the received asset. Both legs affect the BTC-cycle result. Explicitly explain that actual BNB payment/discount/account balances are not modeled; a lower custom fee is an estimate only. Do not advertise a current Binance fee tier as guaranteed.

Network, HTTP/rate-limit and malformed-price errors keep the pending leg, target and funds and are already audited. Retry on the next scheduled interval, no orders from cached failed data and no duplicate/backfilled catch-up trades. Clock moving backward does not re-use an earlier successful sample; moving forward resumes one due poll, without a burst. This public endpoint has no signed-order timestamp/recvWindow requirement.

## Persistence and API contract

Keep all existing PostgreSQL tables, schema and Flyway migrations unchanged. Add backward-compatible fields to the existing `bitcoin_shared.simulation_state.document` JSON, schemaVersion 1: settings initialBtc, initialAction, delta, deltaUnit, pollSeconds; simulation `gomez` object containing these active parameters plus initialBtcEquivalent, lastFillPrice, nextAction, targetPrice, pendingSell, cycleStartBtc, completedCycles, lastCycleGainBtc, stopAfterCycle and decision. Defaults only affect new runs. Missing gomez data on legacy Classic/Adaptive snapshots cannot change their strategy or balances. The transaction row lock and command replay ledger remain authoritative.

## Didactic UI and acceptance

Offer Gómez beside Classic/Adaptive. Explain starting assets and immediate first order on a fresh reading. Show ordered steps: BTC → SELL → USDT → BUY → BTC. Label next action, actual reference fill, formula with active delta/unit, target, latest price, remaining movement, polling interval/due time, run/paused/error status, pending cycle, completed cycles, last cycle BTC result, BTC-equivalent total and change, and fee assumptions. Distinguish draft next-run settings from active relaunch settings. Use centralized BEM CSS and existing design tokens, accessible labels/statuses, no inline styles.

Verify boundary equality, fees on both legs, first SELL/BUY, no same-reading double trade, pause/resume, live smaller delta with funds/reference preserved, deferred stop after rebuy, invalid settings rollback, pending-cycle reset rejection, persistence/restart, configurable polling, HTTP failure/retry, idempotency/conflicts and legacy regressions. UI tests must exercise start parameters, relaunch, stop-after-cycle and displayed decision formulas. Run frontend full tests/build and backend suite. Publish branch and report checks and limitations; await merge/deploy instruction.

Primary market API reference: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints (`GET /api/v3/ticker/price`, BTCUSDT). No private API integration.
