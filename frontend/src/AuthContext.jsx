import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import * as authApi from './authClient.js';
import {readPermissions} from './accessClient.js';
const defaultApi={...authApi,permissions:readPermissions};

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ api=defaultApi, children }) {
  const [session,setSession]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
  const [permissions,setPermissions]=useState(null);
  const generation=useRef(0);
  const refresh=useCallback(async (initial=false,background=false)=>{
    const current=++generation.current;if(!background)setBusy(true);setError('');
    try {
      let result;
      try{result=await (initial?api.initialize():(api.profile??api.initialize)());}
      catch(failure){if(api.permissions&&failure.status===401)result=null;else throw failure;}
      const caps=api.permissions?await api.permissions():null;
      if(current===generation.current){setSession(result);setPermissions(caps);}
    } catch(failure) { if(current===generation.current){setSession(null);setPermissions(null);setError(failure.message||'Could not verify your session.');} }
    finally {if(current===generation.current)setBusy(false);}
  },[api]);
  useEffect(()=>{refresh(true);return()=>{generation.current++;};},[refresh]);
  useEffect(()=>{
    const focus=()=>refresh(false,true);
    const denied=()=>{setSession(null);setPermissions(null);refresh();};
    const storage=event=>{if(event.key==='demo.auth.token'||event.key===null){setSession(null);setPermissions(null);refresh();}};
    window.addEventListener('storage',storage);window.addEventListener('focus',focus);window.addEventListener('demo:access-denied',denied);
    const timer=(session||api.permissions)?setInterval(focus,30000):null;
    return()=>{window.removeEventListener('storage',storage);window.removeEventListener('focus',focus);window.removeEventListener('demo:access-denied',denied);clearInterval(timer);};
  },[refresh,session]);
  useEffect(()=>{
    if(!session?.expiresAt)return;
    const expire=()=>{api.clearSession?.();generation.current++;setSession(null);setPermissions(null);setBusy(false);if(api.permissions)refresh();setError('Your session expired. Please sign in again.');};
    const delay=Date.parse(session.expiresAt)-Date.now();
    if(!Number.isFinite(delay)||delay<=0){expire();return;}
    const timer=setTimeout(expire,Math.min(delay,2147483647));return()=>clearTimeout(timer);
  },[session,api]);
  const logout=async()=>{await api.logout();generation.current++;setSession(null);setPermissions(null);setError('');if(api.permissions)await refresh();};
  return <AuthContext.Provider value={{api,session,busy,error,refresh,logout,canUseSimulator:!busy&&(permissions?.canUseSimulator??session?.canUseSimulator===true),canManageUsers:!busy&&permissions?.canManageUsers===true,canManageGroups:!busy&&permissions?.canManageGroups===true}}>{children}</AuthContext.Provider>;
}
// The provider also works in standalone component tests without a router.
export function AuthRouteCheck() {
  const {pathname}=useLocation();const {refresh}=useAuth();const previous=useRef(pathname);
  useEffect(()=>{if(previous.current!==pathname){previous.current=pathname;refresh();}},[pathname,refresh]);
  return null;
}
