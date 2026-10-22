# People database Hello World — specification first

Base: `prueba-chatbot-spring-ai` at `1621c22189cf828fef78653eaba7d214698e4eca`.
Keep the existing demo features and the original iteration-2 deployment.

## Requirements

- R23: Add an English `People` navigation item, Home card and `/people` route. Show `Hello, database!`, a labeled `Name` input, `Add person` button and a persistent people list. Empty/loading/error/saving states, keyboard submission, refresh and mobile layout are required.
- R24: Implement a separate Java 17 / Spring Boot REST microservice (`people-service`) backed by real PostgreSQL. POST `/api/people` saves a name and returns its generated ID and creation time; GET `/api/people` lists records newest-first with cursor pagination and a Load more control. New records survive page refresh and service restart. Names are trimmed, nonblank and at most 100 characters; equal names are allowed.
- R25: Use Flyway versioned SQL migrations for the `people` table and schema history; database/role provisioning is separate from application schema migration. No Hibernate auto-DDL, destructive schema reset, credential in git, or in-memory production replacement. Include local Docker Compose, provisioning/deployment instructions and a database export command. Use Render private database connectivity in the same workspace/region, environment-only credentials, a small Hikari pool and a DB readiness endpoint.
- R26: Parameterized SQL and validation; JSON error messages in English; no raw database errors/credentials in responses or logs. Include request UUID idempotency so retries of an uncertain submission cannot duplicate a person. Restrict browser CORS to explicit frontend origins. This is a public demo with sample names; authentication is outside this increment.

## API contract

POST body `{ "name": "Ada Lovelace", "requestId": "<UUID>" }` → 201 `{ "id": 1, "name": "Ada Lovelace", "createdAt": "<UTC ISO instant>" }`.
Retrying the same UUID/name returns the same person; UUID reuse with another name returns 409.
GET `?before=<positive ID>&limit=<1..100>` → `{ "people": [...], "nextCursor": <ID or null> }`; default limit 50. Invalid input → 400; DB unavailable → 503 without disclosing connection details. `/health` checks `SELECT 1`.

## Acceptance and traceability

1. Commit this specification before grounding and code generation.
2. Record grounding against the router, Home, client/test conventions, Docker and Render topology.
3. Test Flyway migrations against PostgreSQL (not H2), insert/list, trimming, Unicode, apostrophes/SQL injection string, pagination, idempotent retry/conflict and validation.
4. Test React create/list/error/draft retention and pagination; run frontend regressions and build.
5. Deploy the separate API and PostgreSQL, update only the experimental frontend, then verify a synthetic person through API, fresh GET and read-only SQL. Record deployment IDs and limitations.

## Infrastructure constraints

Use free Render resources without upgrading plans. Free PostgreSQL expires 30 days after creation; document the actual expiration and export/migration path. The owner has not supplied chatbot or OAuth credentials; People must work independently of those integrations.
