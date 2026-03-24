package com.macroscope.insight.model;

import java.time.Instant;

public record CountryInsight(
        String countryCode,
        String countryName,
        String profile,
        String summary,
        RiskLevel riskLevel,
        String recommendation,
        String source,
        Instant generatedAt
) {
}
