-- =============================================================================
-- V1 — Schema inicial: tabela country_snapshot
-- =============================================================================

CREATE TABLE country_snapshot (
    id                   BIGSERIAL       PRIMARY KEY,
    country_code         CHAR(3)         NOT NULL,
    collected_at         TIMESTAMP       NOT NULL,
    inflation            NUMERIC(6,2),
    interest_rate        NUMERIC(6,2),
    exchange_rate        NUMERIC(12,4),
    cost_of_living_index NUMERIC(12,2),  -- GDP per capita PPP pode passar de 100.000
    score                NUMERIC(5,2),
    investor_profile     VARCHAR(20)
);

-- Índices para consultas frequentes
CREATE INDEX idx_snapshot_country_code
    ON country_snapshot (country_code);

CREATE INDEX idx_snapshot_collected_at
    ON country_snapshot (collected_at DESC);

CREATE INDEX idx_snapshot_profile_score
    ON country_snapshot (investor_profile, score DESC);

-- Comentários de documentação
COMMENT ON TABLE country_snapshot IS
    'Snapshot de indicadores macroeconômicos por país, coletado a cada 6h';
COMMENT ON COLUMN country_snapshot.country_code IS
    'Código ISO 3166-1 alpha-3 (ex: BRA, USA, DEU)';
COMMENT ON COLUMN country_snapshot.investor_profile IS
    'Perfil do investidor: CONSERVATIVE, MODERATE ou AGGRESSIVE';
COMMENT ON COLUMN country_snapshot.score IS
    'Score proprietário 0–100 calculado pela fórmula ponderada';
