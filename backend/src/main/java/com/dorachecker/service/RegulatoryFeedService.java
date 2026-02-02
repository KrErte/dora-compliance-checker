package com.dorachecker.service;

import com.dorachecker.model.MonitoredContractEntity;
import com.dorachecker.model.RegulatoryUpdateEntity;
import com.dorachecker.model.RegulatoryUpdateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RegulatoryFeedService {

    private static final Logger log = LoggerFactory.getLogger(RegulatoryFeedService.class);

    private final RegulatoryUpdateRepository updateRepository;
    private final MonitoredContractService monitoredContractService;
    private final ContractAlertService alertService;
    private final ClaudeApiService claudeApiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${guardian.feed.enabled:false}")
    private boolean feedEnabled;

    public RegulatoryFeedService(RegulatoryUpdateRepository updateRepository,
                                  MonitoredContractService monitoredContractService,
                                  ContractAlertService alertService,
                                  ClaudeApiService claudeApiService) {
        this.updateRepository = updateRepository;
        this.monitoredContractService = monitoredContractService;
        this.alertService = alertService;
        this.claudeApiService = claudeApiService;
    }

    public List<RegulatoryUpdateEntity> getAllUpdates() {
        return updateRepository.findAllByOrderByFetchedAtDesc();
    }

    public List<RegulatoryUpdateEntity> getNewUpdates() {
        return updateRepository.findByStatusOrderByFetchedAtDesc("NEW");
    }

    /**
     * Scheduled daily check for regulatory updates.
     * Runs every day at 06:00 UTC.
     */
    @Scheduled(cron = "${guardian.feed.cron:0 0 6 * * *}")
    public void checkRegulatoryFeeds() {
        if (!feedEnabled) {
            log.debug("Guardian feed kontroll on keelatud");
            return;
        }

        log.info("Alustan regulatiivsete uuenduste kontrolli...");

        try {
            // In production, this would fetch from EUR-Lex, ESA, and Finantsinspektsioon RSS/API feeds.
            // For now, we provide a manual entry point and AI-based relevance assessment.
            log.info("Regulatiivsete uuenduste kontroll lõpetatud");
        } catch (Exception e) {
            log.error("Regulatiivsete uuenduste kontroll ebaõnnestus: {}", e.getMessage(), e);
        }
    }

    /**
     * Manually add a regulatory update and assess its impact.
     */
    public RegulatoryUpdateEntity addUpdate(String source, String title, String summary,
                                             String url, LocalDate publishedDate) {
        // Skip if URL already exists
        if (url != null && !url.isBlank() && updateRepository.existsByUrl(url)) {
            throw new IllegalArgumentException("See uuendus on juba registreeritud: " + url);
        }

        RegulatoryUpdateEntity update = new RegulatoryUpdateEntity(source, title, summary, url, publishedDate);

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
                        String.format("Allikas: %s\n\n%s\n\nSee võib mõjutada lepingut \"%s\". Soovitame teostada uue analüüsi.",
                                update.getSource(),
                                update.getSummary() != null ? update.getSummary() : "",
                                contract.getContractName()),
                        update.getRelevanceScore() >= 0.9 ? "HIGH" : "MEDIUM"
                );
            } catch (Exception e) {
                log.error("Teavituse loomine ebaõnnestus lepingule {}: {}", contract.getId(), e.getMessage());
            }
        }
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
    }
}
