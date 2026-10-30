# Conta Conmigo API

Node 22, Express, PostgreSQL. Comandos: npm ci, npm test, npm start.

Variables en Render: DATABASE_URL (credencial compartida autorizada, base ariel_sdd_people_db), ADMIN_TOKEN (mínimo 32 caracteres), MARCELA_EMAIL, FRONTEND_ORIGIN=https://contaconmigo.onrender.com, SMTP_URL y MAIL_FROM cuando se configure correo. PORT lo proporciona Render. Ningún secreto se guarda en Git.

El arranque ejecuta migrate-schema.sql y schema.sql en una transacción. Renombra marcela a contaconmigo conservando los datos; aborta si ambos existen. Ejecutar sólo durante el corte coordinado de la API anterior. Todas las tablas quedan calificadas con contaconmigo. Sin SMTP_URL las notificaciones permanecen pendientes.
