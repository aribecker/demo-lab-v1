CREATE SCHEMA IF NOT EXISTS bitcoin_shared;
CREATE TABLE IF NOT EXISTS bitcoin_shared.simulation_state (
    state_id INTEGER PRIMARY KEY CHECK (state_id = 1),
    document TEXT NOT NULL
);
