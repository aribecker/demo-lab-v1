-- Optional manual provisioning for a PostgreSQL server you administer.
-- Render/Compose provision the database and user themselves: do not run this there.
-- Run with psql as an administrator; psql prompts securely for the role password.
-- Do not pass the password in command-line arguments or commit it.
\set ON_ERROR_STOP on
SELECT 'CREATE ROLE people LOGIN' WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people') \gexec
\password people
SELECT 'CREATE DATABASE people_demo OWNER people' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'people_demo') \gexec
-- Start people-service with PEOPLE_PROFILE=database after provisioning.
-- Flyway, not this bootstrap script, creates and versions the application tables.
