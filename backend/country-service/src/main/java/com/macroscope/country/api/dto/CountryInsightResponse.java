package com.macroscope.country.api.dto;

import java.time.Instant;

public record CountryInsightResponse(
        String countryCode,
        String countryName,
        String profile,
        String summary,
        String riskLevel,
        String recommendation,
        String source,
        Instant generatedAt
) {
}
