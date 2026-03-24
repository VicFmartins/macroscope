package com.macroscope.collector.client;

import com.macroscope.collector.config.CollectorConfig;
import com.macroscope.collector.client.dto.ExchangeRatesResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Cliente para a Exchange Rates API v6 (free tier).
 *
 * <p>Busca todas as taxas de câmbio com base no USD em uma única requisição.
 * Se {@code EXCHANGE_RATES_API_KEY} não estiver configurada, retorna mapa vazio
 * e os snapshots terão {@code exchange_rate = null}.
 *
 * <p>Documentação: https://www.exchangerate-api.com/docs/standard-requests
 */
@Component
@Slf4j
public class ExchangeRatesClient {

    private static final String EXAMPLE_API_KEY = "your_exchange_rates_key_here";

    private final WebClient webClient;
    private final CollectorConfig config;

    public ExchangeRatesClient(
            @Qualifier("exchangeRatesWebClient") WebClient webClient,
            CollectorConfig config) {
        this.webClient = webClient;
        this.config = config;
    }

    /**
     * Retorna todas as taxas de câmbio em relação ao USD.
     *
     * <p>Chave do mapa: código ISO 4217 (ex: "BRL", "EUR").
     * Valor: quantidade de moeda local por 1 USD.
     *
     * @return Mono com o mapa de taxas; retorna mapa vazio em caso de erro ou chave ausente
     */
    public Mono<Map<String, BigDecimal>> fetchRatesVsUsd() {
        if (!hasUsableApiKey()) {
            log.warn("EXCHANGE_RATES_API_KEY não configurada — câmbio não será coletado nesta rodada");
            return Mono.just(new HashMap<>());
        }

        return webClient.get()
                .uri("/{apiKey}/latest/USD", config.getExchangeRatesApiKey())
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> {
                    log.warn("Exchange Rates API retornou erro {}", response.statusCode());
                    return Mono.error(new RuntimeException("Exchange Rates API error: " + response.statusCode()));
                })
                .bodyToMono(ExchangeRatesResponseDto.class)
                .map(dto -> {
                    if (!"success".equals(dto.result()) || dto.conversionRates() == null) {
                        log.warn("Exchange Rates API retornou resultado inesperado: {}", dto.result());
                        return new HashMap<String, BigDecimal>();
                    }
                    return dto.conversionRates();
                })
                .doOnSuccess(m -> log.debug("Exchange Rates: {} moedas recebidas", m.size()))
                .doOnError(e -> log.warn("Falha ao buscar câmbio: {}", e.getMessage()))
                .onErrorReturn(new HashMap<>());
    }

    private boolean hasUsableApiKey() {
        return StringUtils.hasText(config.getExchangeRatesApiKey())
                && !EXAMPLE_API_KEY.equalsIgnoreCase(config.getExchangeRatesApiKey().trim());
    }
}
