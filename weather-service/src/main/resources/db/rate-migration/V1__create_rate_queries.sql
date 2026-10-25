CREATE TABLE bitcoin_shared.rate_queries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    provider VARCHAR(16) NOT NULL DEFAULT 'BINANCE',
    symbol VARCHAR(16) NOT NULL DEFAULT 'BTCUSDT',
    status VARCHAR(16) NOT NULL,
    price NUMERIC(30,12),
    http_status INTEGER,
    error_code VARCHAR(64),
    CONSTRAINT rate_query_result CHECK (
        (status = 'IN_PROGRESS' AND completed_at IS NULL AND price IS NULL AND error_code IS NULL) OR
        (status = 'SUCCESS' AND completed_at IS NOT NULL AND price IS NOT NULL AND error_code IS NULL) OR
        (status = 'ERROR' AND completed_at IS NOT NULL AND price IS NULL AND error_code IS NOT NULL)
    ),
    CONSTRAINT rate_query_time CHECK (completed_at IS NULL OR completed_at >= requested_at),
    CONSTRAINT rate_query_price CHECK (price IS NULL OR (price > 0 AND price <= 1000000000000)),
    CONSTRAINT rate_query_http CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
    CONSTRAINT rate_query_provider CHECK (provider = 'BINANCE'),
    CONSTRAINT rate_query_symbol CHECK (symbol = 'BTCUSDT')
);
CREATE INDEX rate_queries_requested_at_idx ON bitcoin_shared.rate_queries(requested_at DESC, id DESC);
