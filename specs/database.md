# Database contract — R44

This versioned document is the source of truth for the application-owned relational schema. Change it before generating SQL/code. Migrations implement this contract; PostgreSQL integration tests verify types, constraints, indexes, preserved records and migration history. No Hibernate automatic DDL. Use the existing connected database and credentials, never a replacement database. Additional user-managed tables are outside application ownership.

## Existing structures — preserve unchanged

### bitcoin_shared.simulation_state
| Column | SQL type | Rules |
| --- | --- | --- |
| state_id | INTEGER | PRIMARY KEY; CHECK state_id = 1 |
| document | TEXT | NOT NULL; Jackson SharedState JSON snapshot |

Exactly one application state row, id1. JSON includes revisions, controls, running state, bounded samples, balances, strategy tracking and trades. JSON schemaVersion1 remains compatible. The legacy db/shared-simulation.sql creates this table idempotently; do not replace it, convert document to jsonb, add columns, erase records or move it into the new migration stream. State mutations retain SELECT FOR UPDATE serialization. Reset affects the document only.

### public.people
| Column | SQL type | Rules |
| --- | --- | --- |
| id | BIGINT | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL; people_name_not_blank: char_length(btrim(name)) BETWEEN 1 AND 100 |
| request_id | UUID | NOT NULL, UNIQUE; request idempotency |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Equal names allowed. PK and unique constraint create their backing indexes. No foreign keys. Existing Flyway location db/people-migration, V1__create_people.sql and public.flyway_schema_history remain unchanged.

### public.flyway_schema_history (existing Flyway-owned metadata)
installed_rank INTEGER PK NOT NULL; version VARCHAR(50) nullable; description VARCHAR(200) NOT NULL; type VARCHAR(20) NOT NULL; script VARCHAR(1000) NOT NULL; checksum INTEGER nullable; installed_by VARCHAR(100) NOT NULL; installed_on TIMESTAMP NOT NULL DEFAULT now(); execution_time INTEGER NOT NULL; success BOOLEAN NOT NULL. Standard success index. Flyway owns records/checksums; application code never edits them. Metadata structure follows the pinned Flyway version in the existing Maven dependency tree.

## New bitcoin_shared.rate_queries — immutable attempt identity, finalized result
| Column | SQL type | Rules |
| --- | --- | --- |
| id | BIGINT | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY |
| requested_at | TIMESTAMP WITH TIME ZONE | NOT NULL; backend time immediately before provider request |
| completed_at | TIMESTAMP WITH TIME ZONE | nullable while IN_PROGRESS; >= requested_at |
| provider | VARCHAR(16) | NOT NULL DEFAULT 'BINANCE'; CHECK = 'BINANCE' |
| symbol | VARCHAR(16) | NOT NULL DEFAULT 'BTCUSDT'; CHECK = 'BTCUSDT' |
| status | VARCHAR(16) | NOT NULL; IN_PROGRESS, SUCCESS or ERROR |
| price | NUMERIC(30,12) | nullable; positive <= 1000000000000 when SUCCESS; NULL otherwise |
| http_status | INTEGER | nullable for transport errors; when present100–599 |
| error_code | VARCHAR(64) | nullable; sanitized category only, no raw provider body, URL or exception |

Named checks: rate_query_result validates status/result coherence (IN_PROGRESS has null completion/price/error; SUCCESS has completion/price and no error; ERROR has completion/error and null price), rate_query_time, rate_query_price, rate_query_http, rate_query_provider, rate_query_symbol. Index rate_queries_requested_at_idx(requested_at DESC,id DESC) supports time inspection; PK supports newest-first id cursor. No FK to simulation_state or People: audit survives Reset and is not cascade-deleted. No TTL or truncation; history begins at feature deployment, never fabricate historical requests from bounded samples. IDs may have gaps.

Before each actual HTTP attempt commit an IN_PROGRESS row in an independent short transaction while the existing state lock serializes poll ownership. If reservation fails, do not call provider. Finalize on response or failure, preserving original decimal text as BigDecimal (reject precision/scale outside contract; never silently round). Persist result before applying a successful quote to the simulation. If process crashes after reservation, the unfinished row remains observable; do not invent a completed result. If finalization fails, do not trade; retained IN_PROGRESS explains incomplete audit. HTTP/provider failures are rows with safe error categories; no automatic retries inside one attempt. Reads of application state/history are not market queries and create no audit rows. A replayed command creates no new attempt.

## New Flyway stream
Keep People migrations separate. Use db/rate-migration, default schema bitcoin_shared and metadata table bitcoin_shared.rate_query_schema_history. Baseline the pre-existing nonempty schema at version0 (baselineOnMigrate) without touching simulation_state. V1__create_rate_queries.sql creates only the new audit table and index. rate_query_schema_history has the same Flyway-owned metadata columns listed above, with its own PK/success index and baseline/migration rows. New scripts receive incrementing versions; do not modify an applied migration. Startup retries unavailable storage safely. Production migration is additive; rollback application binaries never drops audit tables.

## API and presentation contract
GET /api/simulation includes rateQueries summary: total, successful, failed, inProgress, firstRequestedAt, lastRequestedAt. Counts are lifetime values from the new table, independent of Reset and distinct from successful readings in the current simulation.
GET /api/simulation/rate-queries?before=<positive id>&limit=25 reads history only. Limit1–100, newest id first, nextCursor via limit+1; return queries plus summary. Bind SQL values, never accept SQL/order expressions. No-store responses. Each row includes id, requestedAt, completedAt, provider, symbol, status, price as decimal string or null, httpStatus, errorCode. Return safe400/503 errors. Bounded responses and query timeout10s.

A green expandable tag next to the successful-reading counter shows lifetime attempt count. Expand inline, never a popup. Show date, Buenos Aires local time including seconds and tenths, decimal price/result, SUCCESS/ERROR/IN_PROGRESS labels, first/last times and counts. Load older pages to reach all retained rows; Refresh reads DB only. Abort/ignore obsolete loads on close/unmount and handle loading, empty, error/retry. Explain that gaps may mean pause, sleep, network failure or restart; first/last timestamps do not prove uninterrupted uptime. Existing quote chart/simulation controls and BEM/CSS tokens remain intact.
