package com.macroscope.country.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CountrySnapshotResponse(
        String countryCode,
        String displayName,
        LocalDateTime collectedAt,
        BigDecimal inflation,
        BigDecimal interestRate,
        BigDecimal exchangeRate,
        BigDecimal costOfLivingIndex,
        BigDecimal score,
        String investorProfile
) {
}
