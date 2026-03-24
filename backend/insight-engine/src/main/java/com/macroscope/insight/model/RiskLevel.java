package com.macroscope.insight.model;

public enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH;

    public static RiskLevel fromValue(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Risk level is required");
        }

        return RiskLevel.valueOf(value.trim().toUpperCase());
    }
}
