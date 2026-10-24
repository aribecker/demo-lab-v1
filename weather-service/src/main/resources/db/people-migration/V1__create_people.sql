CREATE TABLE people (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    request_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT people_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 100)
);
-- The primary key supports newest-first cursor pagination. Equal names are allowed.
