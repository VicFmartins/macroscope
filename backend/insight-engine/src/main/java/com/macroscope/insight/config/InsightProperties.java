package com.macroscope.insight.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "macroscope.insights")
@Validated
@Getter
@Setter
public class InsightProperties {

    @NotBlank
    private String model = "gemini-2.5-flash";

    @Min(21600)
    private long cacheTtlSeconds = 43200;

    @Min(1)
    private int timeoutSeconds = 20;
}
