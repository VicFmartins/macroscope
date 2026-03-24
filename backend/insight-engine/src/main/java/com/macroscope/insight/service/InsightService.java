package com.macroscope.insight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.collector.domain.CountryCode;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import com.macroscope.insight.client.LLMClient;
import com.macroscope.insight.config.InsightProperties;
import com.macroscope.insight.model.CountryInsight;
import com.macroscope.insight.model.InsightContext;
import com.macroscope.insight.model.InsightPrompt;
import com.macroscope.insight.model.LLMInsightDraft;
import com.macroscope.insight.model.RiskLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightService {

    private static final double DEFAULT_NEUTRAL_SCORE = 50.0;
    private static final double MAX_VOLATILITY = 12.0;

    private final CountrySnapshotRepository repository;
    private final PromptBuilder promptBuilder;
    private final LLMClient llmClient;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final InsightProperties insightProperties;

    @Value("${macroscope.scoring.default-profile:MODERATE}")
    private String defaultProfile;

    public Optional<CountryInsight> getInsight(String countryCode) {
        return repository.findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc(countryCode, defaultProfile)
                .map(this::resolveInsight);
    }

    private CountryInsight resolveInsight(CountrySnapshot snapshot) {
        String cacheKey = buildCacheKey(snapshot);

        CountryInsight cachedInsight = readCache(cacheKey);
        if (cachedInsight != null) {
            return cachedInsight;
        }

        CountryInsight generatedInsight = generateInsight(snapshot)
                .orElseGet(() -> buildFallbackInsight(snapshot, "fallback"));

        cacheInsight(cacheKey, generatedInsight);
        return generatedInsight;
    }

    private Optional<CountryInsight> generateInsight(CountrySnapshot snapshot) {
        InsightContext context = buildContext(snapshot);
        InsightPrompt prompt = promptBuilder.build(context);

        return llmClient.generateInsight(prompt)
                .flatMap(draft -> toCountryInsight(snapshot, draft));
    }

    private Optional<CountryInsight> toCountryInsight(CountrySnapshot snapshot, LLMInsightDraft draft) {
        try {
            RiskLevel riskLevel = RiskLevel.fromValue(draft.riskLevel());
            if (draft.summary() == null || draft.summary().isBlank() ||
                    draft.recommendation() == null || draft.recommendation().isBlank()) {
                return Optional.empty();
            }

            return Optional.of(new CountryInsight(
                    snapshot.getCountryCode(),
                    countryName(snapshot),
                    defaultProfile,
                    draft.summary().trim(),
                    riskLevel,
                    draft.recommendation().trim(),
                    "llm",
                    Instant.now()
            ));
        } catch (Exception exception) {
            log.warn("Resposta do LLM invalida para {}: {}", snapshot.getCountryCode(), exception.getMessage());
            return Optional.empty();
        }
    }

    private CountryInsight buildFallbackInsight(CountrySnapshot snapshot, String source) {
        String countryName = countryName(snapshot);
        BigDecimal score = snapshot.getScore();
        BigDecimal inflation = snapshot.getInflation();
        BigDecimal interestRate = snapshot.getInterestRate();
        BigDecimal stability = currencyStabilityScore(snapshot);

        RiskLevel riskLevel = determineRiskLevel(score, inflation, interestRate, stability);
        String summary = buildFallbackSummary(countryName, score, inflation, interestRate, stability);
        String recommendation = buildFallbackRecommendation(riskLevel, score, inflation, interestRate);

        return new CountryInsight(
                snapshot.getCountryCode(),
                countryName,
                defaultProfile,
                summary,
                riskLevel,
                recommendation,
                source,
                Instant.now()
        );
    }

    private RiskLevel determineRiskLevel(BigDecimal score,
                                         BigDecimal inflation,
                                         BigDecimal interestRate,
                                         BigDecimal stabilityScore) {
        double scoreValue = decimal(score, 50.0);
        double inflationValue = decimal(inflation, 6.0);
        double interestValue = decimal(interestRate, 6.0);
        double stabilityValue = decimal(stabilityScore, DEFAULT_NEUTRAL_SCORE);

        if (scoreValue < 40.0 || inflationValue >= 12.0 || interestValue >= 15.0 || stabilityValue < 35.0) {
            return RiskLevel.HIGH;
        }
        if (scoreValue < 65.0 || inflationValue >= 5.0 || interestValue >= 8.0 || stabilityValue < 60.0) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }

    private String buildFallbackSummary(String countryName,
                                        BigDecimal score,
                                        BigDecimal inflation,
                                        BigDecimal interestRate,
                                        BigDecimal stabilityScore) {
        String scoreSentence = "%s currently has a macro score of %s/100, with inflation at %s and interest rates at %s."
                .formatted(
                        countryName,
                        format(score),
                        formatWithSuffix(inflation, "%"),
                        formatWithSuffix(interestRate, "%")
                );

        String stabilitySentence = stabilityScore == null
                ? "Currency stability data is limited, so FX risk should be monitored closely before large allocations."
                : "The currency stability signal is %s/100, indicating %s resilience in the recent FX window."
                .formatted(format(stabilityScore), stabilityDescription(stabilityScore.doubleValue()));

        String macroSentence = (score != null && score.doubleValue() >= 65.0)
                ? "The broader macro backdrop remains relatively supportive for disciplined exposure."
                : "The broader macro backdrop still requires selective positioning and active monitoring.";

        return String.join(" ", scoreSentence, stabilitySentence, macroSentence);
    }

    private String buildFallbackRecommendation(RiskLevel riskLevel,
                                               BigDecimal score,
                                               BigDecimal inflation,
                                               BigDecimal interestRate) {
        return switch (riskLevel) {
            case LOW -> "Favorable for gradual long-term exposure, with normal monitoring of policy and valuation changes.";
            case MEDIUM -> "Prefer selective or hedged exposure while tracking inflation, rates, and currency momentum.";
            case HIGH -> {
                if ((inflation != null && inflation.doubleValue() > 20.0) ||
                        (interestRate != null && interestRate.doubleValue() > 20.0) ||
                        (score != null && score.doubleValue() < 30.0)) {
                    yield "Avoid aggressive positioning for now and wait for clearer evidence of macro stabilization.";
                }
                yield "Limit exposure to tactical positions only until the macro environment improves.";
            }
        };
    }

    private InsightContext buildContext(CountrySnapshot snapshot) {
        return new InsightContext(
                snapshot.getCountryCode(),
                countryName(snapshot),
                defaultProfile,
                snapshot.getCollectedAt(),
                snapshot.getScore(),
                snapshot.getInflation(),
                snapshot.getInterestRate(),
                snapshot.getExchangeRate(),
                snapshot.getCostOfLivingIndex(),
                currencyStabilityScore(snapshot)
        );
    }

    private BigDecimal currencyStabilityScore(CountrySnapshot snapshot) {
        if (snapshot.getExchangeRate() == null) {
            return null;
        }

        LocalDateTime since = snapshot.getCollectedAt().minusDays(30);
        List<BigDecimal> rates = repository.findRecentByCountryCode(snapshot.getCountryCode(), since).stream()
                .filter(item -> item.getExchangeRate() != null && item.getExchangeRate().signum() > 0)
                .sorted(Comparator.comparing(CountrySnapshot::getCollectedAt))
                .map(CountrySnapshot::getExchangeRate)
                .toList();

        if (rates.size() < 2) {
            return null;
        }

        double volatility = calculateVolatility(rates);
        double stabilityScore = inverseMinMax(volatility, 0.0, MAX_VOLATILITY);
        return BigDecimal.valueOf(stabilityScore).setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateVolatility(List<BigDecimal> rates) {
        double[] returns = new double[rates.size() - 1];
        for (int index = 1; index < rates.size(); index++) {
            double previous = rates.get(index - 1).doubleValue();
            double current = rates.get(index).doubleValue();
            returns[index - 1] = ((current - previous) / previous) * 100.0;
        }

        double mean = 0.0;
        for (double value : returns) {
            mean += value;
        }
        mean /= returns.length;

        double variance = 0.0;
        for (double value : returns) {
            double diff = value - mean;
            variance += diff * diff;
        }
        variance /= returns.length;

        return Math.sqrt(variance);
    }

    private double inverseMinMax(double value, double min, double max) {
        if (value <= min) {
            return 100.0;
        }
        if (value >= max) {
            return 0.0;
        }
        return 100.0 - (((value - min) / (max - min)) * 100.0);
    }

    private String buildCacheKey(CountrySnapshot snapshot) {
        return "insight:%s:%s:%s".formatted(
                defaultProfile,
                snapshot.getCountryCode(),
                snapshot.getCollectedAt().toInstant(ZoneOffset.UTC)
        );
    }

    private CountryInsight readCache(String cacheKey) {
        try {
            String cachedValue = stringRedisTemplate.opsForValue().get(cacheKey);
            if (cachedValue == null || cachedValue.isBlank()) {
                return null;
            }
            return objectMapper.readValue(cachedValue, CountryInsight.class);
        } catch (Exception exception) {
            log.warn("Nao foi possivel ler insight do Redis: {}", exception.getMessage());
            return null;
        }
    }

    private void cacheInsight(String cacheKey, CountryInsight insight) {
        try {
            String payload = objectMapper.writeValueAsString(insight);
            stringRedisTemplate.opsForValue().set(
                    cacheKey,
                    payload,
                    insightProperties.getCacheTtlSeconds(),
                    TimeUnit.SECONDS
            );
        } catch (JsonProcessingException exception) {
            log.warn("Nao foi possivel serializar insight: {}", exception.getMessage());
        } catch (Exception exception) {
            log.warn("Nao foi possivel publicar insight no Redis: {}", exception.getMessage());
        }
    }

    private String countryName(CountrySnapshot snapshot) {
        return CountryCode.fromCode(snapshot.getCountryCode())
                .map(CountryCode::getDisplayName)
                .orElse(snapshot.getCountryCode());
    }

    private double decimal(BigDecimal value, double fallback) {
        return value == null ? fallback : value.doubleValue();
    }

    private String format(BigDecimal value) {
        if (value == null) {
            return "N/A";
        }
        return value.stripTrailingZeros().toPlainString();
    }

    private String formatWithSuffix(BigDecimal value, String suffix) {
        return value == null ? "N/A" : format(value) + suffix;
    }

    private String stabilityDescription(double stabilityScore) {
        if (stabilityScore >= 70.0) {
            return "strong";
        }
        if (stabilityScore >= 45.0) {
            return "moderate";
        }
        return "fragile";
    }
}
