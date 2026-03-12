package com.dorachecker.service;

import com.dorachecker.model.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RegulatoryTranslatorService {

    private static final Logger log = LoggerFactory.getLogger(RegulatoryTranslatorService.class);

    private final RegulatoryTranslationRepository translationRepo;
    private final RegulatoryUpdateRepository updateRepo;
    private final AssessmentRepository assessmentRepo;
    private final EvidenceRepository evidenceRepo;
    private final IctProviderRepository providerRepo;
    private final ContractAnalysisRepository contractRepo;
    private final RemediationItemRepository remediationRepo;
    private final ClaudeApiService claudeApi;
    private final RemediationService remediationService;
    private final ObjectMapper objectMapper;

    public RegulatoryTranslatorService(RegulatoryTranslationRepository translationRepo,
                                        RegulatoryUpdateRepository updateRepo,
                                        AssessmentRepository assessmentRepo,
                                        EvidenceRepository evidenceRepo,
                                        IctProviderRepository providerRepo,
                                        ContractAnalysisRepository contractRepo,
                                        RemediationItemRepository remediationRepo,
                                        ClaudeApiService claudeApi,
                                        RemediationService remediationService,
                                        ObjectMapper objectMapper) {
        this.translationRepo = translationRepo;
        this.updateRepo = updateRepo;
        this.assessmentRepo = assessmentRepo;
        this.evidenceRepo = evidenceRepo;
        this.providerRepo = providerRepo;
        this.contractRepo = contractRepo;
        this.remediationRepo = remediationRepo;
        this.claudeApi = claudeApi;
        this.remediationService = remediationService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> translateForUser(String userId, String updateId) {
        // Check cache first
        Optional<RegulatoryTranslationEntity> existing = translationRepo.findByUserIdAndRegulatoryUpdateId(userId, updateId);
        if (existing.isPresent()) {
            return toDetailMap(existing.get());
        }

        // Get the regulatory update
        Optional<RegulatoryUpdateEntity> updateOpt = updateRepo.findById(updateId);
        if (updateOpt.isEmpty()) {
            return Map.of("error", "Regulatory update not found");
        }
        RegulatoryUpdateEntity update = updateOpt.get();

        // Build user context
        Map<String, Object> userContext = buildUserContext(userId);

        // Build AI prompt
        String prompt = buildPrompt(update, userContext);

        try {
            String aiResponse = claudeApi.analyze(prompt, 4096);
            Map<String, Object> parsed = objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>() {});

            // Create entity
            RegulatoryTranslationEntity entity = new RegulatoryTranslationEntity(userId, updateId);
            entity.setUpdateTitle(update.getTitle());
            entity.setPlainSummary((String) parsed.getOrDefault("plainSummary", ""));
            entity.setPersonalImpactScore(toInt(parsed.get("personalImpactScore"), 50));
            entity.setRiskLevel((String) parsed.getOrDefault("riskLevel", "MEDIUM"));
            entity.setRiskIfIgnored((String) parsed.getOrDefault("riskIfIgnored", ""));

            // Store action items and affected areas as JSON
            List<?> actionItems = (List<?>) parsed.getOrDefault("actionItems", List.of());
            entity.setActionItemsJson(objectMapper.writeValueAsString(actionItems));
            entity.setTotalActionItems(actionItems.size());
            entity.setAppliedActionItems(0);

            Map<?, ?> affectedAreas = (Map<?, ?>) parsed.getOrDefault("affectedAreas", Map.of());
            entity.setAffectedAreasJson(objectMapper.writeValueAsString(affectedAreas));

            // Context snapshot
            entity.setAssessmentScoreAtTime((Double) userContext.get("latestScore"));
            entity.setEvidenceCountAtTime((Long) userContext.get("evidenceCount"));
            entity.setProviderCountAtTime((Long) userContext.get("providerCount"));
            entity.setContractCountAtTime((long) ((List<?>) userContext.get("contracts")).size());

            translationRepo.save(entity);
            return toDetailMap(entity);

        } catch (Exception e) {
            log.error("Translation failed for userId={}, updateId={}: {}", userId, updateId, e.getMessage(), e);
            return Map.of("error", "AI translation failed: " + e.getMessage());
        }
    }

    private Map<String, Object> buildUserContext(String userId) {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Latest assessment
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        if (!assessments.isEmpty()) {
            AssessmentEntity latest = assessments.get(0);
            ctx.put("latestScore", latest.getScorePercentage());
            ctx.put("complianceLevel", latest.getComplianceLevel());
            ctx.put("answersJson", latest.getAnswersJson());
        } else {
            ctx.put("latestScore", null);
            ctx.put("complianceLevel", "UNKNOWN");
            ctx.put("answersJson", null);
        }

        // Evidence by pillar + expired
        List<EvidenceEntity> allEvidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        ctx.put("evidenceCount", (long) allEvidence.size());
        Map<String, Integer> evidenceByPillar = new LinkedHashMap<>();
        List<String> expiredEvidence = new ArrayList<>();
        for (EvidenceEntity ev : allEvidence) {
            if (ev.getPillar() != null) {
                evidenceByPillar.merge(ev.getPillar(), 1, Integer::sum);
            }
            if ("EXPIRED".equals(ev.getStatus()) ||
                (ev.getExpiryDate() != null && ev.getExpiryDate().isBefore(LocalDate.now()))) {
                expiredEvidence.add(ev.getTitle());
            }
        }
        ctx.put("evidenceByPillar", evidenceByPillar);
        ctx.put("expiredEvidence", expiredEvidence.size() > 5 ? expiredEvidence.subList(0, 5) : expiredEvidence);

        // Top 10 providers
        List<IctProviderEntity> providers = providerRepo.findByUserIdOrderByCreatedAtDesc(userId);
        ctx.put("providerCount", (long) providers.size());
        List<Map<String, Object>> providerList = new ArrayList<>();
        for (int i = 0; i < Math.min(10, providers.size()); i++) {
            IctProviderEntity p = providers.get(i);
            providerList.add(Map.of(
                "name", p.getProviderName() != null ? p.getProviderName() : "Unknown",
                "serviceType", p.getServiceType() != null ? p.getServiceType() : "N/A",
                "criticality", p.getCriticality() != null ? p.getCriticality() : "N/A",
                "isCritical", p.isCritical()
            ));
        }
        ctx.put("providers", providerList);

        // Top 5 contracts
        List<ContractAnalysisEntity> contracts = contractRepo.findByUserIdOrderByAnalysisDateDesc(userId);
        List<Map<String, Object>> contractList = new ArrayList<>();
        for (int i = 0; i < Math.min(5, contracts.size()); i++) {
            ContractAnalysisEntity c = contracts.get(i);
            contractList.add(Map.of(
                "name", c.getContractName() != null ? c.getContractName() : "Unknown",
                "score", c.getScorePercentage(),
                "missingCount", c.getMissingCount()
            ));
        }
        ctx.put("contracts", contractList);

        // Open / in-progress remediation items
        List<RemediationItemEntity> openItems = remediationRepo.findByUserIdAndStatusOrderByPriorityAsc(userId, "OPEN");
        List<RemediationItemEntity> inProgressItems = remediationRepo.findByUserIdAndStatusOrderByPriorityAsc(userId, "IN_PROGRESS");
        List<Map<String, String>> remediationItems = new ArrayList<>();
        for (RemediationItemEntity r : openItems) {
            remediationItems.add(Map.of("title", r.getTitle(), "priority", r.getPriority(), "pillar", r.getPillar() != null ? r.getPillar() : "N/A"));
        }
        for (RemediationItemEntity r : inProgressItems) {
            remediationItems.add(Map.of("title", r.getTitle(), "priority", r.getPriority(), "pillar", r.getPillar() != null ? r.getPillar() : "N/A"));
        }
        ctx.put("remediationItems", remediationItems.size() > 15 ? remediationItems.subList(0, 15) : remediationItems);

        return ctx;
    }

    private String buildPrompt(RegulatoryUpdateEntity update, Map<String, Object> context) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a DORA compliance expert. A new regulatory update has been published. ");
        sb.append("Analyze it against this specific organization's compliance data and generate personalized action items.\n\n");

        sb.append("=== REGULATORY UPDATE ===\n");
        sb.append("Title: ").append(update.getTitle()).append("\n");
        sb.append("Source: ").append(update.getSource()).append("\n");
        sb.append("Severity: ").append(update.getSeverity()).append("\n");
        if (update.getSummary() != null) sb.append("Summary: ").append(update.getSummary()).append("\n");
        if (update.getAiSummary() != null) sb.append("AI Summary: ").append(update.getAiSummary()).append("\n");
        if (update.getAffectedArticles() != null) sb.append("Affected Articles: ").append(update.getAffectedArticles()).append("\n");
        if (update.getAffectedPillars() != null) sb.append("Affected Pillars: ").append(update.getAffectedPillars()).append("\n");
        if (update.getEffectiveDate() != null) sb.append("Effective Date: ").append(update.getEffectiveDate()).append("\n");

        sb.append("\n=== ORGANIZATION'S CURRENT COMPLIANCE STATE ===\n");
        sb.append("Latest Assessment Score: ").append(context.get("latestScore")).append("%\n");
        sb.append("Compliance Level: ").append(context.get("complianceLevel")).append("\n");
        sb.append("Total Evidence Documents: ").append(context.get("evidenceCount")).append("\n");
        sb.append("Evidence by Pillar: ").append(context.get("evidenceByPillar")).append("\n");
        sb.append("Expired Evidence: ").append(context.get("expiredEvidence")).append("\n");
        sb.append("Total ICT Providers: ").append(context.get("providerCount")).append("\n");
        sb.append("Top Providers: ").append(context.get("providers")).append("\n");
        sb.append("Contract Analyses: ").append(context.get("contracts")).append("\n");
        sb.append("Open Remediation Items: ").append(context.get("remediationItems")).append("\n");

        sb.append("\n=== INSTRUCTIONS ===\n");
        sb.append("Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:\n");
        sb.append("{\n");
        sb.append("  \"plainSummary\": \"A 2-3 sentence plain-language summary of what this update means for THIS organization specifically\",\n");
        sb.append("  \"personalImpactScore\": <number 0-100, how much this update impacts THIS organization>,\n");
        sb.append("  \"riskLevel\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n");
        sb.append("  \"riskIfIgnored\": \"What could happen if this organization ignores this update\",\n");
        sb.append("  \"affectedAreas\": {\n");
        sb.append("    \"assessmentGaps\": [\"specific gap 1 based on their assessment data\", ...],\n");
        sb.append("    \"evidenceGaps\": [\"missing or expired evidence they need to address\", ...],\n");
        sb.append("    \"affectedProviders\": [\"provider name that may be affected\", ...],\n");
        sb.append("    \"contractClauses\": [\"contract clause that needs review\", ...]\n");
        sb.append("  },\n");
        sb.append("  \"actionItems\": [\n");
        sb.append("    {\n");
        sb.append("      \"title\": \"Short action title\",\n");
        sb.append("      \"description\": \"Detailed description of what to do\",\n");
        sb.append("      \"priority\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n");
        sb.append("      \"pillar\": \"ICT_RISK_MANAGEMENT|INCIDENT_MANAGEMENT|TESTING|THIRD_PARTY|INFORMATION_SHARING\",\n");
        sb.append("      \"articleReference\": \"e.g. Art. 6(1)\",\n");
        sb.append("      \"suggestedDeadlineDays\": <number of days to complete>,\n");
        sb.append("      \"overlapsWithExisting\": <true|false if similar to their existing remediation items>\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n");
        sb.append("Generate 3-8 actionable, specific action items based on the organization's actual data. ");
        sb.append("Reference their specific providers, contracts, and gaps by name where possible.");

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> applyActionItems(String userId, String translationId, List<Integer> indices) {
        Optional<RegulatoryTranslationEntity> opt = translationRepo.findById(translationId);
        if (opt.isEmpty() || !opt.get().getUserId().equals(userId)) {
            return Map.of("error", "Translation not found");
        }

        RegulatoryTranslationEntity entity = opt.get();

        try {
            List<Map<String, Object>> actionItems = objectMapper.readValue(
                entity.getActionItemsJson(), new TypeReference<List<Map<String, Object>>>() {});

            int applied = 0;
            for (int idx : indices) {
                if (idx < 0 || idx >= actionItems.size()) continue;
                Map<String, Object> item = actionItems.get(idx);

                // Create remediation item
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("title", item.getOrDefault("title", "Regulatory Action Item"));
                body.put("description", item.getOrDefault("description", ""));
                body.put("source", "REGULATORY_UPDATE");
                body.put("sourceId", entity.getRegulatoryUpdateId());
                body.put("pillar", item.getOrDefault("pillar", "ICT_RISK_MANAGEMENT"));
                body.put("articleReference", item.getOrDefault("articleReference", ""));
                body.put("priority", item.getOrDefault("priority", "MEDIUM"));

                Object deadlineDays = item.get("suggestedDeadlineDays");
                if (deadlineDays instanceof Number) {
                    LocalDate dueDate = LocalDate.now().plusDays(((Number) deadlineDays).longValue());
                    body.put("dueDate", dueDate.toString());
                }

                remediationService.create(userId, body);
                applied++;
            }

            entity.setAppliedActionItems(entity.getAppliedActionItems() + applied);
            if (entity.getAppliedActionItems() >= entity.getTotalActionItems()) {
                entity.setStatus("FULLY_APPLIED");
            } else if (entity.getAppliedActionItems() > 0) {
                entity.setStatus("PARTIALLY_APPLIED");
            }
            entity.setUpdatedAt(LocalDateTime.now());
            translationRepo.save(entity);

            return Map.of("applied", applied, "status", entity.getStatus(),
                "appliedActionItems", entity.getAppliedActionItems(),
                "totalActionItems", entity.getTotalActionItems());

        } catch (Exception e) {
            log.error("Failed to apply action items: {}", e.getMessage(), e);
            return Map.of("error", "Failed to apply action items: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getTranslations(String userId) {
        List<RegulatoryTranslationEntity> entities = translationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (RegulatoryTranslationEntity e : entities) {
            result.add(toSummaryMap(e));
        }
        return result;
    }

    public Map<String, Object> getTranslation(String userId, String id) {
        Optional<RegulatoryTranslationEntity> opt = translationRepo.findById(id);
        if (opt.isEmpty() || !opt.get().getUserId().equals(userId)) {
            return null;
        }
        return toDetailMap(opt.get());
    }

    public Map<String, Object> getStats(String userId) {
        long total = translationRepo.countByUserId(userId);
        long applied = translationRepo.countByUserIdAndStatus(userId, "FULLY_APPLIED");
        long partial = translationRepo.countByUserIdAndStatus(userId, "PARTIALLY_APPLIED");
        long dismissed = translationRepo.countByUserIdAndStatus(userId, "DISMISSED");

        // Calculate average impact score
        List<RegulatoryTranslationEntity> all = translationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        double avgImpact = all.stream()
            .filter(e -> e.getPersonalImpactScore() != null)
            .mapToInt(RegulatoryTranslationEntity::getPersonalImpactScore)
            .average()
            .orElse(0);

        int totalActions = all.stream().mapToInt(RegulatoryTranslationEntity::getTotalActionItems).sum();
        int appliedActions = all.stream().mapToInt(RegulatoryTranslationEntity::getAppliedActionItems).sum();

        return Map.of(
            "total", total,
            "fullyApplied", applied,
            "partiallyApplied", partial,
            "dismissed", dismissed,
            "avgImpactScore", Math.round(avgImpact),
            "totalActionItems", totalActions,
            "appliedActionItems", appliedActions
        );
    }

    public Map<String, Object> dismissTranslation(String userId, String id) {
        Optional<RegulatoryTranslationEntity> opt = translationRepo.findById(id);
        if (opt.isEmpty() || !opt.get().getUserId().equals(userId)) {
            return Map.of("error", "Translation not found");
        }
        RegulatoryTranslationEntity entity = opt.get();
        entity.setStatus("DISMISSED");
        entity.setUpdatedAt(LocalDateTime.now());
        translationRepo.save(entity);
        return Map.of("status", "DISMISSED");
    }

    public Map<String, Object> getUpdatesWithTranslationStatus(String userId, int page, int size) {
        List<RegulatoryUpdateEntity> allUpdates = updateRepo.findAllByOrderByPublishedDateDesc();

        // Get user's existing translations for quick lookup
        List<RegulatoryTranslationEntity> translations = translationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, RegulatoryTranslationEntity> translationMap = new LinkedHashMap<>();
        for (RegulatoryTranslationEntity t : translations) {
            translationMap.put(t.getRegulatoryUpdateId(), t);
        }

        int start = page * size;
        int end = Math.min(start + size, allUpdates.size());
        if (start >= allUpdates.size()) {
            return Map.of("content", List.of(), "totalElements", allUpdates.size(), "page", page, "size", size);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = start; i < end; i++) {
            RegulatoryUpdateEntity u = allUpdates.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("title", u.getTitle());
            item.put("source", u.getSource());
            item.put("severity", u.getSeverity());
            item.put("publishedDate", u.getPublishedDate());
            item.put("summary", u.getSummary() != null ? u.getSummary() : u.getAiSummary());
            item.put("affectedPillars", u.getAffectedPillars());

            RegulatoryTranslationEntity translation = translationMap.get(u.getId());
            if (translation != null) {
                item.put("translated", true);
                item.put("translationId", translation.getId());
                item.put("impactScore", translation.getPersonalImpactScore());
                item.put("riskLevel", translation.getRiskLevel());
                item.put("translationStatus", translation.getStatus());
            } else {
                item.put("translated", false);
            }

            items.add(item);
        }

        return Map.of("content", items, "totalElements", allUpdates.size(), "page", page, "size", size);
    }

    // ─── Helpers ─────────────────────────────────────────

    private Map<String, Object> toSummaryMap(RegulatoryTranslationEntity e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("regulatoryUpdateId", e.getRegulatoryUpdateId());
        m.put("updateTitle", e.getUpdateTitle());
        m.put("personalImpactScore", e.getPersonalImpactScore());
        m.put("riskLevel", e.getRiskLevel());
        m.put("status", e.getStatus());
        m.put("totalActionItems", e.getTotalActionItems());
        m.put("appliedActionItems", e.getAppliedActionItems());
        m.put("createdAt", e.getCreatedAt());
        return m;
    }

    private Map<String, Object> toDetailMap(RegulatoryTranslationEntity e) {
        Map<String, Object> m = new LinkedHashMap<>(toSummaryMap(e));
        m.put("plainSummary", e.getPlainSummary());
        m.put("riskIfIgnored", e.getRiskIfIgnored());
        m.put("assessmentScoreAtTime", e.getAssessmentScoreAtTime());
        m.put("evidenceCountAtTime", e.getEvidenceCountAtTime());
        m.put("providerCountAtTime", e.getProviderCountAtTime());
        m.put("contractCountAtTime", e.getContractCountAtTime());
        m.put("updatedAt", e.getUpdatedAt());

        try {
            if (e.getActionItemsJson() != null) {
                m.put("actionItems", objectMapper.readValue(e.getActionItemsJson(), new TypeReference<List<Map<String, Object>>>() {}));
            }
            if (e.getAffectedAreasJson() != null) {
                m.put("affectedAreas", objectMapper.readValue(e.getAffectedAreasJson(), new TypeReference<Map<String, Object>>() {}));
            }
        } catch (Exception ex) {
            log.warn("Failed to parse JSON fields for translation {}: {}", e.getId(), ex.getMessage());
        }

        return m;
    }

    private int toInt(Object value, int defaultValue) {
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try { return Integer.parseInt((String) value); } catch (NumberFormatException e) { /* ignore */ }
        }
        return defaultValue;
    }
}
