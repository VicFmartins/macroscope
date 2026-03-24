package com.macroscope.insight.service;

import com.macroscope.insight.model.InsightContext;
import com.macroscope.insight.model.InsightPrompt;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PromptBuilderTest {

    private final PromptBuilder promptBuilder = new PromptBuilder();

    @Test
    void buildShouldIncludeCoreEconomicSignals() {
        InsightContext context = new InsightContext(
                "BRA",
                "Brazil",
                "MODERATE",
                LocalDateTime.of(2026, 3, 24, 21, 0),
                new BigDecimal("40.05"),
                new BigDecimal("4.37"),
                new BigDecimal("13.75"),
                new BigDecimal("5.12"),
                new BigDecimal("22338.48"),
                new BigDecimal("48.90")
        );

        InsightPrompt prompt = promptBuilder.build(context);

        assertThat(prompt.systemInstruction()).contains("valid JSON only");
        assertThat(prompt.userPrompt()).contains("Brazil (BRA)");
        assertThat(prompt.userPrompt()).contains("Inflation: 4.37%");
        assertThat(prompt.userPrompt()).contains("Interest rate: 13.75%");
        assertThat(prompt.userPrompt()).contains("Currency stability score (0-100, higher is better): 48.9");
        assertThat(prompt.userPrompt()).contains("Macro score (0-100): 40.05");
    }
}
