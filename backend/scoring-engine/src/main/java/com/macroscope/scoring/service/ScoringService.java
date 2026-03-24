package com.macroscope.scoring.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import com.macroscope.collector.service.CollectionRunResult;
import com.macroscope.collector.service.PostCollectionProcessor;
import com.macroscope.scoring.config.ScoringProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Calcula o score do perfil padrão logo após a coleta e publica o ranking em cache.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringService implements PostCollectionProcessor {

    private static final double DEFAULT_NEUTRAL_SCORE = 50.0;
    private static final double TARGET_INTEREST_RATE = 4.0;
    private static final double MAX_INTEREST_DISTANCE = 10.0;
    private static final double MAX_INFLATION = 15.0;
    private static final double MAX_VOLATILITY = 12.0;
    private static final double MIN_GDP_PPP = 5_000.0;
    private static final double MAX_GDP_PPP = 100_000.0;
    private final CountrySnapshotRepository repository;
    private final ScoringProperties scoringProperties;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${macroscope.collection.cache-ttl-seconds:21600}")
    private long rankingTtlSeconds;

    @Override
    public void afterCollection(CollectionRunResult result) {
        if (result.savedSnapshots() == 0) {
            log.warn("Score não calculado: a coleta não gerou snapshots válidos");
            return;
        }

        scoreCollectedAt(result.collectedAt());
    }

    @Transactional
    public void scoreCollectedAt(LocalDateTime collectedAt) {
        List<CountrySnapshot> snapshots = repository
                .findByCollectedAtAndInvestorProfileIsNullOrderByCountryCode(collectedAt);

        if (snapshots.isEmpty()) {
            log.warn("Nenhum snapshot pendente para score em {}", collectedAt);
            return;
        }

        for (CountrySnapshot snapshot : snapshots) {
            BigDecimal score = calculateScore(snapshot);
            snapshot.setScore(score);
            snapshot.setInvestorProfile(scoringProperties.getDefaultProfile());
        }

        repository.saveAll(snapshots);
        publishRankingCache();
        log.info("Scoring concluído: {} países atualizados para o perfil {}", snapshots.size(), scoringProperties.getDefaultProfile());
    }

    BigDecimal calculateScore(CountrySnapshot snapshot) {
        double inflationScore = snapshot.getInflation() == null
                ? DEFAULT_NEUTRAL_SCORE
                : inverseMinMax(snapshot.getInflation().doubleValue(), 0.0, MAX_INFLATION);

        double interestScore = snapshot.getInterestRate() == null
                ? DEFAULT_NEUTRAL_SCORE
                : balancedScore(snapshot.getInterestRate().doubleValue(), TARGET_INTEREST_RATE, MAX_INTEREST_DISTANCE);

        double currencyStabilityScore = calculateCurrencyStabilityScore(snapshot);

        double costProxyScore = snapshot.getCostOfLivingIndex() == null
                ? DEFAULT_NEUTRAL_SCORE
                : directMinMax(snapshot.getCostOfLivingIndex().doubleValue(), MIN_GDP_PPP, MAX_GDP_PPP);

        double weightedScore = (inflationScore * 0.35)
                + (interestScore * 0.25)
                + (currencyStabilityScore * 0.25)
                + (costProxyScore * 0.15);

        return BigDecimal.valueOf(weightedScore).setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateCurrencyStabilityScore(CountrySnapshot snapshot) {
        if (snapshot.getExchangeRate() == null) {
            return DEFAULT_NEUTRAL_SCORE;
        }

        LocalDateTime since = snapshot.getCollectedAt().minusDays(30);
        List<BigDecimal> rates = repository.findRecentByCountryCode(snapshot.getCountryCode(), since).stream()
                .filter(item -> item.getExchangeRate() != null && item.getExchangeRate().signum() > 0)
                .sorted(Comparator.comparing(CountrySnapshot::getCollectedAt))
                .map(CountrySnapshot::getExchangeRate)
                .toList();

        if (rates.size() < 2) {
            return DEFAULT_NEUTRAL_SCORE;
        }

        double volatility = calculateVolatility(rates);
        return inverseMinMax(volatility, 0.0, MAX_VOLATILITY);
    }

    private double calculateVolatility(List<BigDecimal> rates) {
        if (rates.size() < 2) {
            return 0.0;
        }

        double[] returns = new double[rates.size() - 1];
        for (int i = 1; i < rates.size(); i++) {
            double previous = rates.get(i - 1).doubleValue();
            double current = rates.get(i).doubleValue();
            returns[i - 1] = ((current - previous) / previous) * 100.0;
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
        return 100.0 - directMinMax(value, min, max);
    }

    private double directMinMax(double value, double min, double max) {
        if (value <= min) {
            return 0.0;
        }
        if (value >= max) {
            return 100.0;
        }
        return ((value - min) / (max - min)) * 100.0;
    }

    private double balancedScore(double value, double target, double maxDistance) {
        double distance = Math.abs(value - target);
        if (distance >= maxDistance) {
            return 0.0;
        }
        return 100.0 - ((distance / maxDistance) * 100.0);
    }

    private void publishRankingCache() {
        List<Map<String, Object>> rankingPayload = repository.findLatestRankingByProfile(scoringProperties.getDefaultProfile()).stream()
                .map(snapshot -> Map.<String, Object>of(
                        "countryCode", snapshot.getCountryCode(),
                        "score", snapshot.getScore(),
                        "collectedAt", snapshot.getCollectedAt()
                ))
                .toList();

        try {
            String payload = objectMapper.writeValueAsString(rankingPayload);
            String cacheKey = "ranking:global:" + scoringProperties.getDefaultProfile();
            stringRedisTemplate.opsForValue().set(cacheKey, payload, rankingTtlSeconds, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.warn("Não foi possível serializar o ranking para o Redis: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Não foi possível publicar o ranking no Redis: {}", e.getMessage());
        }
    }
}
