import { SIMULATION_URL } from './simulationClient.js';

async function readHistory(kind, { before, signal, limit=25 } = {}) {
  const params=new URLSearchParams({ limit:String(limit) });
  if(before!=null)params.set('before',String(before));
  const controller=new AbortController();
  const abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
  const timeout=setTimeout(abort,12000);
  try {
    const response=await fetch(`${SIMULATION_URL}/${kind}?${params}`,{signal:controller.signal,cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`History unavailable (HTTP ${response.status}). Retry when the backend is ready.`);
    const page=await response.json();
    const cursorValid=page?.nextCursor==null || (Number.isSafeInteger(page.nextCursor)&&page.nextCursor>0);
    const valid=kind==='rate-queries'
      ? Array.isArray(page?.queries)&&Number.isSafeInteger(page?.summary?.total)&&page.summary.total>=0
        &&page.queries.every(row=>Number.isSafeInteger(row.id)&&['SUCCESS','ERROR','IN_PROGRESS'].includes(row.status)&&Number.isFinite(Date.parse(row.requestedAt))
          &&(row.price==null||(typeof row.price==='string'&&/^\d+(?:\.\d+)?$/.test(row.price))))
      : Array.isArray(page?.periods)&&Number.isSafeInteger(page.totalPeriods)&&page.totalPeriods>=0&&Number.isSafeInteger(page.successfulReadings)&&page.successfulReadings>=0
        &&page.periods.every(row=>Number.isSafeInteger(row.id)&&row.id>0&&Number.isFinite(Date.parse(row.from))&&Number.isFinite(Date.parse(row.to))&&Date.parse(row.to)>=Date.parse(row.from)&&Number.isSafeInteger(row.readingCount)&&row.readingCount>0);
    if(!cursorValid||!valid)throw new Error('History returned an invalid response.');
    return page;
  } finally {clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
}

export const readRateQueries = options => readHistory('rate-queries',options);
export const readRatePeriods = options => readHistory('rate-periods',options);
