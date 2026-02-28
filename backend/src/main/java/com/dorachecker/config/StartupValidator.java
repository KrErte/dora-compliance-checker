package com.dorachecker.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StartupValidator {

    private static final Logger log = LoggerFactory.getLogger(StartupValidator.class);

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${anthropic.api.key:}")
    private String anthropicApiKey;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @PostConstruct
    public void validate() {
        log.info("=== Startup Validation ===");

        if (jwtSecret.isBlank() || jwtSecret.contains("Default")) {
            log.warn("JWT_SECRET is using default value — set a strong secret in production!");
        }

        if (datasourceUrl.isBlank()) {
            log.error("DATASOURCE URL is not configured!");
        } else {
            log.info("Database: {}", datasourceUrl.replaceAll("password=.*", "password=***"));
        }

        if (anthropicApiKey.isBlank()) {
            log.warn("ANTHROPIC_API_KEY is not set — AI analysis features will not work");
        }

        if (resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY is not set — email sending will not work");
        }

        log.info("=== Startup Validation Complete ===");
    }
}
