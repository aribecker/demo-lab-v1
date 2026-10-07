# Cold-start recovery correction

The experiment reproduced HTTP 502 while the sleeping weather service needed approximately 62 seconds to become healthy. Generated code incorrectly restricted connection establishment to five seconds despite the canonical 90-second downstream budget. The specification also omitted browser recovery from transient proxy/startup responses.

Align the connection timeout with the configured request timeout. Retry UI requests only for network failures and HTTP 502/503/504, at most twice with three-second delays and a 195-second overall budget. Preserve the frozen tests, API version 0.0.8, loading slots and accessibility. Permanent errors must not be retried. Verify original Java suites, packaged smoke test, added deterministic UI retry regression and the live deployment.
