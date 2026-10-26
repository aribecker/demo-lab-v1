import React,{useEffect,useState,useRef} from 'react';
import * as api from './api.js';

export function Backup(){
 const [preview,setPreview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const sending=useRef(false);
 useEffect(()=>{let alive=true;api.request('/api/treasury/backup/preview').then(p=>{if(alive)setPreview(p);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
 async function send(){
  if(sending.current||!preview?.configured)return;
  sending.current=true;setBusy(true);setError('');
  try{setResult(await api.request('/api/treasury/backup/send',{body:{confirmation:preview.confirmation}}));}
  catch(e){setError(e.message);}
  finally{sending.current=false;setBusy(false);}
 }
 return <section aria-labelledby="backup-title"><div className="page-heading"><div><div className="eyebrow">BASE DE DATOS</div><h1 id="backup-title">Respaldo de seguridad</h1><p>Copia completa de tesorería, con todas las instituciones y sus comprobantes.</p></div></div>
 {error&&<div className="notice notice--error" role="alert">{error}</div>}
 {result?<div className="panel backup"><h2>Correo aceptado para envío</h2><p role="status">El servicio de correo aceptó el respaldo para {result.recipient}. Revisá tu bandeja de entrada y correo no deseado.</p><ul>{result.files.map(f=><li key={f}>{f}</li>)}</ul><p>Referencia: {result.message_id}</p><a className="button button--secondary" href="/">Volver</a></div>:
 !preview?<p role="status">{error?'No se pudo preparar la confirmación. Recargá para reintentar.':'Preparando confirmación…'}</p>:
 <div className="panel backup"><h2>Por favor, confirmá</h2><p>Se enviará un correo a <strong>{preview.recipient}</strong> con los siguientes archivos adjuntos:</p><ul>{preview.files.map(f=><li key={f}><strong>{f}</strong></li>)}</ul>
 <p>El ZIP contiene un dump SQL restaurable de PostgreSQL e instrucciones. El Excel contiene una hoja por tabla con todas sus filas, incluidas las tablas vacías. Los comprobantes binarios se representan en base64, dividido en columnas cuando sea necesario.</p>
 <p>Incluye todas las instituciones del esquema de tesorería, independientemente de la institución activa. Fecha de los archivos: {preview.date} (Buenos Aires).</p>
 {!preview.configured&&<div className="notice notice--error" role="alert">El envío de correo está pendiente de configuración en el servidor. Todavía no se generó ni envió ningún respaldo.</div>}
 <div className="backup__actions"><a className={`button button--secondary ${busy?'backup__cancel--disabled':''}`} href="/" aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();}}>Cancelar</a><button className="button" disabled={busy||!preview.configured} onClick={send}>{busy?'Generando y enviando…':'Confirmar y enviar'}</button></div>
 {busy&&<p role="status">Generando ambos archivos y enviando el correo. Puede tardar hasta un minuto.</p>}</div>}
 </section>;
}
