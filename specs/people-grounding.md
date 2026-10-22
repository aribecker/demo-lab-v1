# People grounding — after specification, before generation

Specification commit: R23–R26 in `specs/people.md` on the experimental branch.

Observed repository:
- `frontend/src/App.jsx` centralizes destinations and React Router routes. Add `/people` there, preserving route focus and the hamburger menu behavior.
- `Home.jsx` has independent feature cards; add one fifth card using existing classes.
- `chatClient.js` demonstrates fetch/AbortSignal and explicit API origin. People needs its own client pointing at the new service; keep chatbot/weather endpoints intact.
- `frontend/src/test` uses Vitest + Testing Library; keep those conventions.
- `Chat-Dockerfile` embeds Vite assets into the weather/chat Spring Boot service. Add `/people` to its SPA forwarding controller so refresh works; do not add database dependencies to that service.
- `weather-service` is Java 17 / Boot 3.5.16. Use matching versions for a new independent `people-service`, Spring JDBC + Hikari, validation, PostgreSQL driver and Flyway. SQL migrations, not JPA-generated tables, own the schema.
- Existing `.dockerignore` allows only weather sources. A dedicated People Dockerfile-specific ignore must allow people sources.

Observed infrastructure:
- Experiment branch head before this increment: `1621c22189cf828fef78653eaba7d214698e4eca`.
- Experimental UI/chat web service: `srv-dbcni429lscs73egi2n0`, Oregon, workspace `tea-db1drlhsrm7s73b7qmhg`, free, autodeploy.
- Frontend origin: `https://ariel-sdd-chatbot-test.onrender.com`.
- No PostgreSQL instances found. Provision a free managed PostgreSQL in Oregon and use its internal connection from the new API.
- Free Render PostgreSQL expires after 30 days; no paid upgrade authorized. No credentials go into repository/source/output.

Implementation decisions:
Use parameterized JdbcTemplate queries; a unique UUID request key handles uncertain POST retries. Query `limit + 1` rows to determine the next ID cursor. GET is read-only. Hikari maximum three connections. Production PostgreSQL uses environment host/port/database/user/password; tests use a real disposable PostgreSQL database and invoke the same Flyway migration. Tests do not substitute H2.

Public demo UX states that sample names are shared. New service readiness depends on DB connectivity, leaving the other features independent.
