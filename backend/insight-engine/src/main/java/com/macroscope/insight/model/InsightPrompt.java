package com.macroscope.insight.model;

public record InsightPrompt(
        String systemInstruction,
        String userPrompt
) {
}
