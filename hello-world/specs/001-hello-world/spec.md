# Especificación: Hello World

## Objetivo
Una aplicación web simple permite solicitar y visualizar un saludo obtenido desde un backend Java. SDD significa desarrollo guiado por especificaciones: este contrato determina la implementación y las pruebas.

## Historias y criterios de aceptación
- AC1: al abrir `/`, el usuario ve una página con el título «Hello World», un botón «Obtener saludo» y un estado inicial que invita a solicitarlo.
- AC2: `GET /api/hello` devuelve HTTP 200, `Content-Type: application/json` y exactamente `{"message":"Hello World!"}`.
- AC3: al pulsar el botón, el frontend JavaScript muestra «Cargando…», desactiva el botón mientras espera y luego muestra el mensaje recibido, sin recargar la página.
- AC4: ante un error HTTP, de conexión o de formato, muestra un error comprensible y permite reintentar.
- AC5: el servidor devuelve 404 para rutas desconocidas y 405 con `Allow: GET` para métodos no admitidos. No permite recorrer directorios mediante la URL.
- AC6: la página usa controles nativos, estado anunciado con `aria-live` y diseño legible en móvil y escritorio.

## Alcance
Backend Java 21 y frontend HTML, CSS y JavaScript nativo; sin base de datos, autenticación, dependencias externas ni servicios remotos. Frontend y API comparten origen. Puerto predeterminado 8080, configurable con `PORT`; escucha en loopback por defecto y admite `HOST` para despliegue.

## Validación
Pruebas HTTP reales de API, archivos estáticos, métodos y rutas; pruebas del controlador del frontend con respuestas exitosas, fallidas y pendientes. La inspección visual y la comprobación con lector de pantalla son manuales.
