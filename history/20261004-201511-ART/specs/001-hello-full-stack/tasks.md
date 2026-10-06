# Tasks

- [x] Archive prior specifications with timestamp.
- [x] Define asynchronous weather contract and error handling.
- [x] Implement Node and Worker upstream calls.
- [x] Render weather and attribution in browser.
- [x] Validate tests and build.
- [x] Save updated sources to OneDrive and deploy existing private Site.

Fallback: on non-timeout Open-Meteo failure, await MET Norway Locationforecast with the same deadline. Return nearest forecast hour labelled as forecast, source and validity time. Missing apparent temperature and weather code are null; omit apparent temperature display. Convert m/s to km/h. Both providers failing returns 502; deadline is 504. Reference: https://api.met.no/doc/GettingStarted

## Version 002

- [x] Archive previous SDD documents with timestamp.
- [x] Specify visible version indicator and workspace-first process.
- [x] Add accessible “🔖 Versión 002” badge.
- [x] Validate build, Node API and Worker API.
- [x] Save source checkpoint in Git and deploy.
