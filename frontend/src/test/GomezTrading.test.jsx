import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import GomezTracking from '../GomezTrading.jsx';
import SharedBitcoinTracker from '../SharedBitcoinTracker.jsx';
import { sharedSnapshot } from './sharedFixture.js';

const flush = () => act(async () => { await Promise.resolve(); });
function active() {
  const data = sharedSnapshot();data.settings.strategy='gomez';
  data.simulation={...data.simulation,strategy:'gomez',phase:'holding_usdt',usdt:9990,capital:10000,feePercent:0.1,tradeCount:1,
    gomez:{delta:1,deltaUnit:'percent',pollSeconds:120,nextAction:'BUY',initialBtcEquivalent:0.1,lastFillPrice:100000,targetPrice:99000,
      pendingSell:true,completedCycles:0,lastCycleGainBtc:0,stopAfterCycle:false,decision:'Waiting to BUY at or below 99000 USDT per BTC.'}};
  return data;
}

it('explains real reciprocal quote, target formula, pending cycle and fees without issuing orders', () => {
  const send=vi.fn();render(<GomezTracking data={active()} send={send} pending={false} />);
  expect(screen.getByText('100000 − (100000 × 1 / 100) = 99000 USDT / BTC')).toBeInTheDocument();
  expect(screen.getByText(/1 USDT = 0.0000125000 BTC/)).toBeInTheDocument();
  expect(screen.getByText(/A sale is awaiting its rebuy/)).toBeInTheDocument();
  expect(screen.getByText(/BNB balances and BNB fee payment are not simulated/)).toBeInTheDocument();
  expect(send).not.toHaveBeenCalled();
});

it('relaunch submits active delta and interval without Reset or a side flip', () => {
  const send=vi.fn();render(<GomezTracking data={active()} send={send} pending={false} />);
  fireEvent.change(screen.getByLabelText('Active Delta margin'),{target:{value:'0.5'}});
  fireEvent.change(screen.getByLabelText('Active Polling interval · seconds'),{target:{value:'30'}});
  fireEvent.click(screen.getByRole('button',{name:'Relaunch with these parameters'}));
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith('relaunch',{changes:{delta:0.5,deltaUnit:'percent',pollSeconds:30}});
});

it('validates live input and supports deferred stop and cancellation', () => {
  const send=vi.fn();const data=active();const view=render(<GomezTracking data={data} send={send} pending={false} />);
  fireEvent.change(screen.getByLabelText('Active Delta margin'),{target:{value:'100'}});
  expect(screen.getByRole('button',{name:'Relaunch with these parameters'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Stop after completing SELL → BUY'}));
  expect(send).toHaveBeenCalledWith('finish-cycle',{enabled:true});
  data.simulation.gomez.stopAfterCycle=true;view.rerender(<GomezTracking data={data} send={send} pending={false} />);
  fireEvent.click(screen.getByRole('button',{name:'Cancel stop after cycle'}));
  expect(send).toHaveBeenLastCalledWith('finish-cycle',{enabled:false});
});

it('starts with explicit SELL parameters and separates next-run drafts from live relaunch', async () => {
  let state=sharedSnapshot();
  const api={read:vi.fn(async()=>structuredClone(state)),command:vi.fn(async c=>{
    if(c.type==='settings')Object.assign(state.settings,c.changes);
    state.revision++;state.controlRevision++;return structuredClone(state);
  })};
  render(<SharedBitcoinTracker api={api} />);await flush();
  fireEvent.change(screen.getByLabelText('Next strategy'),{target:{value:'gomez'}});await flush();
  fireEvent.change(screen.getByLabelText('Initial virtual Bitcoin'),{target:{value:'0.25'}});
  fireEvent.change(screen.getByLabelText('Delta margin'),{target:{value:'2'}});
  fireEvent.click(screen.getByRole('button',{name:'Start simulation'}));await flush();
  expect(api.command).toHaveBeenLastCalledWith(expect.objectContaining({type:'reset',changes:expect.objectContaining({strategy:'gomez',initialAction:'SELL',initialBtc:0.25,delta:2,deltaUnit:'percent',pollSeconds:120})}));
});

it('blocks Reset with a pending rebuy and exposes relaunch instead', async () => {
  const api={read:vi.fn(async()=>active()),command:vi.fn()};
  render(<SharedBitcoinTracker api={api} />);await flush();
  expect(screen.getByRole('button',{name:'Reset simulation'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Relaunch with these parameters'})).toBeEnabled();
  expect(api.command).not.toHaveBeenCalled();
});
