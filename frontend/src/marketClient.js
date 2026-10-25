import { BACKEND_API_URL } from './backendConfig.js';
export const MARKET_URL = `${BACKEND_API_URL}/api/bitcoin`;
export async function readMarket({signal}={}) {
  const controller=new AbortController(),abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const timer=setTimeout(abort,12000);
  try {
    const response=await fetch(MARKET_URL,{signal:controller.signal,cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Market readings are unavailable. The server may be waking up.');
    const state=await response.json();
    if(!Number.isSafeInteger(state?.revision)||!Array.isArray(state.samples)||typeof state.running!=='boolean')throw new Error('Invalid market response.');
    return state;
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
