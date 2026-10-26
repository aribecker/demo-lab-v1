# Marcela — estado de entrega

2026-10-26. Rama zona-marcela-schpilberg, basada en proximo-desarrollo-hello-world @ b3a0e8cac63bce7fab8ba94060f12b8b35e5ca34.

Secuencia SDD: especificación f0cb3a390bb875254708775ef4781249b3d65573, luego grounding 4c6e633c9fc0d9e4c5f59deee84006bcc0711a1f, luego implementación React y pruebas.

- npm ci completado con lockfile reutilizado del frontend existente.
- npm test: 7 pruebas aprobadas. Navegación, foco, preselección de servicio, validación nativa, conservación de datos, contrato POST/honeypot/consentimiento, términos y FAQ. No se envió correo.
- npm run build: correcto. HTML, CSS y JavaScript generados en marcela-frontend/dist.
- QA visual pendiente: Playwright está instalado, pero su ejecutable Chromium no está disponible en este entorno; no se verificó visualmente escritorio/móvil.
- Despliegue completado tras la confirmación explícita del usuario de Ariel's workspace. Servicio estático srv-dbfmuhijnfac73cvbu8g. Backend y DB existentes sin cambios.
- FormSubmit: activación del destinatario y entrega de mensajes no verificadas. No confundir build aprobado con correo operativo.

## Evidencia de publicación
- Workspace: tea-db1drlhsrm7s73b7qmhg (Ariel's workspace), confirmado por el usuario.
- Servicio: srv-dbfmuhijnfac73cvbu8g, marcela-schpilberg-consultas.
- URL: https://marcela-schpilberg-consultas.onrender.com
- Deploy: dep-dbfmui2jnfac73cvc11g; estado live, terminado 2026-10-26T15:18:51.568471Z (12:18:51 de Buenos Aires).
- Commit desplegado: 7b794fad89966dd71efbf670d851aa1088ca6064.
- Verificación HTTPS: documento principal HTTP200, título Marcela Schpilberg | Consultas contables. JavaScript y CSS HTTP200. Bundle contiene destinatario esperado y CSS contiene verde #a8d85f.
- npm audit --omit=dev: cero vulnerabilidades reportadas en dependencias de producción. El build reporta avisos en dependencias de desarrollo heredadas; no se ejecuta un servidor Node/Vite en el sitio estático publicado.
- No se enviaron correos ni se verificó activación/entrega de FormSubmit.
- Este commit de evidencia usa [skip render] para no volver a desplegar sin cambios en la aplicación.
