# Implementation Plan

Use async fetch with AbortController and a 10-second deadline in Node.js and Cloudflare Worker. Fixed Buenos Aires coordinates; Open-Meteo current fields temperature_2m, apparent_temperature, relative_humidity_2m, wind_speed_10m, weather_code. Validate numeric fields and observation timestamp. Use no-store headers. Vanilla browser client renders weather and separates observation and query times. No API key or dependencies.

Reference: https://open-meteo.com/en/docs
Tests mock upstream for deterministic success, repeated requests, provider failure, malformed response and timeout. Verify live upstream after publication. Preserve private Site audience. Original specifications archived before replacement.

Fallback: on non-timeout Open-Meteo failure, await MET Norway Locationforecast with the same deadline. Return nearest forecast hour labelled as forecast, source and validity time. Missing apparent temperature and weather code are null; omit apparent temperature display. Convert m/s to km/h. Both providers failing returns 502; deadline is 504. Reference: https://api.met.no/doc/GettingStarted
