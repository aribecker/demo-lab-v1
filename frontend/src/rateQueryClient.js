import { SIMULATION_URL } from './simulationClient.js';

export async function readRateQueries({ before, signal } = {}) {
  const params=new URLSearchParams({ limit:'25' });
  if(before!=null)params.set('before',String(before));
  const controller=new AbortController();
  const abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
  const timeout=setTimeout(abort,12000);
  try {
    const response=await fetch(`${SIMULATION_URL}/rate-queries?${params}`,{signal:controller.signal,cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`History unavailable (HTTP ${response.status}). Retry when the backend is ready.`);
    const page=await response.json();
    if(!Array.isArray(page?.queries)||!Number.isSafeInteger(page?.summary?.total)||page.summary.total<0
      ||(page.nextCursor!=null&&(!Number.isSafeInteger(page.nextCursor)||page.nextCursor<=0))
      ||page.queries.some(row=>!Number.isSafeInteger(row.id)||!['SUCCESS','ERROR','IN_PROGRESS'].includes(row.status)||!Number.isFinite(Date.parse(row.requestedAt))
        ||(row.price!=null&&(typeof row.price!=='string'||!/^\d+(?:\.\d+)?$/.test(row.price)))))throw new Error('History returned an invalid response.');
    return page;
  } finally {clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
}
