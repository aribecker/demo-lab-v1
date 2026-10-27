import { BACKEND_API_URL } from './backendConfig.js';
import { bearerHeaders, accessDenied } from './authClient.js';
async function request(path, method='GET', body, signal) {
  const controller=new AbortController(),abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const timer=setTimeout(abort,90000);
  try {
    const response=await fetch(`${BACKEND_API_URL}/api/access${path}`,{method,signal:controller.signal,cache:'no-store',credentials:'omit',headers:{...bearerHeaders(),Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(response.status===204)return null;
    const result=await response.json();
    if(!response.ok){accessDenied(response.status);throw new Error(result.message||'Access request could not be completed.');}
    return result;
  }catch(error){if(controller.signal.aborted&&!signal?.aborted)throw new Error('The server is taking longer to respond. Please retry.');throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export const readPermissions=async()=>{const caps=await request('/me');if(!caps||!['canUseSimulator','canManageUsers','canManageGroups'].every(key=>typeof caps[key]==='boolean'))throw new Error('Access could not be verified. Please retry.');return caps;};
export const listRecords=(kind,signal)=>request(`/${kind}`,'GET',undefined,signal);
export const saveRecord=(kind,id,body,signal)=>request(`/${kind}${id?`/${id}`:''}`,id?'PUT':'POST',body,signal);
export const deleteRecord=(kind,id,signal)=>request(`/${kind}/${id}`,'DELETE',undefined,signal);
export const readMembers=(id,signal)=>request(`/groups/${id}/members`,'GET',undefined,signal);
export const saveMembers=(id,userIds,signal)=>request(`/groups/${id}/members`,'PUT',{userIds},signal);
