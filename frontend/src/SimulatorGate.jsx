import React from 'react';
import { Link } from 'react-router';
import { useAuth } from './AuthContext.jsx';
export default function SimulatorGate({children,permission='canUseSimulator',title='Trading Simulator'}) {
  const auth=useAuth();
  if(auth.busy)return <section className="panel"><h1 className="page-intro__title" tabIndex={-1}>{title}</h1><p role="status">Checking your access…</p></section>;
  const user=auth.session?.profile;
  if(auth[permission])return <>{user&&<p className="text">Hello, {user?.name||'there'}.</p>}{children}</>;
  return <section className="panel auth__panel">
    <span className="auth__login-icon" role="img" aria-label="Login">🔐</span>
    <h1 className="page-intro__title" tabIndex={-1}>{user?`Hello, ${user.name||'there'}.`:title}</h1>
    <p>{user?'Lamentamos, usted no tiene acceso a esta sección.':'Please sign in to use this feature.'}</p>
    {auth.error&&<p role="alert">{auth.error}</p>}
    <Link className="button" to="/login">{user?'Manage login':'Login'}</Link>
    {auth.error&&<button className="button" onClick={()=>auth.refresh()}>Retry access check</button>}
  </section>;
}
