package com.macroscope.collector.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot de indicadores macroeconômicos de um país em um ponto no tempo.
 *
 * <p>Coletado a cada 6h pelo {@code DataCollectionService}.
 * O score e o perfil são preenchidos pelo {@code scoring-engine} após a coleta.
 */
@Entity
@Table(name = "country_snapshot")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CountrySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código ISO 3166-1 alpha-3 (ex: BRA, USA, DEU). */
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "country_code", nullable = false, length = 3, columnDefinition = "CHAR(3)")
    private String countryCode;

    /** Instante da coleta (UTC). */
    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    /**
     * Inflação anual (%) — fonte: World Bank {@code FP.CPI.TOTL.ZG}.
     * Normalização no scoring-engine: INVERTIDA (menor = score mais alto).
     */
    @Column(name = "inflation", precision = 6, scale = 2)
    private BigDecimal inflation;

    /**
     * Taxa de juros real (%) — fonte: World Bank {@code FR.INR.RINR}.
     * Normalização no scoring-engine: INVERTIDA (menor = score mais alto).
     */
    @Column(name = "interest_rate", precision = 6, scale = 2)
    private BigDecimal interestRate;

    /**
     * Taxa de câmbio (moeda local por 1 USD) — fonte: Exchange Rates API.
     * O scoring-engine calcula volatilidade 30d a partir do histórico.
     * Normalização: INVERTIDA na volatilidade (menor volatilidade = score mais alto).
     */
    @Column(name = "exchange_rate", precision = 12, scale = 4)
    private BigDecimal exchangeRate;

    /**
     * Proxy do custo de vida = GDP per capita PPP em USD corrente.
     * Fonte: World Bank {@code NY.GDP.PCAP.PP.CD}.
     * Normalização no scoring-engine: DIRETA (maior = score mais alto).
     *
     * <p>TODO Fase 2: substituir por Numbeo Cost of Living Index.
     */
    @Column(name = "cost_of_living_index", precision = 12, scale = 2)
    private BigDecimal costOfLivingIndex;

    // --- Preenchidos pelo scoring-engine ---

    /** Score proprietário 0–100 calculado pela fórmula ponderada por perfil. */
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    /** Perfil de investidor: CONSERVATIVE, MODERATE ou AGGRESSIVE. */
    @Column(name = "investor_profile", length = 20)
    private String investorProfile;
}
