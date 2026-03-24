package com.macroscope.collector.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Countries monitored by MacroScope (ISO 3166-1 alpha-3).
 * Covers G20 plus key developed and emerging economies.
 */
public enum CountryCode {

    // G7
    USA("United States", "USD", "US", "North America"),
    DEU("Germany", "EUR", "DE", "Europe"),
    JPN("Japan", "JPY", "JP", "Asia"),
    GBR("United Kingdom", "GBP", "GB", "Europe"),
    FRA("France", "EUR", "FR", "Europe"),
    ITA("Italy", "EUR", "IT", "Europe"),
    CAN("Canada", "CAD", "CA", "North America"),

    // BRICS and major emerging economies
    CHN("China", "CNY", "CN", "Asia"),
    IND("India", "INR", "IN", "Asia"),
    BRA("Brazil", "BRL", "BR", "South America"),
    RUS("Russia", "RUB", "RU", "Europe"),
    ZAF("South Africa", "ZAR", "ZA", "Africa"),

    // Rest of the G20
    KOR("South Korea", "KRW", "KR", "Asia"),
    AUS("Australia", "AUD", "AU", "Oceania"),
    MEX("Mexico", "MXN", "MX", "North America"),
    IDN("Indonesia", "IDR", "ID", "Asia"),
    TUR("Turkey", "TRY", "TR", "Europe"),
    SAU("Saudi Arabia", "SAR", "SA", "Middle East"),
    ARG("Argentina", "ARS", "AR", "South America"),
    ESP("Spain", "EUR", "ES", "Europe"),

    // High-income economies
    NLD("Netherlands", "EUR", "NL", "Europe"),
    CHE("Switzerland", "CHF", "CH", "Europe"),
    SWE("Sweden", "SEK", "SE", "Europe"),
    NOR("Norway", "NOK", "NO", "Europe"),
    SGP("Singapore", "SGD", "SG", "Asia"),
    ARE("United Arab Emirates", "AED", "AE", "Middle East"),

    // Additional Latin America
    CHL("Chile", "CLP", "CL", "South America"),
    COL("Colombia", "COP", "CO", "South America"),
    PER("Peru", "PEN", "PE", "South America"),

    // Emerging Europe
    POL("Poland", "PLN", "PL", "Europe");

    private final String displayName;
    private final String currencyCode;
    private final String iso2Code;
    private final String region;

    CountryCode(String displayName, String currencyCode, String iso2Code, String region) {
        this.displayName = displayName;
        this.currencyCode = currencyCode;
        this.iso2Code = iso2Code;
        this.region = region;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public String getIso2Code() {
        return iso2Code;
    }

    public String getRegion() {
        return region;
    }

    public String getFlagEmoji() {
        return iso2Code.toUpperCase(Locale.ROOT)
                .chars()
                .mapToObj(codePoint -> String.valueOf(Character.toChars(0x1F1E6 + codePoint - 'A')))
                .reduce("", String::concat);
    }

    public static Optional<CountryCode> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(CountryCode.valueOf(code.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public static final List<String> ALL_CODES = Arrays.stream(values())
            .map(Enum::name)
            .toList();

    public static final String ALL_CODES_SEMICOLON = String.join(";", ALL_CODES);
}
