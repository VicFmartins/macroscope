package com.macroscope.insight.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import com.macroscope.insight.client.LLMClient;
import com.macroscope.insight.config.InsightProperties;
import com.macroscope.insight.model.CountryInsight;
import com.macroscope.insight.model.LLMInsightDraft;
import com.macroscope.insight.model.RiskLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InsightServiceTest {

    @Mock private CountrySnapshotRepository repository;
    @Mock private LLMClient llmClient;
    @Mock private StringRedisTemplate stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    private InsightService insightService;

    @BeforeEach
    void setUp() {
        InsightProperties properties = new InsightProperties();
        PromptBuilder promptBuilder = new PromptBuilder();

        insightService = new InsightService(
                repository,
                promptBuilder,
                llmClient,
                stringRedisTemplate,
                new ObjectMapper().findAndRegisterModules(),
                properties
        );
        ReflectionTestUtils.setField(insightService, "defaultProfile", "MODERATE");
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void getInsightShouldUseLlmWhenAvailable() {
        CountrySnapshot snapshot = snapshot("BRA", "40.05", "4.37", "8.25", "5.12");
        when(repository.findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc("BRA", "MODERATE"))
                .thenReturn(Optional.of(snapshot));
        when(repository.findRecentByCountryCode(anyString(), any())).thenReturn(List.of(snapshot, snapshot("BRA", "41.00", "4.20", "8.10", "5.20")));
        when(llmClient.generateInsight(any())).thenReturn(Optional.of(
                new LLMInsightDraft(
                        "Brazil shows improving inflation dynamics but still faces a restrictive rate environment.",
                        "MEDIUM",
                        "Prefer phased exposure with close monitoring of domestic rates."
                )
        ));

        CountryInsight insight = insightService.getInsight("BRA").orElseThrow();

        assertThat(insight.source()).isEqualTo("llm");
        assertThat(insight.riskLevel()).isEqualTo(RiskLevel.MEDIUM);
        verify(valueOperations).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    void getInsightShouldFallBackWhenLlmFails() {
        CountrySnapshot snapshot = snapshot("ARG", "16.52", "219.88", "35.00", null);
        when(repository.findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc("ARG", "MODERATE"))
                .thenReturn(Optional.of(snapshot));
        when(llmClient.generateInsight(any())).thenReturn(Optional.empty());

        CountryInsight insight = insightService.getInsight("ARG").orElseThrow();

        assertThat(insight.source()).isEqualTo("fallback");
        assertThat(insight.riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(insight.summary()).contains("Argentina");
        assertThat(insight.recommendation()).contains("Avoid aggressive positioning");
    }

    @Test
    void getInsightShouldReturnEmptyWhenSnapshotDoesNotExist() {
        when(repository.findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc("USA", "MODERATE"))
                .thenReturn(Optional.empty());

        assertThat(insightService.getInsight("USA")).isEmpty();
        verifyNoInteractions(llmClient);
    }

    private CountrySnapshot snapshot(String countryCode,
                                     String score,
                                     String inflation,
                                     String interestRate,
                                     String exchangeRate) {
        return CountrySnapshot.builder()
                .countryCode(countryCode)
                .collectedAt(LocalDateTime.of(2026, 3, 24, 21, 0))
                .score(score == null ? null : new BigDecimal(score))
                .inflation(inflation == null ? null : new BigDecimal(inflation))
                .interestRate(interestRate == null ? null : new BigDecimal(interestRate))
                .exchangeRate(exchangeRate == null ? null : new BigDecimal(exchangeRate))
                .costOfLivingIndex(new BigDecimal("22338.48"))
                .investorProfile("MODERATE")
                .build();
    }
}
