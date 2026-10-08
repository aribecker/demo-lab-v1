const card=document.querySelector('#weather-card'),button=document.querySelector('#call'),status=document.querySelector('#status');
const slots=Object.fromEntries(['message','weather','architecture','timestamp'].map(id=>[id,document.querySelector(`#${id} .content`)]));
const format=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n);
function time(value){if(!value)return 'Unavailable';return /Z$|[+-]\d\d:\d\d$/.test(value)?new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'short',timeStyle:'medium'}).format(new Date(value)):value.replace('T',' ');}
let diagnosticQueue=[];let diagnosticsSending=false;
try{diagnosticQueue=JSON.parse(globalThis.localStorage?.getItem('weather-diagnostics')||'[]');if(!Array.isArray(diagnosticQueue))diagnosticQueue=[];}catch{}
function saveDiagnostics(){try{globalThis.localStorage?.setItem('weather-diagnostics',JSON.stringify(diagnosticQueue));}catch{}}
async function flushDiagnostics(){
 if(diagnosticsSending)return;diagnosticsSending=true;
 try{while(diagnosticQueue.length){const response=await fetch('/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(diagnosticQueue[0]),keepalive:true});if(!response.ok)break;diagnosticQueue.shift();saveDiagnostics();}}catch{}finally{diagnosticsSending=false;}
}
function report(id,event,attempt,status,elapsedMs){
 diagnosticQueue.push({id,event,attempt,status,elapsedMs,clientTime:new Date().toISOString()});if(diagnosticQueue.length>100)diagnosticQueue.shift();saveDiagnostics();flushDiagnostics();
}
async function fetchWeather(id){
 const deadline=Date.now()+195000;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.max(1,deadline-Date.now()));
  const started=Date.now();report(id,'attempt-start',attempt+1,null,0);
  try{
   const response=await fetch('/api/hello',{cache:'no-store',signal:controller.signal,headers:{'X-Request-Id':id}});
   report(id,'attempt-response',attempt+1,response.status,Date.now()-started);
   if([502,503,504].includes(response.status)&&attempt<2&&Date.now()+3000<deadline){status.textContent='Weather service is waking up… Retrying';}
   else return response;
  }catch(error){report(id,'network-error',attempt+1,null,Date.now()-started);if(attempt===2||Date.now()+3000>=deadline)throw error;status.textContent='Connecting to weather service… Retrying';}
  finally{clearTimeout(timer);}
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
 throw new Error('Weather service unavailable');
}
async function refresh(){
 const id=globalThis.crypto?.randomUUID?.()||`req-${Date.now()}`;
 if(button.disabled)return;
 button.disabled=true;card.classList.add('loading');card.setAttribute('aria-busy','true');status.textContent='Fetching weather…';Object.values(slots).forEach(el=>el.textContent='');
 try{
  const response=await fetchWeather(id);const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to retrieve the weather. Please try again.');
  const w=data.weather;slots.message.textContent=`${data.message} · ${format(w.temperature)} °C · ${w.location}`;
  slots.weather.textContent=[w.apparentTemperature==null?null:`Feels like: ${format(w.apparentTemperature)} °C`,`Humidity: ${format(w.humidity)}%`,`Wind: ${format(w.windSpeed)} km/h`,`Source: ${w.source}`,w.dataKind].filter(Boolean).join(' · ');
  slots.architecture.textContent=data.architecture;slots.timestamp.textContent=`Data: ${time(w.observedAt)} (Buenos Aires) · Requested: ${time(data.timestamp)}`;status.textContent='✓ Weather updated';report(id,'success',null,200,null);
 }catch(error){status.textContent='Weather unavailable';slots.message.textContent=`Unable to retrieve the weather. Reference: ${id}`;report(id,'display-error',null,null,null);}
 finally{card.classList.remove('loading');card.setAttribute('aria-busy','false');button.disabled=false;flushDiagnostics();}
}
button.addEventListener('click',refresh);refresh();
