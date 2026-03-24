package com.macroscope.collector.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Cria beans de {@link WebClient} para cada API externa.
 * Separados para permitir configuração independente (timeout, headers, retry).
 */
@Configuration
public class WebClientConfig {

    /** WebClient pré-configurado para a World Bank API (sem chave, sem limite). */
    @Bean("worldBankWebClient")
    public WebClient worldBankWebClient(CollectorConfig config) {
        return WebClient.builder()
                .baseUrl(config.getWorldBankBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024)) // 4 MB
                .build();
    }

    /** WebClient pré-configurado para a Exchange Rates API (requer chave gratuita). */
    @Bean("exchangeRatesWebClient")
    public WebClient exchangeRatesWebClient(CollectorConfig config) {
        return WebClient.builder()
                .baseUrl(config.getExchangeRatesBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
