import React,{useEffect,useState,useRef} from 'react';
import * as api from './api.js';

export function Backup(){
 const [preview,setPreview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const sending=useRef(false);
 useEffect(()=>{let alive=true;api.request('/api/treasury/backup/preview').then(p=>{if(alive)setPreview(p);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
 async function send(){
  if(sending.current||!preview)return;
  sending.current=true;setBusy(true);setError('');
  try{
   const prepared=await api.request('/api/treasury/backup/prepare',{body:{confirmation:preview.confirmation}});
   // Fetch both files before initiating either download, so failures remain retryable.
   const blobs=await Promise.all(prepared.downloads.map(path=>api.request(path,{raw:true})));
   setResult(prepared);blobs.forEach((blob,i)=>api.download(blob,prepared.files[i]));
  }
  catch(e){setError(e.message);}
  finally{sending.current=false;setBusy(false);}
 }
 return <section aria-labelledby="backup-title"><div className="page-heading"><div><div className="eyebrow">BASE DE DATOS</div><h1 id="backup-title">Respaldo de seguridad</h1><p>Copia completa de tesorería, con todas las instituciones y sus comprobantes.</p></div></div>
 {error&&<div className="notice notice--error" role="alert">{error}</div>}
 {result?<div className="panel backup"><h2>Respaldo listo</h2><p role="status">{result.mail_accepted?`El servicio de correo aceptó el respaldo para ${result.recipient}. Se iniciaron también las descargas de los dos archivos.`:"No se pudo asegurar el envío del correo, pero se procederá con la descarga de los archivos igualmente."}</p><ul>{result.files.map(f=><li key={f}><a href={api.API+result.downloads[result.files.indexOf(f)]} download={f}>{f}</a></li>)}</ul><p>Si el navegador bloqueó alguna descarga, usá los enlaces de arriba. Los archivos están disponibles durante 15 minutos.</p><a className="button button--secondary" href="/">Volver</a></div>:
 !preview?<p role="status">{error?'No se pudo preparar la confirmación. Recargá para reintentar.':'Preparando confirmación…'}</p>:
 <div className="panel backup"><h2>Por favor, confirmá</h2><p>Se descargarán los siguientes archivos y se intentará enviar una copia a <strong>{preview.recipient}</strong>:</p><ul>{preview.files.map(f=><li key={f}><strong>{f}</strong></li>)}</ul>
 <p>El ZIP contiene un dump SQL restaurable de PostgreSQL e instrucciones. El Excel contiene una hoja por tabla con todas sus filas, incluidas las tablas vacías. Los comprobantes binarios se representan en base64, dividido en columnas cuando sea necesario.</p>
 <p>Incluye todas las instituciones del esquema de tesorería, independientemente de la institución activa. Fecha de los archivos: {preview.date} (Buenos Aires).</p>
 {!preview.configured&&<div className="notice notice--error" role="alert">El correo no está configurado. Se procederá con la descarga de los archivos igualmente.</div>}
 <div className="backup__actions"><a className={`button button--secondary ${busy?'backup__cancel--disabled':''}`} href="/" aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();}}>Cancelar</a><button className="button" disabled={busy} onClick={send}>{busy?'Generando respaldo…':'Confirmar y descargar'}</button></div>
 {busy&&<p role="status">Generando ambos archivos, preparando las descargas e intentando enviar el correo. Puede tardar hasta un minuto.</p>}</div>}
 </section>;
}
