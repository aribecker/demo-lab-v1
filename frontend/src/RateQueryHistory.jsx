import React, { useEffect, useId, useRef, useState } from 'react';
import { readRateQueries } from './rateQueryClient.js';

export const rateTimestamp = value => value ? new Intl.DateTimeFormat('en-GB',{
  timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:1,hourCycle:'h23',
}).format(new Date(value)) : '—';

export default function RateQueryHistory({ summary, loader=readRateQueries }) {
  const id=useId();const [open,setOpen]=useState(false),[page,setPage]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const request=useRef(null),generation=useRef(0);
  const failedCursor=useRef(undefined);
  const cancel=()=>{generation.current++;request.current?.abort();};
  const load=async before=>{
    cancel();const current=generation.current;const controller=new AbortController();request.current=controller;
    setBusy(true);setError('');
    failedCursor.current=before;
    try {
      const result=await loader({before,signal:controller.signal});
      if(current!==generation.current)return;
      setPage(old=>({...result,queries:before&&old?[...old.queries,...result.queries.filter(row=>!old.queries.some(prior=>prior.id===row.id))]:result.queries}));
    }catch(failure){if(current===generation.current)setError(failure.name==='AbortError'?'History request timed out. Retry.':failure.message||'Could not read history.');}
    finally{if(current===generation.current)setBusy(false);}
  };
  useEffect(()=>{if(open)load();else{cancel();setBusy(false);}return cancel;},[open,loader]);
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
      <button type="button" className="button" disabled={busy} onClick={()=>load()}>Refresh history</button>
      {busy&&<p role="status" className="bitcoin__note">Loading saved queries…</p>}
      {error&&<p role="alert" className="bitcoin__note">{error} <button className="button" onClick={()=>load(failedCursor.current)}>Retry history</button></p>}
      {page&&!page.queries.length&&!busy&&<p className="bitcoin__note">No market queries have been recorded yet.</p>}
      {page?.queries.length>0&&<>
        <div className="bitcoin__history-scroll"><table><caption>Saved market queries · newest first · {page.queries.length} rows loaded</caption>
          <thead><tr><th scope="col">Requested · Buenos Aires</th><th scope="col">BTC / USDT</th><th scope="col">Result</th></tr></thead>
          <tbody>{page.queries.map(row=><tr key={row.id}><td><time dateTime={row.requestedAt}>{rateTimestamp(row.requestedAt)}</time><br/><small>#{row.id} · completed {rateTimestamp(row.completedAt)}</small></td>
            <td>{row.price==null?'—':`${row.price} USDT`}</td><td>{row.status}<br/><small>{row.errorCode??(row.status==='IN_PROGRESS'?'Reserved attempt; completion not recorded.':row.provider)}{row.httpStatus?` · HTTP ${row.httpStatus}`:''}</small></td></tr>)}</tbody>
        </table></div>
        {page.nextCursor!=null&&<button className="button" disabled={busy} onClick={()=>load(page.nextCursor)}>Load older queries</button>}
        <p className="bitcoin__note">{page.nextCursor==null?'All rows from this history read are loaded.':'More older rows are available.'} Use Refresh history for the latest results.</p>
      </>}
    </section>}
  </div>;
}
