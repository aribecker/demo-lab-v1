import { afterEach, expect, it, vi } from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();});
it('uses the unified backend without browser credentials or source environment fallback',async()=>{
  vi.stubEnv('VITE_BACKEND_API_URL','https://ariel-demo-next-api.onrender.com');
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({configured:false,models:[]})});vi.stubGlobal('fetch',fetcher);
  const client=await import('../chatClient.js');await client.loadModels();
  expect(fetcher.mock.calls[0][0]).toBe('https://ariel-demo-next-api.onrender.com/api/chat/models');
  expect(fetcher.mock.calls[0][1]).toEqual(expect.objectContaining({credentials:'omit',cache:'no-store'}));
});
it('explains HTML startup responses instead of treating them as a model reply',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>{throw Error('HTML');}}));
  const client=await import('../chatClient.js');await expect(client.loadModels()).rejects.toThrow('iniciándose');
});
