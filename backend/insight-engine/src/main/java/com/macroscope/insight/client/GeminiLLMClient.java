package com.macroscope.insight.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.insight.config.InsightProperties;
import com.macroscope.insight.model.InsightPrompt;
import com.macroscope.insight.model.LLMInsightDraft;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiLLMClient implements LLMClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final InsightProperties insightProperties;

    @Value("${macroscope.apis.gemini-api-key:}")
    private String geminiApiKey;

    @Value("${macroscope.apis.gemini-base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Override
    public Optional<LLMInsightDraft> generateInsight(InsightPrompt prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.info("Gemini API key ausente; insight sera gerado via fallback");
            return Optional.empty();
        }

        Map<String, Object> payload = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", prompt.systemInstruction()))
                ),
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt.userPrompt()))
                )),
                "generation_config", Map.of(
                        "temperature", 0.2,
                        "response_mime_type", "application/json"
                )
        );

        try {
            String rawResponse = webClientBuilder
                    .baseUrl(geminiBaseUrl)
                    .build()
                    .post()
                    .uri("/v1beta/models/{model}:generateContent", insightProperties.getModel())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-goog-api-key", geminiApiKey)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(insightProperties.getTimeoutSeconds()))
                    .block();

            if (rawResponse == null || rawResponse.isBlank()) {
                return Optional.empty();
            }

            return parseInsightDraft(rawResponse);
        } catch (Exception exception) {
            log.warn("Falha ao consultar Gemini API: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    Optional<LLMInsightDraft> parseInsightDraft(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                return Optional.empty();
            }

            String candidateText = sanitizeJson(textNode.asText());
            LLMInsightDraft draft = objectMapper.readValue(candidateText, LLMInsightDraft.class);
            return Optional.of(draft);
        } catch (Exception exception) {
            log.warn("Nao foi possivel interpretar a resposta da Gemini API: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    private String sanitizeJson(String candidateText) {
        String trimmed = candidateText.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "");
            trimmed = trimmed.replaceFirst("^```", "");
            trimmed = trimmed.replaceFirst("```$", "");
            trimmed = trimmed.trim();
        }
        return trimmed;
    }
}
