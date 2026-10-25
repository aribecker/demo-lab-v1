import React from 'react';
import { Link } from 'react-router';
import { useAuth } from './AuthContext.jsx';
export default function SimulatorGate({children}) {
  const auth=useAuth();
  if(auth.busy)return <section className="panel"><h1 className="page-intro__title" tabIndex={-1}>Trading Simulator</h1><p role="status">Checking your access…</p></section>;
  if(auth.canUseSimulator)return children;
  const user=auth.session?.profile;
  return <section className="panel auth__panel">
    <span className="auth__login-icon" role="img" aria-label="Login">🔐</span>
    <h1 className="page-intro__title" tabIndex={-1}>{user?`Hello, ${user.name||'there'}.`:'Trading Simulator'}</h1>
    <p>{user?'You are not authorized to use this feature.':'Please sign in to use this feature.'}</p>
    {auth.error&&<p role="alert">{auth.error}</p>}
    <Link className="button" to="/login">{user?'Manage login':'Login'}</Link>
    {auth.error&&<button className="button" onClick={()=>auth.refresh()}>Retry access check</button>}
  </section>;
}
