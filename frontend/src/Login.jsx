import React, { useEffect, useState } from "react";
import * as defaultApi from "./authClient.js";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
const labels = { google: "Google", github: "GitHub", microsoft: "Microsoft" };
export default function Login({api=defaultApi}) {
  const existing=useAuth();
  return existing?<LoginContent/>:<AuthProvider api={api}><LoginContent/></AuthProvider>;
}
function LoginContent() {
  const auth=useAuth(),api=auth.api,session=auth.session;

  const [choices, setChoices] = useState(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [providerError, setProviderError] = useState(""),
    [retrying, setRetrying] = useState(false);
  async function loadProviders() {
    setRetrying(true);
    setProviderError("");
    try {
      setChoices(await api.providers());
    } catch {
      setProviderError(
        "Could not load sign-in options. The server may be waking up.",
      );
    } finally {
      setRetrying(false);
    }
  }
  useEffect(() => {
    let active = true;
    api
      .providers()
      .then((p) => {
        if (active) {setChoices(p);setBusy(false);}
      })
      .catch(() => {
        if (active) {setBusy(false);setProviderError(
            "Could not load sign-in options. The server may be waking up.",
          );}
      });
    return () => {
      active = false;
    };
  }, [api]);
  async function signIn(id) {
    setBusy(true);
    setError("");
    try {
      await api.startLogin(id);
    } catch {
      setError("Could not open sign-in. Please try again.");
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await auth.logout();
    } catch {
      setError(
        "Sign-out could not be confirmed. Your session is still shown; please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const user = session?.profile;
  const loading=busy||auth.busy;
  return (
    <>
      <section className="page-intro" aria-labelledby="page-heading">
        <p className="text__eyebrow">03 / IDENTITY · TRADING DEMO LAB</p>
        <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>
          {user ? (
            <>
              Hello, <span>{user.name || "there"}.</span>
            </>
          ) : (
            <>
              One profile.
              <br />
              <span>Three ways in.</span>
            </>
          )}
        </h1>
        <p className="page-intro__subtitle">
          {user
            ? "Here is the profile you shared. This browser remembers your login for up to 7 days."
            : "Try Google, GitHub or Microsoft sign-in in the same application as the trading simulator."}
        </p>
      </section>
      <aside className="notice">
        <strong>Account access.</strong> Bitcoin Tracker is public. Trading Simulator is reserved for the authorized Google account.
        Signing in or out preserves the saved simulation.
        {auth.canUseSimulator&&<p><a className="text__link" href="/trading-simulator">Open Trading Simulator →</a></p>}
        <p>
          <a className="text__link" href="/bitcoin">
            Open Bitcoin Tracker →
          </a>
        </p>
      </aside>
      {(error||auth.error) && (
        <p className="notice notice--warning" role="alert">
          {error||auth.error}
        </p>
      )}
      {loading && <p role="status">{user ? "Signing out…" : "Connecting…"}</p>}
      {user ? (
        <section className="panel auth__profile" aria-label="Your profile">
          <div className="auth__person">
            {user.picture?.startsWith("https://") && (
              <img
                className="auth__avatar"
                src={user.picture}
                referrerPolicy="no-referrer"
                alt=""
                onError={(e) => {
                  e.currentTarget.hidden = true;
                }}
              />
            )}
            <div>
              <p className="text__eyebrow">
                SIGNED IN WITH {labels[user.provider] || user.provider}
              </p>
              <h2>{user.name || "Name not shared"}</h2>
            </div>
          </div>
          <dl className="auth__details">
            <div>
              <dt>Email</dt>
              <dd>{user.email || "Not shared by this account"}</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>{labels[user.provider] || user.provider}</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>{user.accountId || "Not shared"}</dd>
            </div>
            {user.locale && (
              <div>
                <dt>Locale</dt>
                <dd>{user.locale}</dd>
              </div>
            )}
            {user.profileUrl?.startsWith("https://") && (
              <div>
                <dt>Public profile</dt>
                <dd>
                  <a href={user.profileUrl} target="_blank" rel="noreferrer">
                    View profile ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <button className="button auth__button" disabled={loading} onClick={signOut}>
            Sign out of demo
          </button>
          <p className="auth__note">
            This ends your demo session. Your{" "}
            {labels[user.provider] || "platform"} account stays signed in, and
            the shared simulator keeps its state.
          </p>
        </section>
      ) : (
        <section className="panel auth__panel" aria-label="Sign-in providers">
          <div className="auth__providers">
            {Object.entries(labels).map(([id, name]) => {
              const enabled =
                choices?.find((p) => p.id === id)?.enabled === true;
              return (
                <div className="auth__provider" key={id}>
                  <button
                    className="button auth__button"
                    disabled={loading || !enabled}
                    onClick={() => signIn(id)}
                  >
                    Continue with {name} <span aria-hidden="true">↗</span>
                  </button>
                  <span className="auth__provider-status">
                    {!choices
                      ? "Checking availability…"
                      : enabled
                        ? "Ready to connect"
                        : "OAuth setup required for this environment"}
                  </span>
                </div>
              );
            })}
          </div>
          {providerError && (
            <div role="status">
              <p>{providerError}</p>
              <button
                className="button auth__button"
                disabled={retrying}
                onClick={loadProviders}
              >
                Retry sign-in options
              </button>
            </div>
          )}
          {choices && !choices.some((p) => p.enabled) && (
            <p className="auth__note">
              Sign-in is pending provider configuration for this environment.
              Bitcoin Tracker remains available while setup is pending.
            </p>
          )}
          <p className="auth__note">
            This browser remembers your login for up to 7 days. Sign out to end this session. Only the profile details you authorize are shown. Your password
            stays with your platform.
          </p>
        </section>
      )}
    </>
  );
}
