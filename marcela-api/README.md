# API Marcela — configuración

Node 22, PostgreSQL. Instalar con npm ci; npm test; iniciar con npm start.

## Aprovisionamiento
Ejecutar provision-role.sql una sola vez mediante psql con el usuario administrativo. No poner credenciales administrativas en el servicio público. DATABASE_URL debe usar marcela_app y su clave nueva, host interno de la instancia existente y nombre de base existente. El arranque crea exclusivamente tablas del esquema marcela. El usuario limitado debe ser propietario de ese esquema.

## Variables
- DATABASE_URL: conexión con marcela_app.
- ADMIN_TOKEN: secreto aleatorio de al menos 32 caracteres. Acceso inicial al panel; pendiente evolución a sesiones/Google.
- MARCELA_EMAIL: destinatario de notificaciones.
- FRONTEND_ORIGIN: https://marcela-schpilberg-consultas.onrender.com
- SMTP_URL: credenciales del proveedor de correo en una URL segura.
- MAIL_FROM: remitente autorizado por ese proveedor.
- PORT: proporcionado por Render.

Sin SMTP_URL la cola conserva notificaciones pendientes y no se envía correo. No anunciar email entregado. En el frontend VITE_CONSULTATIONS_API=true activa el asistente; VITE_API_URL debe apuntar al backend operativo. El panel se abre con #administracion. La clave no se almacena en navegador.

## Estado
Pruebas unitarias y compilación ejecutadas. Falta integración real con PostgreSQL y SMTP, revisión visual y despliegue. No representa una fase 1 aceptada hasta completar esas verificaciones. Evitar activar el formulario público antes de verificar DB y correo.
