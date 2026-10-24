import { BACKEND_API_URL } from './backendConfig.js';
export const AUTH_API_URL = (import.meta.env.VITE_AUTH_API_URL || BACKEND_API_URL).replace(/\/$/, '');
const API = AUTH_API_URL;
const TOKEN = "demo.auth.token",
  VERIFIER = "demo.auth.verifier";
let boot;
async function request(path, { token, body } = {}) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch(`${API}/auth/${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    if (!r.ok) {
      const e = new Error(
        r.status === 401
          ? "Your session expired. Please sign in again."
          : "Sign-in could not be completed. Please try again.",
      );
      e.status = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  } finally {
    clearTimeout(timer);
  }
}
const encode = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
export async function startLogin(provider) {
  if (!["google", "github", "microsoft"].includes(provider))
    throw new Error("Unknown provider");
  const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  sessionStorage.setItem(VERIFIER, verifier);
  window.location.assign(
    `${API}/auth/start/${provider}?challenge=${encode(new Uint8Array(hash))}`,
  );
}
export async function profile() {
  const token = sessionStorage.getItem(TOKEN);
  if (!token) return null;
  try {
    return await request("me", { token });
  } catch (e) {
    if (e.status === 401) sessionStorage.removeItem(TOKEN);
    throw e;
  }
}
async function restore() {
  const fragment = new URLSearchParams(window.location.hash.slice(1)),
    ticket = fragment.get("ticket"),
    failed = fragment.has("auth_error");
  if (ticket || failed)
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  if (failed) {
    sessionStorage.removeItem(VERIFIER);
    throw new Error(
      "Sign-in was cancelled or could not be completed. Please try again.",
    );
  }
  if (ticket) {
    const verifier = sessionStorage.getItem(VERIFIER);
    sessionStorage.removeItem(VERIFIER);
    if (!verifier)
      throw new Error(
        "This login has expired. Please start again in this tab.",
      );
    const result = await request("exchange", { body: { ticket, verifier } });
    sessionStorage.setItem(TOKEN, result.token);
    return result;
  }
  return profile();
}
export function initialize() {
  if (!boot) boot = restore();
  const result = boot;
  result
    .finally(() => {
      if (boot === result) boot = null;
    })
    .catch(() => {});
  return result;
}
export const providers = () => request("providers");
export async function logout() {
  const token = sessionStorage.getItem(TOKEN);
  if (token) await request("logout", { token, body: {} });
  sessionStorage.removeItem(TOKEN);
}
