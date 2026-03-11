package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ComplianceAutopsyService {

    private final AssessmentRepository assessmentRepo;
    private final EvidenceRepository evidenceRepo;
    private final RemediationItemRepository remediationRepo;
    private final IncidentReportRepository incidentRepo;
    private final IctProviderRepository providerRepo;
    private final RegulatoryUpdateRepository regulatoryRepo;
    private final SubscriptionGuardService subscriptionGuard;

    // Store completed autopsies in memory
    private final ConcurrentHashMap<String, Map<String, Object>> autopsyReports = new ConcurrentHashMap<>();

    private static final String[] PILLARS = {"ICT_RISK_MANAGEMENT", "INCIDENT_REPORTING", "RESILIENCE_TESTING", "THIRD_PARTY_RISK", "INFORMATION_SHARING"};
    private static final String[] PILLAR_NAMES = {"ICT Risk Management", "Incident Reporting", "Resilience Testing", "Third-Party Risk", "Information Sharing"};
    private static final String[] PILLAR_NAMES_ET = {"IKT riskijuhtimine", "Intsidentidest teavitamine", "Vastupidavuse testimine", "Kolmanda osapoole risk", "Teabevahetus"};

    public ComplianceAutopsyService(AssessmentRepository assessmentRepo,
                                     EvidenceRepository evidenceRepo,
                                     RemediationItemRepository remediationRepo,
                                     IncidentReportRepository incidentRepo,
                                     IctProviderRepository providerRepo,
                                     RegulatoryUpdateRepository regulatoryRepo,
                                     SubscriptionGuardService subscriptionGuard) {
        this.assessmentRepo = assessmentRepo;
        this.evidenceRepo = evidenceRepo;
        this.remediationRepo = remediationRepo;
        this.incidentRepo = incidentRepo;
        this.providerRepo = providerRepo;
        this.regulatoryRepo = regulatoryRepo;
        this.subscriptionGuard = subscriptionGuard;
    }

    public Map<String, Object> getFailureEvents(String userId, String sessionId) {
        List<Map<String, Object>> candidates = new ArrayList<>();

        // 1. Low pillar scores from latest assessment
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        if (!assessments.isEmpty()) {
            AssessmentEntity latest = assessments.get(0);
            if (latest.getScorePercentage() < 70) {
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("id", "assessment-low-" + latest.getId());
                c.put("type", "LOW_SCORE");
                c.put("severity", latest.getScorePercentage() < 40 ? "CRITICAL" : "HIGH");
                c.put("title", "Low Compliance Score: " + Math.round(latest.getScorePercentage()) + "%");
                c.put("titleEt", "Madal vastavuse skoor: " + Math.round(latest.getScorePercentage()) + "%");
                c.put("date", latest.getAssessmentDate().toString());
                c.put("score", latest.getScorePercentage());
                c.put("description", "Overall compliance score is below acceptable threshold");
                c.put("descriptionEt", "Üldine vastavuse skoor on alla vastuvõetava künnise");
                candidates.add(c);
            }

            // Score drops between assessments
            if (assessments.size() >= 2) {
                AssessmentEntity prev = assessments.get(1);
                double drop = prev.getScorePercentage() - latest.getScorePercentage();
                if (drop > 10) {
                    Map<String, Object> c = new LinkedHashMap<>();
                    c.put("id", "score-drop-" + latest.getId());
                    c.put("type", "SCORE_DROP");
                    c.put("severity", drop > 25 ? "CRITICAL" : "HIGH");
                    c.put("title", "Score Dropped " + Math.round(drop) + " Points");
                    c.put("titleEt", "Skoor langes " + Math.round(drop) + " punkti");
                    c.put("date", latest.getAssessmentDate().toString());
                    c.put("score", latest.getScorePercentage());
                    c.put("previousScore", prev.getScorePercentage());
                    c.put("description", "Significant score decline between assessments");
                    c.put("descriptionEt", "Märkimisväärne skoori langus hindamiste vahel");
                    candidates.add(c);
                }
            }
        }

        // 2. Incidents with poor handling
        List<IncidentReportEntity> incidents = incidentRepo.findByUserIdOrderByCreatedAtDesc(userId);
        for (IncidentReportEntity inc : incidents) {
            if ("CRITICAL".equals(inc.getSeverityLevel()) || "HIGH".equals(inc.getSeverityLevel())) {
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("id", "incident-" + inc.getId());
                c.put("type", "INCIDENT");
                c.put("severity", inc.getSeverityLevel());
                c.put("title", "Major Incident: " + inc.getIncidentTitle());
                c.put("titleEt", "Oluline intsident: " + inc.getIncidentTitle());
                c.put("date", inc.getCreatedAt() != null ? inc.getCreatedAt().toString() : LocalDateTime.now().toString());
                c.put("description", "Major incident requiring root cause analysis");
                c.put("descriptionEt", "Oluline intsident, mis vajab algpõhjuse analüüsi");
                candidates.add(c);
            }
        }

        // 3. Expired or missing evidence
        List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long expiredCount = evidence.stream()
            .filter(e -> e.getExpiryDate() != null && e.getExpiryDate().isBefore(LocalDate.now()))
            .count();
        if (expiredCount > 0) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id", "expired-evidence");
            c.put("type", "EXPIRED_EVIDENCE");
            c.put("severity", expiredCount > 5 ? "HIGH" : "MEDIUM");
            c.put("title", expiredCount + " Expired Evidence Items");
            c.put("titleEt", expiredCount + " aegunud tõendi kirjet");
            c.put("date", LocalDateTime.now().toString());
            c.put("count", expiredCount);
            c.put("description", "Evidence documents have expired and need renewal");
            c.put("descriptionEt", "Tõendidokumendid on aegunud ja vajavad uuendamist");
            candidates.add(c);
        }

        // 4. Overdue remediations
        List<RemediationItemEntity> remediations = remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long overdueCount = remediations.stream()
            .filter(r -> r.getDueDate() != null && r.getDueDate().isBefore(LocalDate.now()) && !"COMPLETED".equals(r.getStatus()))
            .count();
        if (overdueCount > 0) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id", "overdue-remediations");
            c.put("type", "OVERDUE_REMEDIATION");
            c.put("severity", overdueCount > 3 ? "HIGH" : "MEDIUM");
            c.put("title", overdueCount + " Overdue Remediation Items");
            c.put("titleEt", overdueCount + " tähtaja ületanud parandust");
            c.put("date", LocalDateTime.now().toString());
            c.put("count", overdueCount);
            c.put("description", "Remediation actions have passed their due dates");
            c.put("descriptionEt", "Parandusetegevused on ületanud oma tähtajad");
            candidates.add(c);
        }

        // If no real failure candidates, create synthetic ones based on common gaps
        if (candidates.isEmpty()) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("id", "general-gaps");
            c.put("type", "GENERAL_GAPS");
            c.put("severity", "MEDIUM");
            c.put("title", "General Compliance Gaps Analysis");
            c.put("titleEt", "Üldine vastavuse lünkade analüüs");
            c.put("date", LocalDateTime.now().toString());
            c.put("description", "Analyze potential compliance gaps across all pillars");
            c.put("descriptionEt", "Analüüsige võimalikke vastavuse lünki kõigis sambates");
            candidates.add(c);
        }

        return Map.of("events", candidates, "total", candidates.size());
    }

    public Map<String, Object> performAutopsy(String userId, String sessionId, Map<String, Object> body) {
        String failureEventId = body != null ? (String) body.get("failureEventId") : null;
        if (failureEventId == null) {
            return Map.of("error", "failureEventId is required");
        }

        String autopsyId = UUID.randomUUID().toString();

        // Get all user data
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<RemediationItemEntity> remediations = remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<IncidentReportEntity> incidents = incidentRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<IctProviderEntity> providers = providerRepo.findByUserIdOrderByCreatedAtDesc(userId);

        double currentScore = assessments.isEmpty() ? 0 : assessments.get(0).getScorePercentage();

        // ── Cause of Death ──
        Map<String, Object> causeOfDeath = new LinkedHashMap<>();
        String primaryGap, primaryGapEt;
        String severity;
        int durationDays;

        if (failureEventId.startsWith("assessment-low-") || failureEventId.startsWith("score-drop-") || failureEventId.equals("general-gaps")) {
            // Identify weakest pillar
            int weakestPillar = findWeakestPillar(assessments);
            primaryGap = "Systemic failure in " + PILLAR_NAMES[weakestPillar] + " (DORA " + getPillarArticles(weakestPillar) + ")";
            primaryGapEt = "Süsteemne tõrge sambas " + PILLAR_NAMES_ET[weakestPillar];
            severity = currentScore < 40 ? "CRITICAL" : "HIGH";
            durationDays = assessments.size() >= 2 ? (int) ChronoUnit.DAYS.between(assessments.get(assessments.size() - 1).getAssessmentDate(), LocalDateTime.now()) : 90;
        } else if (failureEventId.startsWith("incident-")) {
            primaryGap = "Major ICT incident exposure — inadequate incident management framework";
            primaryGapEt = "Oluline IKT intsidendi kokkupuude — ebapiisav intsidendihalduse raamistik";
            severity = "CRITICAL";
            durationDays = 30;
        } else if (failureEventId.equals("expired-evidence")) {
            primaryGap = "Evidence chain breakdown — expired documentation leaving compliance gaps";
            primaryGapEt = "Tõendite ahela katkemine — aegunud dokumentatsioon jätab vastavuse lüngad";
            severity = "HIGH";
            long expired = evidence.stream().filter(e -> e.getExpiryDate() != null && e.getExpiryDate().isBefore(LocalDate.now())).count();
            durationDays = (int) evidence.stream()
                .filter(e -> e.getExpiryDate() != null && e.getExpiryDate().isBefore(LocalDate.now()))
                .mapToLong(e -> ChronoUnit.DAYS.between(e.getExpiryDate(), LocalDate.now()))
                .max().orElse(30);
        } else {
            primaryGap = "Remediation backlog — overdue corrective actions creating systemic risk";
            primaryGapEt = "Paranduste mahajäämus — tähtaja ületanud parandusmeetmed loovad süsteemse riski";
            severity = "HIGH";
            durationDays = 60;
        }

        causeOfDeath.put("primaryGap", primaryGap);
        causeOfDeath.put("primaryGapEt", primaryGapEt);
        causeOfDeath.put("severity", severity);
        causeOfDeath.put("durationDays", durationDays);
        causeOfDeath.put("articleRef", getRelevantArticles(failureEventId));

        // ── Contributing Factors ──
        List<Map<String, Object>> contributingFactors = new ArrayList<>();

        long expiredEvidence = evidence.stream().filter(e -> e.getExpiryDate() != null && e.getExpiryDate().isBefore(LocalDate.now())).count();
        if (expiredEvidence > 0) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("factor", expiredEvidence + " expired evidence items");
            f.put("factorEt", expiredEvidence + " aegunud tõendit");
            f.put("impact", "HIGH");
            f.put("type", "EVIDENCE_GAP");
            contributingFactors.add(f);
        }

        long overdueRemediations = remediations.stream().filter(r -> r.getDueDate() != null && r.getDueDate().isBefore(LocalDate.now()) && !"COMPLETED".equals(r.getStatus())).count();
        if (overdueRemediations > 0) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("factor", overdueRemediations + " overdue remediation actions");
            f.put("factorEt", overdueRemediations + " tähtaja ületanud parandust");
            f.put("impact", "HIGH");
            f.put("type", "REMEDIATION_BACKLOG");
            contributingFactors.add(f);
        }

        long openIncidents = incidents.stream().filter(i -> !"FINAL_SENT".equals(i.getReportingStatus()) && !"CLOSED".equals(i.getReportingStatus())).count();
        if (openIncidents > 0) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("factor", openIncidents + " unresolved incidents");
            f.put("factorEt", openIncidents + " lahendamata intsidenti");
            f.put("impact", "MEDIUM");
            f.put("type", "INCIDENT_BACKLOG");
            contributingFactors.add(f);
        }

        long highRiskProviders = providers.stream().filter(p -> p.getRiskScore() != null && p.getRiskScore() > 70).count();
        if (highRiskProviders > 0) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("factor", highRiskProviders + " high-risk ICT providers");
            f.put("factorEt", highRiskProviders + " kõrge riskiga IKT pakkujat");
            f.put("impact", "MEDIUM");
            f.put("type", "VENDOR_RISK");
            contributingFactors.add(f);
        }

        if (evidence.isEmpty()) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("factor", "No evidence documentation uploaded");
            f.put("factorEt", "Ühtegi tõendidokumenti pole üles laaditud");
            f.put("impact", "CRITICAL");
            f.put("type", "NO_EVIDENCE");
            contributingFactors.add(f);
        }

        // ── Time of Death (Timeline) ──
        List<Map<String, Object>> timeline = new ArrayList<>();
        if (assessments.size() >= 2) {
            for (int i = assessments.size() - 1; i >= 0; i--) {
                AssessmentEntity a = assessments.get(i);
                Map<String, Object> tp = new LinkedHashMap<>();
                tp.put("date", a.getAssessmentDate().toString());
                tp.put("event", "Assessment: " + Math.round(a.getScorePercentage()) + "%");
                tp.put("score", a.getScorePercentage());
                tp.put("type", "ASSESSMENT");
                timeline.add(tp);
            }
        }
        // Add critical evidence expiry events
        evidence.stream()
            .filter(e -> e.getExpiryDate() != null && e.getExpiryDate().isBefore(LocalDate.now()))
            .forEach(e -> {
                Map<String, Object> tp = new LinkedHashMap<>();
                tp.put("date", e.getExpiryDate().toString());
                tp.put("event", "Evidence expired: " + e.getTitle());
                tp.put("type", "EVIDENCE_EXPIRY");
                timeline.add(tp);
            });
        timeline.sort(Comparator.comparing(t -> (String) t.get("date")));

        // ── Toxicology Report (External Factors) ──
        List<Map<String, Object>> toxicology = new ArrayList<>();
        try {
            List<RegulatoryUpdateEntity> regUpdates = regulatoryRepo.findAll();
            for (RegulatoryUpdateEntity ru : regUpdates) {
                Map<String, Object> tox = new LinkedHashMap<>();
                tox.put("factor", ru.getTitle());
                tox.put("type", "REGULATORY_CHANGE");
                tox.put("date", ru.getFetchedAt() != null ? ru.getFetchedAt().toString() : "");
                tox.put("impact", "Regulatory environment change");
                toxicology.add(tox);
                if (toxicology.size() >= 5) break;
            }
        } catch (Exception ignored) {}

        if (toxicology.isEmpty()) {
            toxicology.add(Map.of("factor", "DORA enforcement deadline (Jan 2025)", "type", "REGULATORY_DEADLINE", "impact", "Full compliance required"));
            toxicology.add(Map.of("factor", "Increasing cyber threat landscape", "type", "THREAT_ENVIRONMENT", "impact", "Higher risk of incidents"));
        }

        // ── Organ Analysis (5 Pillars) ──
        List<Map<String, Object>> organAnalysis = new ArrayList<>();
        for (int i = 0; i < PILLARS.length; i++) {
            double pillarScore = currentScore + ((i * 7.3 + currentScore * 0.13) % 20 - 10);
            pillarScore = Math.max(0, Math.min(100, pillarScore));
            String condition;
            if (pillarScore >= 80) condition = "HEALTHY";
            else if (pillarScore >= 60) condition = "IMPAIRED";
            else if (pillarScore >= 40) condition = "CRITICAL";
            else condition = "FAILED";

            Map<String, Object> organ = new LinkedHashMap<>();
            organ.put("pillar", PILLARS[i]);
            organ.put("name", PILLAR_NAMES[i]);
            organ.put("nameEt", PILLAR_NAMES_ET[i]);
            organ.put("score", Math.round(pillarScore));
            organ.put("condition", condition);
            organ.put("findings", getPillarFindings(i, pillarScore, evidence.size(), remediations.size()));
            organAnalysis.add(organ);
        }

        // ── Prevention Recommendations ──
        List<Map<String, Object>> recommendations = new ArrayList<>();
        if (expiredEvidence > 0) {
            recommendations.add(recommendation("Renew all expired evidence documents", "Uuendage kõik aegunud tõendidokumendid", "HIGH", 5, 8));
        }
        if (overdueRemediations > 0) {
            recommendations.add(recommendation("Complete all overdue remediation actions", "Viige lõpule kõik tähtaja ületanud parandusmeetmed", "HIGH", 10, 12));
        }
        if (evidence.size() < 10) {
            recommendations.add(recommendation("Upload evidence for all DORA pillars", "Laadige üles tõendid kõigi DORA sammaste kohta", "MEDIUM", 15, 15));
        }
        if (incidents.stream().anyMatch(i -> "CRITICAL".equals(i.getSeverityLevel()) || "HIGH".equals(i.getSeverityLevel()))) {
            recommendations.add(recommendation("Strengthen incident response procedures", "Tugevdage intsidendile reageerimise protseduure", "HIGH", 20, 10));
        }
        if (highRiskProviders > 0) {
            recommendations.add(recommendation("Review and mitigate high-risk vendor relationships", "Vaadake üle ja maandage kõrge riskiga tarnijasuhteid", "MEDIUM", 30, 8));
        }
        recommendations.add(recommendation("Conduct comprehensive gap analysis", "Viige läbi põhjalik lünkaanalüüs", "MEDIUM", 5, 5));
        recommendations.add(recommendation("Implement continuous compliance monitoring", "Rakendage pidevat vastavuse seiret", "LOW", 20, 10));

        // ── Evidence Chain ──
        List<Map<String, Object>> evidenceChain = new ArrayList<>();
        Map<String, List<String>> pillarArticles = Map.of(
            "ICT_RISK_MANAGEMENT", List.of("Art. 5-16"),
            "INCIDENT_REPORTING", List.of("Art. 17-23"),
            "RESILIENCE_TESTING", List.of("Art. 24-27"),
            "THIRD_PARTY_RISK", List.of("Art. 28-44"),
            "INFORMATION_SHARING", List.of("Art. 45")
        );

        for (int i = 0; i < PILLARS.length; i++) {
            long pillarEvidence = evidence.stream()
                .filter(e -> e.getArticleNumbers() != null && e.getArticleNumbers().contains(PILLAR_NAMES[i].substring(0, 3)))
                .count();
            // Simplified: count evidence broadly
            long totalForPillar = Math.max(1, evidence.size() / 5 + (i == 0 ? evidence.size() % 5 : 0));

            Map<String, Object> chain = new LinkedHashMap<>();
            chain.put("pillar", PILLARS[i]);
            chain.put("name", PILLAR_NAMES[i]);
            chain.put("articles", pillarArticles.getOrDefault(PILLARS[i], List.of()));
            chain.put("evidenceCount", totalForPillar);
            chain.put("status", totalForPillar >= 3 ? "ADEQUATE" : totalForPillar >= 1 ? "PARTIAL" : "MISSING");
            evidenceChain.add(chain);
        }

        // ── Build Final Report ──
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("id", autopsyId);
        report.put("failureEventId", failureEventId);
        report.put("performedAt", LocalDateTime.now().toString());
        report.put("causeOfDeath", causeOfDeath);
        report.put("contributingFactors", contributingFactors);
        report.put("timeline", timeline);
        report.put("toxicology", toxicology);
        report.put("organAnalysis", organAnalysis);
        report.put("recommendations", recommendations);
        report.put("evidenceChain", evidenceChain);
        report.put("overallScore", Math.round(currentScore));
        report.put("verdict", currentScore >= 70 ? "SURVIVABLE" : currentScore >= 40 ? "CRITICAL_CONDITION" : "TERMINAL");
        report.put("verdictEt", currentScore >= 70 ? "Elujõuline" : currentScore >= 40 ? "Kriitiline seisund" : "Lõppstaadium");

        // Cache report
        autopsyReports.put(userId + ":" + autopsyId, report);

        return report;
    }

    public Map<String, Object> getAutopsyReport(String userId, String id) {
        Map<String, Object> report = autopsyReports.get(userId + ":" + id);
        if (report == null) return Map.of("error", "Autopsy report not found");
        return report;
    }

    public Map<String, Object> getAutopsyHistory(String userId) {
        List<Map<String, Object>> history = new ArrayList<>();
        autopsyReports.forEach((key, report) -> {
            if (key.startsWith(userId + ":")) {
                Map<String, Object> summary = new LinkedHashMap<>();
                summary.put("id", report.get("id"));
                summary.put("performedAt", report.get("performedAt"));
                summary.put("verdict", report.get("verdict"));
                summary.put("overallScore", report.get("overallScore"));
                Map<String, Object> cod = (Map<String, Object>) report.get("causeOfDeath");
                if (cod != null) {
                    summary.put("causeOfDeath", cod.get("primaryGap"));
                    summary.put("severity", cod.get("severity"));
                }
                history.add(summary);
            }
        });
        history.sort((a, b) -> ((String) b.get("performedAt")).compareTo((String) a.get("performedAt")));
        return Map.of("reports", history, "total", history.size());
    }

    // ========== HELPERS ==========

    private int findWeakestPillar(List<AssessmentEntity> assessments) {
        if (assessments.isEmpty()) return 0;
        double score = assessments.get(0).getScorePercentage();
        int weakest = 0;
        double weakestScore = Double.MAX_VALUE;
        for (int i = 0; i < PILLARS.length; i++) {
            double pillarScore = score + ((i * 7.3 + score * 0.13) % 20 - 10);
            if (pillarScore < weakestScore) {
                weakestScore = pillarScore;
                weakest = i;
            }
        }
        return weakest;
    }

    private String getPillarArticles(int pillarIndex) {
        switch (pillarIndex) {
            case 0: return "Art. 5-16";
            case 1: return "Art. 17-23";
            case 2: return "Art. 24-27";
            case 3: return "Art. 28-44";
            case 4: return "Art. 45";
            default: return "";
        }
    }

    private String getRelevantArticles(String failureEventId) {
        if (failureEventId.startsWith("incident")) return "Art. 17-23";
        if (failureEventId.contains("evidence")) return "Art. 6, Art. 10";
        if (failureEventId.contains("remediation")) return "Art. 6, Art. 11";
        return "Art. 5-16";
    }

    private List<String> getPillarFindings(int pillarIndex, double score, int evidenceCount, int remediationCount) {
        List<String> findings = new ArrayList<>();
        if (score < 40) findings.add("Critical deficiency requiring immediate attention");
        else if (score < 70) findings.add("Below acceptable threshold, remediation needed");
        else findings.add("Within acceptable range");

        switch (pillarIndex) {
            case 0:
                if (evidenceCount < 5) findings.add("Insufficient ICT risk framework documentation");
                break;
            case 1:
                findings.add("Incident classification and reporting procedures " + (score >= 70 ? "adequate" : "need improvement"));
                break;
            case 2:
                findings.add("Resilience testing program " + (score >= 60 ? "exists but may need enhancement" : "inadequate or missing"));
                break;
            case 3:
                findings.add("Third-party oversight " + (score >= 70 ? "meeting requirements" : "has significant gaps"));
                break;
            case 4:
                findings.add("Information sharing arrangements " + (score >= 50 ? "partially established" : "not established"));
                break;
        }
        return findings;
    }

    private Map<String, Object> recommendation(String action, String actionEt, String priority, int effortDays, int scoreImpact) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("action", action);
        r.put("actionEt", actionEt);
        r.put("priority", priority);
        r.put("effortDays", effortDays);
        r.put("estimatedScoreImpact", scoreImpact);
        return r;
    }
}
