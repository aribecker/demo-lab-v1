import React from 'react';
import{fireEvent,render,screen,waitFor}from'@testing-library/react';
import{describe,it,expect,vi}from'vitest';
import Login from '../Login.jsx';
const choices=[{id:'google',enabled:true},{id:'github',enabled:false},{id:'microsoft',enabled:true}];
const user={profile:{provider:'google',name:'Ariel',email:'ariel@example.test',accountId:'123'},expiresAt:new Date(Date.now()+1800000).toISOString()};
const api=(s=null)=>({providers:vi.fn().mockResolvedValue(choices),initialize:vi.fn().mockResolvedValue(s),startLogin:vi.fn(),logout:vi.fn().mockResolvedValue(null)});
describe('login',()=>{
 it('explains unconfigured providers and keeps the market tracker available',async()=>{const client=api();client.providers.mockResolvedValue(choices.map(p=>({...p,enabled:false})));render(<Login api={client}/>);expect(await screen.findByText(/Sign-in is pending provider configuration/)).toBeInTheDocument();expect(screen.getByRole('link',{name:'Open Bitcoin Tracker →'})).toHaveAttribute('href','/bitcoin');expect(screen.getByRole('button',{name:/Continue with Google/})).toBeDisabled();expect(client.startLogin).not.toHaveBeenCalled();});
 it('offers three providers and only starts a configured provider',async()=>{const client=api();render(<Login api={client}/>);await waitFor(()=>expect(screen.getByRole('button',{name:/Continue with Google/})).toBeEnabled());expect(screen.getByRole('button',{name:/Continue with GitHub/})).toBeDisabled();expect(screen.getByRole('button',{name:/Continue with Microsoft/})).toBeEnabled();fireEvent.click(screen.getByRole('button',{name:/Continue with Google/}));expect(client.startLogin).toHaveBeenCalledWith('google');});
 it('greets the profile and clears it after signout',async()=>{const client=api(user);render(<Login api={client}/>);await screen.findByText('ariel@example.test');expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Hello, Ariel.');fireEvent.click(screen.getByRole('button',{name:'Sign out of demo'}));await waitFor(()=>expect(screen.queryByText('ariel@example.test')).not.toBeInTheDocument());});
 it('retains profile if logout fails',async()=>{const client=api(user);client.logout.mockRejectedValue(new Error());render(<Login api={client}/>);await screen.findByText('ariel@example.test');fireEvent.click(screen.getByRole('button',{name:'Sign out of demo'}));expect(await screen.findByRole('alert')).toHaveTextContent('could not be confirmed');expect(screen.getByText('ariel@example.test')).toBeInTheDocument();});
 it('handles missing shared data',async()=>{const client=api({profile:{provider:'github',accountId:'1'},expiresAt:user.expiresAt});render(<Login api={client}/>);expect(await screen.findByText('Not shared by this account')).toBeInTheDocument();expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Hello, there.');});
 it('retries failed availability requests',async()=>{const client=api();client.providers.mockRejectedValueOnce(new Error());render(<Login api={client}/>);fireEvent.click(await screen.findByRole('button',{name:'Retry sign-in options'}));await waitFor(()=>expect(screen.getByRole('button',{name:/Continue with Google/})).toBeEnabled());});
});

