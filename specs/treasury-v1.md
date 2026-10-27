# Treasury v1 — specification and grounding

## Scope
New React application with a hamburger drawer, initially closed on both desktop and mobile, and client routing; a separate Render static service. Reuse the existing integrated Spring API, PostgreSQL connection and Google OAuth registration. No new database, paid resource or credentials. El requerimiento del 26/10/2026 sustituye el acceso anónimo: reutilizar DemoSessions, registrar identidad del servidor y exigir permisos explícitos por institución (specs/treasury-operations.md). No habilitar la nueva versión sin aprovisionar esos permisos. Authentication of the demo and simulator remains unchanged.

## Data and accounting
PostgreSQL schema treasury, isolated from public/bitcoin_shared/auth_private. Institutions own members, hierarchical accounts, journal headers, lines and multiple binary attachments. Composite tenant foreign keys prevent cross-institution links. ARS/USD balances remain separate, NUMERIC(18,2). Posted entries are immutable, corrected by a linked reversal. Drafts can be edited. Posting requires at least two valid lines and balanced debits/credits independently in each currency. Serialize institution counters and journal changes transactionally.

## UI
Generic initial theme; institutional themes through centralized BEM CSS variables. Institution/member/account CRUD (deactivate used records). Responsive entry grid with ARS/USD totals and differences, draft/post actions, camera/file inputs, previews and attachment removal. Multiple JPEG/PNG/WebP/PDF files, <=5 MiB each, <=10 per entry. File signatures validated; no SVG/HTML uploads.
Balance at cutoff date and journal by inclusive date range. Only posted entries affect reports. Journal includes embedded image receipts and downloadable PDF attachments, all self-contained in offline HTML with Base64 Data URLs, escaped user text and embedded styles.

## Grounding
Existing API service ariel-demo-integrated-api uses weather-service/ and Weather-Dockerfile on proximo-desarrollo-hello-world. Reuse DatabaseConnections and simulation.database-url, Flyway migration conventions and durable DemoSessions. Existing AuthController start stores PKCE challenge; extend only with a fixed allowlisted treasury callback. Keep the original default login target unchanged. Treasury API gets an authenticated institution-permission interceptor with no-store/nosniff headers; hide treasury from the anonymous Database Explorer to prevent bypass. New frontend in treasury-frontend/ built separately with existing React/router versions. Backend code adds ariel.iteration2.weather.treasury.
Workflow: specification -> grounded implementation -> accounting/isolation/auth/report tests -> backend rollout -> new frontend rollout -> live checks.

## Antecedente: acceso directo — 2026-10-25 (sustituido)
Historical behavior only, superseded by the 26/10/2026 operations requirement. The owner previously requested removing login and exposing all options in a hamburger menu. No OAuth/session restoration or bearer token is used by the Treasury frontend. All accounting rules, tenant foreign keys, posted immutability, attachment limits and report behavior are retained. The menu exposes Institutions, Members, Chart of Accounts, Entries, Balance and Journal, closes on navigation/backdrop/Escape, and advertises its expanded state accessibly. Treasury remains on its existing public URL; anyone with that URL can read and change its records. No change to other application authentication, schema or existing data.

## Institution-first workspace — 2026-10-25
1. The first application screen requires choosing an institution. Institution management remains reachable to create the first one. No scoped screen may operate before a valid institution is selected.
2. A single application-level institution ID is the source of truth. Persist it locally and restore it on reload and direct links; while the catalog loads, display loading instead of suggesting the saved selection was lost.
3. After selection, apply its theme and retain that selection across hamburger navigation, CRUD saves, report generation and catalog refreshes. Keep the previous catalog during background refreshes. Clear selection only on an explicit change or after a successful catalog refresh confirms deletion.
4. All member/account/entry/receipt/report requests use the selected institution ID. Switching institution remounts scoped screens and clears their previous data/forms. The current institution name remains visible in the header and page context.
5. Creating an institution refreshes the catalog and selects the returned institution ID automatically. Editing the selected institution refreshes its name/theme without dropping the selection.
6. The selected institution home shows its workspace actions. A dedicated “Cambiar institución” action returns to the institution chooser; no generic multi-institution dashboard replaces a valid active workspace.
7. Regression acceptance: choose -> Members -> save member -> Accounts -> Members keeps the same institution and theme; new browser component lifecycle restores the saved institution; catalog refresh never flashes the chooser; switching uses only the new institution's endpoints; invalid persisted IDs require a fresh selection and never fall back silently to another institution.

## Complete institutional skins — 2026-10-25
The selected institution's persisted theme_id controls a complete visual skin, not only the primary button color. All theme tokens live in the centralized BEM stylesheet and cover canvas, surfaces, borders, header, navigation, text, focus, form controls, tables, typography and corner treatment. Keep the same navigation and accounting behavior.
- Clásico/generic: warm ivory workspace, light header, navy/gold accents, serif headings and restrained corners.
- Mariners: cool blue workspace, dark marine-blue header with white text, blue-tinted surfaces and borders, sans-serif headings and rounder controls/cards. Preserve readable dropdown options and focused controls. It must be visibly distinct from Clásico on Members even with no records and the hamburger closed.
- Scottish: green/cream palette. Club: burgundy/rose palette. Unselected chooser uses the generic skin.
- Apply a theme immediately when choosing another institution; preserve it on navigation, catalog refresh, reload and editing the active institution. The stored theme assignment must not be changed as part of this correction.
Acceptance: switch Eureka (generic) -> Santos Patronos (mariners) on the same Members page. Verify different computed workspace/header colors, heading font and panel radius, then verify the theme survives reload. Confirm primary controls and header text remain readable in both skins.

### Presentación de miembros
La lista muestra Nombre antes de Apellido y se ordena ascendentemente por nombre, luego apellido, con comparación en español sin distinguir mayúsculas ni acentos. El selector de miembros del asiento usa el mismo orden y muestra «Nombre Apellido». El filtro conserva el orden y la institución activa.

### Fecha de ingreso y desempate de miembros
Reemplazar la columna ID interno por Fecha de ingreso. Es un campo de negocio opcional DATE (admission_date), editable manualmente al crear o editar un miembro, independiente de cualquier timestamp de creación del registro. Vacío significa «Sin identificar». No inferir ni completar automáticamente la fecha en registros nuevos o existentes. Permitir borrar una fecha ya cargada.
Mostrar Nombre, Apellido, Fecha de ingreso (dd/mm/aaaa), y el resto de columnas. Ordenar por nombre y apellido en español, luego por fecha de ingreso ascendente; cuando coinciden ambos nombres, los que no tienen fecha quedan al final. Desempatar igualdad completa por ID interno sin mostrarlo. Aplicar el mismo orden al selector de miembros del asiento. Mantener institución, tema, filtros y edición. Las fechas son días de calendario sin conversiones de zona horaria. Migración incremental nullable; no modificar V1 ni datos existentes. API acepta fecha ISO yyyy-mm-dd o null y conserva compatibilidad con solicitudes sin este campo.


## Evolución operativa — sin publicar

Ver treasury-operations.md para alcance, estados reales y transición. La V3 es
aditiva; los adjuntos siguen separados de los recibos emitidos aún pendientes.
Proveedores tienen catálogo propio por institución; el editor permite asociarlos
a líneas existentes del diario. Nuevas cuentas pueden exigir miembro/proveedor
en ambos lados. Ninguna regla modifica asientos históricos.
