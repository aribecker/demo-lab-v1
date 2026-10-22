export const BITCOIN_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

export async function loadBitcoin({ signal } = {}) {
  const response = await fetch(BITCOIN_URL, {
    signal, headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'omit',
  });
  if (!response.ok) throw new Error(response.status === 429
    ? 'Coinbase rate limit reached. Waiting for the next refresh.'
    : `Coinbase is unavailable (HTTP ${response.status}).`);
  const { data } = await response.json();
  const amount = data?.amount;
  const price = typeof amount === 'string' && amount.trim() ? Number(amount) : NaN;
  if (!Number.isFinite(price) || price <= 0 || data?.currency !== 'USD'
    || (data.base !== undefined && data.base !== 'BTC')) {
    throw new Error('Coinbase returned an invalid BTC/USD quote.');
  }
  return { price, retrievedAt: new Date().toISOString() };
}
