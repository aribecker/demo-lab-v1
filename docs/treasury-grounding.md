# Treasury v1 — implementation and deployment

## Existing resources retained
- GitHub: aribecker/0080-prueba-SDD-full-stack.
- Shared backend: ariel-demo-integrated-api, branch proximo-desarrollo-hello-world, weather-service/.
- PostgreSQL: existing simulation.database-url / SIMULATION_DATABASE_URL; new treasury schema and Flyway history only.
- Existing Google OAuth registration and durable seven-day bearer sessions.
- New static frontend: treasury-frontend/, deployment branch treasury-v1, service ariel-treasury.

## Grounded design
TreasuryRepository uses the existing secret-safe DatabaseConnections parser. JdbcTemplate and TransactionTemplate share one datasource; institution row locks serialize numbering, posting, reversal and receipt changes. UUID keys and composite tenant FKs enforce institution isolation. Monetary values use NUMERIC(18,2), Java BigDecimal and JSON decimal strings; the UI uses BigInt cents. Posted entries and receipts are immutable. Reversal creates a separate balanced entry, preserves the original and prevents duplicate reversals.

TreasuryAccess checks server-owned, verified Google identity aribecker2@gmail.com on every treasury endpoint, including binary downloads. It reuses the established owner predicate; this v1 is single-admin, multi-institution. Treasury tables are omitted from the existing public database explorer, including explicit table access. The original OAuth callback remains the default; app=treasury selects a fixed callback URL. No caller-supplied return URL is accepted. Exact CORS allowlisting covers the new frontend. No credentials are copied or exposed.

React uses BrowserRouter and generated static route entry files, a responsive hamburger/sidebar, four themes implemented through central BEM styles and CSS variables, and explicit empty/loading/error states. The initial database contains themes only; no institution, person, account or monetary entry is fabricated. Drafts can have incomplete balance, while every line still needs a valid institution account and a single positive debit/credit. Posting enforces at least two lines and independent ARS/USD balance.

## Receipts and exports
Up to 10 JPEG/PNG/WebP/PDF attachments per entry, 5 MiB each. Signature validation excludes HTML and SVG. BYTEA storage uses existing PostgreSQL. Authenticated binary reads return attachment disposition and nosniff. Draft and saved receipt previews are supported; posted receipts cannot be changed.

Balance uses a cutoff date and includes sums/saldos, account types, assets/liabilities/equity and cumulative income less expenses. Journal uses an inclusive date interval, contains posted entries only and retains original entries plus reversals. Both display generated HTML in a sandboxed iframe and download the same standalone HTML. User values are escaped, the HTML disables scripts/network content via CSP, and receipts use Base64 Data URLs. PDF receipts are embedded as downloadable links. Report limit: 500 posted entries and 50 MiB of receipt payload per journal export; narrower periods can be selected. The entry list shows the latest 500 records.

## Validation
Java regression suite plus treasury repository and HTTP access tests. Covers per-currency balance, invalid precision, cross-tenant API and direct FK writes, durable restart, concurrent numbering, posted immutability, reversals, receipt limits and signatures, owner-only access, CORS and OAuth callback allowlisting. Disposable PostgreSQL tests run inside the existing Render Docker build using SIMULATION_TEST_DATABASE_URL; no test records are written to production.
Frontend tests cover login/denial, institution skin changes, member CRUD submission, per-currency posting controls, exact cents, escaped and self-contained report HTML and complete receipt requirements. Production builds generate explicit static routes.
