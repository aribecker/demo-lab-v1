import React from 'react';
import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {afterEach,expect,it,vi} from 'vitest';
import App from '../App.jsx';
import {sharedSnapshot} from './sharedFixture.js';
import {sendSimulationCommand,readSimulation} from '../simulationClient.js';
import {readMarket} from '../marketClient.js';
const owner={profile:{provider:'google',name:'Ariel Becker',email:'aribecker2@gmail.com'},canUseSimulator:true,expiresAt:new Date(Date.now()+1800000).toISOString()};
const client=session=>({initialize:vi.fn().mockResolvedValue(session),profile:vi.fn().mockResolvedValue(session),providers:vi.fn().mockResolvedValue([{id:'google',enabled:true}]),logout:vi.fn().mockResolvedValue(null)});
const backend=()=>({read:vi.fn().mockResolvedValue(sharedSnapshot()),command:vi.fn()});
function menu(){fireEvent.click(screen.getByRole('button',{name:'Menu',exact:true}));}
function open(session,path='/trading-simulator') {
 const authApi=client(session),simulationApi=backend(),marketApi=backend();
 render(<MemoryRouter initialEntries={[path]}><App authApi={authApi} simulationApi={simulationApi} marketApi={marketApi}/></MemoryRouter>);
 return {authApi,simulationApi,marketApi};
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();sessionStorage.clear();});
it('anonymous direct entry shows login icon and never mounts or reads simulator',async()=>{
 const b=open(null);expect(await screen.findByText('Please sign in to use this feature.')).toBeInTheDocument();
 expect(screen.getByRole('img',{name:'Login'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'Login',exact:true})).toHaveAttribute('href','/login');
 menu();expect(screen.getByRole('link',{name:'Bitcoin Tracker',exact:true})).toBeInTheDocument();expect(screen.queryByRole('link',{name:'Trading Simulator',exact:true})).not.toBeInTheDocument();
 expect(b.simulationApi.read).not.toHaveBeenCalled();expect(b.simulationApi.command).not.toHaveBeenCalled();
});
it('another signed-in user is greeted, denied and has no simulator menu',async()=>{
 const b=open({...owner,profile:{name:'Jane Example',email:'jane@example.test'},canUseSimulator:false});
 expect(await screen.findByRole('heading',{name:'Hello, Jane Example.'})).toBeInTheDocument();expect(screen.getByText('You are not authorized to use this feature.')).toBeInTheDocument();
 menu();expect(screen.queryByRole('link',{name:'Trading Simulator',exact:true})).not.toBeInTheDocument();expect(b.simulationApi.read).not.toHaveBeenCalled();
});
it('owner can open separate simulator and tracker routes without commands or duplicate panels',async()=>{
 const b=open(owner);expect(await screen.findByTestId('usdt-balance')).toBeInTheDocument();expect(screen.queryByRole('region',{name:'Bitcoin price tracker'})).not.toBeInTheDocument();
 menu();expect(screen.getByRole('link',{name:'Trading Simulator',exact:true})).toHaveAttribute('aria-current','page');fireEvent.click(screen.getByRole('link',{name:'Bitcoin Tracker',exact:true}));
 expect(await screen.findByRole('region',{name:'Bitcoin price tracker'})).toBeInTheDocument();expect(screen.queryByTestId('usdt-balance')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Pause tracking'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Start simulation'})).not.toBeInTheDocument();expect(b.simulationApi.command).not.toHaveBeenCalled();expect(b.marketApi.command).not.toHaveBeenCalled();
});
it('logging out removes owner navigation and direct access immediately',async()=>{
 const b=open(owner,'/login');await screen.findByText('aribecker2@gmail.com');menu();expect(screen.getByRole('link',{name:'Trading Simulator',exact:true})).toBeInTheDocument();menu();
 fireEvent.click(screen.getByRole('button',{name:'Sign out of demo'}));await waitFor(()=>expect(screen.queryByText('aribecker2@gmail.com')).not.toBeInTheDocument());
 // Subsequent revalidation must also return the revoked session as absent.
 b.authApi.profile.mockResolvedValue(null);menu();expect(screen.queryByRole('link',{name:'Trading Simulator',exact:true})).not.toBeInTheDocument();expect(b.simulationApi.command).not.toHaveBeenCalled();
});
it('expiry removes mounted private data and menu',async()=>{
 vi.useFakeTimers();open({...owner,expiresAt:new Date(Date.now()+1000).toISOString()});
 await act(async()=>{await Promise.resolve();});expect(screen.getByTestId('usdt-balance')).toBeInTheDocument();
 await act(()=>vi.advanceTimersByTimeAsync(1001));expect(screen.queryByTestId('usdt-balance')).not.toBeInTheDocument();expect(screen.getByText(/session expired/)).toBeInTheDocument();
 menu();expect(screen.queryByRole('link',{name:'Trading Simulator',exact:true})).not.toBeInTheDocument();
});
it('failed verification stays closed and allows retry',async()=>{
 const api=client(null);api.initialize.mockRejectedValue(new Error('Cannot verify session'));
 const b=backend();render(<MemoryRouter initialEntries={['/trading-simulator']}><App authApi={api} simulationApi={b}/></MemoryRouter>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Cannot verify session');expect(b.read).not.toHaveBeenCalled();
 api.profile.mockResolvedValue(owner);fireEvent.click(screen.getByRole('button',{name:'Retry access check'}));expect(await screen.findByTestId('usdt-balance')).toBeInTheDocument();
});
it('server denial clears mounted data and rechecks the session',async()=>{
 const b=open(owner);await screen.findByTestId('usdt-balance');b.authApi.profile.mockResolvedValue(null);
 act(()=>window.dispatchEvent(new Event('demo:access-denied')));expect(await screen.findByText('Please sign in to use this feature.')).toBeInTheDocument();expect(screen.queryByTestId('usdt-balance')).not.toBeInTheDocument();
});
it('simulator requests carry bearer tokens and public market does not',async()=>{
 sessionStorage.setItem('demo.auth.token','opaque-token');const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>sharedSnapshot()});vi.stubGlobal('fetch',fetcher);
 await readSimulation();await sendSimulationCommand({type:'running'});await readMarket();
 expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer opaque-token');expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer opaque-token');expect(fetcher.mock.calls[2][1].headers.Authorization).toBeUndefined();
});
