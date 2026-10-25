import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import * as defaultApi from './authClient.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ api=defaultApi, children }) {
  const [session,setSession]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
  const generation=useRef(0);
  const refresh=useCallback(async (initial=false,background=false)=>{
    const current=++generation.current;if(!background)setBusy(true);setError('');
    try {
      const result=await (initial?api.initialize():(api.profile??api.initialize)());
      if(current===generation.current)setSession(result);
    } catch(failure) { if(current===generation.current){setSession(null);setError(failure.message||'Could not verify your session.');} }
    finally {if(current===generation.current)setBusy(false);}
  },[api]);
  useEffect(()=>{refresh(true);return()=>{generation.current++;};},[refresh]);
  useEffect(()=>{
    const focus=()=>refresh(false,true);
    const denied=()=>{setSession(null);refresh();};
    window.addEventListener('focus',focus);window.addEventListener('demo:access-denied',denied);
    const timer=session?setInterval(focus,30000):null;
    return()=>{window.removeEventListener('focus',focus);window.removeEventListener('demo:access-denied',denied);clearInterval(timer);};
  },[refresh,session]);
  useEffect(()=>{
    if(!session?.expiresAt)return;
    const expire=()=>{generation.current++;setSession(null);setBusy(false);setError('Your session expired. Please sign in again.');};
    const delay=Date.parse(session.expiresAt)-Date.now();
    if(!Number.isFinite(delay)||delay<=0){expire();return;}
    const timer=setTimeout(expire,Math.min(delay,2147483647));return()=>clearTimeout(timer);
  },[session]);
  const logout=async()=>{await api.logout();generation.current++;setSession(null);setError('');};
  return <AuthContext.Provider value={{api,session,busy,error,refresh,logout,canUseSimulator:!busy&&session?.canUseSimulator===true}}>{children}</AuthContext.Provider>;
}
// The provider also works in standalone component tests without a router.
export function AuthRouteCheck() {
  const {pathname}=useLocation();const {refresh}=useAuth();const previous=useRef(pathname);
  useEffect(()=>{if(previous.current!==pathname){previous.current=pathname;refresh();}},[pathname,refresh]);
  return null;
}
