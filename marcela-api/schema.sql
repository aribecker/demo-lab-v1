CREATE SCHEMA IF NOT EXISTS marcela;
CREATE TABLE IF NOT EXISTS marcela.consultation_categories (id text PRIMARY KEY, definition jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS marcela.consultation_requests (
 id uuid PRIMARY KEY, idempotency_key uuid UNIQUE NOT NULL, payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'RECIBIDA' CHECK(status IN ('RECIBIDA','EN_REVISION','RESPONDIDA')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS marcela_requests_date ON marcela.consultation_requests(created_at DESC);
CREATE TABLE IF NOT EXISTS marcela.consultation_messages (
 id uuid PRIMARY KEY, request_id uuid REFERENCES marcela.consultation_requests(id),
 kind text NOT NULL CHECK(kind IN ('INTERNA','RESPUESTA')), body text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS marcela.request_status_history (
 id uuid PRIMARY KEY, request_id uuid REFERENCES marcela.consultation_requests(id), previous_status text, status text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS marcela.notification_logs (
 id uuid PRIMARY KEY, request_id uuid REFERENCES marcela.consultation_requests(id), recipient text NOT NULL,
 kind text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'PENDIENTE', attempts integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now());
