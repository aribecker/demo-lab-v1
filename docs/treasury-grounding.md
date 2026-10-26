# Treasury v1 — implementation and deployment

## Existing resources retained
- GitHub: aribecker/0080-prueba-SDD-full-stack.
- Shared backend: ariel-demo-integrated-api, branch proximo-desarrollo-hello-world, weather-service/.
- PostgreSQL: existing simulation.database-url / SIMULATION_DATABASE_URL; new treasury schema and Flyway history only.
- Existing Google OAuth registration and durable seven-day bearer sessions.
- New static frontend: treasury-frontend/, deployment branch treasury-v1, service ariel-treasury.

## Grounded design
TreasuryRepository uses the existing secret-safe DatabaseConnections parser. JdbcTemplate and TransactionTemplate share one datasource; institution row locks serialize numbering, posting, reversal and receipt changes. UUID keys and composite tenant FKs enforce institution isolation. Monetary values use NUMERIC(18,2), Java BigDecimal and JSON decimal strings; the UI uses BigInt cents. Posted entries and receipts are immutable. Reversal creates a separate balanced entry, preserves the original and prevents duplicate reversals.

TreasuryAccess permits anonymous reads and writes on Treasury endpoints only, including binary downloads, as explicitly requested by the owner on 2026-10-25. Journal actor is recorded as anonymous. The demo and simulator authentication is unchanged. Treasury tables are omitted from the existing public database explorer, including explicit table access. The original OAuth callback remains the default; app=treasury selects a fixed callback URL. No caller-supplied return URL is accepted. Exact CORS allowlisting covers the new frontend. No credentials are copied or exposed.

React uses BrowserRouter and generated static route entry files, an initially closed hamburger drawer on every screen size, four themes implemented through central BEM styles and CSS variables, and explicit empty/loading/error states. The initial database contains themes only; no institution, person, account or monetary entry is fabricated. Drafts can have incomplete balance, while every line still needs a valid institution account and a single positive debit/credit. Posting enforces at least two lines and independent ARS/USD balance.

## Receipts and exports
Up to 10 JPEG/PNG/WebP/PDF attachments per entry, 5 MiB each. Signature validation excludes HTML and SVG. BYTEA storage uses existing PostgreSQL. Authenticated binary reads return attachment disposition and nosniff. Draft and saved receipt previews are supported; posted receipts cannot be changed.

Balance uses a cutoff date and includes sums/saldos, account types, assets/liabilities/equity and cumulative income less expenses. Journal uses an inclusive date interval, contains posted entries only and retains original entries plus reversals. Both display generated HTML in a sandboxed iframe and download the same standalone HTML. User values are escaped, the HTML disables scripts/network content via CSP, and receipts use Base64 Data URLs. PDF receipts are embedded as downloadable links. Report limit: 500 posted entries and 50 MiB of receipt payload per journal export; narrower periods can be selected. The entry list shows the latest 500 records.

## Validation
Java regression suite plus treasury repository and HTTP access tests. Covers per-currency balance, invalid precision, cross-tenant API and direct FK writes, durable restart, concurrent numbering, posted immutability, reversals, receipt limits and signatures, Treasury-only anonymous access, preservation of simulator authentication, CORS and OAuth callback allowlisting. Disposable PostgreSQL tests run inside the existing Render Docker build using SIMULATION_TEST_DATABASE_URL; no test records are written to production.
Frontend tests cover direct access without OAuth or bearer tokens, hamburger open/navigation/Escape behavior, institution skin changes, member CRUD submission, per-currency posting controls, exact cents, escaped and self-contained report HTML and complete receipt requirements. Production builds generate explicit static routes.

## Institution context correction
The catalog formerly used the generic useLoad hook, which cleared data on refresh; deriving the active institution solely from that transient data could unmount scoped screens. Institution creation also discarded the returned ID rather than selecting it. Replace this with an application-level catalog loader that keeps previous results, tracks loading/errors and rejects stale responses. Await catalog refresh before automatically selecting a newly created institution. Gate all scoped routes with the same institution chooser/loading state. Persist one ID, restore it before scoped content loads, and use the selected institution name/theme throughout the workspace. Keep existing backend composite tenant constraints and request paths; no database or authentication changes are needed.

## Complete skin correction
Live metadata confirms Eureka uses generic and Santos Patronos uses mariners. React already switches data-theme on the app root, and selection restoration tests cover that binding. CSS only varied --primary/--accent, while body canvas, white topbar, panels, inputs and table surfaces were hardcoded; both existing primary colors were similar navy blues. Expand centralized theme token sets and consume them throughout the BEM components. Use the existing persisted IDs and existing primary/accent colors, without a database migration or changing institution records. Validate live computed colors, fonts and radii after selecting each institution on the same page, including a reload, in addition to frontend regression tests.

### Orden y presentación de miembros
El CRUD mostraba Apellido antes de Nombre y conservaba el orden recibido del API. Se ordena una copia en la presentación con Intl.Collator español, por first_name y luego last_name; se aplica también al selector del asiento sin modificar datos almacenados.

### ID en la lista de miembros
El API ya devuelve id en cada miembro. El CRUD genera las columnas y el filtro desde configs.members.columns: agregar id expone el identificador completo y permite buscarlo sin cambios de API, base de datos ni formulario. Mantener Nombre y Apellido como primeras columnas y el comparador existente.

### Fecha de ingreso de miembros
La migración V1 no guarda fecha de ingreso en members. Se agrega V2__member_admission_date.sql con admission_date DATE nullable sin default. TreasuryModels.Member incorpora LocalDate opcional; saveMember lo persiste al crear y editar. members ya selecciona todas las columnas y query serializa java.sql.Date en ISO, sin cambios de lectura. El frontend incorpora un input date opcional y convierte vacío a null al guardar. Sustituye la columna id por admission_date, formatea dd/mm/aaaa sin zona horaria, y extiende sortedMembers con desempate por fecha y luego ID. Validar creación/edición/borrado de fecha, homónimos y ausencia de fecha, y migración V1 con miembros existentes. La idea inicial de timestamp de creación queda descartada por la aclaración del usuario; no se despliega.


## Respaldo de seguridad — 2026-10-26
Ruta global /backup, confirmación previa con destinatario fijo del propietario y nombres fechados en Buenos Aires. API independiente /api/treasury/backup; no cambiar autenticación ni tablas existentes. TreasuryRepository.ensureBackupReady reutiliza las migraciones actuales antes de exportar. pg_dump del esquema treasury y XLSX streaming usan el mismo snapshot REPEATABLE READ. El runtime incorpora PostgreSQL 17 para disponer de pg_dump; mantiene USER 10001 y el entrypoint Java.

XLSX OOXML escrito con ZipOutputStream para evitar nuevas dependencias; valores inlineStr impiden fórmulas y pérdida de precisión; encabezados y hojas vacías presentes; textos/base64 largos se dividen en columnas. ZIP contiene dump SQL sin propietarios/permisos y README de restauración mediante psql --single-transaction en una base vacía. Límites y errores explícitos, sin recortes ni envíos parciales. No se consulta ni exporta ningún otro esquema.

Correo HTTPS vía Resend, con destinatario aribecker2@gmail.com fijado en servidor. Variables privadas requeridas en ariel-demo-integrated-api: TREASURY_BACKUP_MAIL_API_KEY y TREASURY_BACKUP_MAIL_FROM (remitente autorizado por el proveedor). No usar variables VITE para secretos, ni credenciales Google de login como autorización Gmail. Sin ambas variables, pantalla informa configuración pendiente y no permite enviar. Ningún correo real se envía durante validación.

Pruebas: frontend confirma solo tras acción explícita, no duplica clics, reintenta con el mismo token y muestra error real. Backend verifica configuración ausente, parsing secreto de conexión, Excel vacío, texto que parece fórmula, decimales exactos y binarios en partes. Prueba PostgreSQL en build crea dos bases desechables loopback, genera y restaura el SQL, verifica filas/fechas/binarios/FKs/historial de migración, excluye escritura concurrente del Excel y comprueba envío idempotente con proveedor simulado. No toca registros de producción.
