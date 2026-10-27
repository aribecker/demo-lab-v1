import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
beforeEach(() => { vi.resetModules(); localStorage.clear(); sessionStorage.clear(); history.replaceState(null, '', '/login'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
describe('auth handoff client', () => {
  it('does not silently fall back to the original environment', async () => {
    vi.stubEnv('VITE_AUTH_API_URL','');vi.stubEnv('VITE_BACKEND_API_URL','');vi.stubEnv('VITE_WEATHER_API_URL','');
    const client=await import('../authClient.js');
    expect(client.AUTH_API_URL).not.toContain('ariel-weather-api-iteration-2');
    const fetcher=vi.fn().mockResolvedValue(reply([]));vi.stubGlobal('fetch',fetcher);
    await client.providers();expect(fetcher.mock.calls[0][0]).toBe('/auth/providers');
  });
  it('uses the explicitly configured target backend in production', async () => {
    vi.stubEnv('VITE_AUTH_API_URL','https://ariel-demo-next-api.onrender.com');
    const fetcher=vi.fn().mockResolvedValue(reply([]));vi.stubGlobal('fetch',fetcher);
    const client=await import('../authClient.js');await client.providers();
    expect(fetcher.mock.calls[0][0]).toBe('https://ariel-demo-next-api.onrender.com/auth/providers');
  });
  it('scrubs callback and exchanges once on duplicate initialization', async () => {
    sessionStorage.setItem('demo.auth.verifier', 'a'.repeat(43));
    history.replaceState(null, '', '/login#ticket=' + 't'.repeat(43));
    const fetcher = vi.fn().mockResolvedValue(reply({ token: 'demo-token', profile: { name: 'Ariel' } }));
    vi.stubGlobal('fetch', fetcher);
    const client = await import('../authClient.js');
    const one = client.initialize(), two = client.initialize();
    expect(location.hash).toBe('');
    await Promise.all([one, two]);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ ticket: 't'.repeat(43), verifier: 'a'.repeat(43) });
    expect(localStorage.getItem('demo.auth.token')).toBe('demo-token');
    expect(sessionStorage.getItem('demo.auth.verifier')).toBeNull();
    expect(fetcher.mock.calls[0][1].credentials).toBe('omit');
  });
  it('rejects callback without original verifier and no network access', async () => {
    history.replaceState(null, '', '/login#ticket=ticket');
    vi.stubGlobal('fetch', vi.fn());
    const client = await import('../authClient.js');
    await expect(client.initialize()).rejects.toThrow('expired');
    expect(location.hash).toBe(''); expect(fetch).not.toHaveBeenCalled();
  });
  it('clears expired token but retains it when logout fails', async () => {
    localStorage.setItem('demo.auth.token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply({}, 401)).mockRejectedValueOnce(new Error('offline')));
    const client = await import('../authClient.js');
    await expect(client.profile()).rejects.toThrow('expired');
    expect(localStorage.getItem('demo.auth.token')).toBeNull();
    localStorage.setItem('demo.auth.token', 'token');
    await expect(client.logout()).rejects.toThrow('offline');
    expect(localStorage.getItem('demo.auth.token')).toBe('token');
  });
  it('handles cancellation without fetching or exposing details', async () => {
    history.replaceState(null, '', '/login#auth_error=failed'); vi.stubGlobal('fetch', vi.fn());
    const client = await import('../authClient.js');
    await expect(client.initialize()).rejects.toThrow('cancelled');
    expect(location.hash).toBe(''); expect(fetch).not.toHaveBeenCalled();
  });
});


it('restores the saved session after a fresh client lifecycle with empty sessionStorage',async()=>{
  localStorage.setItem('demo.auth.token','persistent-token');sessionStorage.clear();
  const saved={profile:{name:'Ariel Becker'},canUseSimulator:true,expiresAt:'2026-11-01T12:00:00Z'};
  const fetcher=vi.fn().mockResolvedValue(reply(saved));vi.stubGlobal('fetch',fetcher);
  const first=await import('../authClient.js');expect(await first.initialize()).toEqual(saved);
  vi.resetModules();sessionStorage.clear();const fresh=await import('../authClient.js');expect(await fresh.initialize()).toEqual(saved);
  expect(fetcher.mock.calls.every(call=>call[1].headers.Authorization==='Bearer persistent-token')).toBe(true);
  expect(localStorage.getItem('demo.auth.token')).toBe('persistent-token');
});
it('confirmed logout removes persistent token and failed restore preserves it for retry',async()=>{
  localStorage.setItem('demo.auth.token','persistent-token');
  const fetcher=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply(null,204));vi.stubGlobal('fetch',fetcher);
  const client=await import('../authClient.js');await expect(client.profile()).rejects.toThrow('offline');expect(localStorage.getItem('demo.auth.token')).toBe('persistent-token');
  await client.logout();expect(localStorage.getItem('demo.auth.token')).toBeNull();
});
