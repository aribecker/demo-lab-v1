# Respaldo de seguridad de tesorería

Agregar «Respaldo de seguridad» al menú y ruta /backup, disponible sin selección de institución. Respalda TODO el esquema treasury de PostgreSQL compartido; no incluir sesiones, trading, ni otros esquemas.

Antes de generar o enviar, mostrar «Por favor, confirmá. Se enviará un correo a aribecker2@gmail.com con los siguientes archivos adjuntos», alcance y nombres exactos Treasury Database-YYYYMMDD.zip y Treasury Database-YYYYMMDD.xlsx, fecha de Buenos Aires fijada al preparar la confirmación. Botones Cancelar y Confirmar y enviar. No generar ni enviar al abrir pantalla/cancelar.

ZIP: pg_dump SQL completo del esquema, incluyendo estructura, datos, claves, índices, secuencias, historial Flyway y comprobantes BYTEA; README con restauración en una base vacía de PostgreSQL. Sin propietarios, permisos ni credenciales. Excel XLSX real, una hoja por tabla incluida la tabla de migraciones, encabezados incluso para tablas vacías y todas las filas. Textos y decimales exactos, nunca fórmulas; fechas ISO, NULL como celda vacía; BYTEA base64 dividido en columnas de 30000 caracteres, sin truncamiento.

Ambos archivos usan la misma transacción REPEATABLE READ y snapshot exportado a pg_dump. Detección de límites: 100 MiB SQL, 18 MiB combinados ZIP/XLSX, máximo Excel 1048576 filas y 16384 columnas, error explícito sin envío parcial. Procesos limitados a 45 segundos y archivos temporales eliminados incluso al fallar.

Envío HTTPS mediante Resend desde el backend. Destinatario fijo, no aceptado del cliente. Configuración privada TREASURY_BACKUP_MAIL_API_KEY y TREASURY_BACKUP_MAIL_FROM; no reutilizar OAuth de login como permiso de correo. Mostrar configuración pendiente si falta. Éxito significa proveedor aceptó el correo, no entrega confirmada en Gmail. Nunca reportar éxito ante fallo. Reintentos usan el mismo ID de confirmación y bytes para idempotencia; exclusión concurrente y enfriamiento de 60 segundos.

Conservar acceso anónimo de Treasury expresamente autorizado antes. El respaldo nunca se devuelve al navegador ni acepta destinatarios alternativos. Sin envío real durante pruebas automáticas.
