package com.macroscope.country.api.dto;

import java.util.List;

public record CountryComparisonResponse(
        String profile,
        CountrySnapshotResponse first,
        CountrySnapshotResponse second,
        List<String> missingCountries
) {
}
