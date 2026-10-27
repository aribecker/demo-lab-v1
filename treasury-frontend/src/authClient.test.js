import {it,expect,vi,afterEach} from 'vitest';
import {webcrypto} from 'node:crypto';
import {startLogin,initialize,logout} from './authClient.js';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();sessionStorage.clear();history.replaceState(null,'','/');});
it('inicia OAuth con PKCE y el callback de tesorería',async()=>{
 const assign=vi.fn();vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('window',{location:{assign}});
 await startLogin('google');
 const url=new URL(assign.mock.calls[0][0]);expect(url.pathname).toBe('/auth/start/google');
 expect(url.searchParams.get('app')).toBe('treasury');expect(url.searchParams.get('challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
 expect(sessionStorage.getItem('treasury.auth.verifier')).toMatch(/^[A-Za-z0-9_-]{43}$/);
});
it('intercambia el ticket una vez y elimina el fragmento de la URL',async()=>{
 sessionStorage.setItem('treasury.auth.verifier','verifier');history.replaceState(null,'','/login#ticket=one-use');
 const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({token:'session',profile:{name:'Ariel'}}),{status:200}));vi.stubGlobal('fetch',fetch);
 await initialize();
 expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ticket:'one-use',verifier:'verifier'});
 expect(location.hash).toBe('');expect(localStorage.getItem('treasury.auth.token')).toBe('session');expect(sessionStorage.getItem('treasury.auth.verifier')).toBeNull();
});
it('revoca la sesión en el servidor al salir',async()=>{
 localStorage.setItem('treasury.auth.token','session');const fetch=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal('fetch',fetch);
 await logout();expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer session');expect(localStorage.getItem('treasury.auth.token')).toBeNull();
});
