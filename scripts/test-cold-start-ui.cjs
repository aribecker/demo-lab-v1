const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('java-backend/src/main/resources/public/app.js','utf8');
async function scenario(statuses){
 const elements=new Map();let calls=0,busyRequests=0;
 const element=id=>{if(!elements.has(id))elements.set(id,{disabled:false,textContent:'',classList:{add(){},remove(){}},setAttribute(k,v){this[k]=v},addEventListener(){}});return elements.get(id)};
 const data={message:'Hello World · Version 0.0.8',weather:{temperature:18,location:'Buenos Aires',humidity:60,windSpeed:12,source:'Fixture'},architecture:'Browser → API',timestamp:'2026-10-07T14:00:00Z'};
 const context={document:{querySelector:element},Intl,Date,AbortController,
 setTimeout:(callback,ms)=>{if(ms===3000)queueMicrotask(callback);return 1},clearTimeout(){},
 fetch:async(url)=>{if(url==='/api/diagnostics')return {status:204,ok:true};calls++;assert.equal(element('#call').disabled,true);assert.equal(element('#weather-card')['aria-busy'],'true');busyRequests++;let status=statuses.shift();if(status==='network')throw Error('Network');return {status,ok:status===200,json:async()=>data}}};
 vm.runInNewContext(source,context);
 for(let i=0;i<20;i++)await new Promise(setImmediate);
 assert.equal(element('#call').disabled,false);assert.equal(element('#weather-card')['aria-busy'],'false');return {calls,busyRequests,status:element('#status').textContent};
}
(async()=>{
 assert.deepEqual(await scenario([502,503,200]),{calls:3,busyRequests:3,status:'✓ Weather updated'});
 assert.equal((await scenario(['network',200])).calls,2);
 assert.equal((await scenario([400])).calls,1);
 assert.deepEqual(await scenario([504,504,504]),{calls:3,busyRequests:3,status:'Weather unavailable'});
 console.log('PASS: transient retry recovery, network retry, permanent error, bounded attempts, loading state');
})().catch(e=>{console.error(e);process.exitCode=1});
