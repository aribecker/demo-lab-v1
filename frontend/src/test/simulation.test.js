import { describe, expect, it } from 'vitest';
import { EMPTY_SIMULATION, simulationReducer as reduce, validLimits, validRun } from '../simulation.js';

const reset = (capital = 1000, feePercent = 0.1) => reduce(EMPTY_SIMULATION, { type: 'reset', capital, feePercent });
const tick = (s, price, sequence, minimum = 99000, maximum = 101000) => reduce(s, {
  type: 'quote', quote: { price, retrievedAt: '2026-10-22T12:00:00Z' }, sequence, minimum, maximum,
});

describe('virtual all-in engine', () => {
  it('starts with zero counters and funds one fresh initial buy with received-asset fee', () => {
    expect(EMPTY_SIMULATION.usdt).toBe(0);
    expect(EMPTY_SIMULATION.btc).toBe(0);
    const waiting = reset();
    expect(waiting.tradeCount).toBe(0);
    expect(waiting.usdt).toBe(0);
    const s = tick(waiting, 100000, 1);
    expect(s.usdt).toBe(0);
    expect(s.btc).toBeCloseTo(0.00999, 10);
    expect(s.feesBtc).toBeCloseTo(0.00001, 10);
    expect(s.feesEquivalent).toBeCloseTo(1, 10);
    expect(s.trades[0]).toMatchObject({ side: 'BUY', spent: 1000, feeAsset: 'BTC', reason: 'Initial purchase' });
  });
  it('sells above maximum, then buys below minimum using only proceeds', () => {
    let s = tick(reset(), 100000, 1);
    s = tick(s, 102000, 2);
    expect(s.phase).toBe('holding_usdt');
    expect(s.usdt).toBeCloseTo(1017.96102, 8);
    expect(s.btc).toBe(0);
    expect(s.feesUsdt).toBeCloseTo(1.01898, 8);
    expect(s.feesEquivalent).toBeCloseTo(2.01898, 8);
    s = tick(s, 98000, 3);
    expect(s.phase).toBe('holding_btc');
    expect(s.usdt).toBe(0);
    expect(s.btc).toBeCloseTo(1017.96102 / 98000 * 0.999, 10);
    expect(s.feesEquivalent).toBeCloseTo(3.03694102, 8);
    expect(s.tradeCount).toBe(3);
  });
  it('does not fill at equality, repeatedly on the same side, or twice for one sequence', () => {
    let s = tick(reset(), 100000, 1);
    s = tick(s, 101000, 2);
    expect(s.tradeCount).toBe(1);
    s = tick(s, 102000, 3);
    const replay = tick(s, 98000, 3);
    expect(replay).toBe(s);
    s = tick(s, 103000, 4);
    s = tick(s, 99000, 5);
    expect(s.tradeCount).toBe(2);
    s = tick(s, 98000, 6);
    s = tick(s, 97000, 7);
    expect(s.tradeCount).toBe(3);
  });
  it('applies moved limits prospectively, without replaying a sample', () => {
    let s = tick(reset(), 100000, 1);
    expect(tick(s, 100000, 1, 98000, 99000)).toBe(s);
    s = tick(s, 100100, 2, 98000, 99000);
    expect(s.tradeCount).toBe(1);
    s = tick(s, 98900, 3, 98000, 99000);
    s = tick(s, 99100, 4, 98000, 99000);
    expect(s.tradeCount).toBe(2);
  });
  it('blocks invalid settings and bad prices without spending virtual funds', () => {
    for (const [min, max] of [[0, 1], [2, 1], [1, 1], [NaN, 3], [1, Infinity]]) {
      expect(validLimits(min, max)).toBe(false);
      expect(tick(reset(), 100000, 1, min, max).tradeCount).toBe(0);
    }
    for (const [cap, fee] of [[0, 0.1], [-1, 0.1], [Infinity, 0.1], [1000, -1], [1000, 6]]) {
      expect(validRun(cap, fee)).toBe(false);
      expect(reset(cap, fee)).toBe(EMPTY_SIMULATION);
    }
    expect(tick(reset(), NaN, 1).tradeCount).toBe(0);
  });
  it('reset replaces all totals and applies the new capital and fee', () => {
    let s = tick(tick(reset(), 100000, 1), 102000, 2);
    s = reduce(s, { type: 'reset', capital: 10000, feePercent: 0.2 });
    expect(s).toMatchObject({ tradeCount: 0, feesEquivalent: 0, feesBtc: 0, feesUsdt: 0, usdt: 0, btc: 0, trades: [] });
    s = tick(s, 100000, 1);
    expect(s.btc).toBeCloseTo(0.0998, 10);
    expect(s.feesEquivalent).toBeCloseTo(20, 10);
  });
  it('bounds the ledger while keeping aggregate counters and zero-fee arithmetic', () => {
    let s = tick(reset(1000, 0), 100000, 1);
    for (let seq = 2; seq <= 202; seq++) s = tick(s, seq % 2 === 0 ? 102000 : 98000, seq);
    expect(s.tradeCount).toBe(202);
    expect(s.trades).toHaveLength(100);
    expect(s.feesEquivalent).toBe(0);
    expect(s.usdt + s.btc).toBeGreaterThan(0);
  });
});
