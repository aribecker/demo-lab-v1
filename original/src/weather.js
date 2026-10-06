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
module.exports = {getWeather};
