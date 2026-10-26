# Marcela — estado de entrega

2026-10-26. Rama zona-marcela-schpilberg, basada en proximo-desarrollo-hello-world @ b3a0e8cac63bce7fab8ba94060f12b8b35e5ca34.

Secuencia SDD: especificación f0cb3a390bb875254708775ef4781249b3d65573, luego grounding 4c6e633c9fc0d9e4c5f59deee84006bcc0711a1f, luego implementación React y pruebas.

- npm ci completado con lockfile reutilizado del frontend existente.
- npm test: 7 pruebas aprobadas. Navegación, foco, preselección de servicio, validación nativa, conservación de datos, contrato POST/honeypot/consentimiento, términos y FAQ. No se envió correo.
- npm run build: correcto. HTML, CSS y JavaScript generados en marcela-frontend/dist.
- QA visual pendiente: Playwright está instalado, pero su ejecutable Chromium no está disponible en este entorno; no se verificó visualmente escritorio/móvil.
- Despliegue pendiente: el usuario aún no confirmó Ariel's workspace. No se creó servicio ni se modificó el backend o la DB existentes.
- FormSubmit: activación del destinatario y entrega de mensajes no verificadas. No confundir build aprobado con correo operativo.

Siguiente paso autorizado tras confirmar workspace: crear sitio estático con deploy/marcela-zone.json, seguir el deploy hasta estado terminal y verificar URL HTTPS. Registrar aquí evidencia de despliegue antes de anunciarlo como publicado.
