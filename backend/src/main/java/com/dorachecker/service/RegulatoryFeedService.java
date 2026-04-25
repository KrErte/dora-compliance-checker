package com.dorachecker.service;

import com.dorachecker.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class RegulatoryFeedService {

  private static final Logger log = LoggerFactory.getLogger(RegulatoryFeedService.class);

  private final RegulatoryUpdateRepository updateRepository;
  private final RegulatorySourceRepository sourceRepository;
  private final MonitoredContractService monitoredContractService;
  private final ContractAlertService alertService;
  private final ClaudeApiService claudeApiService;
  private final AlertMatchingService alertMatchingService;
  private final RssFeedParser rssFeedParser = new RssFeedParser();
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final HttpClient httpClient =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(15))
          .followRedirects(HttpClient.Redirect.NORMAL)
          .build();

  @Value("${guardian.feed.enabled:false}")
  private boolean feedEnabled;

  @Value("${alert.enrichment.max-per-cycle:10}")
  private int maxEnrichmentPerCycle;

  public RegulatoryFeedService(
      RegulatoryUpdateRepository updateRepository,
      RegulatorySourceRepository sourceRepository,
      MonitoredContractService monitoredContractService,
      ContractAlertService alertService,
      ClaudeApiService claudeApiService,
      AlertMatchingService alertMatchingService) {
    this.updateRepository = updateRepository;
    this.sourceRepository = sourceRepository;
    this.monitoredContractService = monitoredContractService;
    this.alertService = alertService;
    this.claudeApiService = claudeApiService;
    this.alertMatchingService = alertMatchingService;
  }

  public List<RegulatoryUpdateEntity> getAllUpdates() {
    return updateRepository.findAllByOrderByFetchedAtDesc();
  }

  public List<RegulatoryUpdateEntity> getNewUpdates() {
    return updateRepository.findByStatusOrderByFetchedAtDesc("NEW");
  }

  /** Scheduled check for regulatory updates from RSS feeds. Runs every 2 hours by default. */
  @Scheduled(cron = "${guardian.feed.cron:0 0 */2 * * *}")
  public void checkRegulatoryFeeds() {
    if (!feedEnabled) {
      log.debug("Guardian feed kontroll on keelatud");
      return;
    }

    log.info("Alustan regulatiivsete uuenduste kontrolli...");
    int totalNew = 0;
    int enriched = 0;

    try {
      List<RegulatorySourceEntity> sources = sourceRepository.findByEnabledTrue();
      log.info("Kontrollitavaid allikaid: {}", sources.size());

      for (RegulatorySourceEntity source : sources) {
        try {
          int newFromSource = fetchAndProcessSource(source);
          totalNew += newFromSource;

          // Update lastCheckedAt
          source.setLastCheckedAt(LocalDateTime.now());
          sourceRepository.save(source);
        } catch (Exception e) {
          log.error("Allika {} kontroll ebaõnnestus: {}", source.getName(), e.getMessage());
        }
      }

      // Enrich new updates with AI (rate limited)
      List<RegulatoryUpdateEntity> needsEnrichment =
          updateRepository.findByStatusOrderByFetchedAtDesc("NEW");
      for (RegulatoryUpdateEntity update : needsEnrichment) {
        if (enriched >= maxEnrichmentPerCycle) {
          log.info(
              "AI rikastamise limiit ({}) saavutatud, jätkame järgmisel tsüklil",
              maxEnrichmentPerCycle);
          break;
        }
        try {
          enrichWithAi(update);
          alertMatchingService.matchAndCreateAlerts(update);
          enriched++;
        } catch (Exception e) {
          log.warn("Uuenduse AI rikastamine ebaõnnestus {}: {}", update.getId(), e.getMessage());
        }
      }

      log.info(
          "Regulatiivsete uuenduste kontroll lõpetatud. Uusi: {}, AI rikastatud: {}",
          totalNew,
          enriched);
    } catch (Exception e) {
      log.error("Regulatiivsete uuenduste kontroll ebaõnnestus: {}", e.getMessage(), e);
    }
  }

  private int fetchAndProcessSource(RegulatorySourceEntity source) {
    log.debug("Kontrollin allikat: {} ({})", source.getName(), source.getUrl());

    String xmlContent = fetchFeedContent(source.getUrl());
    if (xmlContent == null || xmlContent.isBlank()) {
      log.warn("Tühi vastus allikalt: {}", source.getName());
      return 0;
    }

    List<RssFeedParser.FeedItem> items = rssFeedParser.parseFeed(xmlContent);
    log.debug("Allikast {} leiti {} elementi", source.getName(), items.size());

    int newCount = 0;
    for (RssFeedParser.FeedItem item : items) {
      try {
        // Dedup by sourceId+externalId or URL
        String externalId = item.guid() != null ? item.guid() : item.link();
        if (externalId != null
            && source.getId() != null
            && updateRepository.existsBySourceIdAndExternalId(source.getId(), externalId)) {
          continue;
        }
        if (item.link() != null
            && !item.link().isBlank()
            && updateRepository.existsByUrl(item.link())) {
          continue;
        }

        RegulatoryUpdateEntity update =
            new RegulatoryUpdateEntity(
                source.getName(),
                item.title() != null ? truncate(item.title(), 990) : "Untitled",
                item.description() != null ? truncate(item.description(), 5000) : null,
                item.link(),
                RssFeedParser.parseDate(item.pubDate()));
        update.setSourceId(source.getId());
        update.setExternalId(externalId);
        update.setStatus("NEW");
        update.setRawContent(item.description());

        updateRepository.save(update);
        newCount++;
      } catch (Exception e) {
        log.warn("Elemendi salvestamine ebaõnnestus: {}", e.getMessage());
      }
    }

    if (newCount > 0) {
      log.info("Allikast {} salvestati {} uut uuendust", source.getName(), newCount);
    }
    return newCount;
  }

  private String fetchFeedContent(String url) {
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(url))
              .header("User-Agent", "DoraAudit-RegulatoryMonitor/1.0")
              .header(
                  "Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml")
              .timeout(Duration.ofSeconds(30))
              .GET()
              .build();

      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        return response.body();
      }
      log.warn("HTTP {} vastus URL-ilt: {}", response.statusCode(), url);
      return null;
    } catch (Exception e) {
      log.error("RSS sisu laadimine ebaõnnestus {}: {}", url, e.getMessage());
      return null;
    }
  }

  private void enrichWithAi(RegulatoryUpdateEntity update) {
    String enrichmentJson =
        claudeApiService.enrichRegulatoryUpdate(
            update.getTitle(),
            update.getSummary() != null ? update.getSummary() : "",
            update.getSource());

    JsonNode enrichment = parseJson(enrichmentJson);
    if (enrichment == null) return;

    if (enrichment.has("summary")) {
      update.setAiSummary(enrichment.get("summary").asText());
    }
    if (enrichment.has("impactAnalysis")) {
      update.setAiImpactAnalysis(enrichment.get("impactAnalysis").asText());
    }
    if (enrichment.has("regulations")) {
      update.setRegulations(enrichment.get("regulations").asText());
    }
    if (enrichment.has("companyTypes")) {
      update.setCompanyTypes(enrichment.get("companyTypes").asText());
    }
    if (enrichment.has("countries")) {
      update.setCountries(enrichment.get("countries").asText());
    }
    if (enrichment.has("severity")) {
      update.setSeverity(enrichment.get("severity").asText());
    }

    // Also do relevance assessment
    try {
      String relevanceJson =
          claudeApiService.assessRegulatoryRelevance(update.getTitle(), update.getSummary());
      JsonNode relevance = parseJson(relevanceJson);
      if (relevance != null) {
        if (relevance.has("relevanceScore")) {
          update.setRelevanceScore(relevance.get("relevanceScore").asDouble());
        }
        if (relevance.has("affectedArticles")) {
          update.setAffectedArticles(relevance.get("affectedArticles").asText());
        }
        if (relevance.has("status")) {
          update.setStatus(relevance.get("status").asText());
        }
      }
    } catch (Exception e) {
      log.warn("Relevantsuse hindamine ebaõnnestus: {}", e.getMessage());
      update.setStatus("POTENTIALLY_RELEVANT");
    }

    updateRepository.save(update);

    // Notify monitored contracts if highly relevant
    if (update.getRelevanceScore() != null && update.getRelevanceScore() >= 0.7) {
      notifyActiveContracts(update);
    }
  }

  private JsonNode parseJson(String json) {
    try {
      return objectMapper.readTree(json);
    } catch (Exception e) {
      log.warn("JSON parsimine ebaõnnestus: {}", e.getMessage());
      return null;
    }
  }

  /** Manually add a regulatory update and assess its impact. */
  public RegulatoryUpdateEntity addUpdate(
      String source, String title, String summary, String url, LocalDate publishedDate) {
    if (url != null && !url.isBlank() && updateRepository.existsByUrl(url)) {
      throw new IllegalArgumentException("See uuendus on juba registreeritud: " + url);
    }

    RegulatoryUpdateEntity update =
        new RegulatoryUpdateEntity(source, title, summary, url, publishedDate);

    // Assess relevance using AI
    try {
      String relevanceJson = claudeApiService.assessRegulatoryRelevance(title, summary);
      JsonNode relevance = objectMapper.readTree(relevanceJson);

      if (relevance.has("relevanceScore")) {
        update.setRelevanceScore(relevance.get("relevanceScore").asDouble());
      }
      if (relevance.has("affectedArticles")) {
        update.setAffectedArticles(relevance.get("affectedArticles").asText());
      }
      if (relevance.has("status")) {
        update.setStatus(relevance.get("status").asText());
      }
    } catch (Exception e) {
      log.warn("Relevantsuse hindamine ebaõnnestus: {}", e.getMessage());
      update.setRelevanceScore(0.5);
    }

    update = updateRepository.save(update);

    // If highly relevant, alert all active monitored contracts
    if (update.getRelevanceScore() != null && update.getRelevanceScore() >= 0.7) {
      notifyActiveContracts(update);
    }

    return update;
  }

  private void notifyActiveContracts(RegulatoryUpdateEntity update) {
    List<MonitoredContractEntity> activeContracts = monitoredContractService.getActiveContracts();

    for (MonitoredContractEntity contract : activeContracts) {
      try {
        alertService.createRegulatoryAlert(
            contract.getUserId(),
            contract.getId(),
            update.getId(),
            "Uus regulatiivne uuendus: " + truncate(update.getTitle(), 100),
            String.format(
                "Allikas: %s\n\n%s\n\nSee võib mõjutada lepingut \"%s\". Soovitame teostada uue analüüsi.",
                update.getSource(),
                update.getSummary() != null ? update.getSummary() : "",
                contract.getContractName()),
            update.getRelevanceScore() >= 0.9 ? "HIGH" : "MEDIUM");
      } catch (Exception e) {
        log.error(
            "Teavituse loomine ebaõnnestus lepingule {}: {}", contract.getId(), e.getMessage());
      }
    }
  }

  private String truncate(String text, int maxLength) {
    if (text == null) return "";
    return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
  }
}
