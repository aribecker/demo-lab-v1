import React, { useEffect, useState } from "react";
import * as defaultApi from "./authClient.js";
const labels = { google: "Google", github: "GitHub", microsoft: "Microsoft" };
export default function Login({ api = defaultApi }) {
  const [choices, setChoices] = useState(null),
    [session, setSession] = useState(null),
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
        if (active) setChoices(p);
      })
      .catch(() => {
        if (active)
          setProviderError(
            "Could not load sign-in options. The server may be waking up.",
          );
      });
    api
      .initialize()
      .then((s) => {
        if (active) setSession(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    if (!session?.expiresAt) return;
    const expire = () => {
      setSession(null);
      setError("Your session expired. Please sign in again.");
    };
    const delay = Date.parse(session.expiresAt) - Date.now();
    if (delay <= 0) {
      expire();
      return;
    }
    const timer = setTimeout(expire, Math.min(delay, 2147483647));
    return () => clearTimeout(timer);
  }, [session]);
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
      await api.logout();
      setSession(null);
    } catch {
      setError(
        "Sign-out could not be confirmed. Your session is still shown; please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const user = session?.profile;
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
            ? "Here is the profile you shared with this demo."
            : "Try Google, GitHub or Microsoft sign-in in the same application as the trading simulator."}
        </p>
      </section>
      <aside className="notice">
        <strong>Optional login demo.</strong> The trading simulator is public
        and shared. Signing in or out does not reset balances, change its
        controls or create a private simulation.
        <p>
          <a className="text__link" href="/bitcoin">
            Open trading simulator →
          </a>
        </p>
      </aside>
      {error && (
        <p className="notice notice--warning" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">{user ? "Signing out…" : "Connecting…"}</p>}
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
          <button className="button auth__button" disabled={busy} onClick={signOut}>
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
                    disabled={busy || !enabled}
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
              The shared trading simulator is available while setup is pending.
            </p>
          )}
          <p className="auth__note">
            Only the profile details you authorize are shown. Your password
            stays with your platform.
          </p>
        </section>
      )}
    </>
  );
}
