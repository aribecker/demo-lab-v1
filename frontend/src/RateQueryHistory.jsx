import React, { useEffect, useId, useRef, useState } from 'react';
import { readRateQueries, readRatePeriods } from './rateQueryClient.js';

export const rateTimestamp = value => value ? new Intl.DateTimeFormat('en-GB',{
  timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:1,hourCycle:'h23',
}).format(new Date(value)) : '—';

export default function RateQueryHistory({ summary, loader=readRateQueries, periodLoader=readRatePeriods }) {
  const id=useId();const [open,setOpen]=useState(false),[page,setPage]=useState(null),[periodPage,setPeriodPage]=useState(null),[view,setView]=useState('latest'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const request=useRef(null),generation=useRef(0),failedAction=useRef({});
  const cancel=()=>{generation.current++;request.current?.abort();};
  const load=async (before,{mode=view,all=mode==='all'}={})=>{
    cancel();const current=generation.current;const controller=new AbortController();request.current=controller;
    setView(mode);setBusy(true);setError('');
    if(before==null){if(mode==='summary')setPeriodPage(null);else setPage(null);}
    let cursor=before;
    try {
      do {
        failedAction.current={before:cursor,mode,all};
        const result=await (mode==='summary'?periodLoader:loader)({before:cursor,limit:all?100:25,signal:controller.signal});
        if(current!==generation.current)return;
        if(result.nextCursor!=null && cursor!=null && result.nextCursor>=cursor)throw new Error('History cursor did not advance. Retry.');
        const append=cursor!=null;
        if(mode==='summary')setPeriodPage(old=>({...result,periods:append&&old?[...old.periods,...result.periods.filter(row=>!old.periods.some(prior=>prior.id===row.id))]:result.periods}));
        else setPage(old=>({...result,queries:append&&old?[...old.queries,...result.queries.filter(row=>!old.queries.some(prior=>prior.id===row.id))]:result.queries}));
        cursor=result.nextCursor;
      }while(all&&cursor!=null);
    }catch(failure){if(current===generation.current)setError(failure.name==='AbortError'?'History request timed out. Retry.':failure.message||'Could not read history.');}
    finally{if(current===generation.current)setBusy(false);}
  };
  useEffect(()=>{if(open)load();else{cancel();setBusy(false);}return cancel;},[open,loader,periodLoader]);
  const totals=summary ?? page?.summary;
  return <div className="bitcoin__rate-history">
    <button className="button button--success bitcoin__history-tag" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}>
      {open?'−':'+'} Market queries · {totals?.total?.toLocaleString('en-US') ?? '—'}
    </button>
    {open&&<section id={id} className="bitcoin__history-box" aria-label="Lifetime market query history">
      <p className="bitcoin__note">All recorded provider attempts since this feature was deployed. Reset never clears this table. Opening or refreshing this box reads PostgreSQL; it does not request a market price.</p>
      {totals&&<p className="bitcoin__note">{totals.successful} successful · {totals.failed} failed · {totals.inProgress} incomplete<br/>
        First attempt: {rateTimestamp(totals.firstRequestedAt)}<br/>Latest attempt: {rateTimestamp(totals.lastRequestedAt)}</p>}
      <p className="bitcoin__note">Buenos Aires time · date, hours, minutes, seconds and tenths. Gaps can mean pause, hosting sleep, restart or provider failure; this is activity history, not proof of continuous uptime.</p>
      <div className="bitcoin__history-toolbar" role="group" aria-label="History view">
        <button className="button" aria-pressed={view==='latest'} onClick={()=>load(undefined,{mode:'latest',all:false})}>Latest 25</button>
        <button className="button" aria-pressed={view==='all'} disabled={busy&&view==='all'} onClick={()=>load(undefined,{mode:'all',all:true})}>View All</button>
        <button className="button" aria-pressed={view==='summary'} onClick={()=>load(undefined,{mode:'summary',all:false})}>Resumido</button>
        <button type="button" className="button" disabled={busy} onClick={()=>load()}>Refresh history</button>
      </div>
      {busy&&view==='all'&&<button className="button" onClick={()=>{cancel();setBusy(false);}}>Stop loading</button>}
      {busy&&<p role="status" className="bitcoin__note">{view==='all'?`Loading all saved queries… ${page?.queries.length??0} loaded`:view==='summary'?'Loading activity periods…':'Loading saved queries…'}</p>}
      {error&&<p role="alert" className="bitcoin__note">{error} <button className="button" onClick={()=>load(failedAction.current.before,failedAction.current)}>Retry history</button></p>}
      {view!=='summary'&&page&&!page.queries.length&&!busy&&<p className="bitcoin__note">No market queries have been recorded yet.</p>}
      {view!=='summary'&&page?.queries.length>0&&<>
        <div className="bitcoin__history-scroll"><table><caption>Saved market queries · {view==='all'?'View All':'Latest / loaded'} · newest first · {page.queries.length} rows loaded</caption>
          <thead><tr><th scope="col">Requested · Buenos Aires</th><th scope="col">BTC / USDT</th><th scope="col">Result</th></tr></thead>
          <tbody>{page.queries.map(row=><tr key={row.id}><td><time dateTime={row.requestedAt}>{rateTimestamp(row.requestedAt)}</time><br/><small>#{row.id} · completed {rateTimestamp(row.completedAt)}</small></td>
            <td>{row.price==null?'—':`${row.price} USDT`}</td><td>{row.status}<br/><small>{row.errorCode??(row.status==='IN_PROGRESS'?'Reserved attempt; completion not recorded.':row.provider)}{row.httpStatus?` · HTTP ${row.httpStatus}`:''}</small></td></tr>)}</tbody>
        </table></div>
        {page.nextCursor!=null&&<button className="button" disabled={busy} onClick={()=>load(page.nextCursor)}>Load older queries</button>}
        <p className="bitcoin__note">{page.nextCursor==null?'All rows from this history read are loaded.':'More older rows are available.'} Use Refresh history for the latest results.</p>
      </>}
      {view==='summary'&&<>
        <p className="bitcoin__note">Activity periods · successful readings only. Consecutive gaps strictly below 60 seconds stay together; a gap of exactly 60 seconds or more starts a new period. From / To are the first and last observed readings, not guaranteed uptime.</p>
        {periodPage&&<p className="bitcoin__note">{periodPage.totalPeriods} periods · {periodPage.successfulReadings} successful readings in the full saved history.</p>}
        {periodPage&&!periodPage.periods.length&&!busy&&<p className="bitcoin__note">No successful readings have been recorded yet.</p>}
        {periodPage?.periods.length>0&&<><div className="bitcoin__history-scroll"><table><caption>Activity periods · newest first</caption>
          <thead><tr><th scope="col">From · Buenos Aires</th><th scope="col">To · Buenos Aires</th><th scope="col">Readings</th></tr></thead>
          <tbody>{periodPage.periods.map(period=><tr key={period.id}><td><time dateTime={period.from}>{rateTimestamp(period.from)}</time></td><td><time dateTime={period.to}>{rateTimestamp(period.to)}</time></td><td>{period.readingCount}</td></tr>)}</tbody>
        </table></div>{periodPage.nextCursor!=null&&<button className="button" disabled={busy} onClick={()=>load(periodPage.nextCursor,{mode:'summary',all:false})}>Load older periods</button>}</>}
      </>}
    </section>}
  </div>;
}
