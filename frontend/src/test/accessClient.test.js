import {afterEach,expect,it,vi} from 'vitest';
import {readPermissions,saveRecord,deleteRecord} from '../accessClient.js';
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
it('requires all capability booleans instead of trusting malformed authorization responses',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({canUseSimulator:true})}));
 await expect(readPermissions()).rejects.toThrow('Access could not be verified');
});
it('CRUD uses bearer authorization and the correct write verbs without cookies',async()=>{
 localStorage.setItem('demo.auth.token','opaque');const json=vi.fn(async()=>({id:3}));const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json}).mockResolvedValueOnce({ok:true,status:204,json});vi.stubGlobal('fetch',fetcher);
 await saveRecord('users',3,{firstName:'A',lastName:'B',email:'a@b.test'});await deleteRecord('users',3);
 expect(fetcher.mock.calls[0][1]).toMatchObject({method:'PUT',credentials:'omit',headers:{Authorization:'Bearer opaque'}});
 expect(fetcher.mock.calls[1][1]).toMatchObject({method:'DELETE',credentials:'omit'});expect(json).toHaveBeenCalledTimes(1);
});
