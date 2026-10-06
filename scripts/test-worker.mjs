import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const realFetch=globalThis.fetch;
const fixture={timezone:'America/Argentina/Buenos_Aires',current:{time:'2026-10-04T19:30',temperature_2m:20,apparent_temperature:19,relative_humidity_2m:70,wind_speed_10m:12,weather_code:3}};
let calls=0;
try {
 globalThis.fetch=async (url,options)=>{calls++;assert.ok(url.includes('latitude=-34.6037'));assert.equal(options.cache,'no-store');return Response.json(fixture);};
 for(let i=0;i<2;i++){const r=await worker.fetch(new Request('https://example.test/api/hello'));assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');const d=await r.json();assert.equal(d.weather.temperature,20);assert.equal(d.weather.humidity,70);assert.ok(d.timestamp);}
 assert.equal(calls,2);
 for(const mock of [async()=>new Response('',{status:503}),async()=>Response.json({}),async()=>{throw new Error('network');},async()=>new Response('{')]){globalThis.fetch=mock;assert.equal((await worker.fetch(new Request('https://example.test/api/hello'))).status,502);}
 globalThis.fetch=async()=>{throw new DOMException('Timeout','AbortError');};assert.equal((await worker.fetch(new Request('https://example.test/api/hello'))).status,504);
 let fallbackCalls=0;
 globalThis.fetch=async()=>{fallbackCalls++;if(fallbackCalls===1)return new Response('',{status:429});return Response.json({properties:{timeseries:[{time:new Date().toISOString(),data:{instant:{details:{air_temperature:18,relative_humidity:60,wind_speed:2}}}}]}});};
 const fallback=await (await worker.fetch(new Request('https://example.test/api/hello'))).json();assert.equal(fallback.weather.source,'MET Norway');assert.equal(fallback.weather.windSpeed,7.2);assert.equal(fallback.weather.apparentTemperature,null);assert.equal(fallbackCalls,2);
 for(const path of ['/','/app.js','/styles.css'])assert.equal((await worker.fetch(new Request('https://example.test'+path))).status,200);
 assert.equal((await worker.fetch(new Request('https://example.test/missing'))).status,404);
} finally {globalThis.fetch=realFetch;}
console.log('Worker weather: fresh calls, output, failures, timeout and assets passed');
