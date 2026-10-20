// Preserve the presentation contract from the 0.0.8 frontend.
export function weatherPresentation(data) {
  const weather = data.weather;
  const observed = weather.observedAt.endsWith('Z')
    ? new Date(weather.observedAt).toLocaleString('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires', hourCycle: 'h23',
    })
    : weather.observedAt.replace('T', ' ');
  const queried = new Date(data.timestamp).toLocaleTimeString('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires', hourCycle: 'h23',
  });
  return {
    message: `${data.message} · ${weather.temperature} °C · ${weather.location}`,
    weather: `${weather.apparentTemperature === null ? '' : 'Feels like: ' + weather.apparentTemperature + ' °C · '}Humidity: ${weather.humidity}% · Wind: ${weather.windSpeed} km/h · Source: ${weather.source}${weather.dataKind ? ' · ' + weather.dataKind : ''}`,
    architecture: data.architecture,
    timestamp: `Data: ${observed} (Buenos Aires) · Requested: ${queried}`,
  };
}
