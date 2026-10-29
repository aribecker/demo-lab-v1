-- Ejecutar una sola vez con permisos administrativos, fuera del servicio web.
-- psql: solicita una clave nueva sin incluirla en el repositorio.
\prompt -s 'Clave nueva para marcela_app: ' marcela_password
BEGIN;
CREATE ROLE marcela_app LOGIN PASSWORD :'marcela_password';
CREATE SCHEMA marcela AUTHORIZATION marcela_app;
COMMIT;
