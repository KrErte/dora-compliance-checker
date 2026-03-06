package com.dorachecker.service;

import com.dorachecker.model.GapAnalysisEntity;
import com.dorachecker.model.GapAnalysisRepository;
import com.dorachecker.model.GapAnalysisResult;
import com.dorachecker.model.GapAnalysisResult.GapFinding;
import com.dorachecker.service.DoraArticleRequirements.Requirement;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GapAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(GapAnalysisService.class);
    private static final int MAX_DOCUMENT_LENGTH = 100_000;

    private final DocumentExtractionService extractionService;
    private final ClaudeApiService claudeApiService;
    private final GapAnalysisRepository repository;
    private final ObjectMapper objectMapper;

    public GapAnalysisService(DocumentExtractionService extractionService,
                               ClaudeApiService claudeApiService,
                               GapAnalysisRepository repository,
                               ObjectMapper objectMapper) {
        this.extractionService = extractionService;
        this.claudeApiService = claudeApiService;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public GapAnalysisResult analyze(String userId, String documentTitle, String documentCategory,
                                      List<String> articleNumbers, MultipartFile file) {
        String documentText = extractionService.extractText(file);

        if (documentText == null || documentText.isBlank()) {
            throw new IllegalArgumentException("Could not extract text from the uploaded file");
        }

        if (documentText.length() > MAX_DOCUMENT_LENGTH) {
            documentText = documentText.substring(0, MAX_DOCUMENT_LENGTH);
        }

        List<Requirement> requirements = DoraArticleRequirements.getByArticles(articleNumbers);
        if (requirements.isEmpty()) {
            throw new IllegalArgumentException("No valid article numbers provided");
        }

        String prompt = buildPrompt(documentText, requirements);
        String aiResponse = claudeApiService.analyze(prompt, 6144);

        List<GapFinding> findings = parseFindings(aiResponse, requirements);
        String summaryEt = parseSummary(aiResponse, "summaryEt");
        String summaryEn = parseSummary(aiResponse, "summaryEn");

        int foundCount = 0, missingCount = 0, partialCount = 0;
        for (GapFinding f : findings) {
            switch (f.status()) {
                case "found" -> foundCount++;
                case "missing" -> missingCount++;
                case "partial" -> partialCount++;
            }
        }
        int total = findings.size();
        double score = total > 0 ? (foundCount + partialCount * 0.5) / total * 100.0 : 0;
        String level = score >= 80 ? "GREEN" : score >= 50 ? "YELLOW" : "RED";

        String findingsJson;
        try {
            findingsJson = objectMapper.writeValueAsString(findings);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize findings", e);
        }

        String articleNumbersStr = String.join(",", articleNumbers);

        GapAnalysisEntity entity = new GapAnalysisEntity();
        entity.setUserId(userId);
        entity.setDocumentTitle(documentTitle);
        entity.setFileName(file.getOriginalFilename());
        entity.setDocumentCategory(documentCategory);
        entity.setArticleNumbers(articleNumbersStr);
        entity.setAnalysisDate(LocalDateTime.now());
        entity.setTotalRequirements(total);
        entity.setFoundCount(foundCount);
        entity.setMissingCount(missingCount);
        entity.setPartialCount(partialCount);
        entity.setScorePercentage(Math.round(score * 10.0) / 10.0);
        entity.setComplianceLevel(level);
        entity.setSummaryEt(summaryEt);
        entity.setSummaryEn(summaryEn);
        entity.setFindingsJson(findingsJson);
        entity = repository.save(entity);

        return toResult(entity, findings);
    }

    public GapAnalysisResult getById(String id, String userId) {
        return repository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .map(this::toResult)
                .orElse(null);
    }

    public List<GapAnalysisResult> getHistory(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResult)
                .collect(Collectors.toList());
    }

    public GapAnalysisResult linkEvidence(String id, String userId, String evidenceId) {
        GapAnalysisEntity entity = repository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Analysis not found"));
        entity.setLinkedEvidenceId(evidenceId);
        entity = repository.save(entity);
        return toResult(entity);
    }

    private GapAnalysisResult toResult(GapAnalysisEntity entity) {
        List<GapFinding> findings;
        try {
            findings = objectMapper.readValue(entity.getFindingsJson(),
                    new TypeReference<List<GapFinding>>() {});
        } catch (Exception e) {
            findings = List.of();
        }
        return toResult(entity, findings);
    }

    private GapAnalysisResult toResult(GapAnalysisEntity entity, List<GapFinding> findings) {
        return new GapAnalysisResult(
                entity.getId(),
                entity.getUserId(),
                entity.getDocumentTitle(),
                entity.getFileName(),
                entity.getDocumentCategory(),
                entity.getArticleNumbers(),
                entity.getAnalysisDate(),
                entity.getTotalRequirements(),
                entity.getFoundCount(),
                entity.getMissingCount(),
                entity.getPartialCount(),
                entity.getScorePercentage(),
                entity.getComplianceLevel(),
                entity.getSummaryEt(),
                entity.getSummaryEn(),
                findings,
                entity.getLinkedEvidenceId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private List<GapFinding> parseFindings(String aiResponse, List<Requirement> requirements) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(aiResponse,
                    new TypeReference<Map<String, Object>>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> resultsRaw = (List<Map<String, Object>>) parsed.get("results");
            if (resultsRaw == null) {
                log.error("AI response missing 'results' field");
                return List.of();
            }

            List<GapFinding> findings = new ArrayList<>();
            for (Map<String, Object> r : resultsRaw) {
                findings.add(new GapFinding(
                        ((Number) r.get("requirementId")).intValue(),
                        (String) r.getOrDefault("articleNumber", ""),
                        (String) r.getOrDefault("subRequirementEt", ""),
                        (String) r.getOrDefault("subRequirementEn", ""),
                        (String) r.getOrDefault("status", "missing"),
                        (String) r.getOrDefault("quoteFromDocument", ""),
                        (String) r.getOrDefault("recommendationEt", ""),
                        (String) r.getOrDefault("recommendationEn", ""),
                        (String) r.getOrDefault("doraReference", "")
                ));
            }
            return findings;
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", e.getMessage());
            return List.of();
        }
    }

    private String parseSummary(String aiResponse, String field) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(aiResponse,
                    new TypeReference<Map<String, Object>>() {});
            return (String) parsed.getOrDefault(field, "");
        } catch (Exception e) {
            return "";
        }
    }

    private String buildPrompt(String documentText, List<Requirement> requirements) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a DORA (Digital Operational Resilience Act) compliance analyst. ");
        sb.append("Analyze the following document against specific DORA article requirements.\n\n");
        sb.append("IMPORTANT: The document may be a policy, procedure, framework, test report, audit report, etc. ");
        sb.append("It does NOT need to reference DORA directly. Evaluate based on substance — ");
        sb.append("look for equivalent content using standard compliance, security, and business terminology.\n\n");
        sb.append("For EACH requirement below, classify as \"found\", \"partial\", or \"missing\":\n\n");

        Map<String, List<Requirement>> grouped = requirements.stream()
                .collect(Collectors.groupingBy(Requirement::articleNumber, LinkedHashMap::new, Collectors.toList()));

        for (Map.Entry<String, List<Requirement>> entry : grouped.entrySet()) {
            String article = entry.getKey();
            List<Requirement> reqs = entry.getValue();
            sb.append("ARTICLE ").append(article).append(":\n");

            for (Requirement req : reqs) {
                sb.append(req.id()).append(". ").append(req.requirementEn()).append(" - ").append(req.doraReference()).append("\n");
                sb.append("   - FOUND: ").append(req.foundCriteria()).append("\n");
                sb.append("   - PARTIAL: ").append(req.partialCriteria()).append("\n");
                sb.append("   - MISSING: ").append(req.missingCriteria()).append("\n\n");
            }
        }

        sb.append("Return ONLY a JSON object with this structure (no other text):\n");
        sb.append("{\n");
        sb.append("  \"results\": [\n");
        sb.append("    {\n");
        sb.append("      \"requirementId\": <number matching the requirement number above>,\n");
        sb.append("      \"articleNumber\": \"<article number, e.g. '5'>\",\n");
        sb.append("      \"subRequirementEt\": \"<requirement name in Estonian>\",\n");
        sb.append("      \"subRequirementEn\": \"<requirement name in English>\",\n");
        sb.append("      \"status\": \"found\" | \"partial\" | \"missing\",\n");
        sb.append("      \"quoteFromDocument\": \"<exact quote from document supporting the classification, empty if missing>\",\n");
        sb.append("      \"recommendationEt\": \"<specific recommendation in Estonian, empty if found>\",\n");
        sb.append("      \"recommendationEn\": \"<specific recommendation in English, empty if found>\",\n");
        sb.append("      \"doraReference\": \"<DORA reference, e.g. 'Art. 5(1)'>\"\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"summaryEt\": \"<2-3 sentence overall summary in Estonian>\",\n");
        sb.append("  \"summaryEn\": \"<2-3 sentence overall summary in English>\"\n");
        sb.append("}\n\n");
        sb.append("The results array must contain exactly ").append(requirements.size()).append(" objects.\n\n");
        sb.append("DOCUMENT TEXT:\n---\n");
        sb.append(documentText);
        sb.append("\n---");

        return sb.toString();
    }
}
