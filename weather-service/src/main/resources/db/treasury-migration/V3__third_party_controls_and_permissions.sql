-- Additive only: do not infer historical obligations or grant any identity access.
ALTER TABLE accounts ADD COLUMN requires_member BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN requires_supplier BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN auxiliary_type VARCHAR(30);
ALTER TABLE accounts ADD CONSTRAINT account_auxiliary_type CHECK (
 auxiliary_type IS NULL OR auxiliary_type IN ('MEMBER_DEBT','MEMBER_ADVANCE','SUPPLIER_DEBT','SUPPLIER_ADVANCE'));
ALTER TABLE accounts ADD CONSTRAINT account_auxiliary_party CHECK (
 auxiliary_type IS NULL OR
 (auxiliary_type IN ('MEMBER_DEBT','MEMBER_ADVANCE') AND requires_member=TRUE AND requires_supplier=FALSE) OR
 (auxiliary_type IN ('SUPPLIER_DEBT','SUPPLIER_ADVANCE') AND requires_supplier=TRUE AND requires_member=FALSE));
CREATE TABLE suppliers (
 id VARCHAR(36) PRIMARY KEY,
 institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id),
 name VARCHAR(200) NOT NULL, external_reference VARCHAR(100) NOT NULL DEFAULT '',
 email VARCHAR(200) NOT NULL DEFAULT '', notes VARCHAR(2000) NOT NULL DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE(institution_id,id)
);
ALTER TABLE journal_lines ADD COLUMN supplier_id VARCHAR(36);
ALTER TABLE journal_lines ADD CONSTRAINT journal_supplier_tenant
 FOREIGN KEY(institution_id,supplier_id) REFERENCES suppliers(institution_id,id);
CREATE INDEX supplier_ledger ON journal_lines(institution_id,supplier_id);
CREATE TABLE treasury_permissions (
 institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id),
 provider VARCHAR(30) NOT NULL, account_id VARCHAR(200) NOT NULL,
 can_read BOOLEAN NOT NULL DEFAULT FALSE,
 can_write BOOLEAN NOT NULL DEFAULT FALSE,
 can_confirm BOOLEAN NOT NULL DEFAULT FALSE,
 granted_by VARCHAR(200) NOT NULL, granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(institution_id,provider,account_id),
 CHECK((can_write=FALSE AND can_confirm=FALSE) OR can_read=TRUE)
);
