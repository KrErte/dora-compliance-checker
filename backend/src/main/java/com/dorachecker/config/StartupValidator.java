package com.dorachecker.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class StartupValidator {

  private static final Logger log = LoggerFactory.getLogger(StartupValidator.class);

  private final Environment environment;

  @Value("${jwt.secret:}")
  private String jwtSecret;

  @Value("${spring.datasource.url:}")
  private String datasourceUrl;

  @Value("${anthropic.api.key:}")
  private String anthropicApiKey;

  @Value("${resend.api-key:}")
  private String resendApiKey;

  public StartupValidator(Environment environment) {
    this.environment = environment;
  }

  @PostConstruct
  public void validate() {
    log.info("=== Startup Validation ===");
    boolean isProd = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod");

    if (jwtSecret.isBlank() || jwtSecret.length() < 32) {
      if (isProd) {
        throw new IllegalStateException(
            "JWT_SECRET must be set to a strong secret (>=32 chars) in production!");
      }
      log.warn("JWT_SECRET is not set — set a strong secret via JWT_SECRET env var");
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
