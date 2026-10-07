# Cold-start verification

Date: 2026-10-07 UTC. Branch: test-java-fuentes. Implementation commit: a7c7d87f0316ab6fa12c6379fd56a5e6dee04e17.

## Diagnosis

A live GET /api/hello returned HTTP 502 after approximately 8.6 seconds. A subsequent weather /health request took approximately 62.5 seconds and returned 200. Render logs show the weather process had stopped after inactivity and restarted. Once awake, the main API returned valid weather JSON. This supports a cold-start failure rather than an invalid weather endpoint.

The implementation used a five-second connection timeout despite the specified 90-second downstream request budget. This mismatch was corrected. Canonical SDD lacked explicit connection-budget alignment and transient browser-retry behavior; both requirements are now stated, with a timestamped copy of the previous specification retained. Exact exception details from the original failing request were not logged, so the short connection deadline is a demonstrated defect and likely contributor rather than a captured exception diagnosis.

## Automated verification

- Original main Java integration suite: zero failures/errors/skips; package build succeeded.
- Original weather Java integration suite: zero failures/errors/skips.
- Original packaged two-process smoke test: passed, two fresh provider requests.
- All nine original test/support file hashes: unchanged.
- New UI regression: passed for 502/503 followed by recovery, network error recovery, permanent 400 without retry, repeated 504 stopping after three attempts, and disabled-button/aria-busy preservation.
- JavaScript syntax and git whitespace checks: passed.

Cold-start recovery is exercised deterministically through simulated transient failures. A fresh 15-minute inactivity cycle has not been used as an automated acceptance test.

## Deployment verification

Render deployment dep-db35qnh5efls73c1rhq0 reached live on implementation commit a7c7d87. The deployed JavaScript contains the retry implementation. Real GET /api/hello returned HTTP 200 with numeric weather data from MET Norway and the expected version and architecture. The browser initial load displayed weather successfully.

URL: https://ariel-sdd-test-java-app.onrender.com/
