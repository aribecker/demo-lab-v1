import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

it('routes only weather to the independent service while all application APIs use the backend', async () => {
  vi.stubEnv('VITE_WEATHER_API_URL', 'https://weather.test/api/weather');
  vi.stubEnv('VITE_BACKEND_API_URL', 'https://backend.test');
  vi.stubEnv('VITE_AUTH_API_URL', '');
  vi.stubEnv('VITE_SIMULATION_API_URL', '');
  vi.resetModules();
  const snapshot={schemaVersion:1,revision:1,controlRevision:1,running:true,samples:[],settings:{},
    simulation:{phase:'holding_usdt',usdt:10000,btc:0,feesEquivalent:0,capital:10000,feePercent:0.1}};
  const fetcher=vi.fn(async url=>({ok:true,status:200,json:async()=>url.endsWith('/api/simulation')?snapshot:[]}));
  vi.stubGlobal('fetch',fetcher);
  const weather=await import('../weatherClient.js');
  const people=await import('../peopleClient.js');
  const chat=await import('../chatClient.js');
  const auth=await import('../authClient.js');
  const simulation=await import('../simulationClient.js');
  expect(weather.WEATHER_URL).toBe('https://weather.test/api/weather');
  await people.listPeople();await chat.loadModels();await auth.providers();await simulation.readSimulation();
  expect(fetcher.mock.calls.map(call=>call[0])).toEqual([
    'https://backend.test/api/people','https://backend.test/api/chat/models',
    'https://backend.test/auth/providers','https://backend.test/api/simulation',
  ]);
});

it('does not use weather as an implicit backend when backend configuration is absent', async () => {
  vi.stubEnv('VITE_WEATHER_API_URL', 'https://weather.test/api/weather');
  vi.stubEnv('VITE_BACKEND_API_URL', '');
  vi.stubEnv('VITE_AUTH_API_URL', '');
  vi.stubEnv('VITE_SIMULATION_API_URL', '');
  vi.resetModules();
  expect((await import('../authClient.js')).AUTH_API_URL).toBe('');
  expect((await import('../peopleClient.js')).PEOPLE_API_URL).toBe('');
  expect((await import('../chatClient.js')).CHAT_API_URL).toBe('');
  expect((await import('../simulationClient.js')).SIMULATION_URL).toBe('/api/simulation');
});
