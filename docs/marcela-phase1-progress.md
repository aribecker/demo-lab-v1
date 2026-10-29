# Fase 1 — implementación en validación

API Node/Express/Postgres independiente. El catálogo por objetivo y áreas se conserva como JSONB editable en consultation_categories; no requiere cambios de frontend. SMTP_URL y MAIL_FROM habilitan transporte Nodemailer. Sin SMTP las notificaciones quedan pendientes, visibles en el panel. Administración inicial mediante clave privada de al menos 32 caracteres en ADMIN_TOKEN, sólo en memoria del navegador y verificada por servidor. Es una solución inicial; OAuth Google no implementado.

Bootstrap opcional con BOOTSTRAP_DATABASE_URL crea rol exclusivo y esquema marcela. Eliminar esa variable tras primer arranque; DATABASE_URL de runtime usa el rol limitado. Marcela utiliza su propia API. Fases posteriores sin implementar.

Pruebas locales: 9 frontend (7 previas y 2 asistente), 5 validación servidor; build aprobado y sintaxis servidor válida. Todavía no equivalen a aceptación completa: verificar API real y responsive. Faltan filtros completos de panel, paginación, política de retención y endurecer sesiones administrativas antes de considerar cierre integral. El cambio se conserva en rama de trabajo hasta comprobar despliegue.
