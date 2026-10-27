# Operaciones y auxiliares de tesorería

Estado: implementación parcial en rama de revisión; no habilitada ni desplegada.
Requerimiento de origen: requerimiento_tesoreria_operaciones_y_contabilidad.md,
166 líneas, leído íntegramente el 26/10/2026 (hora de Buenos Aires).

## Alcance contractual

El diario existente continúa siendo la única contabilidad. Cargos individuales y
lotes, conceptos configurables, obligaciones de proveedores y sus líneas,
cobranzas, pagos, transferencias, aplicaciones y recibos son documentos propios.
Sus vínculos con el diario explican los auxiliares; ningún saldo se edita a mano.
Se preservan institución, moneda, importes decimales, fechas efectivas, historial
y trazabilidad. No se reconstruyen documentos históricos desde descripciones.

Confirmar documento, aplicaciones, asiento y número de recibo debe ser una sola
transacción. Se requieren idempotencia, numeradores concurrentes, snapshot del
recibo y reintentos de PDF fuera de la transacción. Corregir imputación, anular
un cobro erróneo y devolver dinero son tres acciones diferentes. Reversas de
aplicaciones y documentos mantienen el historial. Los lotes deben dividirse
en asientos balanceados de hasta 200 líneas sin perder ni duplicar cargos.

## Primera implementación verificable

Nueva V3 agrega requires_member, requires_supplier y auxiliary_type al plan
existente; suppliers y treasury_permissions, sin identidades ni permisos
precargados; supplier_id a líneas con FK compuesta por institución.
auxiliary_type permite MEMBER_DEBT, MEMBER_ADVANCE, SUPPLIER_DEBT,
SUPPLIER_ADVANCE. Deuda y anticipos nunca se concilian neteados entre cuentas.

Las nuevas líneas de cuentas configuradas exigen miembro/proveedor válido,
independientemente del lado Debe/Haber. Las cuentas auxiliares no admiten
nuevos asientos manuales: necesitan el flujo documental, aún pendiente.
Las restricciones de configuración no se aplican retroactivamente al histórico.
No clasificar automáticamente cuentas ya existentes: exige conciliación previa.

Todas las rutas privadas de tesorería reutilizan DemoSessions. Solo themes y
preflight permanecen públicos. Se exige permiso explícito por institución:
can_read, can_write, can_confirm. can_confirm no se deduce de can_write.
La gestión del catálogo global y el respaldo completo requieren una identidad
verificada presente en treasury.catalog-editors (lista vacía por defecto).
Esta configuración no otorga acceso a operaciones de instituciones: para ellas
también se requiere treasury_permissions. No se reutiliza el permiso del simulador.
Los permisos se aprovisionan mediante administración de infraestructura; no
hay endpoint de autoasignación ni usuarios administrativos inventados.

## Pendiente de implementación integrada

| Capacidad | Estado |
|---|---|
| Catálogo de conceptos y reglas por institución | Pendiente |
| Cargos, lotes, revisión, división e idempotencia | Pendiente |
| Proveedores | Catálogo implementado; obligaciones/líneas pendientes |
| Cobranzas, pagos directos y transferencias | Pendiente |
| Aplicaciones y reversiones históricas | Pendiente |
| Recibos, numeradores, snapshots, PDF y reintentos | Pendiente |
| Corrección, anulación y devolución separadas | Pendiente |
| Conciliación histórica con mayor | Pendiente |
| Permisos y cuentas que exigen tercero | Implementados; pruebas en base desechable |
| Transición conciliada del histórico | Pendiente del esquema/datos reales |
| Despliegue y pruebas integradas | Bloqueados |

No implementar cambios de moneda, transferencias entre instituciones ni
comprobantes fiscales en este alcance. No declarar los casos de aceptación
del requerimiento como aprobados hasta ejecutarlos contra la implementación.

## Bloqueos concretos y transición

La consulta de esquema de Render falló por allowlist vacía. El esquema
versionado V1/V2 está inspeccionado, pero falta comparar columnas,
restricciones e historial efectivo de migraciones con la base desplegada.
El backend compartido y el frontend activos se despliegan automáticamente
desde ramas distintas; no se identificó un entorno de pruebas separado.
No publicar estos cambios en esas ramas ni ejecutar V3 allí sin resolverlo.

Antes de desplegar: obtener exportación de solo esquema e historial Flyway,
identificar el entorno de pruebas y aprovisionar permisos de identidades reales.
Validar V3 sobre copia desechable del esquema real con datos representativos.
Resolver las diferencias históricas con partidas abiertas conciliadas que no
vuelvan a afectar el saldo del diario. Nunca recrear la base ni editar V1/V2.

## Actualización de despliegue autorizada por el usuario

El usuario solicita publicar en las mismas ramas y servicios existentes, sin
crear otro entorno. Se conserva treasury-v1 para frontend y
proximo-desarrollo-hello-world para backend. El alcance sigue siendo parcial.

Para evitar bloqueo de acceso inicial, TREASURY_BOOTSTRAP_OWNER_EMAIL permite
aprovisionar permisos explícitos después de un login Google con email verificado
que coincida exactamente. Vacía por defecto. La identidad interna proviene de
DemoSessions, nunca del cliente. Otorga acceso de catálogo y permisos de lectura,
escritura y confirmación sobre instituciones existentes/nuevas; los guarda con
actor bootstrap e idempotencia bajo locks. No crea miembros ni asientos. Usuarios
fuera de esa configuración siguen necesitando grants individuales. Configurar
la cuenta propietaria ya existente del proyecto antes de activar el backend.
