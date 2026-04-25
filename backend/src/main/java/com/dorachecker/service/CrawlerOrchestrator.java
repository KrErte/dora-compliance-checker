package com.dorachecker.service;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Unified management point for all crawlers. Provides listing, status, and manual triggering. */
@Service
public class CrawlerOrchestrator {

  private static final Logger log = LoggerFactory.getLogger(CrawlerOrchestrator.class);

  private final List<CrawlSource> sources;

  public CrawlerOrchestrator(List<CrawlSource> sources) {
    this.sources = sources;
    log.info("CrawlerOrchestrator initialized with {} sources: {}", sources.size(), sourceNames());
  }

  /** List all registered crawlers with their enabled status. */
  public List<Map<String, Object>> listSources() {
    return sources.stream()
        .map(
            s ->
                Map.<String, Object>of(
                    "name", s.getName(),
                    "enabled", s.isEnabled()))
        .toList();
  }

  /** Execute a specific crawler by name. */
  public Map<String, Object> execute(String name) {
    CrawlSource source =
        sources.stream()
            .filter(s -> s.getName().equals(name))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown crawler: " + name));

    if (!source.isEnabled()) {
      return Map.of("source", name, "status", "DISABLED", "message", "Crawler is not enabled");
    }

    log.info("Manually triggering crawler: {}", name);
    return source.execute();
  }

  /** Execute all enabled crawlers. */
  public List<Map<String, Object>> executeAll() {
    List<Map<String, Object>> results = new ArrayList<>();
    for (CrawlSource source : sources) {
      if (!source.isEnabled()) {
        results.add(
            Map.of("source", source.getName(), "status", "SKIPPED", "message", "Not enabled"));
        continue;
      }
      try {
        results.add(source.execute());
      } catch (Exception e) {
        log.error("Crawler {} failed: {}", source.getName(), e.getMessage());
        results.add(
            Map.of("source", source.getName(), "status", "FAILED", "error", e.getMessage()));
      }
    }
    return results;
  }

  private List<String> sourceNames() {
    return sources.stream().map(CrawlSource::getName).toList();
  }
}
