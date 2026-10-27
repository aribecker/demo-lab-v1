export const sample = {
  version: '2.0.0', city: 'Buenos Aires, Argentina', temperatureC: 21.4, feelsLikeC: 20.1,
  humidityPercent: 64, windKmh: 12.3, observedAt: '2026-10-20T12:00:00Z', requestedAt: '2026-10-20T12:10:00Z',
  timezone: 'America/Argentina/Buenos_Aires', provider: 'Open-Meteo', providerUrl: 'https://open-meteo.com/',
  dataType: 'current model data', requestId: '123e4567-e89b-12d3-a456-426614174000',
};

export function json(body = sample, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
