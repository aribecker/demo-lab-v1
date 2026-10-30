-- Ejecutar en la misma transacción que schema.sql, durante el corte de servicio.
SELECT pg_advisory_xact_lock(726103029);
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='marcela') THEN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='contaconmigo') THEN
   RAISE EXCEPTION 'Existen ambos esquemas; revisar datos antes de migrar';
  END IF;
  ALTER SCHEMA marcela RENAME TO contaconmigo;
 END IF;
END $$;
