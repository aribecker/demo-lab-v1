import {it,expect,vi,afterEach} from 'vitest';
import {request} from './api.js';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
it('no usa tokens ni credenciales al acceder a tesorería',async()=>{
 localStorage.setItem('treasury.auth.token','old-session');
 const fetch=vi.fn().mockResolvedValue(new Response('[]',{status:200}));vi.stubGlobal('fetch',fetch);
 expect(await request('/api/treasury/institutions')).toEqual([]);
 const config=fetch.mock.calls[0][1];expect(config.credentials).toBe('omit');expect(config.headers).not.toHaveProperty('Authorization');
});
