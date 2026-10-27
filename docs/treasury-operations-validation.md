Estado previo conservado como historial. El usuario autorizó posteriormente
la publicación en las ramas y servicios actuales; ver treasury-current-deployment.md.

# Verificación — avance parcial

26/10/2026, fecha de Buenos Aires.

## Ejecutado

- Compilación Java 17 con Maven 3.9.9.
- Suite completa del backend: 101 casos, 91 ejecutados correctamente,
  10 omitidos por requisitos de PostgreSQL loopback no disponibles.
  Cero fallos y cero errores. No afirmar que esos diez casos pasaron.
- Suite completa del frontend: 33 pruebas aprobadas en 6 archivos.
- Build Vite y generación de rutas estáticas, incluido /suppliers: aprobados.
- git diff --check: sin errores.
- V1/V2 sin modificaciones. V3 probada con H2 en modo PostgreSQL, incluida
  actualización desde V2 con asientos y líneas preexistentes. Se verificó que
  conserva importe, estado, descripción y actor histórico, y no concede accesos.

## Cobertura agregada

Miembro obligatorio en ambos lados, miembro opcional, proveedor obligatorio,
proveedor en institución incorrecta, conservación del proveedor al revertir,
baja sin borrado, bloqueo de asiento manual en cuentas auxiliares y prohibición
de reclasificar cuentas utilizadas sin transición conciliada.
HTTP: escritura/lectura privada anónima rechazadas, permisos distintos de lectura,
escritura y confirmación, aislamiento, protección del respaldo global, CORS y
callback OAuth existentes. Frontend: login PKCE, intercambio de ticket,
restauración, vencimiento, logout, proveedor en institución activa y configuración
explícita de cuenta sin defaults de clasificación.

## No ejecutado / bloqueado

- V3 contra PostgreSQL real y copia del esquema activo.
- Casos de aceptación de cargos/lotes, cobranzas, obligaciones/pagos,
  aplicaciones, recibos/numeradores, PDF y reintentos, correcciones documentales,
  devoluciones y conciliación histórica: funcionalidades no implementadas.
- Despliegue y verificación integrada: no realizados.
- No se abrió la red de la base, se asignaron permisos a usuarios ni se cambió
  ninguna rama con despliegue automático.

El listado completo de archivos es el diff de la revisión. Tablas existentes
modificadas por V3: accounts, journal_lines. Tablas nuevas: suppliers,
treasury_permissions. No modifica journal_entries, importes ni líneas actuales;
solo incorpora supplier_id nullable a journal_lines.

## Estado de publicación

La rama remota treasury-operations-foundation-20261026 fue creada desde la base
08e5f69e9b6225b25e6a63349a6893228c62977a. La revisión automática rechazó
la operación create_tree para subir el contenido modificado, por exigir
consentimiento explícito de publicación al repositorio. No se reintentó por
otra vía. La rama remota no contiene este avance; no hay PR ni despliegue.
El código modificado y su commit se conservan localmente, junto con un paquete
revisable. Aprobar la subida no resolvería por sí solo los bloqueos del esquema
y del entorno de pruebas.
