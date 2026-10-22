# People PostgreSQL Hello World

SDD order: `specs/people.md` → `specs/people-grounding.md` → implementation.
The English `/people` feature uses its own Spring Boot 3.5.16 / Java 17 microservice.
The experimental frontend/chat service is only the UI host; it does not own the database.

## Database lifecycle

1. Provision PostgreSQL and its login/database via Render, Compose or the optional
   administrator-only `people-service/db/bootstrap.sql`.
2. Configure the service's runtime environment (below).
3. Start with profile `database`. Spring Boot runs Flyway automatically.
4. Flyway applies `V1__create_people.sql` exactly once and records its checksum in
   `flyway_schema_history`. Create `V2__...sql` for future changes; never edit an
   already applied migration. `clean` is disabled. There is no Hibernate auto-DDL.

No credentials or sample records are seeded. Names are shared public demo data.
Equal names are allowed; a unique request UUID makes uncertain retries safe.

## Render

Workspace: Ariel's workspace. Region: Oregon.
Database: `ariel-sdd-people-db`, ID `dpg-dbcnsmivcj2c73f9iucg-a`, PostgreSQL 17.
Free database expires **2026-11-21**. It persists across service restarts/deploys,
but the free database is not indefinite storage. Export before expiration or
explicitly choose a paid/external database later; no upgrade is performed here.

Create `ariel-sdd-people-api` from branch `prueba-chatbot-spring-ai` using
`People-Dockerfile`, free plan. Configure Environment from the database's
**Connect → Internal** details (never copy credentials to the browser app):

| Variable | Value |
| --- | --- |
| PEOPLE_PROFILE | database |
| DB_HOST | Internal hostname from Render |
| DB_PORT | 5432 |
| DB_NAME | Database name from Render |
| DB_USER | Database user from Render |
| DB_PASSWORD | Database password from Render |
| ALLOWED_ORIGINS | https://ariel-sdd-chatbot-test.onrender.com |

Save and deploy. `/health` must report `database: PostgreSQL`. The default preview
profile is a provisioning state: `/api/people` responds 503 and explicitly says
that no records were saved. It never substitutes in-memory or fake persistence.
The hosted connector does not expose database connection credentials, so the
Dashboard connection step is necessary if no authenticated Dashboard is available.

Frontend defaults to `https://ariel-sdd-people-api.onrender.com`; a differently named
API requires build variable `VITE_PEOPLE_API_URL` and the matching explicit CORS origin.

## Local development

Set `PEOPLE_DB_PASSWORD` privately in your shell, then:

```sh
docker compose -f compose.people.yaml up --build -d
# The official Postgres image creates the login/database on first volume initialization.
cd frontend
VITE_PEOPLE_API_URL=http://localhost:8081 npm run dev
```

Compose stores data in the named `people-data` volume. Normal down/up preserves it;
`docker compose down -v` destroys it and is not part of routine reset instructions.
Changing POSTGRES_* values does not rewrite credentials in an existing volume.

For manual Java development, use profile `database` and the DB_* variables above.

## Tests

`People-Dockerfile` packages the app after running integration tests against a
disposable PostgreSQL 17 build-stage cluster. The cluster/data never enters the
runtime image. No H2 substitute. Alternatively, use a **disposable test database**:

```sh
PEOPLE_TEST_DB_URL=jdbc:postgresql://localhost:5432/people_test \
PEOPLE_TEST_DB_USER=people mvn -f people-service/pom.xml test
```

Set PEOPLE_TEST_DB_PASSWORD privately if needed. Integration tests truncate only
the supplied test database's people table; never point them at a real data database.
Tests cover migrations, actual insert/list, validation/constraints, SQL parameter
binding, cursor pagination, repeated requests and exact-origin CORS.

## Export

For local Compose, use a private filesystem destination:

```sh
docker compose -f compose.people.yaml exec -T db \
  pg_dump -U people -d people_demo --format=custom > people-backup.dump
```

For Render, use the external hostname with TLS and environment variables PGHOST,
PGPORT, PGDATABASE, PGUSER and PGPASSWORD; then run:

```sh
PGSSLMODE=require pg_dump --format=custom --file=people-backup.dump
```

Keep dumps private. Restore into a separately provisioned database with `pg_restore`;
verify migration history/data before moving the service connection. No automatic
backup, deletion, schema clean or destructive rollback is performed by this demo.
