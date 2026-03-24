package com.macroscope.country.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CountryRankingResponse(
        String countryCode,
        String displayName,
        BigDecimal score,
        BigDecimal inflation,
        BigDecimal interestRate,
        BigDecimal exchangeRate,
        BigDecimal costOfLivingIndex,
        LocalDateTime collectedAt,
        String investorProfile
) {
}
