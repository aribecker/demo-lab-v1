export const sharedSnapshot = (overrides = {}) => ({
  schemaVersion: 1, revision: 1, controlRevision: 0, running: true, count: 1,
  lastPollAt: 1792670400000, nextPollAt: 1792670410000, updatedAt: '2026-10-22T12:00:00Z', error: '',
  samples: [{ price: 80000, retrievedAt: '2026-10-22T12:00:00Z' }], baseline: 80000, range: { min: 80000, max: 80000 },
  settings: { capital: 10000, feePercent: 0.1, minimum: 79000, maximum: 81000, step: 10 },
  simulation: { phase: 'inactive', capital: 0, feePercent: 0, usdt: 0, btc: 0, feesBtc: 0, feesUsdt: 0, feesEquivalent: 0, tradeCount: 0, previousPrice: null, lastSequence: 0, trades: [] },
  commandIds: [], ...overrides,
});
