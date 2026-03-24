package com.macroscope.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class EnvironmentValidationRunner implements ApplicationRunner {

    private final SecurityProperties securityProperties;
    private final Environment environment;

    @Override
    public void run(ApplicationArguments args) {
        if (!securityProperties.isProduction()) {
            return;
        }

        String datasourceUrl = environment.getProperty("spring.datasource.url", "");
        String redisUrl = environment.getProperty("spring.data.redis.url", "");
        String allowedOrigins = environment.getProperty("macroscope.web.allowed-origins", "");

        requireValue(securityProperties.getCollectionTriggerApiKey(), "COLLECTION_TRIGGER_API_KEY");
        requireNonLocalValue(datasourceUrl, "DATABASE_URL / spring.datasource.url");
        requireNonLocalValue(redisUrl, "REDIS_URL / spring.data.redis.url");
        requireNonLocalValue(allowedOrigins, "ALLOWED_ORIGINS / macroscope.web.allowed-origins");
    }

    private void requireValue(String value, String variableName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(variableName + " must be configured in production.");
        }
    }

    private void requireNonLocalValue(String value, String variableName) {
        requireValue(value, variableName);
        if (value.contains("localhost") || value.contains("127.0.0.1")) {
            throw new IllegalStateException(variableName + " must not point to localhost in production.");
        }
    }
}
