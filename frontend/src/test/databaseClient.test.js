import { afterEach, expect, it, vi } from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();});

it('uses only the application backend and encodes identifiers as query parameters',async()=>{
  vi.stubEnv('VITE_BACKEND_API_URL','https://backend.test');vi.stubEnv('VITE_WEATHER_API_URL','https://weather.test/api/weather');
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({rows:[]})});vi.stubGlobal('fetch',fetcher);
  const api=await import('../databaseClient.js');await api.loadTable('module a','Odd"Table',25);
  const [url,options]=fetcher.mock.calls[0];const parsed=new URL(url);
  expect(parsed.origin).toBe('https://backend.test');expect(parsed.searchParams.get('schema')).toBe('module a');
  expect(parsed.searchParams.get('table')).toBe('Odd"Table');expect(parsed.searchParams.get('offset')).toBe('25');
  expect(options).toEqual(expect.objectContaining({cache:'no-store',credentials:'omit'}));expect(options.method).toBeUndefined();
});
it('explains waking-up HTML and forwards controlled backend errors',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>{throw Error('HTML');}})
    .mockResolvedValueOnce({ok:false,json:async()=>({message:'Table unavailable'})}));
  const api=await import('../databaseClient.js');await expect(api.loadDatabase()).rejects.toThrow('waking up');
  await expect(api.loadTable('public','missing')).rejects.toThrow('Table unavailable');
});
