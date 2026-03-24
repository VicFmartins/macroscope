package com.macroscope.scoring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import com.macroscope.scoring.config.ScoringProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    void setUp() {
        ScoringProperties scoringProperties = new ScoringProperties();
        scoringProperties.setDefaultProfile("MODERATE");

        scoringService = new ScoringService(
                mock(CountrySnapshotRepository.class),
                scoringProperties,
                new ObjectMapper().findAndRegisterModules(),
                mock(StringRedisTemplate.class)
        );
    }

    @Test
    void calculateScore_shouldRewardLowInflationAndStableIndicators() {
        CountrySnapshot snapshot = CountrySnapshot.builder()
                .countryCode("USA")
                .collectedAt(LocalDateTime.now())
                .inflation(new BigDecimal("2.50"))
                .interestRate(new BigDecimal("4.00"))
                .exchangeRate(new BigDecimal("1.00"))
                .costOfLivingIndex(new BigDecimal("65000.00"))
                .build();

        BigDecimal score = scoringService.calculateScore(snapshot);

        assertThat(score).isGreaterThan(new BigDecimal("70.00"));
    }

    @Test
    void calculateScore_shouldFallbackToNeutralForMissingIndicators() {
        CountrySnapshot snapshot = CountrySnapshot.builder()
                .countryCode("BRA")
                .collectedAt(LocalDateTime.now())
                .build();

        BigDecimal score = scoringService.calculateScore(snapshot);

        assertThat(score).isEqualByComparingTo("50.00");
    }
}
