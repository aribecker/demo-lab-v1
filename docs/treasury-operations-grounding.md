# Grounding: tesorería operativa

Base inspeccionada: aribecker/0080-prueba-SDD-full-stack, treasury-v1,
08e5f69e9b6225b25e6a63349a6893228c62977a. El árbol no contiene AGENTS.md.

TreasuryRepository emplea JdbcTemplate, TransactionTemplate y Flyway en el
esquema treasury. V1 contiene institutions, members, accounts, journal_entries,
journal_lines y journal_attachments; V2 agrega admission_date a members.
No existen cargos, conceptos, proveedores, aplicaciones o recibos emitidos.
journal_attachments almacena respaldos binarios: no se reutiliza como recibos.
El límite de asientos es 200 líneas; el mayor/balance se calcula del diario.
Los asientos numeran con lock de institutions. El actor era anonymous.
TreasuryAccess permite toda operación sin autenticación. DemoSessions ya ofrece
identidades verificadas y sesiones persistentes; no hay ACL de tesorería.

Render: ariel-treasury usa treasury-v1; ariel-demo-integrated-api usa
proximo-desarrollo-hello-world; ambos autoDeploy=yes. La base existente es
ariel-sdd-people-db. Consultar information_schema.columns falló porque su
allowlist de conexiones externas está vacía. No se modificó esa política.
Se contrastó también el árbol de proximo-desarrollo-hello-world
(b3a0e8cac63bce7fab8ba94060f12b8b35e5ca34): las fuentes de
weather-service coinciden por SHA con treasury-v1. Esto verifica el código
versionado de ambas ramas, no el esquema real ni el commit efectivo en ejecución.

Decisión: cambios aislados y revisables, sin mover las ramas activas. V3 agrega
configuración/ACL/proveedores sin tocar asientos existentes. El resto del
alcance sigue explícitamente pendiente en specs/treasury-operations.md.
