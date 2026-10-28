import React from 'react';
import {act,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {expect,it,vi} from 'vitest';
import App from '../App.jsx';
import {sharedSnapshot} from './sharedFixture.js';
const owner={profile:{name:'Ariel Becker',email:'aribecker2@gmail.com'},canUseSimulator:true,expiresAt:new Date(Date.now()+600000).toISOString()};
const caps=(simulator=true,users=false,groups=false)=>({canUseSimulator:simulator,canManageUsers:users,canManageGroups:groups});
function auth(session,permissions){return {initialize:vi.fn().mockResolvedValue(session),profile:vi.fn().mockResolvedValue(session),permissions:vi.fn().mockResolvedValue(permissions),logout:vi.fn()};}
function open(path,authApi,accessApi,simulationApi={read:vi.fn().mockResolvedValue(sharedSnapshot()),command:vi.fn()}){
 render(<MemoryRouter initialEntries={[path]}><App authApi={authApi} accessApi={accessApi} simulationApi={simulationApi}/></MemoryRouter>);return simulationApi;
}
it('Everyone can enter the simulator anonymously without gaining users or groups administration',async()=>{
 const api=auth(null,caps());open('/trading-simulator',api);
 expect(await screen.findByTestId('usdt-balance')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Menu',exact:true}));fireEvent.click(screen.getByRole('link',{name:'Users',exact:true}));
 expect(await screen.findByText('Please sign in to use this feature.')).toBeInTheDocument();
});
it('groups and users have independent route permissions and denied pages do not fetch records',async()=>{
 const accessApi={listRecords:vi.fn()};open('/groups',auth(owner,caps(true,true,false)),accessApi);
 expect(await screen.findByText('Lamentamos, usted no tiene acceso a esta sección.')).toBeInTheDocument();
 expect(accessApi.listRecords).not.toHaveBeenCalled();
});
it('a named user administrator can create edit and delete a user',async()=>{
 const records=[{id:1,firstName:'Ariel',lastName:'Becker',email:'aribecker2@gmail.com',principalKind:'USER',systemKey:'owner'}];
 const api={listRecords:vi.fn(async()=>[...records]),saveRecord:vi.fn(async(_kind,id,value)=>{if(id)Object.assign(records.find(x=>x.id===id),value);else records.push({id:3,...value,principalKind:'USER'});}),deleteRecord:vi.fn(async(_kind,id)=>records.splice(records.findIndex(x=>x.id===id),1))};
 open('/users',auth(owner,caps(true,true,false)),api);
 await screen.findByText('Ariel Becker');
 fireEvent.change(screen.getByLabelText('First name'),{target:{value:'Jane'}});fireEvent.change(screen.getByLabelText('Last name'),{target:{value:'Doe'}});fireEvent.change(screen.getByLabelText('Email'),{target:{value:'jane@example.test'}});fireEvent.click(screen.getByRole('button',{name:'Save user'}));
 await screen.findByText('Jane Doe');expect(api.saveRecord).toHaveBeenCalledWith('users',null,{firstName:'Jane',lastName:'Doe',email:'jane@example.test'},expect.any(AbortSignal));
 fireEvent.click(screen.getByRole('button',{name:'Edit Jane Doe'}));fireEvent.change(screen.getByLabelText('First name'),{target:{value:'Janet'}});fireEvent.click(screen.getByRole('button',{name:'Save user'}));await screen.findByText('Janet Doe');
 fireEvent.click(screen.getByRole('button',{name:'Delete Janet Doe'}));await waitFor(()=>expect(screen.queryByText('Janet Doe')).not.toBeInTheDocument());
 expect(api.deleteRecord).toHaveBeenCalledWith('users',3,expect.any(AbortSignal));
});
it('group administrators can explicitly assign Everyone to a permission group',async()=>{
 const groups=[{id:1,name:'Trading Simulator',permissions:['SIMULATOR']}];
 const api={listRecords:vi.fn(async()=>groups),readMembers:vi.fn(async()=>({users:[{id:2,firstName:'Everyone',lastName:'',email:null}],memberIds:[]})),saveMembers:vi.fn(async(_id,userIds)=>({users:[{id:2,firstName:'Everyone',lastName:''}],memberIds:userIds}))};
 open('/groups',auth(owner,caps(true,false,true)),api);await screen.findByRole('button',{name:'Members of Trading Simulator'});
 fireEvent.click(screen.getByRole('button',{name:'Members of Trading Simulator'}));const everyone=await screen.findByLabelText('Everyone');fireEvent.click(everyone);fireEvent.click(screen.getByRole('button',{name:'Save membership'}));
 await waitFor(()=>expect(api.saveMembers).toHaveBeenCalledWith(1,[2],expect.any(AbortSignal)));
});
it('permission revocation on focus unmounts the simulator without issuing a command',async()=>{
 const api=auth(owner,caps()),simulation=open('/trading-simulator',api);await screen.findByTestId('usdt-balance');
 api.permissions.mockResolvedValue(caps(false,false,false));act(()=>window.dispatchEvent(new Event('focus')));
 expect(await screen.findByText('Lamentamos, usted no tiene acceso a esta sección.')).toBeInTheDocument();expect(screen.queryByTestId('usdt-balance')).not.toBeInTheDocument();expect(simulation.command).not.toHaveBeenCalled();
});
it('an expired identity can fall back to an explicitly public Everyone permission',async()=>{
 const api=auth(null,caps());api.initialize.mockRejectedValue(Object.assign(new Error('Expired'),{status:401}));
 const simulation=open('/trading-simulator',api);expect(await screen.findByTestId('usdt-balance')).toBeInTheDocument();expect(simulation.command).not.toHaveBeenCalled();
});

it('isolates users and groups forms and membership state during repeated menu navigation',async()=>{
 const users=[{id:1,firstName:'Ariel',lastName:'Becker',email:'aribecker2@gmail.com',principalKind:'USER',systemKey:'owner'}];
 const groups=[{id:4,name:'Review groups',permissions:['GROUPS']}];
 const api={listRecords:vi.fn(async kind=>kind==='users'?users:groups),readMembers:vi.fn(async()=>({users,memberIds:[1]}))};
 open('/users',auth(null,caps(true,true,true)),api);
 await screen.findByText('Ariel Becker');
 fireEvent.click(screen.getByRole('button',{name:'Edit Ariel Becker'}));
 fireEvent.change(screen.getByLabelText('First name'),{target:{value:'Unsaved user'}});
 const navigate=label=>{fireEvent.click(screen.getByRole('button',{name:'Menu',exact:true}));fireEvent.click(screen.getByRole('link',{name:label,exact:true}));};
 navigate('Groups');
 await screen.findByRole('button',{name:'Members of Review groups'});
 expect(screen.getByLabelText('Group name')).toHaveValue('');
 expect(screen.getByRole('checkbox',{name:'Groups administration'})).not.toBeChecked();
 expect(screen.queryByText('Ariel Becker')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Edit Review groups'}));
 fireEvent.change(screen.getByLabelText('Group name'),{target:{value:'Unsaved group'}});
 fireEvent.click(screen.getByRole('button',{name:'Members of Review groups'}));
 await screen.findByRole('region',{name:'Group membership'});
 navigate('Users');
 await screen.findByText('Ariel Becker');
 expect(screen.getByLabelText('First name')).toHaveValue('');
 expect(screen.queryByRole('region',{name:'Group membership'})).not.toBeInTheDocument();
 expect(screen.queryByLabelText('Group name')).not.toBeInTheDocument();
 navigate('Groups');
 await screen.findByRole('button',{name:'Members of Review groups'});
 expect(screen.getByLabelText('Group name')).toHaveValue('');
 expect(screen.queryByRole('region',{name:'Group membership'})).not.toBeInTheDocument();
});
it('ignores an old users response after navigating to groups while loading',async()=>{
 let finishUsers;let usersSignal;
 const api={listRecords:vi.fn((kind,signal)=>kind==='users'?(usersSignal=signal,new Promise(resolve=>{finishUsers=resolve;})):Promise.resolve([{id:5,name:'Destination group',permissions:['USERS']}]))};
 open('/users',auth(null,caps(true,true,true)),api);
 await screen.findByText('Loading users…');
 fireEvent.click(screen.getByRole('button',{name:'Menu',exact:true}));fireEvent.click(screen.getByRole('link',{name:'Groups',exact:true}));
 await screen.findByRole('button',{name:'Edit Destination group'});
 expect(usersSignal.aborted).toBe(true);
 await act(async()=>finishUsers([{id:1,firstName:'Stale',lastName:'Person',email:'stale@example.test',principalKind:'USER'}]));
 expect(screen.getByRole('button',{name:'Edit Destination group'})).toBeInTheDocument();
 expect(screen.queryByText('Stale Person')).not.toBeInTheDocument();
});

it('keeps long group names in the record and gives short actions their full accessible context',async()=>{
 const name='Administración de usuarios y grupos con un nombre largo para revisión móvil';
 const api={listRecords:vi.fn(async()=>[{id:7,name,permissions:['USERS','GROUPS']}])};
 open('/groups',auth(null,caps(true,true,true)),api);
 await screen.findByText(name,{exact:true});
 const actions=screen.getByRole('group',{name:`Actions for ${name}`});
 for(const [label,visible] of [[`Edit ${name}`,'Edit'],[`Delete ${name}`,'Delete'],[`Members of ${name}`,'Members']])expect(within(actions).getByRole('button',{name:label,exact:true})).toHaveTextContent(new RegExp(`^${visible}$`));
 expect(api.listRecords).toHaveBeenCalledWith('groups',expect.any(AbortSignal));
});
