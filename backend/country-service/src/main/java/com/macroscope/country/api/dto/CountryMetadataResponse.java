package com.macroscope.country.api.dto;

public record CountryMetadataResponse(
        String countryCode,
        String displayName,
        String iso2Code,
        String flag,
        String region,
        String currency
) {
}
