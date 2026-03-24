-- =============================================================================
-- MacroScope — Schema inicial (espelhado nas migrations Flyway do backend)
-- Executado apenas na criação do volume do container postgres
-- =============================================================================

CREATE TABLE IF NOT EXISTS country_snapshot (
    id               BIGSERIAL    PRIMARY KEY,
    country_code     CHAR(3)      NOT NULL,
    collected_at     TIMESTAMP    NOT NULL,
    inflation        NUMERIC(6,2),
    interest_rate    NUMERIC(6,2),
    exchange_rate    NUMERIC(12,4),
    cost_of_living_index NUMERIC(12,2),  -- GDP per capita PPP pode passar de 100.000
    score            NUMERIC(5,2),
    investor_profile VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_country_code
    ON country_snapshot (country_code);

CREATE INDEX IF NOT EXISTS idx_snapshot_collected_at
    ON country_snapshot (collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_profile_score
    ON country_snapshot (investor_profile, score DESC);
