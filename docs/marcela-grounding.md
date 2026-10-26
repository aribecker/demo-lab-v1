# Grounding — Marcela Schpilberg
Fecha: 2026-10-26. Base revisada: proximo-desarrollo-hello-world @ b3a0e8cac63bce7fab8ba94060f12b8b35e5ca34.
Especificación previa: specs/marcela/platform.md @ f0cb3a390bb875254708775ef4781249b3d65573.

## Evidencia revisada
- README.md exige commit spec → grounding → implementación/tests → evidencia.
- frontend/package.json: React/DOM19.3.1, Vite6.4.4, Vitest2.1.9, Node>=22. Reutilizar versiones y lockfile, con nombre de paquete propio.
- frontend/vite.config.js: plugin React y entorno jsdom. La nueva app no necesita proxies de APIs porque conserva POST externo nativo.
- specs/design-system.md: CSS central y BEM. La especificación de Marcela declara paleta propia para conservar la referencia.
- deploy/integrated-zone.json: frontend estático y backend compartido ariel-demo-integrated-api. No se requiere cambiar backend ni CORS en esta versión.
- Árbol completo revisado: no hay AGENTS.md en esta rama.
- HTML adjunto: dos vistas por botones, tres áreas, dos tarjetas de precios, formulario nativo con validación HTML y FormSubmit; no hay almacenamiento ni administración implementada. Extraer CSS y generar componentes React conservando contenido y estructura.
- Documentación actual Render https://render.com/docs/static-sites.md recuperada: sitio estático desde Git con directorio publicado y comando build. Conservar configuración separada en deploy/marcela-zone.json (manifiesto de conector, no Blueprint).

## Trazabilidad
R1/R2 → src/App.jsx con estado React de vista y servicio, foco y botones accesibles; App.test.jsx.
R3/R4 → mismo formulario, campos y reglas; consentimiento con name para POST; contrato/validez nativa en tests sin red.
R5/R6 → contenido original, aclaración de activación externa, año y FAQ.
Diseño → src/styles.css, clases BEM ms-*, estilos inline extraídos.
R7 → marcela-frontend/package*.json, vite.config.js y deploy/marcela-zone.json.

## Límites y decisiones
No crear backend ni DB. No copiar claves al frontend. Conservar FormSubmit y su destinatario del adjunto; no enviar correos durante QA. Activación y entrega no verificadas.
Workspace aún sin confirmar; preparar código, build y manifiesto antes de pedir confirmación final para crear el servicio.
