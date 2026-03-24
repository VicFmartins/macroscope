package com.macroscope.insight.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InsightContext(
        String countryCode,
        String countryName,
        String investorProfile,
        LocalDateTime collectedAt,
        BigDecimal score,
        BigDecimal inflation,
        BigDecimal interestRate,
        BigDecimal exchangeRate,
        BigDecimal costOfLivingIndex,
        BigDecimal currencyStabilityScore
) {
}
