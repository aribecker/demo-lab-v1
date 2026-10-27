import React,{useEffect,useState} from 'react';
import * as auth from './authClient.js';

export function AccessGate({children}){
 const [session,setSession]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[providers,setProviders]=useState([]);
 useEffect(()=>{let alive=true;
  auth.initialize().then(s=>{if(alive)setSession(s);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
  auth.providers().then(p=>{if(alive)setProviders(p);}).catch(e=>{if(alive)setError(e.message);});
  const expired=()=>{setSession(null);setError('La sesión venció. Iniciá sesión nuevamente.');};window.addEventListener('treasury:session-expired',expired);
  return()=>{alive=false;window.removeEventListener('treasury:session-expired',expired);};
 },[]);
 const signIn=async p=>{setError('');try{await auth.startLogin(p);}catch(e){setError(e.message);}};
 const signOut=async()=>{try{await auth.logout();setSession(null);}catch(e){setError(e.message);}};
 if(loading)return <p role="status">Verificando sesión…</p>;
 if(session)return <><div className="notice">{session.profile?.name||'Sesión iniciada'} <button className="button button--text" onClick={signOut}>Cerrar sesión</button></div>{error&&<p role="alert">{error}</p>}{children}</>;
 return <main className="main"><section className="panel panel--form"><h1>Acceso a tesorería</h1><p>Iniciá sesión. El acceso a cada institución requiere autorización explícita.</p>{error&&<p role="alert">{error}</p>}{providers.filter(p=>p.enabled).map(p=><button className="button" key={p.id} onClick={()=>signIn(p.id)}>Continuar con {p.name}</button>)}{!providers.some(p=>p.enabled)&&<p>No hay proveedores de acceso disponibles.</p>}</section></main>;
}
