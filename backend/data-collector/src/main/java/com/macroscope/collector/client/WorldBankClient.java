package com.macroscope.collector.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.macroscope.collector.domain.CountryCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Cliente para a World Bank API v2 (sem autenticação, sem limite de requisições).
 *
 * <p>Usa requisição em lote (batch) com países separados por ";" para buscar
 * todos os 30 países em uma única chamada HTTP por indicador.
 *
 * <p>Documentação: https://datahelpdesk.worldbank.org/knowledgebase/articles/898590
 */
@Component
@Slf4j
public class WorldBankClient {

    private final WebClient webClient;

    public WorldBankClient(@Qualifier("worldBankWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Busca o valor mais recente de um indicador para todos os 30 países monitorados.
     *
     * <p>URL gerada: {@code /country/BRA;USA;.../indicator/{code}?format=json&mrv=1&per_page=50}
     *
     * @param indicatorCode código do indicador (ex: {@code FP.CPI.TOTL.ZG})
     * @return Mono com mapa {@code countryCode (alpha-3) → valor}; países sem dados são omitidos
     */
    public Mono<Map<String, BigDecimal>> fetchIndicatorAsMap(String indicatorCode) {
        // Concatenar diretamente no path evita URL-encoding dos ";" pela spec RFC 3986
        String path = "/country/" + CountryCode.ALL_CODES_SEMICOLON + "/indicator/" + indicatorCode;

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(path)
                        .queryParam("format", "json")
                        .queryParam("mrv", "1")
                        .queryParam("per_page", "50")
                        .build())
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> {
                    log.warn("World Bank API retornou erro {} para indicador {}", response.statusCode(), indicatorCode);
                    return Mono.error(new RuntimeException("World Bank API error: " + response.statusCode()));
                })
                .bodyToMono(JsonNode[].class)
                .map(this::extractValues)
                .doOnSuccess(m -> log.debug("World Bank [{}]: {} países com dados", indicatorCode, m.size()))
                .doOnError(e -> log.warn("Falha ao buscar indicador {} do World Bank: {}", indicatorCode, e.getMessage()))
                .onErrorReturn(new HashMap<>());
    }

    /**
     * Extrai o mapa {@code countryCode → valor} da resposta da World Bank API.
     *
     * <p>A API retorna um array de 2 elementos:
     * <ul>
     *   <li>[0] — objeto de metadados (paginação)</li>
     *   <li>[1] — array de entradas, cada uma com {@code countryiso3code} e {@code value}</li>
     * </ul>
     * Entradas com {@code value: null} são ignoradas (dados indisponíveis para aquele ano).
     */
    private Map<String, BigDecimal> extractValues(JsonNode[] response) {
        Map<String, BigDecimal> result = new HashMap<>();

        if (response == null || response.length < 2 || !response[1].isArray()) {
            log.warn("Resposta inesperada da World Bank API (array com < 2 elementos)");
            return result;
        }

        response[1].forEach(entry -> {
            String code = entry.path("countryiso3code").asText(null);
            JsonNode valueNode = entry.path("value");

            if (code != null && !code.isBlank() && !valueNode.isNull() && !valueNode.isMissingNode()) {
                try {
                    result.put(code, new BigDecimal(valueNode.asText()));
                } catch (NumberFormatException e) {
                    log.debug("Valor não numérico para {}: {}", code, valueNode.asText());
                }
            }
        });

        return result;
    }
}
