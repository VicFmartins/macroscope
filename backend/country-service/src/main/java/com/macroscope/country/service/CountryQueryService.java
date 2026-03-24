package com.macroscope.country.service;

import com.macroscope.collector.domain.CountryCode;
import com.macroscope.collector.domain.CountrySnapshot;
import com.macroscope.collector.repository.CountrySnapshotRepository;
import com.macroscope.country.api.dto.CountryComparisonResponse;
import com.macroscope.country.api.dto.CountryMetadataResponse;
import com.macroscope.country.api.dto.CountryRankingResponse;
import com.macroscope.country.api.dto.CountrySnapshotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CountryQueryService {

    private final CountrySnapshotRepository repository;

    @Value("${macroscope.scoring.default-profile:MODERATE}")
    private String defaultProfile;

    public List<CountryRankingResponse> getRanking() {
        return repository.findLatestRankingByProfile(defaultProfile).stream()
                .map(this::toRankingResponse)
                .toList();
    }

    public List<CountryMetadataResponse> getCountryMetadata() {
        return List.of(CountryCode.values()).stream()
                .map(countryCode -> new CountryMetadataResponse(
                        countryCode.name(),
                        countryCode.getDisplayName(),
                        countryCode.getIso2Code(),
                        countryCode.getFlagEmoji(),
                        countryCode.getRegion(),
                        countryCode.getCurrencyCode()
                ))
                .sorted((left, right) -> left.displayName().compareToIgnoreCase(right.displayName()))
                .toList();
    }

    public CountrySnapshotResponse getCountry(String code) {
        String normalizedCode = normalizeCode(code);

        return repository.findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc(normalizedCode, defaultProfile)
                .map(this::toSnapshotResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No snapshot found for country " + normalizedCode
                ));
    }

    public CountryComparisonResponse compare(String firstCode, String secondCode) {
        String normalizedFirst = normalizeCode(firstCode);
        String normalizedSecond = normalizeCode(secondCode);

        Optional<CountrySnapshotResponse> first = repository
                .findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc(normalizedFirst, defaultProfile)
                .map(this::toSnapshotResponse);

        Optional<CountrySnapshotResponse> second = repository
                .findTopByCountryCodeAndInvestorProfileOrderByCollectedAtDesc(normalizedSecond, defaultProfile)
                .map(this::toSnapshotResponse);

        List<String> missingCountries = new ArrayList<>();
        if (first.isEmpty()) {
            missingCountries.add(normalizedFirst);
        }
        if (second.isEmpty()) {
            missingCountries.add(normalizedSecond);
        }

        return new CountryComparisonResponse(defaultProfile, first.orElse(null), second.orElse(null), missingCountries);
    }

    private String normalizeCode(String code) {
        return CountryCode.fromCode(code)
                .map(Enum::name)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported country code: " + code
                ));
    }

    private CountryRankingResponse toRankingResponse(CountrySnapshot snapshot) {
        CountryCode countryCode = CountryCode.fromCode(snapshot.getCountryCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid country code in database"));

        return new CountryRankingResponse(
                snapshot.getCountryCode(),
                countryCode.getDisplayName(),
                snapshot.getScore(),
                snapshot.getInflation(),
                snapshot.getInterestRate(),
                snapshot.getExchangeRate(),
                snapshot.getCostOfLivingIndex(),
                snapshot.getCollectedAt(),
                snapshot.getInvestorProfile()
        );
    }

    private CountrySnapshotResponse toSnapshotResponse(CountrySnapshot snapshot) {
        CountryCode countryCode = CountryCode.fromCode(snapshot.getCountryCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid country code in database"));

        return new CountrySnapshotResponse(
                snapshot.getCountryCode(),
                countryCode.getDisplayName(),
                snapshot.getCollectedAt(),
                snapshot.getInflation(),
                snapshot.getInterestRate(),
                snapshot.getExchangeRate(),
                snapshot.getCostOfLivingIndex(),
                snapshot.getScore(),
                snapshot.getInvestorProfile()
        );
    }
}
