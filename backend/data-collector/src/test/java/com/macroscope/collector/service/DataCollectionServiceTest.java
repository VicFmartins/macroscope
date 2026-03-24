package com.macroscope.collector.service;

import com.macroscope.collector.client.ExchangeRatesClient;
import com.macroscope.collector.client.WorldBankClient;
import com.macroscope.collector.domain.CountryCode;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataCollectionServiceTest {

    @Mock private WorldBankClient worldBankClient;
    @Mock private ExchangeRatesClient exchangeRatesClient;
    @Mock private CountrySnapshotRepository repository;
    @Mock private PostCollectionProcessor postCollectionProcessor;

    private DataCollectionService service;

    @BeforeEach
    void setUp() {
        service = new DataCollectionService(
                worldBankClient,
                exchangeRatesClient,
                repository,
                List.of(postCollectionProcessor)
        );
    }

    @Test
    void collectAll_shouldSaveOnlyValidSnapshots() {
        Map<String, BigDecimal> inflationData = Map.of(
                "BRA", new BigDecimal("4.62"),
                "USA", new BigDecimal("3.40")
        );
        Map<String, BigDecimal> interestData = Map.of(
                "BRA", new BigDecimal("8.50"),
                "USA", new BigDecimal("5.25")
        );
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INFLATION_INDICATOR))
                .thenReturn(Mono.just(inflationData));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INTEREST_INDICATOR))
                .thenReturn(Mono.just(interestData));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.GDP_PPP_INDICATOR))
                .thenReturn(Mono.just(Map.of()));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(Map.of()));
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        CollectionRunResult result = service.collectAll();

        // then
        ArgumentCaptor<List<CountrySnapshot>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(result.savedSnapshots()).isEqualTo(2);
        assertThat(result.skippedSnapshots()).isEqualTo(CountryCode.values().length - 2);
    }

    @Test
    void collectAll_shouldMapInflationByCountryCode() {
        Map<String, BigDecimal> inflationData = Map.of(
                "BRA", new BigDecimal("4.62"),
                "USA", new BigDecimal("3.40")
        );
        Map<String, BigDecimal> interestData = Map.of(
                "BRA", new BigDecimal("8.50"),
                "USA", new BigDecimal("5.25")
        );
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INFLATION_INDICATOR))
                .thenReturn(Mono.just(inflationData));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INTEREST_INDICATOR))
                .thenReturn(Mono.just(interestData));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.GDP_PPP_INDICATOR))
                .thenReturn(Mono.just(Map.of()));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(Map.of()));
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.collectAll();

        ArgumentCaptor<List<CountrySnapshot>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        CountrySnapshot bra = findByCode(captor.getValue(), "BRA");
        assertThat(bra.getInflation()).isEqualByComparingTo("4.62");
        assertThat(bra.getInterestRate()).isEqualByComparingTo("8.50");

        CountrySnapshot usa = findByCode(captor.getValue(), "USA");
        assertThat(usa.getInflation()).isEqualByComparingTo("3.40");
    }

    @Test
    void collectAll_shouldMapExchangeRateByCurrencyCode() {
        // BRA usa BRL; DEU usa EUR
        Map<String, BigDecimal> rates = Map.of(
                "BRL", new BigDecimal("5.12"),
                "EUR", new BigDecimal("0.92")
        );
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INFLATION_INDICATOR))
                .thenReturn(Mono.just(Map.of(
                        "BRA", new BigDecimal("4.62"),
                        "DEU", new BigDecimal("2.10")
                )));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INTEREST_INDICATOR))
                .thenReturn(Mono.just(Map.of(
                        "BRA", new BigDecimal("8.50"),
                        "DEU", new BigDecimal("3.50")
                )));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.GDP_PPP_INDICATOR))
                .thenReturn(Mono.just(Map.of()));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(rates));
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.collectAll();

        ArgumentCaptor<List<CountrySnapshot>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        CountrySnapshot bra = findByCode(captor.getValue(), "BRA");
        assertThat(bra.getExchangeRate()).isEqualByComparingTo("5.12");

        // DEU, FRA, ITA, ESP, NLD compartilham EUR
        CountrySnapshot deu = findByCode(captor.getValue(), "DEU");
        assertThat(deu.getExchangeRate()).isEqualByComparingTo("0.92");
    }

    @Test
    void collectAll_shouldStoreGdpPppAsCostOfLivingProxy() {
        Map<String, BigDecimal> gdpData = Map.of("USA", new BigDecimal("63000.00"));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INFLATION_INDICATOR))
                .thenReturn(Mono.just(Map.of("USA", new BigDecimal("3.40"))));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INTEREST_INDICATOR))
                .thenReturn(Mono.just(Map.of()));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.GDP_PPP_INDICATOR))
                .thenReturn(Mono.just(gdpData));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(Map.of()));
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.collectAll();

        ArgumentCaptor<List<CountrySnapshot>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        CountrySnapshot usa = findByCode(captor.getValue(), "USA");
        assertThat(usa.getCostOfLivingIndex()).isEqualByComparingTo("63000.00");
    }

    @Test
    void collectAll_shouldNotThrowWhenAllApisFail() {
        when(worldBankClient.fetchIndicatorAsMap(any()))
                .thenReturn(Mono.error(new RuntimeException("API down")));
        when(exchangeRatesClient.fetchRatesVsUsd())
                .thenReturn(Mono.error(new RuntimeException("API down")));

        assertThatCode(() -> service.collectAll()).doesNotThrowAnyException();
    }

    @Test
    void collectAll_shouldSetCountryCodeOnEverySnapshot() {
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INFLATION_INDICATOR))
                .thenReturn(Mono.just(Map.of("BRA", new BigDecimal("4.62"))));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.INTEREST_INDICATOR))
                .thenReturn(Mono.just(Map.of("BRA", new BigDecimal("8.50"))));
        when(worldBankClient.fetchIndicatorAsMap(DataCollectionService.GDP_PPP_INDICATOR))
                .thenReturn(Mono.just(Map.of()));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(Map.of()));
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.collectAll();

        ArgumentCaptor<List<CountrySnapshot>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).allMatch(s -> s.getCountryCode() != null && s.getCountryCode().length() == 3);
        assertThat(captor.getValue()).allMatch(s -> s.getCollectedAt() != null);
    }

    @Test
    void collectAll_shouldSkipPersistenceWhenNoSnapshotPassesValidation() {
        when(worldBankClient.fetchIndicatorAsMap(any())).thenReturn(Mono.just(Map.of()));
        when(exchangeRatesClient.fetchRatesVsUsd()).thenReturn(Mono.just(Map.of()));

        CollectionRunResult result = service.collectAll();

        verify(repository, never()).saveAll(anyList());
        assertThat(result.savedSnapshots()).isZero();
        assertThat(result.skippedSnapshots()).isEqualTo(CountryCode.values().length);
    }

    // --- helpers ---

    private CountrySnapshot findByCode(List<CountrySnapshot> snapshots, String code) {
        return snapshots.stream()
                .filter(s -> code.equals(s.getCountryCode()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Snapshot não encontrado: " + code));
    }
}
