package com.macroscope.collector.service;

import com.macroscope.collector.client.ExchangeRatesClient;
import com.macroscope.collector.client.WorldBankClient;
import com.macroscope.collector.domain.CountryCode;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Orquestra a coleta de dados macroeconômicos para os 30 países monitorados.
 *
 * <p>Fluxo:
 * <ol>
 *   <li>Busca em paralelo: inflação, juros, GDP PPP (World Bank) + câmbio (Exchange Rates)</li>
 *   <li>Monta um {@link CountrySnapshot} por país (campos null se API não retornou dados)</li>
 *   <li>Persiste todos os snapshots em batch na tabela {@code country_snapshot}</li>
 * </ol>
 *
 * <p>Após persistência, o {@code scoring-engine} calcula os scores dos snapshots.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataCollectionService {

    private static final int MIN_POPULATED_INDICATORS = 2;

    // --- Códigos de indicadores World Bank ---
    static final String INFLATION_INDICATOR   = "FP.CPI.TOTL.ZG";
    static final String INTEREST_INDICATOR    = "FR.INR.RINR";
    /** GDP per capita PPP (USD corrente) — proxy para custo de vida. @see CountrySnapshot#costOfLivingIndex */
    static final String GDP_PPP_INDICATOR     = "NY.GDP.PCAP.PP.CD";

    private final WorldBankClient worldBankClient;
    private final ExchangeRatesClient exchangeRatesClient;
    private final CountrySnapshotRepository repository;
    private final List<PostCollectionProcessor> postCollectionProcessors;

    /**
     * Coleta dados de todos os países e persiste os snapshots.
     *
     * <p>Erros em APIs externas são tratados individualmente: a coleta não é abortada
     * se uma API falhar — o snapshot é salvo com os campos disponíveis (outros = null).
     */
    @Transactional
    public CollectionRunResult collectAll() {
        log.info("Iniciando coleta para {} países", CountryCode.values().length);

        Map<String, BigDecimal> inflationMap   = new HashMap<>();
        Map<String, BigDecimal> interestMap    = new HashMap<>();
        Map<String, BigDecimal> gdpPppMap      = new HashMap<>();
        Map<String, BigDecimal> exchangeRateMap = new HashMap<>();

        try {
            // Busca paralela: 3 indicadores World Bank + câmbio ao mesmo tempo
            Mono.zip(
                    worldBankClient.fetchIndicatorAsMap(INFLATION_INDICATOR),
                    worldBankClient.fetchIndicatorAsMap(INTEREST_INDICATOR),
                    worldBankClient.fetchIndicatorAsMap(GDP_PPP_INDICATOR),
                    exchangeRatesClient.fetchRatesVsUsd()
            ).blockOptional().ifPresent(tuple -> {
                inflationMap.putAll(tuple.getT1());
                interestMap.putAll(tuple.getT2());
                gdpPppMap.putAll(tuple.getT3());
                exchangeRateMap.putAll(tuple.getT4());
            });
        } catch (Exception e) {
            log.error("Erro inesperado durante coleta paralela: {}", e.getMessage(), e);
            // Continua com os mapas parcialmente preenchidos
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        List<CountrySnapshot> snapshots = Arrays.stream(CountryCode.values())
                .map(country -> buildSnapshot(country, now, inflationMap, interestMap, gdpPppMap, exchangeRateMap))
                .toList();

        List<CountrySnapshot> validSnapshots = snapshots.stream()
                .filter(this::isValidSnapshot)
                .toList();

        int skippedSnapshots = snapshots.size() - validSnapshots.size();
        if (validSnapshots.isEmpty()) {
            log.warn("Coleta descartada: nenhum snapshot atingiu os critérios mínimos de qualidade");
            return new CollectionRunResult(now, snapshots.size(), 0, skippedSnapshots);
        }

        repository.saveAll(validSnapshots);

        long withData = validSnapshots.stream()
                .filter(this::hasAnyEconomicIndicator)
                .count();

        CollectionRunResult result = new CollectionRunResult(
                now,
                snapshots.size(),
                validSnapshots.size(),
                skippedSnapshots
        );

        log.info(
                "Coleta concluída: {} snapshots salvos, {} descartados ({} com pelo menos 1 indicador)",
                result.savedSnapshots(),
                result.skippedSnapshots(),
                withData
        );

        postCollectionProcessors.forEach(processor -> triggerPostCollection(processor, result));
        return result;
    }

    private CountrySnapshot buildSnapshot(
            CountryCode country,
            LocalDateTime collectedAt,
            Map<String, BigDecimal> inflationMap,
            Map<String, BigDecimal> interestMap,
            Map<String, BigDecimal> gdpPppMap,
            Map<String, BigDecimal> exchangeRateMap) {

        String code = country.name();

        return CountrySnapshot.builder()
                .countryCode(code)
                .collectedAt(collectedAt)
                .inflation(inflationMap.get(code))
                .interestRate(interestMap.get(code))
                // câmbio: busca pela moeda do país (ex: BRA → BRL)
                .exchangeRate(exchangeRateMap.get(country.getCurrencyCode()))
                // GDP PPP: proxy do custo de vida
                .costOfLivingIndex(gdpPppMap.get(code))
                .build();
    }

    private boolean isValidSnapshot(CountrySnapshot snapshot) {
        if (snapshot.getCountryCode() == null || snapshot.getCollectedAt() == null) {
            return false;
        }

        int populatedIndicators = 0;
        if (snapshot.getInflation() != null) {
            populatedIndicators++;
        }
        if (snapshot.getInterestRate() != null) {
            populatedIndicators++;
        }
        if (snapshot.getExchangeRate() != null) {
            populatedIndicators++;
        }
        if (snapshot.getCostOfLivingIndex() != null) {
            populatedIndicators++;
        }

        return populatedIndicators >= MIN_POPULATED_INDICATORS;
    }

    private boolean hasAnyEconomicIndicator(CountrySnapshot snapshot) {
        return snapshot.getInflation() != null
                || snapshot.getInterestRate() != null
                || snapshot.getExchangeRate() != null
                || snapshot.getCostOfLivingIndex() != null;
    }

    private void triggerPostCollection(PostCollectionProcessor processor, CollectionRunResult result) {
        try {
            processor.afterCollection(result);
        } catch (Exception e) {
            log.error("Falha em pós-processamento após a coleta: {}", e.getMessage(), e);
        }
    }
}
