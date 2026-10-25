import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import RateQueryHistory, { rateTimestamp } from '../RateQueryHistory.jsx';
import { readRateQueries, readRatePeriods } from '../rateQueryClient.js';

const stamp='2026-10-25T15:34:56.123456Z';
const summary={total:2,successful:1,failed:1,inProgress:0,firstRequestedAt:stamp,lastRequestedAt:stamp};
const row=(id,extra={})=>({id,requestedAt:stamp,completedAt:stamp,status:'SUCCESS',price:'81000.123456789012',provider:'BINANCE',symbol:'BTCUSDT',httpStatus:200,errorCode:null,...extra});
const first={queries:[row(2)],nextCursor:2,summary};
const expand=()=>fireEvent.click(screen.getByRole('button',{name:/Market queries/}));

it('is read-only and lazy, expands inline with date/time tenths and exact decimal value',async()=>{
  const loader=vi.fn().mockResolvedValue(first);render(<RateQueryHistory summary={summary} loader={loader}/>);
  expect(loader).not.toHaveBeenCalled();expand();
  expect(await screen.findByText('81000.123456789012 USDT')).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Lifetime market query history'})).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(rateTimestamp(stamp)).toBe('25/10/2026, 12:34:56.1');
  expect(screen.getByText(/not proof of continuous uptime/)).toBeInTheDocument();
  expect(loader.mock.calls[0][0].before).toBeUndefined();
});
it('loads older rows without duplicates and refresh replaces the list',async()=>{
  const loader=vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce({queries:[row(1,{status:'ERROR',price:null,errorCode:'HTTP_ERROR',httpStatus:429})],nextCursor:null,summary}).mockResolvedValueOnce({queries:[row(3)],nextCursor:3,summary:{...summary,total:3}});
  render(<RateQueryHistory summary={summary} loader={loader}/>);expand();await screen.findByText('81000.123456789012 USDT');
  fireEvent.click(screen.getByRole('button',{name:'Load older queries'}));
  expect(await screen.findByText('ERROR')).toBeInTheDocument();
  expect(loader.mock.calls[1][0].before).toBe(2);expect(screen.queryByRole('button',{name:'Load older queries'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Refresh history'}));await waitFor(()=>expect(screen.queryByText('ERROR')).not.toBeInTheDocument());
  expect(loader.mock.calls[2][0].before).toBeUndefined();
});
it('handles failure/retry and empty history',async()=>{
  const loader=vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce({queries:[],nextCursor:null,summary:{...summary,total:0}});
  render(<RateQueryHistory loader={loader}/>);expand();expect(await screen.findByRole('alert')).toHaveTextContent('Unavailable');
  fireEvent.click(screen.getByRole('button',{name:'Retry history'}));expect(await screen.findByText('No market queries have been recorded yet.')).toBeInTheDocument();
});
it('aborts on close and ignores an obsolete response after reopening',async()=>{
  let finish;const loader=vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce({queries:[],nextCursor:null,summary});
  render(<RateQueryHistory summary={summary} loader={loader}/>);expand();
  expect(screen.getByRole('status')).toHaveTextContent('Loading');const signal=loader.mock.calls[0][0].signal;
  expand();expect(signal.aborted).toBe(true);expand();await screen.findByText('No market queries have been recorded yet.');
  await act(async()=>finish(first));expect(screen.queryByText('81000.123456789012 USDT')).not.toBeInTheDocument();
});
it('client uses only GET history with cursor and rejects invalid payloads',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>first});vi.stubGlobal('fetch',fetcher);
  try{
    await readRateQueries({before:2});expect(fetcher.mock.calls[0][0]).toContain('/rate-queries?limit=25&before=2');
    expect(fetcher.mock.calls[0][1]).toEqual(expect.objectContaining({cache:'no-store',credentials:'omit'}));
    expect(fetcher.mock.calls[0][1].method).toBeUndefined();
    fetcher.mockResolvedValueOnce({ok:true,json:async()=>({queries:[row(1,{price:99})],summary,nextCursor:null})});
    await expect(readRateQueries()).rejects.toThrow('invalid response');
    fetcher.mockResolvedValueOnce({ok:false,status:503});await expect(readRateQueries()).rejects.toThrow('HTTP 503');
  }finally{vi.unstubAllGlobals();}
});

it('View All loads every bounded page automatically and reports completion',async()=>{
  const loader=vi.fn().mockResolvedValueOnce(first)
    .mockResolvedValueOnce({...first,queries:[row(5),row(4)],nextCursor:4})
    .mockResolvedValueOnce({...first,queries:[row(3),row(2)],nextCursor:2})
    .mockResolvedValueOnce({...first,queries:[row(1)],nextCursor:null});
  render(<RateQueryHistory summary={summary} loader={loader}/>);expand();await screen.findByText('81000.123456789012 USDT');
  fireEvent.click(screen.getByRole('button',{name:'View All'}));
  await screen.findByText('Saved market queries · View All · newest first · 5 rows loaded');
  expect(loader.mock.calls.slice(1).map(call=>call[0].before)).toEqual([undefined,4,2]);
  expect(loader.mock.calls.slice(1).every(call=>call[0].limit===100)).toBe(true);
  expect(screen.queryByRole('button',{name:'Load older queries'})).not.toBeInTheDocument();
});
it('View All keeps loaded rows and retry resumes the failed page',async()=>{
  const loader=vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce({...first,queries:[row(4)],nextCursor:4})
    .mockRejectedValueOnce(new Error('Temporary')).mockResolvedValueOnce({...first,queries:[row(3)],nextCursor:null});
  render(<RateQueryHistory loader={loader}/>);expand();await screen.findByText('81000.123456789012 USDT');
  fireEvent.click(screen.getByRole('button',{name:'View All'}));await screen.findByRole('alert');
  expect(screen.getByText(/1 rows loaded/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Retry history'}));await screen.findByText(/2 rows loaded/);
  expect(loader.mock.calls[3][0].before).toBe(4);
});
it('Resumido uses the server periods, pages them and refreshes the same view',async()=>{
  const loader=vi.fn().mockResolvedValue(first);
  const period={id:2,from:stamp,to:'2026-10-25T15:36:16.123456Z',readingCount:9};
  const periodLoader=vi.fn().mockResolvedValueOnce({periods:[period],nextCursor:2,totalPeriods:2,successfulReadings:10})
    .mockResolvedValueOnce({periods:[{...period,id:1,readingCount:1}],nextCursor:null,totalPeriods:2,successfulReadings:10})
    .mockResolvedValueOnce({periods:[],nextCursor:null,totalPeriods:0,successfulReadings:0});
  render(<RateQueryHistory summary={summary} loader={loader} periodLoader={periodLoader}/>);expand();await screen.findByText('81000.123456789012 USDT');
  fireEvent.click(screen.getByRole('button',{name:'Resumido'}));await screen.findByRole('table',{name:'Activity periods · newest first'});
  expect(screen.getByText(/2 periods · 10 successful/)).toBeInTheDocument();
  expect(screen.getByText('25/10/2026, 12:36:16.1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Load older periods'}));await waitFor(()=>expect(screen.queryByRole('button',{name:'Load older periods'})).not.toBeInTheDocument());
  expect(periodLoader.mock.calls[1][0].before).toBe(2);
  fireEvent.click(screen.getByRole('button',{name:'Refresh history'}));await screen.findByText('No successful readings have been recorded yet.');
  expect(loader).toHaveBeenCalledTimes(1);expect(periodLoader).toHaveBeenCalledTimes(3);
});
it('switching view cancels View All and ignores its delayed page',async()=>{
  let finish;const loader=vi.fn().mockResolvedValueOnce(first).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const periodLoader=vi.fn().mockResolvedValue({periods:[],nextCursor:null,totalPeriods:0,successfulReadings:0});
  render(<RateQueryHistory loader={loader} periodLoader={periodLoader}/>);expand();await screen.findByText('81000.123456789012 USDT');
  fireEvent.click(screen.getByRole('button',{name:'View All'}));const signal=loader.mock.calls[1][0].signal;
  fireEvent.click(screen.getByRole('button',{name:'Resumido'}));await screen.findByText('No successful readings have been recorded yet.');
  expect(signal.aborted).toBe(true);await act(async()=>finish(first));
  expect(screen.queryByRole('table',{name:/Saved market queries/})).not.toBeInTheDocument();
});
it('period client reads the summary endpoint and validates intervals',async()=>{
  const result={periods:[{id:1,from:stamp,to:stamp,readingCount:1}],nextCursor:null,totalPeriods:1,successfulReadings:1};
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>result});vi.stubGlobal('fetch',fetcher);
  try {
    await readRatePeriods({before:2});expect(fetcher.mock.calls[0][0]).toContain('/rate-periods?limit=25&before=2');
    fetcher.mockResolvedValueOnce({ok:true,json:async()=>({...result,periods:[{...result.periods[0],readingCount:0}]})});
    await expect(readRatePeriods()).rejects.toThrow('invalid response');
  }finally{vi.unstubAllGlobals();}
});
