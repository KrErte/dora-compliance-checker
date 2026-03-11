package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardPackageService {

    private final AssessmentRepository assessmentRepository;
    private final EvidenceRepository evidenceRepository;
    private final RemediationItemRepository remediationRepository;
    private final IncidentReportRepository incidentRepository;
    private final IctProviderRepository ictProviderRepository;
    private final VendorRiskRepository vendorRiskRepository;
    private final RegulatoryUpdateRepository regulatoryUpdateRepository;

    public BoardPackageService(AssessmentRepository assessmentRepository,
                                EvidenceRepository evidenceRepository,
                                RemediationItemRepository remediationRepository,
                                IncidentReportRepository incidentRepository,
                                IctProviderRepository ictProviderRepository,
                                VendorRiskRepository vendorRiskRepository,
                                RegulatoryUpdateRepository regulatoryUpdateRepository) {
        this.assessmentRepository = assessmentRepository;
        this.evidenceRepository = evidenceRepository;
        this.remediationRepository = remediationRepository;
        this.incidentRepository = incidentRepository;
        this.ictProviderRepository = ictProviderRepository;
        this.vendorRiskRepository = vendorRiskRepository;
        this.regulatoryUpdateRepository = regulatoryUpdateRepository;
    }

    public Map<String, Object> getBoardPackageData(String userId) {
        Map<String, Object> data = new LinkedHashMap<>();

        // 1. Assessment scores & trend
        List<AssessmentEntity> assessments = assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
        Map<String, Object> assessmentData = new LinkedHashMap<>();
        if (!assessments.isEmpty()) {
            AssessmentEntity latest = assessments.get(0);
            assessmentData.put("latestScore", latest.getScorePercentage());
            assessmentData.put("complianceLevel", latest.getComplianceLevel());
            assessmentData.put("assessmentDate", latest.getAssessmentDate().toString());
            assessmentData.put("totalQuestions", latest.getTotalQuestions());
            assessmentData.put("compliantCount", latest.getCompliantCount());

            // Trend: last 5 assessments
            List<Map<String, Object>> trend = assessments.stream().limit(5).map(a -> {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("date", a.getAssessmentDate().toString());
                t.put("score", a.getScorePercentage());
                t.put("level", a.getComplianceLevel());
                return t;
            }).collect(Collectors.toList());
            assessmentData.put("trend", trend);
        }
        data.put("assessment", assessmentData);

        // 2. Evidence stats
        Map<String, Object> evidenceData = new LinkedHashMap<>();
        long totalEvidence = evidenceRepository.countByUserId(userId);
        long verifiedEvidence = evidenceRepository.countByUserIdAndStatus(userId, "VERIFIED");
        long expiredEvidence = evidenceRepository.countByUserIdAndStatus(userId, "EXPIRED");
        evidenceData.put("total", totalEvidence);
        evidenceData.put("verified", verifiedEvidence);
        evidenceData.put("expired", expiredEvidence);
        evidenceData.put("verificationRate", totalEvidence > 0 ? Math.round((double) verifiedEvidence / totalEvidence * 100) : 0);
        data.put("evidence", evidenceData);

        // 3. Remediation stats
        Map<String, Object> remediationData = new LinkedHashMap<>();
        long totalRemediation = remediationRepository.countByUserId(userId);
        long openRemediation = remediationRepository.countByUserIdAndStatus(userId, "OPEN");
        long inProgressRemediation = remediationRepository.countByUserIdAndStatus(userId, "IN_PROGRESS");
        long completedRemediation = remediationRepository.countByUserIdAndStatus(userId, "COMPLETED");
        remediationData.put("total", totalRemediation);
        remediationData.put("open", openRemediation);
        remediationData.put("inProgress", inProgressRemediation);
        remediationData.put("completed", completedRemediation);
        remediationData.put("completionRate", totalRemediation > 0 ? Math.round((double) completedRemediation / totalRemediation * 100) : 0);

        // Top gaps (open remediations by priority)
        List<RemediationItemEntity> openItems = remediationRepository.findByUserIdAndStatusOrderByPriorityAsc(userId, "OPEN");
        List<Map<String, String>> topGaps = openItems.stream().limit(5).map(r -> {
            Map<String, String> gap = new LinkedHashMap<>();
            gap.put("title", r.getTitle());
            gap.put("priority", r.getPriority());
            gap.put("pillar", r.getPillar());
            gap.put("articleReference", r.getArticleReference());
            return gap;
        }).collect(Collectors.toList());
        remediationData.put("topGaps", topGaps);
        data.put("remediation", remediationData);

        // 4. Incident summary
        Map<String, Object> incidentData = new LinkedHashMap<>();
        long totalIncidents = incidentRepository.countByUserId(userId);
        long majorIncidents = incidentRepository.countByUserIdAndIsMajorTrue(userId);
        long openIncidents = incidentRepository.countByUserIdAndReportingStatus(userId, "DETECTED")
            + incidentRepository.countByUserIdAndReportingStatus(userId, "INITIAL_SENT")
            + incidentRepository.countByUserIdAndReportingStatus(userId, "INTERMEDIATE_SENT")
            + incidentRepository.countByUserIdAndReportingStatus(userId, "DRAFT");
        long closedIncidents = incidentRepository.countByUserIdAndReportingStatus(userId, "CLOSED")
            + incidentRepository.countByUserIdAndReportingStatus(userId, "FINAL_SENT");
        incidentData.put("total", totalIncidents);
        incidentData.put("major", majorIncidents);
        incidentData.put("open", openIncidents);
        incidentData.put("closed", closedIncidents);
        data.put("incidents", incidentData);

        // 5. Vendor risk overview
        Map<String, Object> vendorData = new LinkedHashMap<>();
        List<IctProviderEntity> providers = ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        vendorData.put("totalProviders", providers.size());
        vendorData.put("criticalProviders", providers.stream()
            .filter(p -> "CRITICAL".equals(p.getCriticality()) || Boolean.TRUE.equals(p.isCritical())).count());
        vendorData.put("withExitStrategy", providers.stream()
            .filter(p -> Boolean.TRUE.equals(p.getHasExitStrategy())).count());
        List<VendorRiskEntity> highRisk = vendorRiskRepository.findHighRiskVendors();
        vendorData.put("highRiskVendors", highRisk.stream().limit(5).map(v -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", v.getVendorName());
            m.put("score", v.getAverageScore());
            m.put("riskLevel", v.getRiskLevel());
            return m;
        }).collect(Collectors.toList()));
        data.put("vendors", vendorData);

        // 6. Recent regulatory updates
        List<RegulatoryUpdateEntity> recentUpdates = regulatoryUpdateRepository.findAllByOrderByPublishedDateDesc();
        data.put("regulatoryUpdates", recentUpdates.stream().limit(5).map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title", u.getTitle());
            m.put("severity", u.getSeverity());
            m.put("publishedDate", u.getPublishedDate() != null ? u.getPublishedDate().toString() : null);
            m.put("summary", u.getAiSummary() != null ? u.getAiSummary() : u.getSummary());
            return m;
        }).collect(Collectors.toList()));

        // 7. Overall health score
        int healthScore = calculateOverallHealth(assessments, totalEvidence, verifiedEvidence,
            completedRemediation, totalRemediation, openIncidents);
        data.put("overallHealthScore", healthScore);
        data.put("generatedAt", LocalDateTime.now().toString());

        return data;
    }

    private int calculateOverallHealth(List<AssessmentEntity> assessments, long totalEvidence,
                                        long verifiedEvidence, long completedRemediation,
                                        long totalRemediation, long openIncidents) {
        double score = 50; // Base

        // Assessment component (30%)
        if (!assessments.isEmpty()) {
            score = assessments.get(0).getScorePercentage() * 0.3;
        }

        // Evidence component (20%)
        if (totalEvidence > 0) {
            score += ((double) verifiedEvidence / totalEvidence) * 100 * 0.2;
        }

        // Remediation component (25%)
        if (totalRemediation > 0) {
            score += ((double) completedRemediation / totalRemediation) * 100 * 0.25;
        } else {
            score += 25; // No remediation needed = good
        }

        // Incident component (25%) — fewer open incidents = better
        if (openIncidents == 0) {
            score += 25;
        } else if (openIncidents <= 2) {
            score += 15;
        } else {
            score += 5;
        }

        return (int) Math.min(100, Math.max(0, score));
    }
}
