export const API=(import.meta.env.VITE_API_URL||'https://ariel-demo-integrated-api.onrender.com').replace(/\/$/,'');
const TOKEN='treasury.auth.token',VERIFIER='treasury.auth.verifier';
export const token=()=>localStorage.getItem(TOKEN);
export function clearToken(){localStorage.removeItem(TOKEN);}
export async function request(path,{body,raw=false}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
 try{
  const form=body instanceof FormData;
  const r=await fetch(API+path,{method:body===undefined?'GET':'POST',credentials:'omit',cache:'no-store',signal:controller.signal,
   headers:{...(token()?{Authorization:`Bearer ${token()}`} : {}),...(!form&&body!==undefined?{'Content-Type':'application/json'}:{})},
   ...(body!==undefined?{body:form?body:JSON.stringify(body)}:{})});
  if(!r.ok){let data;try{data=await r.json();}catch{}if(r.status===401){clearToken();window.dispatchEvent(new Event('treasury:session'));}
   const error=new Error(data?.message||(r.status===403?'Tu cuenta no está autorizada.':'No se pudo completar la operación. Reintentá.'));error.status=r.status;throw error;}
  if(raw)return r.blob();const text=await r.text();return text?JSON.parse(text):null;
 }catch(e){if(e.name==='AbortError')throw new Error('El servidor está tardando en responder. Si estaba suspendido, reintentá en unos instantes.');throw e;}finally{clearTimeout(timer);}
}
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function login(){const v=encode(crypto.getRandomValues(new Uint8Array(32)));sessionStorage.setItem(VERIFIER,v);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));
 window.location.assign(`${API}/auth/start/google?app=treasury&challenge=${encode(new Uint8Array(digest))}`);
}
export async function restore(){
 const params=new URLSearchParams(location.hash.slice(1)),ticket=params.get('ticket');
 if(ticket||params.has('auth_error'))history.replaceState(null,'',location.pathname+location.search);
 if(params.has('auth_error')){sessionStorage.removeItem(VERIFIER);throw new Error('No se completó el acceso con Google. Podés volver a intentarlo.');}
 if(ticket){const verifier=sessionStorage.getItem(VERIFIER);sessionStorage.removeItem(VERIFIER);if(!verifier)throw new Error('El acceso venció. Iniciá sesión nuevamente.');
  const data=await request('/auth/exchange',{body:{ticket,verifier}});localStorage.setItem(TOKEN,data.token);return data;}
 return token()?request('/auth/me'):null;
}
export async function logout(){if(token())await request('/auth/logout',{body:{}});clearToken();}
export const root=inst=>`/api/treasury/institutions/${encodeURIComponent(inst)}`;
export const dataUrl=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
export function download(content,name,type='text/html;charset=utf-8'){
 const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
