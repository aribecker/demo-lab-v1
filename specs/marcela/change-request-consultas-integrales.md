# Change request — consultas profesionales integrales
Estado: especificación de trabajo, no implementada. 2026-10-29.
Base: zona-marcela-schpilberg bcc0f75fa2b864c5f4fdfb1ae98f944ec5b7dac5.
Esta especificación sustituye las restricciones de specs/marcela/platform.md que prohíben backend, base y administración y el uso previsto del backend compartido. Conserva su diseño y condiciones de precio y plazo salvo aclaración expresa aquí.

## Objetivo y fases
Una plataforma para atención personal de Marcela: consultas, clases y trabajos. Fase 1: catálogo configurable, asistente, registro persistente, notificaciones, confirmación, panel privado, estados y respuestas. Fase 2: modalidades, tarifas, presupuestos y pagos manuales. Fase 3: disponibilidad y reuniones; fase 4: Calendar, videoconferencia, pagos y portal, sujetos a decisión posterior. No implementar fases 2–4 ahora.
El precio existente de ARS 10.000 por una consulta semanal y el compromiso de hasta siete días corridos para consultas del abono se conservan explícitamente; no aplicar ese plazo a solicitudes fuera del abono ni publicar otros precios sin aprobación. Categorías iniciales pendientes de validación de Marcela.

## Modelo funcional
Objetivos: CONSULTAS, CLASES y TRABAJOS. Áreas configurables por objetivo:
- CONSULTAS: Contabilidad, impuestos, auditoría, pericias, trámites, otros/no estoy seguro.
- CLASES: Contabilidad, auditoría, impuestos, pericias, otras materias/no estoy seguro.
- TRABAJOS: Estados contables, auditoría, impuestos, pericias, trámites, otros/no estoy seguro.
Tipos de necesidad opcionales, configurados por objetivo y cuando corresponda área: para trámites ARCA, IGJ, inscripciones profesionales, presentaciones y gestiones administrativas, otros; para clases consulta puntual, clase individual, preparación de examen, acompañamiento; para trabajos estados contables, auditoría, liquidaciones impositivas, pericias, otro; para consultas duda puntual, procedimiento, análisis de situación, otro. No forzar al visitante a conocer la clasificación precisa.
Solicitud: nombre, email, objetivo, área y descripción obligatorios; teléfono, tipo de necesidad, disponibilidad y datos complementarios opcionales. Validar longitudes y sintaxis también en servidor. Advertir que no se incluyan contraseñas, datos bancarios ni información confidencial innecesaria.

## UI/UX
Mantener paleta, tipografía, BEM, responsive y accesibilidad de platform.md. Navegación Inicio, Servicios y Realizar consulta. Asistente de tres pasos: objetivo; tema; datos y necesidad. Mostrar sólo opciones coherentes, permitir volver sin perder datos, errores asociados a controles y foco visible. Tras persistencia exitosa, mostrar identificador y confirmación de recepción, sin afirmar que un email llegó. Texto: “¡Gracias por tu consulta! Recibí tu solicitud y voy a revisar personalmente la información que me enviaste. Me comunicaré con vos para indicarte cómo podemos avanzar.”
Panel privado: lista filtrable por objetivo, área, fecha y estado; detalle, historial, notas internas, respuesta y cambio de estado. No exponer notas internas al cliente. El acceso debe estar autorizado en servidor, no sólo oculto en React.

## Datos y seguridad — diseño para fase 1
En Postgres separar el dominio Marcela en esquema y credenciales de privilegios mínimos, sin afectar esquemas existentes. Migraciones versionadas y transaccionales. UUID e instantes UTC; índices por fecha, estado, objetivo y área. No almacenar secretos en Git o cliente.
- consultation_categories: id, parent_id nullable, kind (objetivo/área), código estable, etiqueta, activo, orden; relación de área con objetivo.
- consultation_subcategories: id, objetivo_id, area_id nullable, etiqueta, activo, orden.
- consultation_requests: id UUID, nombre, email, teléfono nullable, objetivo_id, área_id, subcategoría_id nullable, descripción, disponibilidad y complementos nullable, estado, created_at, updated_at.
- consultation_messages: id, request_id, tipo (cliente/interna/respuesta), contenido, autor administrativo nullable, created_at.
- request_status_history: id, request_id, estado anterior/nuevo, actor, timestamp.
- notification_logs: id, request_id, destinatario, tipo, estado, intentos, referencia proveedor y fecha; sin guardar secretos. Outbox transaccional para evitar perder notificaciones al fallar correo, con reintentos limitados y trazabilidad.
- admin_users/sessions: identidad verificada, autorización explícita, sesiones seguras revocables. OAuth Google opcional; no conceder acceso por cualquier cuenta Google. Seleccionar identidad autorizada y configurar proveedor antes de producción.
Estados fase 1 RECIBIDA, EN_REVISION y RESPONDIDA; historial completo. Los estados adicionales de fases posteriores no requieren etapas obligatorias. Proteger contra spam, limitar tamaño y frecuencia, evitar revelar datos en logs, usar HTTPS, CSRF cuando se usen cookies y política de retención definida antes de operar con datos reales.
Fases futuras: service_types, service_rates, quotes, payment_records, availability_slots y appointments. Distinguir horarios disponibles, propuestos y confirmados; impedir solapamientos mediante validación transaccional y restricción de base de datos. No agregar tablas ni lógica de negocio futura salvo migraciones expresamente justificadas.

## Contrato API propuesto
JSON UTF-8, errores con código y mensaje apto para UI; no retornar datos privados al público.
- GET /api/catalog: objetivos, áreas y tipos activos y relaciones.
- POST /api/requests: campos del formulario; validar pertenencia entre categorías. Respuesta 201 {id, status: RECIBIDA} sólo después de guardar solicitud e intenciones de notificación atómicamente. Fallos de validación 400/422; indisponibilidad 503 sin falsa confirmación. Proteger duplicados por clave de idempotencia.
- GET /api/admin/requests: autenticado y autorizado; filtros objetivo, área, estado y fechas, paginación.
- GET /api/admin/requests/{id}: detalle e historial, sólo administrador.
- POST /api/admin/requests/{id}/notes: guardar nota interna.
- PATCH /api/admin/requests/{id}/status: cambio controlado y registro histórico.
- POST /api/admin/requests/{id}/responses: guardar respuesta y registrar envío mediante outbox; diferenciar pendiente, enviado y fallido. No marcar email entregado por aceptar solicitud del proveedor.
Endpoints de autenticación dependen de la solución elegida. No admitir credenciales por defecto.

## Notificaciones
Al crear solicitud en una transacción registrar notificaciones para Marcela y solicitante; el transporte se configura mediante secretos en servidor. La confirmación visual informa recepción persistida, no entrega del correo. El destinatario y el remitente autorizado deben confirmarse; no asumir que la cuenta del formulario existente tiene credenciales ni capacidad SMTP. El panel debe señalar fallas y permitir reintento controlado. Verificación de envío a personas requiere entorno y destinatarios de prueba apropiados.

## Aceptación y pruebas
1. Cada objetivo presenta sus áreas y opción de incertidumbre; cambios limpian selecciones incompatibles.
2. Campos obligatorios y límites validados en cliente y servidor. Se permite texto libre y campos opcionales vacíos.
3. Registro recuperable tras reinicio con UUID único y estado RECIBIDA; fallos de DB no muestran éxito.
4. Confirmación visual refleja sólo registro persistido; eventos de correo quedan registrados y reintentables.
5. Un usuario anónimo o no autorizado no puede listar, leer, responder ni cambiar solicitudes; notas internas nunca se filtran a vista pública.
6. Administrador autorizado filtra, revisa, escribe nota, responde y modifica estado con historial; fallo de entrega se refleja correctamente.
7. Se mantienen oferta y plazo originales en su alcance, identidad visual y funcionamiento a 320px y escritorio.
8. Tests automatizados de validación, catálogo, persistencia, autorización, estados, outbox y fallos; revisión visual responsive; pruebas de integración con Postgres y correo controlado.
9. Despliegue sólo tras configurar y verificar backend, DB, identidad administrativa y correo. No modificar Demo Lab, Trading o Tesorería.
