# Historial de cambios

## 27/10/2026 — Conexión directa de Demo Lab a PostgreSQL

- Credencial configurada únicamente en Render, fuera del repositorio.
- Mapeo explícito de simulation.database-url mediante SPRING_APPLICATION_JSON.
- Despliegue activo y conexión PostgreSQL confirmada en registros de ejecución.

## 27/10/2026 — Demo Lab en repositorio propio

- Servicios demo-lab y demo-lab-api creados desde aribecker/demo-lab, rama main.
- URL real del frontend incorporada a CORS y redirección del backend.
- Configuración de despliegue, especificación y pasos de activación de secretos documentados.
- Servicios anteriores y datos conservados. Credenciales pendientes de transferencia dentro de Render.

## Sin publicar — 26/10/2026

- Primera parte del requerimiento de operaciones y contabilidad: controles de
  terceros, catálogo de proveedores y acceso explícito por institución.
- V3 aditiva; no edita V1/V2 ni vuelve a contabilizar datos históricos.
- Login del frontend reutiliza el OAuth y las sesiones existentes.
- No desplegado: falta inspeccionar esquema activo, identificar entorno de
  pruebas y aprovisionar permisos explícitos. Funcionalidades operativas y
  conciliación pendientes, enumeradas en specs/treasury-operations.md.

Validación: backend 91 pruebas aprobadas y 10 omitidas (101 total), frontend
33 aprobadas, build Vite aprobado. PostgreSQL/despliegue no verificados.
Detalle: docs/treasury-operations-validation.md.

El usuario autorizó publicar sobre ramas/servicios actuales. Se incorpora
bootstrap de permisos para la cuenta Google propietaria verificada mediante
configuración explícita, vacía por defecto, para evitar bloquear el acceso.

Corrección de prueba PostgreSQL del respaldo: elimina el supuesto de ocho tablas
y verifica hojas contra el catálogo real, más restauración de proveedores y
permisos incorporados en V3. La prueba había frenado correctamente el primer
build del backend; no se publicó una versión con pruebas fallidas.
