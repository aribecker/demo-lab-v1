import {it,expect,vi,afterEach} from 'vitest';
import {request} from './api.js';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
it('usa la sesión de tesorería sin enviar cookies',async()=>{
 localStorage.setItem('treasury.auth.token','old-session');
 const fetch=vi.fn().mockResolvedValue(new Response('[]',{status:200}));vi.stubGlobal('fetch',fetch);
 expect(await request('/api/treasury/institutions')).toEqual([]);
 const config=fetch.mock.calls[0][1];expect(config.credentials).toBe('omit');expect(config.headers.Authorization).toBe('Bearer old-session');
});

it('elimina una sesión vencida y notifica al control de acceso',async()=>{
 localStorage.setItem('treasury.auth.token','expired');
 const listener=vi.fn();window.addEventListener('treasury:session-expired',listener);
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{"message":"Iniciá sesión"}',{status:401})));
 await expect(request('/api/treasury/institutions')).rejects.toThrow('Iniciá sesión');
 expect(localStorage.getItem('treasury.auth.token')).toBeNull();expect(listener).toHaveBeenCalledOnce();
 window.removeEventListener('treasury:session-expired',listener);
});
it('conserva la sesión ante falta de permisos y no fabrica identidad',async()=>{
 localStorage.setItem('treasury.auth.token','valid');
 const fetch=vi.fn().mockResolvedValue(new Response('{"message":"Sin permiso"}',{status:403}));vi.stubGlobal('fetch',fetch);
 await expect(request('/api/treasury/institutions/other/members',{body:{first_name:'Ana'}})).rejects.toThrow('Sin permiso');
 expect(localStorage.getItem('treasury.auth.token')).toBe('valid');
 expect(fetch.mock.calls[0][1].headers).toEqual({'Authorization':'Bearer valid','Content-Type':'application/json'});
});
