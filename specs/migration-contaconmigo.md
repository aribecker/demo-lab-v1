# SDD — migración a Conta Conmigo

Esta especificación sustituye los nombres y rutas históricos de specs/marcela/.

Destino GitHub aribecker/contaconmigo, rama main, repositorio privado con únicamente esta aplicación. Directorios frontend/, api/, specs/, docs/ y deploy/. Servicios Render contaconmigo y contaconmigo-api; URLs deseadas homónimas sujetas a disponibilidad. Conservar identidad profesional de Marcela y condiciones comerciales actuales.

Instancia y base PostgreSQL permanecen ariel-sdd-people-db y ariel_sdd_people_db. Usuario compartido autorizado expresamente por el usuario para estas pruebas. Renombrar esquema marcela a contaconmigo en transacción, sin copiar ni eliminar registros, conservando UUID, relaciones, historial y notificaciones. Si existen ambos esquemas, abortar y revisar; no fusionar automáticamente. API debe calificar todas las tablas con contaconmigo.

Orden: crear repositorio privado, guardar especificación, grounding y código en main; probar; detener escrituras durante corte; cambiar fuente de API y frontend y sus comandos; iniciar API con migración; verificar salud y registros existentes; actualizar CORS y URL de API del frontend; desplegar frontend; comprobar ambos servicios y UI. No suspender ni borrar servicios de otras aplicaciones.

Aceptación: ambos servicios apuntan al repositorio nuevo/main, directorios correctos, esquema nuevo con datos conservados, ausencia de operaciones sobre otros esquemas, formulario y panel operativos. Correo continúa pendiente de SMTP; esta migración no resuelve esa configuración.
