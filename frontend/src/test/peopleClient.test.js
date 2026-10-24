import { afterEach, expect, it, vi } from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();});
it('uses the unified backend and preserves the retry UUID in the POST body', async()=>{
  vi.stubEnv('VITE_WEATHER_API_URL','https://ariel-demo-next-api.onrender.com/api/weather');
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:1,name:'Ada',createdAt:'2026-10-24T00:00:00Z'})});vi.stubGlobal('fetch',fetcher);
  const client=await import('../peopleClient.js');await client.addPerson('Ada','same-retry-id');
  expect(fetcher.mock.calls[0][0]).toBe('https://ariel-demo-next-api.onrender.com/api/people');
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({name:'Ada',requestId:'same-retry-id'});
  expect(fetcher.mock.calls[0][1].credentials).toBe('omit');
});
