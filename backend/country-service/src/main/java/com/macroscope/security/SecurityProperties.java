package com.macroscope.security;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "macroscope.security")
@Validated
@Getter
@Setter
public class SecurityProperties {

    private String appEnvironment = "local";

    private String collectionTriggerApiKey;

    @Min(1)
    private int rateLimitWindowSeconds = 60;

    @Min(1)
    private int rateLimitMaxRequests = 120;

    @Min(1)
    private int rateLimitMaxTriggerRequests = 5;

    public boolean isProduction() {
        return "production".equalsIgnoreCase(appEnvironment);
    }
}
