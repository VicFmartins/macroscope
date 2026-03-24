package com.macroscope.scoring.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "macroscope.scoring")
@Getter
@Setter
@Validated
public class ScoringProperties {

    @NotBlank
    private String defaultProfile = "MODERATE";
}
