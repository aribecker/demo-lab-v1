import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AdaptiveTracking from '../AdaptiveTracking.jsx';
import SharedBitcoinTracker from '../SharedBitcoinTracker.jsx';
import { sharedSnapshot } from './sharedFixture.js';

function snapshot(tracking = {}) {
  const base=sharedSnapshot();
  return { ...base, lastPollAt:Date.now(), settings:{ ...base.settings, strategy:'adaptive' },
    simulation:{ ...base.simulation, strategy:'adaptive', phase:'holding_usdt', capital:10000,usdt:10000,feePercent:.1,
      dipAtr:1.5,reboundAtr:.75,trailAtr:2,lossAtr:3,minimumMovePercent:.2,
      tracking:{ completedCandles:8,decision:'Warming up', ...tracking } } };
}
it('explains warmup, missing indicators and formulas without fabricating zero prices', () => {
  render(<AdaptiveTracking data={snapshot()} />);
  expect(screen.getByLabelText('Indicator warmup')).toHaveAttribute('value','8');
  expect(screen.getByText(/8 completed sampled candles/)).toBeInTheDocument();
  expect(screen.getAllByText('Waiting').length).toBeGreaterThan(5);
  expect(screen.getByText(/Wilder average of 14 true ranges/)).toBeInTheDocument();
  expect(screen.getByText(/Entry ÷/)).toBeInTheDocument();
});
it('shows backend levels and trend rejection without claiming it should buy', () => {
  render(<AdaptiveTracking data={snapshot({ completedCandles:22,ready:true,trendAllowed:false,dipArmed:true,
    cycleHigh:81000,dipLow:79000,buyTrigger:80500,atr:500,decision:'Rebound reached, but trend filter blocks entry.' })} />);
  expect(screen.getByText(/Trend blocks entry/)).toBeInTheDocument();
  expect(screen.getByText('80,500 USDT / BTC')).toBeInTheDocument();
  expect(screen.getAllByText('500 USDT / BTC',{selector:'dd'})).toHaveLength(2);
  expect(screen.getByText(/Rebound reached, but trend filter blocks entry/)).toBeInTheDocument();
});
it('labels stale and paused data as saved values', () => {
  const data=snapshot();data.lastPollAt=1;
  const view=render(<AdaptiveTracking data={data} />);
  expect(screen.getByRole('status')).toHaveTextContent('Stale snapshot');
  expect(screen.getByText(/Last saved engine decision/)).toBeInTheDocument();
  view.rerender(<AdaptiveTracking data={{...data,running:false}} />);
  expect(screen.getByRole('status')).toHaveTextContent('Paused');
});
it('keeps a classic run distinct from next adaptive configuration', () => {
  const data=snapshot();data.simulation.strategy='classic';
  render(<AdaptiveTracking data={data} />);
  expect(screen.getByText(/Classic minimum \/ maximum/)).toHaveTextContent('Next Start / Reset: Adaptive');
  expect(screen.queryByLabelText('Indicator warmup')).not.toBeInTheDocument();
});
it('mount is read-only and explicit Reset sends strategy plus bounded risk settings', async () => {
  let data=snapshot();data.simulation.strategy='classic';
  const api={read:vi.fn(async()=>structuredClone(data)),command:vi.fn(async command=>{
    data={...data,settings:{...data.settings,...command.changes},controlRevision:data.controlRevision+1,revision:data.revision+1};return structuredClone(data);
  })};
  render(<SharedBitcoinTracker api={api} />);
  await act(async()=>{await Promise.resolve();});
  expect(api.command).not.toHaveBeenCalled();
  const input=screen.getByLabelText(/Rebound size · ATR multiple/);
  fireEvent.change(input,{target:{value:'0'}});
  expect(screen.getByRole('button',{name:'Reset simulation'})).toBeDisabled();
  fireEvent.change(input,{target:{value:'1.25'}});
  fireEvent.click(screen.getByRole('button',{name:'Reset simulation'}));
  await act(async()=>{await Promise.resolve();});
  expect(api.command).toHaveBeenCalledWith(expect.objectContaining({type:'reset',changes:expect.objectContaining({strategy:'adaptive',reboundAtr:1.25,trailAtr:2})}));
  fireEvent.change(screen.getByLabelText('Next strategy'),{target:{value:'classic'}});
  await act(async()=>{await Promise.resolve();});
  expect(api.command).toHaveBeenLastCalledWith(expect.objectContaining({type:'settings',changes:{strategy:'classic'}}));
});
