# Grounding de migración

Fuente revisada: aribecker/0080-prueba-SDD-full-stack, rama marcela-consultas-sdd-fase1, commit 546ab735d0656aeae4fc053ed3bfe28717f6c0f9. Recuperados todos los archivos de marcela-frontend, marcela-api, specs/marcela y documentación Marcela. Se excluyen fuentes de otros proyectos.

La aplicación usa tablas calificadas por esquema en server.js y schema.sql. migrate-schema.sql se ejecuta antes de schema.sql dentro de la misma transacción de inicialización. Renombrar el esquema conserva tablas, datos y relaciones. La migración aborta ante dos esquemas para no ocultar información. Los nombres personales que ve el visitante se conservan; sólo cambian identidad técnica y despliegue.

Acceso: conector GitHub permite escribir en repositorios existentes pero no ofrece creación de repositorio. gh no tiene sesión iniciada. Navegador falla al arrancar. Destino debe crearse antes de efectuar corte; no migrar DB dejando servicios actuales con consultas al esquema anterior.
