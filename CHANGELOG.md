# Historial de cambios

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

El build Docker garantiza detener PostgreSQL desechable al salir, incluso ante
fallos de tests, y separa su log del stream de build para no retener la compilación.
