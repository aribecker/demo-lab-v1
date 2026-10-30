# Historial de cambios

## 27/10/2026 — Filas administrativas legibles en celular

- R50 especifica datos y acciones en regiones separadas, con datos arriba en pantallas de hasta 820px.
- Users y Groups usan el bloque compartido record-list; botones cortos y nombres accesibles con contexto.
- El contrato CSS impide volver a comprimir los nombres entre botones y cubre el ajuste de filas.

## 27/10/2026 — Pantalla en blanco al alternar Users y Groups

- Cada ruta administrativa monta su propio estado de formulario, listado y membresías.
- Evita interpretar usuarios como grupos durante la navegación y descarta respuestas tardías de la pantalla anterior.
- Regresión reproducida antes de corregir y cubierta en ambas direcciones.

## 27/10/2026 — Everyone en la administración para revisión

- Asignación solicitada de Everyone a Users administration y Groups administration mediante V2 optativa de una sola ejecución.
- Conserva los permisos del propietario y el CRUD como autoridad; quitar Everyone no se revierte en reinicios.

## 27/10/2026 — Turquesa e íconos de navegación

- R49 actualiza la especificación visual y sus tokens a una paleta verde azulada más alegre.
- Las 13 opciones del menú tienen íconos SVG locales definidos en la especificación, con etiquetas y accesibilidad conservadas.
- Menú desplazable en pantallas pequeñas, opción activa destacada y contraste verificado.

## 27/10/2026 — Acceso configurable de Demo Lab por grupos

- Especificación R48 y migración aditiva en el nuevo esquema demo_lab de la base compartida; Treasury conserva su esquema separado.
- CRUD de usuarios, grupos y membresías con tres permisos independientes, comprobados en interfaz y API.
- Ariel Becker inicialmente en los tres grupos; Everyone inicialmente en Trading Simulator para permitir acceso público.
- Los cambios persisten entre despliegues; protección del último administrador y exclusión del esquema del explorador público.
- Google OAuth continúa siendo requisito para identificar administradores; sus credenciales se configuran fuera del código.


## 27/10/2026 — Trading Simulator siempre visible

- Menú y tarjeta de Home visibles para todas las sesiones.
- Login requerido al entrar sin sesión; saludo y denegación en castellano para usuarios no autorizados.
- Cuenta Google propietaria verificada conserva acceso al simulador completo.
- Logout y expiración quitan los datos privados, pero conservan la navegación.

## 27/10/2026 — Recuperación de conexión del Bitcoin Tracker

- Espera de lectura pública ampliada de 12 a 90 segundos para el arranque del backend.
- Mensajes de conexión claros en lugar de errores técnicos de aborto del navegador.
- Cancelación al salir y reintento automático conservados; no modifica el simulador.

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

El build Docker garantiza detener PostgreSQL desechable al salir, incluso ante
fallos de tests, y separa su log del stream de build para no retener la compilación.
