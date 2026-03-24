package com.macroscope.collector.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Configurações externas do data-collector.
 * Mapeadas do prefixo {@code macroscope.apis} no application.yml.
 *
 * <p>Ativadas via {@code @ConfigurationPropertiesScan} na classe principal.
 */
@ConfigurationProperties(prefix = "macroscope.apis")
@Getter
@Setter
@Validated
public class CollectorConfig {

    /** URL base da World Bank API. Ex: https://api.worldbank.org/v2 */
    @NotBlank
    private String worldBankBaseUrl;

    /** URL base da Exchange Rates API. Ex: https://v6.exchangerate-api.com/v6 */
    @NotBlank
    private String exchangeRatesBaseUrl;

    /**
     * Chave de API gratuita da Exchange Rates API.
     * Obter em: https://www.exchangerate-api.com/
     * Se vazia, dados de câmbio não serão coletados (coluna ficará null).
     */
    private String exchangeRatesApiKey = "";
}
