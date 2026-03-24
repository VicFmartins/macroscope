package com.macroscope.insight.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.insight.config.InsightProperties;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class GeminiLLMClientTest {

    @Test
    void parseInsightDraftShouldReadJsonPayloadFromCandidateText() {
        GeminiLLMClient client = new GeminiLLMClient(
                mock(WebClient.Builder.class),
                new ObjectMapper(),
                new InsightProperties()
        );

        String rawResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"summary\\":\\"Macro conditions are improving.\\" ,\\"riskLevel\\":\\"MEDIUM\\",\\"recommendation\\":\\"Prefer gradual exposure.\\"}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        assertThat(client.parseInsightDraft(rawResponse))
                .isPresent()
                .get()
                .extracting("summary", "riskLevel", "recommendation")
                .containsExactly("Macro conditions are improving.", "MEDIUM", "Prefer gradual exposure.");
    }
}
