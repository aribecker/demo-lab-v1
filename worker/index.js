const assets = {"/": ["text/html; charset=utf-8", "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>SDD Full Stack Hello</title><link rel=\"stylesheet\" href=\"/styles.css\"></head><body><main><div class=\"badge\">SPEC-DRIVEN DEVELOPMENT</div><p class=\"badge\" aria-label=\"Versi\u00f3n 002\">\ud83d\udd16 Versi\u00f3n 002</p><h1>Clima, full stack.</h1><p class=\"lead\">Cada consulta recorre el frontend, el backend y un servicio meteorol\u00f3gico asincr\u00f3nico.</p><section><div class=\"label\">CLIMA EN BUENOS AIRES</div><div id=\"status\">Consultando\u2026</div><h2 id=\"message\"></h2><p id=\"weather\" aria-live=\"polite\"></p><code id=\"architecture\"></code><small id=\"timestamp\"></small><button id=\"call\">Consultar clima</button></section><footer>Frontend \u00b7 HTTP API \u00b7 Node.js \u00b7 zero external dependencies \u00b7 Datos de <a href=\"https://open-meteo.com/\" style=\"color:inherit\">Open-Meteo</a> / <a href=\"https://www.met.no/\" style=\"color:inherit\">MET Norway</a></footer></main><script src=\"/app.js\"></script></body></html>\n"], "/app.js": ["text/javascript; charset=utf-8", "const statusEl=document.querySelector('#status'), message=document.querySelector('#message'), architecture=document.querySelector('#architecture'), timestamp=document.querySelector('#timestamp'), button=document.querySelector('#call'), details=document.querySelector('#weather');\nasync function callApi(){statusEl.textContent='Consultando clima\u2026';button.disabled=true;message.textContent='';details.textContent='';timestamp.textContent='';try{const r=await fetch('/api/hello',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);const w=d.weather;statusEl.textContent='\u2713 Clima actualizado';message.textContent=`${w.temperature} \u00b0C \u00b7 ${w.location}`;details.textContent=`${w.apparentTemperature === null ? '' : 'Sensaci\u00f3n t\u00e9rmica: '+w.apparentTemperature+' \u00b0C \u00b7 '}Humedad: ${w.humidity}% \u00b7 Viento: ${w.windSpeed} km/h \u00b7 Fuente: ${w.source}${w.dataKind ? ' \u00b7 '+w.dataKind : ''}`;architecture.textContent=d.architecture;timestamp.textContent=`Datos: ${(w.observedAt.endsWith('Z') ? new Date(w.observedAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hourCycle:'h23'}) : w.observedAt.replace('T',' '))} (Buenos Aires) \u00b7 Consulta: ${new Date(d.timestamp).toLocaleTimeString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hourCycle:'h23'})}`;}catch(e){statusEl.textContent=`\u2715 ${e.message}`;architecture.textContent='Pod\u00e9s volver a intentar con el bot\u00f3n.';}finally{button.disabled=false;}}\nbutton.addEventListener('click',callApi);callApi();\n"], "/styles.css": ["text/css; charset=utf-8", "*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0b1020;color:#f4f7ff;min-height:100vh;display:grid;place-items:center}main{width:min(760px,90vw)}.badge,.label{font-size:.75rem;letter-spacing:.16em;color:#7dd3fc;font-weight:800}h1{font-size:clamp(3rem,9vw,6.5rem);line-height:.9;margin:.25em 0}.lead{font-size:1.25rem;color:#aeb9d4;max-width:620px}section{margin-top:3rem;padding:2rem;border:1px solid #293653;border-radius:24px;background:#111a30;box-shadow:0 24px 80px #0008}#status{margin:1rem 0;color:#86efac}h2{font-size:1.7rem}code{display:block;padding:1rem;background:#080d19;border-radius:12px;color:#f0abfc}small{display:block;margin:1rem 0;color:#94a3b8}button{border:0;border-radius:999px;padding:.85rem 1.2rem;font-weight:800;cursor:pointer}footer{margin-top:1.5rem;color:#64748b;font-size:.9rem}\n"]};
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires';
async function getWeather(fetcher = fetch) {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), 10000);
 try {
  const response = await fetcher(WEATHER_URL, {signal:controller.signal,cache:'no-store'});
  if (!response.ok) throw new Error('Weather provider HTTP '+response.status);
  const data = await response.json(); const c = data.current;
  if (!c || typeof c.time !== 'string' || !['temperature_2m','relative_humidity_2m','apparent_temperature','weather_code','wind_speed_10m'].every(k => Number.isFinite(c[k]))) throw new Error('Invalid weather response');
  return {location:'Buenos Aires, Argentina',temperature:c.temperature_2m,apparentTemperature:c.apparent_temperature,humidity:c.relative_humidity_2m,windSpeed:c.wind_speed_10m,weatherCode:c.weather_code,observedAt:c.time,timezone:data.timezone,source:'Open-Meteo',sourceUrl:'https://open-meteo.com/',units:{temperature:'°C',humidity:'%',windSpeed:'km/h'}};
 } catch(error) {
  if (error.name === 'AbortError') throw error;
  const response = await fetcher('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-34.6037&lon=-58.3816', {signal:controller.signal,cache:'no-store',headers:{'User-Agent':'Ariel-SDD-Weather/1.0 https://ariel-ssd-full-stack-0080.aribecker2.chatgpt.site'}});
  if (!response.ok) throw new Error('MET Norway HTTP '+response.status);
  const data=await response.json();
  const points=data.properties?.timeseries;
  if (!Array.isArray(points) || !points.length) throw new Error('Invalid MET response');
  const point=points.reduce((a,b)=>Math.abs(Date.parse(a.time)-Date.now())<=Math.abs(Date.parse(b.time)-Date.now())?a:b);
  const c=point.data?.instant?.details;
  if (!c || !['air_temperature','relative_humidity','wind_speed'].every(k=>Number.isFinite(c[k])) || !Number.isFinite(Date.parse(point.time))) throw new Error('Invalid MET weather');
  return {location:'Buenos Aires, Argentina',temperature:c.air_temperature,apparentTemperature:null,humidity:c.relative_humidity,windSpeed:Math.round(c.wind_speed*36)/10,weatherCode:null,observedAt:point.time,timezone:'America/Argentina/Buenos_Aires',source:'MET Norway',sourceUrl:'https://www.met.no/',dataKind:'Pronóstico para la hora más cercana',units:{temperature:'°C',humidity:'%',windSpeed:'km/h'}};
 } finally {clearTimeout(timer);}
}

export default {
 async fetch(request) {
  const pathname = new URL(request.url).pathname;
  if (pathname === '/api/hello') {
   try {const weather = await getWeather();return Response.json({message:'Clima en Buenos Aires',weather,timestamp:new Date().toISOString(),architecture:`Browser → Worker API → ${weather.source} → JSON → Browser`},{headers:{'Cache-Control':'no-store'}});}
   catch(error){console.error('Weather fetch failed:',error.name,error.message);return Response.json({error:'No se pudo consultar el clima. Volvé a intentar.'},{status:error.name === 'AbortError'?504:502,headers:{'Cache-Control':'no-store'}});}
  }
  const asset = assets[pathname];
  if(!asset) return new Response('Not found',{status:404});
  return new Response(asset[1],{headers:{'Content-Type':asset[0]}});
 }
};
