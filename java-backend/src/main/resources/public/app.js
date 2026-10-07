const card=document.querySelector('#weather-card'),button=document.querySelector('#call'),status=document.querySelector('#status');
const slots=Object.fromEntries(['message','weather','architecture','timestamp'].map(id=>[id,document.querySelector(`#${id} .content`)]));
const format=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n);
function time(value){if(!value)return 'Unavailable';return /Z$|[+-]\d\d:\d\d$/.test(value)?new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'short',timeStyle:'medium'}).format(new Date(value)):value.replace('T',' ');}
async function refresh(){
 if(button.disabled)return;
 button.disabled=true;card.classList.add('loading');card.setAttribute('aria-busy','true');status.textContent='Fetching weather…';Object.values(slots).forEach(el=>el.textContent='');
 try{
  const response=await fetch('/api/hello',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to retrieve the weather. Please try again.');
  const w=data.weather;slots.message.textContent=`${data.message} · ${format(w.temperature)} °C · ${w.location}`;
  slots.weather.textContent=[w.apparentTemperature==null?null:`Feels like: ${format(w.apparentTemperature)} °C`,`Humidity: ${format(w.humidity)}%`,`Wind: ${format(w.windSpeed)} km/h`,`Source: ${w.source}`,w.dataKind].filter(Boolean).join(' · ');
  slots.architecture.textContent=data.architecture;slots.timestamp.textContent=`Data: ${time(w.observedAt)} (Buenos Aires) · Requested: ${time(data.timestamp)}`;status.textContent='✓ Weather updated';
 }catch(error){status.textContent='Weather unavailable';slots.message.textContent='Unable to retrieve the weather. Please try again.';}
 finally{card.classList.remove('loading');card.setAttribute('aria-busy','false');button.disabled=false;}
}
button.addEventListener('click',refresh);refresh();
