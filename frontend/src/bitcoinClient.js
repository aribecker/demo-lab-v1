export const BITCOIN_URL = 'https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT';

export async function loadBitcoin({ signal } = {}) {
  const response = await fetch(BITCOIN_URL, {
    signal, headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'omit',
  });
  if (!response.ok) throw new Error(response.status === 429
    ? 'Binance rate limit reached. Waiting for the next refresh.'
    : `Binance is unavailable (HTTP ${response.status}).`);
  const data = await response.json();
  const amount = data?.price;
  const price = typeof amount === 'string' && amount.trim() ? Number(amount) : NaN;
  if (!Number.isFinite(price) || price <= 0 || data?.symbol !== 'BTCUSDT') {
    throw new Error('Binance returned an invalid BTC/USDT quote.');
  }
  return { price, retrievedAt: new Date().toISOString() };
}
