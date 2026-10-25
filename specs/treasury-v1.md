# Treasury v1 — specification and grounding

## Scope
New React application with a hamburger drawer, initially closed on both desktop and mobile, and client routing; a separate Render static service. Reuse the existing integrated Spring API, PostgreSQL connection and Google OAuth registration. No new database, paid resource or credentials. Access update explicitly requested by the owner: no login for Treasury. Treasury endpoints are public for reading and writing. Record created_by as anonymous, never as an authenticated owner. Authentication of the demo and simulator remains unchanged.

## Data and accounting
PostgreSQL schema treasury, isolated from public/bitcoin_shared/auth_private. Institutions own members, hierarchical accounts, journal headers, lines and multiple binary attachments. Composite tenant foreign keys prevent cross-institution links. ARS/USD balances remain separate, NUMERIC(18,2). Posted entries are immutable, corrected by a linked reversal. Drafts can be edited. Posting requires at least two valid lines and balanced debits/credits independently in each currency. Serialize institution counters and journal changes transactionally.

## UI
Generic initial theme; institutional themes through centralized BEM CSS variables. Institution/member/account CRUD (deactivate used records). Responsive entry grid with ARS/USD totals and differences, draft/post actions, camera/file inputs, previews and attachment removal. Multiple JPEG/PNG/WebP/PDF files, <=5 MiB each, <=10 per entry. File signatures validated; no SVG/HTML uploads.
Balance at cutoff date and journal by inclusive date range. Only posted entries affect reports. Journal includes embedded image receipts and downloadable PDF attachments, all self-contained in offline HTML with Base64 Data URLs, escaped user text and embedded styles.

## Grounding
Existing API service ariel-demo-integrated-api uses weather-service/ and Weather-Dockerfile on proximo-desarrollo-hello-world. Reuse DatabaseConnections and simulation.database-url, Flyway migration conventions and durable DemoSessions. Existing AuthController start stores PKCE challenge; extend only with a fixed allowlisted treasury callback. Keep the original default login target unchanged. Treasury API gets an anonymous-access interceptor with no-store/nosniff headers; hide treasury from the anonymous Database Explorer to prevent bypass. New frontend in treasury-frontend/ built separately with existing React/router versions. Backend code adds ariel.iteration2.weather.treasury.
Workflow: specification -> grounded implementation -> accounting/isolation/auth/report tests -> backend rollout -> new frontend rollout -> live checks.

## Direct-access update — 2026-10-25
The owner explicitly requested removing login and exposing all options in a hamburger menu. No OAuth/session restoration or bearer token is used by the Treasury frontend. All accounting rules, tenant foreign keys, posted immutability, attachment limits and report behavior are retained. The menu exposes Institutions, Members, Chart of Accounts, Entries, Balance and Journal, closes on navigation/backdrop/Escape, and advertises its expanded state accessibly. Treasury remains on its existing public URL; anyone with that URL can read and change its records. No change to other application authentication, schema or existing data.

## Institution-first workspace — 2026-10-25
1. The first application screen requires choosing an institution. Institution management remains reachable to create the first one. No scoped screen may operate before a valid institution is selected.
2. A single application-level institution ID is the source of truth. Persist it locally and restore it on reload and direct links; while the catalog loads, display loading instead of suggesting the saved selection was lost.
3. After selection, apply its theme and retain that selection across hamburger navigation, CRUD saves, report generation and catalog refreshes. Keep the previous catalog during background refreshes. Clear selection only on an explicit change or after a successful catalog refresh confirms deletion.
4. All member/account/entry/receipt/report requests use the selected institution ID. Switching institution remounts scoped screens and clears their previous data/forms. The current institution name remains visible in the header and page context.
5. Creating an institution refreshes the catalog and selects the returned institution ID automatically. Editing the selected institution refreshes its name/theme without dropping the selection.
6. The selected institution home shows its workspace actions. A dedicated “Cambiar institución” action returns to the institution chooser; no generic multi-institution dashboard replaces a valid active workspace.
7. Regression acceptance: choose -> Members -> save member -> Accounts -> Members keeps the same institution and theme; new browser component lifecycle restores the saved institution; catalog refresh never flashes the chooser; switching uses only the new institution's endpoints; invalid persisted IDs require a fresh selection and never fall back silently to another institution.
