package com.macroscope;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan("com.macroscope")  // descobre CollectorConfig e demais @ConfigurationProperties
public class MacroScopeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MacroScopeApplication.class, args);
    }
}
