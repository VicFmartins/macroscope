package com.macroscope.collector.client;

import com.macroscope.collector.config.CollectorConfig;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ExchangeRatesClientTest {

    private MockWebServer mockServer;
    private ExchangeRatesClient client;
    private CollectorConfig config;

    @BeforeEach
    void setUp() throws IOException {
        mockServer = new MockWebServer();
        mockServer.start();

        config = new CollectorConfig();
        config.setWorldBankBaseUrl("http://unused");
        config.setExchangeRatesBaseUrl(mockServer.url("/").toString());
        config.setExchangeRatesApiKey("test-api-key");

        WebClient webClient = WebClient.builder()
                .baseUrl(mockServer.url("/").toString())
                .build();
        client = new ExchangeRatesClient(webClient, config);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockServer.shutdown();
    }

    @Test
    void fetchRatesVsUsd_shouldParseValidResponse() {
        String json = """
                {
                  "result": "success",
                  "base_code": "USD",
                  "conversion_rates": {
                    "BRL": 5.12,
                    "EUR": 0.92,
                    "JPY": 149.50
                  }
                }
                """;
        mockServer.enqueue(new MockResponse()
                .setBody(json)
                .addHeader("Content-Type", "application/json"));

        Map<String, BigDecimal> result = client.fetchRatesVsUsd().block();

        assertThat(result).isNotNull();
        assertThat(result.get("BRL")).isEqualByComparingTo("5.12");
        assertThat(result.get("EUR")).isEqualByComparingTo("0.92");
        assertThat(result.get("JPY")).isEqualByComparingTo("149.50");
    }

    @Test
    void fetchRatesVsUsd_shouldReturnEmptyMapWhenApiKeyIsBlank() {
        config.setExchangeRatesApiKey("");

        Map<String, BigDecimal> result = client.fetchRatesVsUsd().block();

        assertThat(result).isEmpty();
        // Não deve ter feito nenhuma requisição ao servidor
        assertThat(mockServer.getRequestCount()).isZero();
    }

    @Test
    void fetchRatesVsUsd_shouldIgnoreExampleApiKeyPlaceholder() {
        config.setExchangeRatesApiKey("your_exchange_rates_key_here");

        Map<String, BigDecimal> result = client.fetchRatesVsUsd().block();

        assertThat(result).isEmpty();
        assertThat(mockServer.getRequestCount()).isZero();
    }

    @Test
    void fetchRatesVsUsd_shouldReturnEmptyMapOnServerError() {
        mockServer.enqueue(new MockResponse().setResponseCode(401));

        Map<String, BigDecimal> result = client.fetchRatesVsUsd().block();

        assertThat(result).isEmpty();
    }

    @Test
    void fetchRatesVsUsd_shouldReturnEmptyMapOnErrorResult() {
        String json = """
                {"result": "error", "error-type": "invalid-key"}
                """;
        mockServer.enqueue(new MockResponse()
                .setBody(json)
                .addHeader("Content-Type", "application/json"));

        Map<String, BigDecimal> result = client.fetchRatesVsUsd().block();

        assertThat(result).isEmpty();
    }
}
