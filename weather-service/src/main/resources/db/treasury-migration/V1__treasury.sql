CREATE TABLE themes (
 id VARCHAR(30) PRIMARY KEY, name VARCHAR(100) NOT NULL,
 primary_color VARCHAR(7) NOT NULL, accent_color VARCHAR(7) NOT NULL
);
INSERT INTO themes VALUES ('generic','Clásico','#163047','#c89c45'),('scottish','Verde escocés','#174b3c','#c7ab67'),('mariners','Mariners · azul','#163e63','#d0ae65'),('club','Club · borgoña','#652c45','#c29c59');
CREATE TABLE institutions (
 id VARCHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, code VARCHAR(30) NOT NULL UNIQUE,
 theme_id VARCHAR(30) NOT NULL REFERENCES themes(id), active BOOLEAN NOT NULL DEFAULT TRUE,
 next_entry BIGINT NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE members (
 id VARCHAR(36) PRIMARY KEY, institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id),
 first_name VARCHAR(120) NOT NULL, last_name VARCHAR(120) NOT NULL, residence VARCHAR(240) NOT NULL DEFAULT '',
 membership_number VARCHAR(50) NOT NULL DEFAULT '', email VARCHAR(200) NOT NULL DEFAULT '',
 phone VARCHAR(80) NOT NULL DEFAULT '', notes VARCHAR(2000) NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE(institution_id,id)
);
CREATE TABLE accounts (
 id VARCHAR(36) PRIMARY KEY, institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id),
 code VARCHAR(30) NOT NULL, name VARCHAR(160) NOT NULL,
 type VARCHAR(20) NOT NULL CHECK(type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
 parent_id VARCHAR(36), currency_policy VARCHAR(4) NOT NULL CHECK(currency_policy IN ('ARS','USD','BOTH')),
 allows_posting BOOLEAN NOT NULL DEFAULT TRUE, active BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE(institution_id,id), UNIQUE(institution_id,code),
 FOREIGN KEY(institution_id,parent_id) REFERENCES accounts(institution_id,id), CHECK(parent_id IS NULL OR parent_id<>id)
);
CREATE TABLE journal_entries (
 id VARCHAR(36) PRIMARY KEY, institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id),
 entry_number BIGINT NOT NULL, entry_date DATE NOT NULL, description VARCHAR(1000) NOT NULL,
 reference VARCHAR(200) NOT NULL DEFAULT '', status VARCHAR(10) NOT NULL CHECK(status IN ('DRAFT','POSTED')),
 reversal_of_id VARCHAR(36), created_by VARCHAR(200) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, posted_at TIMESTAMP,
 UNIQUE(institution_id,id), UNIQUE(institution_id,entry_number), UNIQUE(institution_id,reversal_of_id),
 FOREIGN KEY(institution_id,reversal_of_id) REFERENCES journal_entries(institution_id,id)
);
CREATE TABLE journal_lines (
 id VARCHAR(36) PRIMARY KEY, institution_id VARCHAR(36) NOT NULL, journal_entry_id VARCHAR(36) NOT NULL,
 position INTEGER NOT NULL, account_id VARCHAR(36) NOT NULL, member_id VARCHAR(36),
 description VARCHAR(500) NOT NULL DEFAULT '', currency VARCHAR(3) NOT NULL CHECK(currency IN ('ARS','USD')),
 debit NUMERIC(18,2) NOT NULL DEFAULT 0, credit NUMERIC(18,2) NOT NULL DEFAULT 0,
 FOREIGN KEY(institution_id,journal_entry_id) REFERENCES journal_entries(institution_id,id) ON DELETE CASCADE,
 FOREIGN KEY(institution_id,account_id) REFERENCES accounts(institution_id,id),
 FOREIGN KEY(institution_id,member_id) REFERENCES members(institution_id,id),
 CHECK((debit>0 AND credit=0) OR (credit>0 AND debit=0)), UNIQUE(journal_entry_id,position)
);
CREATE TABLE journal_attachments (
 id VARCHAR(36) PRIMARY KEY, institution_id VARCHAR(36) NOT NULL, journal_entry_id VARCHAR(36) NOT NULL,
 file_name VARCHAR(200) NOT NULL, content_type VARCHAR(50) NOT NULL, file_size BIGINT NOT NULL,
 file_data BYTEA NOT NULL, description VARCHAR(500) NOT NULL DEFAULT '',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(institution_id,journal_entry_id) REFERENCES journal_entries(institution_id,id) ON DELETE CASCADE,
 CHECK(file_size>0 AND file_size<=5242880)
);
CREATE INDEX journal_dates ON journal_entries(institution_id,status,entry_date,entry_number);
CREATE INDEX account_ledger ON journal_lines(institution_id,account_id);
CREATE INDEX member_ledger ON journal_lines(institution_id,member_id);
CREATE INDEX attachments_entry ON journal_attachments(institution_id,journal_entry_id);
