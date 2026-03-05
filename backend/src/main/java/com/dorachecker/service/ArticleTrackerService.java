package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.EvidenceEntity;
import com.dorachecker.model.EvidenceRepository;
import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ArticleTrackerService {

    private final AssessmentRepository assessmentRepo;
    private final EvidenceRepository evidenceRepo;
    private final RemediationItemRepository remediationRepo;

    // In-memory storage for article notes/status overrides per user
    private final ConcurrentHashMap<String, Map<String, Map<String, Object>>> userArticleData = new ConcurrentHashMap<>();

    public ArticleTrackerService(
            AssessmentRepository assessmentRepo,
            EvidenceRepository evidenceRepo,
            RemediationItemRepository remediationRepo) {
        this.assessmentRepo = assessmentRepo;
        this.evidenceRepo = evidenceRepo;
        this.remediationRepo = remediationRepo;
    }

    public Map<String, Object> getArticleComplianceStatus(String userId) {
        // Get latest assessment score
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        double overallScore = 0;
        if (!assessments.isEmpty()) {
            overallScore = assessments.get(0).getScorePercentage();
        }

        // Get evidence by pillar and article
        List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Integer> evidenceByPillar = new HashMap<>();
        Map<String, Set<String>> evidenceByArticle = new HashMap<>();
        for (EvidenceEntity e : evidence) {
            String pillar = e.getPillar() != null ? e.getPillar() : "GENERAL";
            evidenceByPillar.merge(pillar, 1, Integer::sum);
            if (e.getArticleNumbers() != null && !e.getArticleNumbers().isBlank()) {
                for (String artNum : e.getArticleNumbers().split(",")) {
                    String key = "art" + artNum.trim();
                    evidenceByArticle.computeIfAbsent(key, k -> new HashSet<>()).add(e.getId());
                }
            }
        }

        // Get remediation items by pillar
        List<RemediationItemEntity> remediations = remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, int[]> remByPillar = new HashMap<>(); // [total, completed]
        for (RemediationItemEntity r : remediations) {
            String pillar = r.getPillar() != null ? r.getPillar() : "GENERAL";
            remByPillar.computeIfAbsent(pillar, k -> new int[]{0, 0});
            remByPillar.get(pillar)[0]++;
            if ("COMPLETED".equals(r.getStatus())) {
                remByPillar.get(pillar)[1]++;
            }
        }

        // Build article structure
        List<Map<String, Object>> chapters = new ArrayList<>();
        chapters.add(buildChapter("I", "General Provisions", "Art. 1-4", List.of(
            buildArticle("art1", "Article 1", "Subject matter", "GENERAL", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art2", "Article 2", "Scope — financial entities", "GENERAL", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art3", "Article 3", "Definitions", "GENERAL", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art4", "Article 4", "Proportionality principle", "GENERAL", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        chapters.add(buildChapter("II", "ICT Risk Management", "Art. 5-16", List.of(
            buildArticle("art5", "Article 5", "Governance and organisation", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art6", "Article 6", "ICT risk management framework", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art7", "Article 7", "ICT systems, protocols and tools", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art8", "Article 8", "Identification of ICT assets", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art9", "Article 9", "Protection and prevention", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art10", "Article 10", "Detection", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art11", "Article 11", "Response and recovery", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art12", "Article 12", "Backup policies and procedures", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art13", "Article 13", "Learning and evolving", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art14", "Article 14", "Communication", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art15", "Article 15", "Simplified framework (part 1)", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art16", "Article 16", "Simplified framework (part 2)", "ICT_RISK_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        chapters.add(buildChapter("III", "ICT-Related Incident Management", "Art. 17-23", List.of(
            buildArticle("art17", "Article 17", "ICT-related incident management process", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art18", "Article 18", "Classification of incidents", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art19", "Article 19", "Reporting of major incidents", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art20", "Article 20", "Harmonisation of reporting", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art21", "Article 21", "Centralisation of reporting", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art22", "Article 22", "Supervisory feedback", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art23", "Article 23", "Payment-related incidents", "INCIDENT_MANAGEMENT", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        chapters.add(buildChapter("IV", "Digital Operational Resilience Testing", "Art. 24-27", List.of(
            buildArticle("art24", "Article 24", "General testing requirements", "TESTING", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art25", "Article 25", "Testing of ICT tools and systems", "TESTING", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art26", "Article 26", "TLPT requirements", "TESTING", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art27", "Article 27", "Requirements for TLPT testers", "TESTING", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        chapters.add(buildChapter("V", "Managing ICT Third-Party Risk", "Art. 28-44", List.of(
            buildArticle("art28", "Article 28", "General principles for ICT TPP risk", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art29", "Article 29", "Preliminary assessment & concentration risk", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art30", "Article 30", "Key contractual provisions", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art31", "Article 31", "Oversight framework designation", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art32", "Article 32", "Structure of oversight framework", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId),
            buildArticle("art33", "Article 33", "Tasks of the Lead Overseer", "THIRD_PARTY", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        chapters.add(buildChapter("VI", "Information-Sharing Arrangements", "Art. 45", List.of(
            buildArticle("art45", "Article 45", "Information-sharing arrangements", "INFORMATION_SHARING", overallScore, evidenceByPillar, evidenceByArticle, remByPillar, userId)
        )));

        // Calculate overall stats
        int totalArticles = 0, compliantArticles = 0, partialArticles = 0, nonCompliantArticles = 0;
        for (Map<String, Object> chapter : chapters) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> articles = (List<Map<String, Object>>) chapter.get("articles");
            for (Map<String, Object> article : articles) {
                totalArticles++;
                String status = (String) article.get("status");
                if ("compliant".equals(status)) compliantArticles++;
                else if ("partial".equals(status)) partialArticles++;
                else nonCompliantArticles++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("chapters", chapters);
        result.put("totalArticles", totalArticles);
        result.put("compliant", compliantArticles);
        result.put("partial", partialArticles);
        result.put("nonCompliant", nonCompliantArticles);
        result.put("overallPercentage", totalArticles > 0
                ? Math.round(((compliantArticles + partialArticles * 0.5) / totalArticles) * 100)
                : 0);
        return result;
    }

    public Map<String, Object> updateArticleStatus(String userId, String articleId, Map<String, Object> data) {
        userArticleData.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        // Map frontend 'status' field to 'manualStatus' used by buildArticle
        Map<String, Object> stored = new LinkedHashMap<>(data);
        if (stored.containsKey("status") && !stored.containsKey("manualStatus")) {
            stored.put("manualStatus", stored.get("status"));
        }
        userArticleData.get(userId).put(articleId, stored);
        return Map.of("success", true, "articleId", articleId);
    }

    public Map<String, Object> getArticleDetail(String userId, String articleId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("articleId", articleId);
        Map<String, Object> userData = userArticleData
                .getOrDefault(userId, Map.of())
                .getOrDefault(articleId, Map.of());
        result.put("notes", userData.getOrDefault("notes", ""));
        result.put("responsiblePerson", userData.getOrDefault("responsiblePerson", ""));
        result.put("targetDate", userData.getOrDefault("targetDate", ""));
        result.put("manualStatus", userData.getOrDefault("manualStatus", ""));
        return result;
    }

    private Map<String, Object> buildChapter(String number, String title, String articleRange,
                                              List<Map<String, Object>> articles) {
        Map<String, Object> chapter = new LinkedHashMap<>();
        chapter.put("number", number);
        chapter.put("title", title);
        chapter.put("articleRange", articleRange);
        chapter.put("articles", articles);
        int compliant = 0, partial = 0;
        for (Map<String, Object> a : articles) {
            String s = (String) a.get("status");
            if ("compliant".equals(s)) compliant++;
            else if ("partial".equals(s)) partial++;
        }
        chapter.put("progress", articles.isEmpty() ? 0
                : Math.round(((compliant + partial * 0.5) / articles.size()) * 100));
        return chapter;
    }

    private Map<String, Object> buildArticle(String id, String number, String title, String pillar,
                                              double overallScore,
                                              Map<String, Integer> evidenceByPillar,
                                              Map<String, Set<String>> evidenceByArticle,
                                              Map<String, int[]> remByPillar,
                                              String userId) {
        Map<String, Object> article = new LinkedHashMap<>();
        article.put("id", id);
        article.put("number", number);
        article.put("title", title);
        article.put("pillar", pillar);

        // Check for manual status override
        Map<String, Object> userData = userArticleData
                .getOrDefault(userId, Map.of())
                .getOrDefault(id, Map.of());
        String manualStatus = (String) userData.getOrDefault("manualStatus", "");

        int evidenceCount = evidenceByArticle.containsKey(id)
                ? evidenceByArticle.get(id).size()
                : 0;
        // Fallback: count by pillar
        if (evidenceCount == 0) {
            evidenceCount = evidenceByPillar.getOrDefault(pillar, 0);
        }

        if (!manualStatus.isEmpty()) {
            article.put("status", manualStatus);
        } else {
            int[] rem = remByPillar.getOrDefault(pillar, new int[]{0, 0});
            String status;
            if (overallScore >= 75 && evidenceCount >= 1) {
                status = "compliant";
            } else if (overallScore >= 40 || evidenceCount >= 1 || rem[1] > 0) {
                status = "partial";
            } else {
                status = "non_compliant";
            }
            article.put("status", status);
        }

        article.put("evidenceCount", evidenceCount);
        article.put("notes", userData.getOrDefault("notes", ""));
        article.put("responsiblePerson", userData.getOrDefault("responsiblePerson", ""));
        article.put("targetDate", userData.getOrDefault("targetDate", ""));
        return article;
    }
}
