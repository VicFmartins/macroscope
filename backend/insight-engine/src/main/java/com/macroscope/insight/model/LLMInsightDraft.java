package com.macroscope.insight.model;

public record LLMInsightDraft(
        String summary,
        String riskLevel,
        String recommendation
) {
}
