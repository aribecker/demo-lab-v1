import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SharedBitcoinTracker from '../SharedBitcoinTracker.jsx';
import { sharedSnapshot } from './sharedFixture.js';
import { validateSnapshot, readSimulation, sendSimulationCommand } from '../simulationClient.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const flush = () => act(async () => { await Promise.resolve(); });

function backend(initial = sharedSnapshot()) {
  let state = structuredClone(initial);
  const api = {
    read: vi.fn(async () => structuredClone(state)),
    command: vi.fn(async command => {
      if (command.expectedControlRevision !== state.controlRevision) throw Object.assign(new Error('Conflict'), { status: 409 });
      if (command.type === 'running') state.running = command.running;
      if (command.type === 'settings') Object.assign(state.settings,command.changes);
      if (command.type === 'reset') {
        Object.assign(state.settings,command.changes);
        state.simulation = { ...sharedSnapshot().simulation, phase: 'holding_usdt', capital: state.settings.capital, feePercent: state.settings.feePercent, usdt: state.settings.capital };
        state.samples=[];state.count=0;state.baseline=null;state.range=null;
      }
      state.revision++;state.controlRevision++;
      return structuredClone(state);
    }),
  };
  return { api, external: update => { state = { ...state, ...update }; } };
}

it('two clients read the same persisted controls; mounting, hiding and unmounting send no command', async () => {
  vi.useFakeTimers();
  const b=backend();
  const first=render(<SharedBitcoinTracker api={b.api} />);
  await flush();
  expect(b.api.command).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Pause tracking'}));await flush();
  expect(b.api.command).toHaveBeenCalledWith(expect.objectContaining({type:'running',running:false,expectedControlRevision:0,id:expect.any(String)}));
  const second=render(<SharedBitcoinTracker api={b.api} />);await flush();
  expect(within(second.container).getByRole('button',{name:'Resume tracking'})).toBeInTheDocument();
  let visibility='visible';
  vi.spyOn(document,'visibilityState','get').mockImplementation(()=>visibility);
  visibility='hidden';act(()=>document.dispatchEvent(new Event('visibilitychange')));
  const reads=b.api.read.mock.calls.length;
  await act(()=>vi.advanceTimersByTimeAsync(3000));
  expect(b.api.read).toHaveBeenCalledTimes(reads);
  expect(b.api.command).toHaveBeenCalledTimes(1);
  visibility='visible';act(()=>document.dispatchEvent(new Event('visibilitychange')));await flush();
  first.unmount(); await act(()=>vi.advanceTimersByTimeAsync(3000));
  expect(b.api.command).toHaveBeenCalledTimes(1);
  expect(within(second.container).getByRole('button',{name:'Resume tracking'})).toBeInTheDocument();
});

it('loads an existing BTC balance and phase without auto-resetting or funding', async () => {
  const state=sharedSnapshot();state.running=false;state.simulation={...state.simulation,phase:'holding_btc',capital:10000,btc:0.1,feePercent:0.1,feesEquivalent:10,tradeCount:1};
  const b=backend(state);render(<SharedBitcoinTracker api={b.api} />);await flush();
  expect(screen.getByTestId('btc-balance')).toHaveTextContent('0.10000000 BTC');
  expect(screen.getByRole('button',{name:'Reset simulation'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Resume tracking'})).toBeInTheDocument();
  expect(b.api.command).not.toHaveBeenCalled();
});

it('Start explicitly seeds shared USDT and another view sees it without starting', async () => {
  const b=backend();const first=render(<SharedBitcoinTracker api={b.api} />);await flush();
  fireEvent.click(screen.getByRole('button',{name:'Start simulation'}));await flush();
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('10,000.00 USDT');
  first.unmount();render(<SharedBitcoinTracker api={b.api} />);await flush();
  expect(screen.getByTestId('usdt-balance')).toHaveTextContent('10,000.00 USDT');
  expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
  expect(b.api.command).toHaveBeenCalledTimes(1);
});

it('persists +/- centrally and saves edited fields on blur', async () => {
  const b=backend();render(<SharedBitcoinTracker api={b.api} />);await flush();
  fireEvent.click(screen.getByRole('button',{name:'Increase Buy minimum'}));await flush();
  expect(b.api.command).toHaveBeenLastCalledWith(expect.objectContaining({type:'settings',changes:{minimum:79010}}));
  const capital=screen.getByLabelText('Initial capital · USDT');
  fireEvent.change(capital,{target:{value:'20000'}});fireEvent.blur(capital);await flush();
  expect(b.api.command).toHaveBeenLastCalledWith(expect.objectContaining({type:'settings',changes:{capital:20000},expectedControlRevision:1}));
});

it('refreshes conflict state and does not replay the rejected action', async () => {
  const b=backend();render(<SharedBitcoinTracker api={b.api} />);await flush();
  b.external({controlRevision:7,revision:8,running:false});
  fireEvent.click(screen.getByRole('button',{name:'Pause tracking'}));await flush();
  expect(screen.getByRole('alert')).toHaveTextContent('Another view changed');
  expect(screen.getByRole('button',{name:'Resume tracking'})).toBeInTheDocument();
  expect(b.api.command).toHaveBeenCalledTimes(1);
});

it('missing storage shows an error without inventing a local session or controls', async () => {
  render(<SharedBitcoinTracker api={{read:vi.fn().mockRejectedValue(new Error('Storage unavailable')),command:vi.fn()}} />);await flush();
  expect(screen.getByRole('alert')).toHaveTextContent('No local session');
  expect(screen.queryByRole('button',{name:'Start simulation'})).not.toBeInTheDocument();
});

it('shared HTTP client uses server snapshots, omits credentials and sends explicit commands', async () => {
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>sharedSnapshot()});vi.stubGlobal('fetch',fetcher);
  await readSimulation();expect(fetcher.mock.calls[0][0]).toContain('/api/simulation');
  expect(fetcher.mock.calls[0][1]).toEqual(expect.objectContaining({cache:'no-store',credentials:'omit'}));
  await sendSimulationCommand({id:'example',type:'running',running:false,expectedControlRevision:0});
  expect(fetcher.mock.calls[1][1]).toEqual(expect.objectContaining({method:'POST',body:expect.stringContaining('expectedControlRevision')}));
  expect(()=>validateSnapshot({simulation:{usdt:0}})).toThrow('invalid snapshot');
});
