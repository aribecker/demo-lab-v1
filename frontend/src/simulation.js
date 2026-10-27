export const EMPTY_SIMULATION = {
  phase: 'inactive', capital: 0, feePercent: 0, usdt: 0, btc: 0,
  feesBtc: 0, feesUsdt: 0, feesEquivalent: 0, tradeCount: 0,
  previousPrice: null, lastSequence: 0, trades: [],
};

export function validLimits(minimum, maximum) {
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum > 0 && maximum > minimum;
}
export function validRun(capital, feePercent) {
  return Number.isFinite(capital) && capital > 0 && capital <= 1e12
    && Number.isFinite(feePercent) && feePercent >= 0 && feePercent <= 5;
}

function execute(state, side, quote, reason) {
  const rate = state.feePercent / 100;
  const buy = side === 'BUY';
  const spent = buy ? state.usdt : state.btc;
  const gross = buy ? spent / quote.price : spent * quote.price;
  const fee = gross * rate;
  const received = gross - fee;
  const feeEquivalent = buy ? fee * quote.price : fee;
  const trade = { id: state.tradeCount + 1, side, price: quote.price,
    retrievedAt: quote.retrievedAt, spent, received, fee,
    spentAsset: buy ? 'USDT' : 'BTC', receivedAsset: buy ? 'BTC' : 'USDT',
    feeAsset: buy ? 'BTC' : 'USDT', feeEquivalent, reason };
  return { ...state, phase: buy ? 'holding_btc' : 'holding_usdt',
    btc: buy ? received : 0, usdt: buy ? 0 : received,
    feesBtc: state.feesBtc + (buy ? fee : 0), feesUsdt: state.feesUsdt + (buy ? 0 : fee),
    feesEquivalent: state.feesEquivalent + feeEquivalent,
    tradeCount: state.tradeCount + 1, trades: [...state.trades, trade].slice(-100) };
}

export function simulationReducer(state, action) {
  if (action.type === 'reset') {
    if (!validRun(action.capital, action.feePercent)) return state;
    return { ...EMPTY_SIMULATION, phase: 'holding_usdt', capital: action.capital, usdt: action.capital, feePercent: action.feePercent };
  }
  if (action.type !== 'quote' || state.phase === 'inactive' || action.sequence <= state.lastSequence) return state;
  const { quote, minimum, maximum } = action;
  if (!Number.isFinite(quote.price) || quote.price <= 0) return state;
  let next = { ...state, previousPrice: quote.price, lastSequence: action.sequence };
  if (!validLimits(minimum, maximum)) return next;
  if (state.phase === 'holding_btc' && state.previousPrice <= maximum && quote.price > maximum) {
    next = execute(next, 'SELL', quote, 'Crossed above maximum');
  } else if (state.phase === 'holding_usdt' && state.previousPrice !== null && state.previousPrice >= minimum && quote.price < minimum) {
    next = execute(next, 'BUY', quote, 'Crossed below minimum');
  }
  return next;
}
