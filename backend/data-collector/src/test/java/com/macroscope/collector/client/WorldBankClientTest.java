package com.macroscope.collector.client;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WorldBankClientTest {

    private MockWebServer mockServer;
    private WorldBankClient client;

    @BeforeEach
    void setUp() throws IOException {
        mockServer = new MockWebServer();
        mockServer.start();

        WebClient webClient = WebClient.builder()
                .baseUrl(mockServer.url("/").toString())
                .build();
        client = new WorldBankClient(webClient);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockServer.shutdown();
    }

    @Test
    void fetchIndicatorAsMap_shouldParseValidResponse() throws InterruptedException {
        String json = """
                [
                  {"page": 1, "pages": 1, "per_page": "50", "total": 2},
                  [
                    {"countryiso3code": "BRA", "value": 4.62, "date": "2023"},
                    {"countryiso3code": "USA", "value": 3.40, "date": "2023"}
                  ]
                ]
                """;
        mockServer.enqueue(new MockResponse()
                .setBody(json)
                .addHeader("Content-Type", "application/json"));

        Map<String, BigDecimal> result = client.fetchIndicatorAsMap("FP.CPI.TOTL.ZG").block();

        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get("BRA")).isEqualByComparingTo("4.62");
        assertThat(result.get("USA")).isEqualByComparingTo("3.40");
    }

    @Test
    void fetchIndicatorAsMap_shouldOmitEntriesWithNullValue() throws InterruptedException {
        String json = """
                [
                  {"page": 1},
                  [
                    {"countryiso3code": "BRA", "value": null, "date": "2023"},
                    {"countryiso3code": "DEU", "value": 2.10, "date": "2023"}
                  ]
                ]
                """;
        mockServer.enqueue(new MockResponse()
                .setBody(json)
                .addHeader("Content-Type", "application/json"));

        Map<String, BigDecimal> result = client.fetchIndicatorAsMap("FP.CPI.TOTL.ZG").block();

        assertThat(result).doesNotContainKey("BRA");
        assertThat(result.get("DEU")).isEqualByComparingTo("2.10");
    }

    @Test
    void fetchIndicatorAsMap_shouldReturnEmptyMapOnServerError() {
        mockServer.enqueue(new MockResponse().setResponseCode(503));

        Map<String, BigDecimal> result = client.fetchIndicatorAsMap("FP.CPI.TOTL.ZG").block();

        assertThat(result).isEmpty();
    }

    @Test
    void fetchIndicatorAsMap_shouldReturnEmptyMapOnMalformedResponse() {
        mockServer.enqueue(new MockResponse()
                .setBody("not-json")
                .addHeader("Content-Type", "application/json"));

        Map<String, BigDecimal> result = client.fetchIndicatorAsMap("FP.CPI.TOTL.ZG").block();

        assertThat(result).isEmpty();
    }

    @Test
    void fetchIndicatorAsMap_shouldSendBatchRequestWithSemicolonSeparatedCodes() throws InterruptedException {
        String json = """
                [{"page": 1}, []]
                """;
        mockServer.enqueue(new MockResponse()
                .setBody(json)
                .addHeader("Content-Type", "application/json"));

        client.fetchIndicatorAsMap("FP.CPI.TOTL.ZG").block();

        RecordedRequest request = mockServer.takeRequest();
        String path = request.getPath();

        // Deve conter os 30 países no path — separados por ";" (não URL-encoded)
        assertThat(path).contains("BRA").contains("USA").contains("DEU");
        assertThat(path).contains("FP.CPI.TOTL.ZG");
        assertThat(path).contains("mrv=1");
    }
}
