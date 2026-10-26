# Marcela Schpilberg — consultas contables

Frontend React/Vite basado en el HTML adjunto. Especificación: ../specs/marcela/platform.md; grounding: ../docs/marcela-grounding.md.

Node 22. Ejecutar npm ci, npm test, npm run build. Desarrollo: npm run dev -- --host 127.0.0.1. Vista del build: npm run preview -- --host 127.0.0.1.

CSS central en src/styles.css; componentes y estado de navegación en src/App.jsx. Los campos se conservan al alternar vistas. No hay pagos ni administración.

Despliegue independiente: ../deploy/marcela-zone.json. Compartir backend existente si una futura ampliación requiere una API. Esta versión hace POST nativo a FormSubmit y no crea backend ni base de datos.

El destinatario conta.conmigo.1234@gmail.com debe completar la activación que indique FormSubmit. Publicar la página no confirma activación ni entrega. Las pruebas no envían consultas reales.
