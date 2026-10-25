CREATE TABLE auth_private.application_sessions (
 token_hash VARCHAR(43) PRIMARY KEY CHECK (CHAR_LENGTH(token_hash) = 43),
 profile TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
 revoked_at TIMESTAMP WITH TIME ZONE,
 CONSTRAINT application_sessions_expiry CHECK (expires_at > created_at)
);
CREATE INDEX application_sessions_expiry_idx ON auth_private.application_sessions(expires_at);
