# Demo Lab deployment record — 2026-10-27

Workspace: tea-db1drlhsrm7s73b7qmhg, explicitly authorized by user.

| Resource | ID | URL |
| --- | --- | --- |
| Frontend demo-lab | srv-dbge9jt9el5s738tcjr0 | https://demo-lab-jeov.onrender.com |
| Backend demo-lab-api | srv-dbge9g0u01pc73fl3f7g | https://demo-lab-api.onrender.com |

Repository: aribecker/demo-lab, main, automatic deploys enabled. Initial application source commit eb0cc74780de39618236851e830077d06e3b605b. Initial frontend deploy dep-dbge9kd9el5s738tckng. Backend deploy after correcting assigned frontend origin dep-dbge9p636a0s73bnpur0.

## Activation pending

The Render connector can create services and set environment variables, but cannot read secret values from the previous API. Database metadata does not expose connection credentials. No secret was copied or invented.

Owner action in Render: copy SIMULATION_DATABASE_URL from ariel-demo-integrated-api Environment to demo-lab-api Environment; copy enabled OAuth client IDs/secrets and OPENROUTER_API_KEY as applicable. Keep copies inside Render. Configure OAuth provider callback for the new backend before testing login. Save and deploy, then verify persistent storage, login, authorized simulator access and chatbot independently.

The original services, existing database, balances, control state and simulated trades were not reset or modified by this deployment. Both backends use row locks and the stored nextPollAt when sharing existing simulation storage. No new paid resource was requested.

## Verification

- Initial frontend deploy live; HTTP 200 for /, /trading-simulator/ and /login/.
- Frontend generated JavaScript contains the new backend origin and excludes the previous integrated API origin.
- Initial backend deploy dep-dbge9gou01pc73fl3ftg reached live. Docker build ran 103 tests with zero failures, errors or skips.
- Backend deploy dep-dbge9p636a0s73bnpur0 reached live. /health returned HTTP 200 with status UP and Access-Control-Allow-Origin matching https://demo-lab-jeov.onrender.com.
- /auth/providers returned HTTP 200 with all providers disabled, as expected without credentials. /api/people/health returned HTTP 503 confirming pending PostgreSQL configuration.
- The independent existing weather service did not respond within the initial verification timeout; weather availability and its CORS permission for the new frontend remain unverified.
- No deployed database was accessed by build tests; Docker provisions a disposable PostgreSQL cluster.


## PostgreSQL activation — 2026-10-27

Owner supplied the existing internal connection through the conversation. Its value was saved only to the Render backend environment; it is omitted from this repository.

Deploy dep-dbgei1ss728c738unhb0 reached live but /api/people/health still returned 503. Owner confirmed the environment entry existed. An explicit Spring property mapping via SPRING_APPLICATION_JSON was then applied without repeating the credential. Deploy dep-dbgena3l550s738rflf0 reached live. Runtime Flyway logs confirmed a connection to the existing PostgreSQL 17.11 database. This activation supersedes the earlier database-pending statements; OAuth and optional chatbot provider configuration remain separate pending work.

Verification after activation: /health returned 200/UP; /api/people/health returned 200 with PostgreSQL UP; /api/database returned 200 and the existing bitcoin_shared and public schemas. No reset or simulated trade command was sent.
