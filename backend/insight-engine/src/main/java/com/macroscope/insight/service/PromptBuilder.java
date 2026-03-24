package com.macroscope.insight.service;

import com.macroscope.insight.model.InsightContext;
import com.macroscope.insight.model.InsightPrompt;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PromptBuilder {

    public InsightPrompt build(InsightContext context) {
        String systemInstruction = """
                You are MacroScope, a senior macroeconomic analyst.
                Analyze the provided country data and return valid JSON only.
                The JSON object must contain exactly these fields:
                - summary: 2 to 3 sentences
                - riskLevel: one of LOW, MEDIUM, HIGH
                - recommendation: one concise investment recommendation
                Keep the analysis grounded in the supplied data. Do not invent numbers.
                """;

        String userPrompt = """
                Analyze the following country economic data.

                Country: %s (%s)
                Investor profile: %s
                Collected at (UTC): %s
                Inflation: %s
                Interest rate: %s
                Exchange rate vs USD: %s
                Currency stability score (0-100, higher is better): %s
                Cost of living proxy (GDP PPP per capita): %s
                Macro score (0-100): %s

                Provide:
                1. Summary (2-3 sentences)
                2. Risk level (LOW, MEDIUM, HIGH)
                3. Investment recommendation
                """.formatted(
                context.countryName(),
                context.countryCode(),
                context.investorProfile(),
                context.collectedAt(),
                formatMetric(context.inflation(), "%"),
                formatMetric(context.interestRate(), "%"),
                formatMetric(context.exchangeRate(), ""),
                formatMetric(context.currencyStabilityScore(), ""),
                formatMetric(context.costOfLivingIndex(), " USD"),
                formatMetric(context.score(), "")
        );

        return new InsightPrompt(systemInstruction, userPrompt);
    }

    private String formatMetric(BigDecimal value, String suffix) {
        if (value == null) {
            return "N/A";
        }
        return value.stripTrailingZeros().toPlainString() + suffix;
    }
}
