import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BitcoinTracker from '../BitcoinTracker.jsx';

afterEach(() => vi.useRealTimers());
const flush = () => act(async () => { await Promise.resolve(); });
const amount = price => ({ price, retrievedAt: new Date().toISOString() });

it('defaults to 10000 USDT, waits after Start/Reset, then buys on a new downward crossing under StrictMode', async () => {
  vi.useFakeTimers();
  const requests = [];
  const loader = vi.fn(options => new Promise(resolve => requests.push({ ...options, resolve })));
  render(<StrictMode><BitcoinTracker loader={loader} /></StrictMode>);
  await act(() => requests.at(-1).resolve(amount(100000)));
  expect(screen.getByLabelText('Initial capital · USDT')).toHaveValue(10000);
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('10,000.00 USDT');
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00000000 BTC');
  expect(screen.getByTestId('total-fees')).toHaveTextContent('0.00 USDT');
  await act(() => requests.at(-1).resolve(amount(100000)));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  await act(() => vi.advanceTimersByTimeAsync(10000));
  await act(() => requests.at(-1).resolve(amount(99000)));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
  expect(screen.getByTestId('total-fees')).toHaveTextContent('10.00 USDT');
  fireEvent.click(screen.getByRole('button', { name: 'Increase Sell maximum' }));
  expect(screen.getByLabelText('Sell maximum')).toHaveValue(100510);
  expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '20000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset simulation' }));
  expect(screen.getByTestId('total-fees')).toHaveTextContent('0.00 USDT');
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00000000 BTC');
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('20,000.00 USDT');
  await act(() => requests.at(-1).resolve(amount(98000)));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
});

it('retains capital without trading on failed Reset quotes and rejects invalid settings', async () => {
  const loader = vi.fn().mockResolvedValueOnce(amount(100000)).mockRejectedValueOnce(new Error('Unavailable'));
  render(<BitcoinTracker loader={loader} />); await flush();
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '-1' } });
  expect(screen.getByRole('button', { name: 'Start simulation' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '10000' } });
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '101000' } });
  expect(screen.getByRole('button', { name: 'Start simulation' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '99000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' })); await flush();
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('10,000.00 USDT');
  expect(screen.getByRole('status')).toHaveTextContent('Unavailable');
});

it('buys, sells and rebuys only on crossings and pauses the cycle', async () => {
  vi.useFakeTimers();
  const loader = vi.fn().mockResolvedValueOnce(amount(100000)).mockResolvedValueOnce(amount(100000))
    .mockResolvedValueOnce(amount(98000)).mockResolvedValueOnce(amount(102000)).mockResolvedValueOnce(amount(98000));
  render(<BitcoinTracker loader={loader} />); await flush();
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '99000' } });
  fireEvent.change(screen.getByLabelText('Sell maximum'), { target: { value: '101000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' })); await flush();
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('2');
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00000000 BTC');
  fireEvent.click(screen.getByRole('button', { name: 'Pause tracking' }));
  await act(() => vi.advanceTimersByTimeAsync(30000));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Resume tracking' })); await flush();
  expect(screen.getByTestId('trade-count')).toHaveTextContent('3');
});
