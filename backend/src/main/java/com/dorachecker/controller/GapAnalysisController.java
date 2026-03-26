package com.dorachecker.controller;

import com.dorachecker.model.GapAnalysisResult;
import com.dorachecker.service.ArticleTrackerService;
import com.dorachecker.service.DoraArticleRequirements;
import com.dorachecker.service.GapAnalysisService;
import com.dorachecker.service.SubscriptionGuardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gap-analysis")
public class GapAnalysisController {

    private static final Logger log = LoggerFactory.getLogger(GapAnalysisController.class);

    private final GapAnalysisService gapAnalysisService;
    private final SubscriptionGuardService subscriptionGuardService;
    private final ArticleTrackerService articleTrackerService;

    public GapAnalysisController(GapAnalysisService gapAnalysisService,
                                  SubscriptionGuardService subscriptionGuardService,
                                  ArticleTrackerService articleTrackerService) {
        this.gapAnalysisService = gapAnalysisService;
        this.subscriptionGuardService = subscriptionGuardService;
        this.articleTrackerService = articleTrackerService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentTitle") String documentTitle,
            @RequestParam("documentCategory") String documentCategory,
            @RequestParam("articleNumbers") String articleNumbers,
            Authentication authentication) {

        String userId = authentication.getName();

        if (!subscriptionGuardService.canAccess(userId, null, SubscriptionGuardService.Feature.EVIDENCE_GAP_ANALYZER)) {
            return ResponseEntity.status(403).body(Map.of("error", "Evidence Gap Analyzer requires an Enterprise subscription"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 10MB limit"));
        }

        List<String> articles = Arrays.stream(articleNumbers.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        if (articles.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "At least one article number is required"));
        }

        try {
            GapAnalysisResult result = gapAnalysisService.analyze(userId, documentTitle, documentCategory, articles, file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Gap analysis failed for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    /**
     * Zero-upload: accept pre-extracted text from client-side parsing.
     */
    @PostMapping("/analyze-text")
    public ResponseEntity<?> analyzeText(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String userId = authentication.getName();

        if (!subscriptionGuardService.canAccess(userId, null, SubscriptionGuardService.Feature.EVIDENCE_GAP_ANALYZER)) {
            return ResponseEntity.status(403).body(Map.of("error", "Evidence Gap Analyzer requires an Enterprise subscription"));
        }

        String text = body.get("text");
        String documentTitle = body.getOrDefault("documentTitle", "");
        String documentCategory = body.getOrDefault("documentCategory", "POLICY");
        String articleNumbers = body.getOrDefault("articleNumbers", "");
        String fileName = body.getOrDefault("fileName", "client-parsed.txt");

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text content is required"));
        }

        List<String> articles = Arrays.stream(articleNumbers.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        if (articles.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "At least one article number is required"));
        }

        try {
            GapAnalysisResult result = gapAnalysisService.analyzeText(userId, documentTitle, documentCategory, articles, fileName, text);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Gap analysis (text) failed for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<GapAnalysisResult>> getHistory(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(gapAnalysisService.getHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GapAnalysisResult> getById(@PathVariable String id, Authentication authentication) {
        String userId = authentication.getName();
        GapAnalysisResult result = gapAnalysisService.getById(id, userId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/supported-articles")
    public ResponseEntity<List<Map<String, Object>>> getSupportedArticles() {
        List<Map<String, Object>> articles = DoraArticleRequirements.ALL_REQUIREMENTS.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        DoraArticleRequirements.Requirement::articleNumber))
                .entrySet().stream()
                .map(entry -> {
                    var reqs = entry.getValue();
                    return Map.<String, Object>of(
                            "articleNumber", entry.getKey(),
                            "requirementCount", reqs.size(),
                            "firstReference", reqs.get(0).doraReference(),
                            "nameEt", getArticleNameEt(entry.getKey()),
                            "nameEn", getArticleNameEn(entry.getKey())
                    );
                })
                .sorted((a, b) -> Integer.compare(
                        Integer.parseInt((String) a.get("articleNumber")),
                        Integer.parseInt((String) b.get("articleNumber"))))
                .toList();
        return ResponseEntity.ok(articles);
    }

    @PostMapping("/{id}/link-evidence")
    public ResponseEntity<?> linkEvidence(@PathVariable String id,
                                           @RequestParam("evidenceId") String evidenceId,
                                           Authentication authentication) {
        String userId = authentication.getName();
        try {
            GapAnalysisResult result = gapAnalysisService.linkEvidence(id, userId, evidenceId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/sync-tracker")
    public ResponseEntity<?> syncTracker(@PathVariable String id, Authentication authentication) {
        String userId = authentication.getName();
        GapAnalysisResult result = gapAnalysisService.getById(id, userId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        // Sync each finding to Article Tracker — map gap status to tracker status
        int synced = 0;
        for (var finding : result.findings()) {
            String articleId = "art" + finding.articleNumber();
            String trackerStatus = switch (finding.status().toLowerCase()) {
                case "found" -> "compliant";
                case "partial" -> "partial";
                case "missing" -> "non_compliant";
                default -> "non_compliant";
            };

            Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("status", trackerStatus);
            data.put("notes", "Gap Analysis: " + finding.subRequirementEn()
                    + (finding.quoteFromDocument() != null && !finding.quoteFromDocument().isBlank()
                            ? " | Evidence: " + finding.quoteFromDocument() : ""));
            articleTrackerService.updateArticleStatus(userId, articleId, data);
            synced++;
        }

        return ResponseEntity.ok(Map.of(
                "synced", true,
                "findingsCount", result.findings().size(),
                "articlesSynced", synced
        ));
    }

    private String getArticleNameEt(String articleNumber) {
        return switch (articleNumber) {
            case "5" -> "Juhtimine ja organisatsioon";
            case "6" -> "IKT riskijuhtimise raamistik";
            case "8" -> "Tuvastamine";
            case "9" -> "Kaitse ja ennetamine";
            case "11" -> "Talitluspidevus";
            case "17" -> "Intsidentide haldamise protsess";
            case "18" -> "IKT intsidentide klassifitseerimine";
            case "19" -> "Oluliste intsidentide raporteerimine";
            case "24" -> "Digitaalse vastupidavuse testimine";
            case "30" -> "Lepingu põhisätted";
            default -> "Artikkel " + articleNumber;
        };
    }

    private String getArticleNameEn(String articleNumber) {
        return switch (articleNumber) {
            case "5" -> "Governance and Organisation";
            case "6" -> "ICT Risk Management Framework";
            case "8" -> "Identification";
            case "9" -> "Protection and Prevention";
            case "11" -> "Business Continuity";
            case "17" -> "Incident Management Process";
            case "18" -> "Classification of ICT-related Incidents";
            case "19" -> "Reporting of Major ICT-related Incidents";
            case "24" -> "Digital Operational Resilience Testing";
            case "30" -> "Key Contractual Provisions";
            default -> "Article " + articleNumber;
        };
    }
}
