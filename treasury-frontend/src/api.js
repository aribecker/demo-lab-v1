export const API=(import.meta.env.VITE_API_URL||'https://ariel-demo-integrated-api.onrender.com').replace(/\/$/,'');
export async function request(path,{body,raw=false}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
 try{
  const form=body instanceof FormData;
  const token=localStorage.getItem("treasury.auth.token");
  const r=await fetch(API+path,{method:body===undefined?'GET':'POST',credentials:'omit',cache:'no-store',signal:controller.signal,
   headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(!form&&body!==undefined?{'Content-Type':'application/json'}:{})},
   ...(body!==undefined?{body:form?body:JSON.stringify(body)}:{})});
  if(r.status===401){localStorage.removeItem("treasury.auth.token");window.dispatchEvent(new Event("treasury:session-expired"));}
  if(!r.ok){let data;try{data=await r.json();}catch{}
   const error=new Error(data?.message||'No se pudo completar la operación. Reintentá.');error.status=r.status;throw error;}
  if(raw)return r.blob();const text=await r.text();return text?JSON.parse(text):null;
 }catch(e){if(e.name==='AbortError')throw new Error('El servidor está tardando en responder. Si estaba suspendido, reintentá en unos instantes.');throw e;}finally{clearTimeout(timer);}
}
export const root=inst=>`/api/treasury/institutions/${encodeURIComponent(inst)}`;
export const dataUrl=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
export function download(content,name,type='text/html;charset=utf-8'){
 const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

