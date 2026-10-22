import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BitcoinTracker from '../BitcoinTracker.jsx';

afterEach(() => vi.useRealTimers());
const flush = () => act(async () => { await Promise.resolve(); });
const amount = price => ({ price, retrievedAt: new Date().toISOString() });

it('waits for a fresh Reset quote, shows balances/fees and never duplicates the initial buy under StrictMode', async () => {
  vi.useFakeTimers();
  const requests = [];
  const loader = vi.fn(options => new Promise(resolve => requests.push({ ...options, resolve })));
  render(<StrictMode><BitcoinTracker loader={loader} /></StrictMode>);
  await act(() => requests.at(-1).resolve(amount(100000)));
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00000000 BTC');
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  expect(screen.getByText('Waiting for a fresh quote to buy')).toBeInTheDocument();
  await act(() => requests.at(-1).resolve(amount(100000)));
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00999000 BTC');
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('0.00 USDT');
  expect(screen.getByTestId('total-fees')).toHaveTextContent('1.00 USDT');
  expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
  fireEvent.click(screen.getByRole('button', { name: 'Increase Sell maximum' }));
  expect(screen.getByLabelText('Sell maximum')).toHaveValue(100510);
  expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '10000' } });
  expect(screen.getByTestId('total-fees')).toHaveTextContent('1.00 USDT');
  fireEvent.click(screen.getByRole('button', { name: 'Reset & buy' }));
  expect(screen.getByTestId('total-fees')).toHaveTextContent('0.00 USDT');
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.00000000 BTC');
  await act(() => requests.at(-1).resolve(amount(100000)));
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.09990000 BTC');
  expect(screen.getByTestId('total-fees')).toHaveTextContent('10.00 USDT');
});

it('does not trade during a failed Reset quote and rejects invalid capital/limits', async () => {
  const loader = vi.fn().mockResolvedValueOnce(amount(100000)).mockRejectedValueOnce(new Error('Unavailable'));
  render(<BitcoinTracker loader={loader} />);
  await flush();
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '-1' } });
  expect(screen.getByRole('button', { name: 'Start simulation' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Initial capital · USDT'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '101000' } });
  expect(screen.getByRole('button', { name: 'Start simulation' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '99000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
  await flush();
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  expect(screen.getByRole('status')).toHaveTextContent('Unavailable');
});

it('sells/rebuys on new samples and pauses both tracking and simulation', async () => {
  vi.useFakeTimers();
  const loader = vi.fn().mockResolvedValueOnce(amount(100000)).mockResolvedValueOnce(amount(100000))
    .mockResolvedValueOnce(amount(102000)).mockResolvedValueOnce(amount(98000));
  render(<BitcoinTracker loader={loader} />); await flush();
  fireEvent.change(screen.getByLabelText('Buy minimum'), { target: { value: '99000' } });
  fireEvent.change(screen.getByLabelText('Sell maximum'), { target: { value: '101000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start simulation' })); await flush();
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('2');
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('1,017.96102 USDT');
  fireEvent.click(screen.getByRole('button', { name: 'Pause tracking' }));
  await act(() => vi.advanceTimersByTimeAsync(30000));
  expect(screen.getByTestId('trade-count')).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Resume tracking' })); await flush();
  expect(screen.getByTestId('trade-count')).toHaveTextContent('3');
});
