# Grounding — solicitudes integrales

2026-10-29. Base zona-marcela-schpilberg bcc0f75fa2b864c5f4fdfb1ae98f944ec5b7dac5; especificación change-request-consultas-integrales.md commit d82ac632c88d99bd847933156977b84d09064fa5.

La aplicación real usa React/Vite, formulario HTML con FormSubmit, CSS BEM central y no tiene API propia. El servicio Render estático despliega automáticamente la rama zona-marcela-schpilberg. La rama de trabajo se mantiene separada para evitar desplegar un formulario parcialmente conectado. La base PostgreSQL existente es compartida con otros proyectos; no se ha configurado esquema ni credenciales independientes. Las credenciales de correo y la identidad autorizada del panel aún no están verificadas.

El asistente consumirá el catálogo de la API y no mostrará una confirmación de envío si el servidor no confirma registro persistente. Conservar precio y plazo originales y mantener la UI vigente hasta contar con implementación y validaciones completas. Pruebas locales sin envío de correos reales.
