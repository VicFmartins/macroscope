package com.macroscope.collector.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO de resposta da Exchange Rates API v6 (free tier).
 *
 * <p>Exemplo de resposta:
 * <pre>
 * {
 *   "result": "success",
 *   "base_code": "USD",
 *   "conversion_rates": {
 *     "BRL": 5.12,
 *     "EUR": 0.92,
 *     ...
 *   }
 * }
 * </pre>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExchangeRatesResponseDto(

        /** "success" ou "error" */
        String result,

        /** Moeda base da cotação (sempre "USD" nas nossas chamadas). */
        @JsonProperty("base_code")
        String baseCode,

        /** Mapa de código de moeda (ISO 4217) → taxa de câmbio em relação ao USD. */
        @JsonProperty("conversion_rates")
        Map<String, BigDecimal> conversionRates
) {}
