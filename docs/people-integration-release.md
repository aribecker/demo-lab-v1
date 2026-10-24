# Unified People + Login + trading v2.7.0

The source People requirements were reconciled into master R36 before grounding and source generation. People now belongs to proximo-desarrollo-hello-world and ariel-demo-next, with its API inside ariel-demo-next-api. Original branch/service are preserved.

## Storage compatibility
The shared database connection parser is reused for simulation and People; no credential copy or new resource is needed. People uses its own maximum-three-connection Hikari pool, prepared JDBC statements, explicit transactions and programmatic Flyway migration. Exact original V1 SQL preserves public.people, identity IDs, request UUIDs, created_at and public.flyway_schema_history. Bitcoin state remains isolated in bitcoin_shared. Datasource/Flyway auto-configuration is disabled in favor of explicit lazy setup, so absent storage does not prevent Login/weather startup.

## Behavior
Menu/Home/direct /people route provides add-name/list/refresh/pagination with persistent records and safe same-UUID retries. Names are trimmed, nonblank and <=100 characters. Duplicate names are allowed. API returns 201 on create, 200 on replay, 409 on UUID/name conflict, 400 on validation, 503 on unavailable storage. /api/people/health checks the database. The list is public shared sample data, independent of optional login. Frontend uses the unified backend, not the old People service.

## Verification
Backend local suite passes with PostgreSQL-only integration cases skipped when no test database is supplied. Render Docker runs those cases against a separate disposable PostgreSQL17 database, testing migration/history reuse, restart persistence, safe SQL names, paging and replay/conflict. The test database is restricted to loopback and never production. Live smoke checks only compare existing lists and health; no synthetic production rows or simulation commands are issued.

No new service, database, paid plan or OAuth registration is introduced. Free hosting and database expiration limitations remain unchanged.
