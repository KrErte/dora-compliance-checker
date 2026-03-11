package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComplianceDecayService {

    private final EvidenceRepository evidenceRepository;
    private final RemediationItemRepository remediationRepository;
    private final IncidentReportRepository incidentRepository;
    private final IctProviderRepository ictProviderRepository;
    private final RegulatoryUpdateRepository regulatoryUpdateRepository;
    private final AssessmentRepository assessmentRepository;

    public ComplianceDecayService(EvidenceRepository evidenceRepository,
                                   RemediationItemRepository remediationRepository,
                                   IncidentReportRepository incidentRepository,
                                   IctProviderRepository ictProviderRepository,
                                   RegulatoryUpdateRepository regulatoryUpdateRepository,
                                   AssessmentRepository assessmentRepository) {
        this.evidenceRepository = evidenceRepository;
        this.remediationRepository = remediationRepository;
        this.incidentRepository = incidentRepository;
        this.ictProviderRepository = ictProviderRepository;
        this.regulatoryUpdateRepository = regulatoryUpdateRepository;
        this.assessmentRepository = assessmentRepository;
    }

    public Map<String, Object> getForecast(String userId) {
        LocalDate now = LocalDate.now();
        LocalDate horizon = now.plusDays(90);
        List<Map<String, Object>> items = new ArrayList<>();

        // 1. Evidence expiry
        List<EvidenceEntity> evidence = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (EvidenceEntity e : evidence) {
            if (e.getExpiryDate() != null && !e.getExpiryDate().isAfter(horizon) && !"EXPIRED".equals(e.getStatus())) {
                long daysUntil = ChronoUnit.DAYS.between(now, e.getExpiryDate());
                items.add(buildItem("EVIDENCE_EXPIRY", e.getTitle(),
                    "Evidence document expires", e.getExpiryDate().toString(),
                    calculateUrgency(daysUntil), e.getPillar(), "/evidence-vault",
                    e.getId()));
            }
        }

        // 2. Remediation deadlines
        List<RemediationItemEntity> remediations = remediationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (RemediationItemEntity r : remediations) {
            if (r.getDueDate() != null && !"COMPLETED".equals(r.getStatus()) && !"DEFERRED".equals(r.getStatus())) {
                long daysUntil = ChronoUnit.DAYS.between(now, r.getDueDate());
                if (daysUntil <= 90) {
                    items.add(buildItem("REMEDIATION_DEADLINE", r.getTitle(),
                        "Remediation item due", r.getDueDate().toString(),
                        calculateUrgency(daysUntil), r.getPillar(), "/remediation",
                        r.getId()));
                }
            }
        }

        // 3. Incident reporting deadlines
        List<IncidentReportEntity> incidents = incidentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (IncidentReportEntity inc : incidents) {
            if ("CLOSED".equals(inc.getReportingStatus()) || "FINAL_SENT".equals(inc.getReportingStatus())) continue;

            if (inc.getInitialReportDueAt() != null && inc.getInitialReportSentAt() == null) {
                long daysUntil = ChronoUnit.DAYS.between(now, inc.getInitialReportDueAt().toLocalDate());
                items.add(buildItem("INCIDENT_DEADLINE", inc.getIncidentTitle(),
                    "Initial report due (4h)", inc.getInitialReportDueAt().toString(),
                    calculateUrgency(daysUntil), "INCIDENT_MANAGEMENT", "/incident-reporting",
                    inc.getId()));
            }
            if (inc.getIntermediateReportDueAt() != null && inc.getIntermediateReportSentAt() == null
                && inc.getInitialReportSentAt() != null) {
                long daysUntil = ChronoUnit.DAYS.between(now, inc.getIntermediateReportDueAt().toLocalDate());
                items.add(buildItem("INCIDENT_DEADLINE", inc.getIncidentTitle(),
                    "Intermediate report due (72h)", inc.getIntermediateReportDueAt().toString(),
                    calculateUrgency(daysUntil), "INCIDENT_MANAGEMENT", "/incident-reporting",
                    inc.getId()));
            }
            if (inc.getFinalReportDueAt() != null && inc.getFinalReportSentAt() == null
                && inc.getResolvedAt() != null) {
                long daysUntil = ChronoUnit.DAYS.between(now, inc.getFinalReportDueAt().toLocalDate());
                items.add(buildItem("INCIDENT_DEADLINE", inc.getIncidentTitle(),
                    "Final report due (1 month)", inc.getFinalReportDueAt().toString(),
                    calculateUrgency(daysUntil), "INCIDENT_MANAGEMENT", "/incident-reporting",
                    inc.getId()));
            }
        }

        // 4. Contract renewals
        List<IctProviderEntity> providers = ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (IctProviderEntity p : providers) {
            if (p.getContractEndDate() != null) {
                long daysUntil = ChronoUnit.DAYS.between(now, p.getContractEndDate());
                if (daysUntil <= 90 && daysUntil >= -30) {
                    items.add(buildItem("CONTRACT_RENEWAL", p.getProviderName(),
                        "Contract expires", p.getContractEndDate().toString(),
                        calculateUrgency(daysUntil), "THIRD_PARTY", "/supply-chain",
                        p.getId()));
                }
            }
        }

        // 5. Assessment staleness (if last assessment > 90 days old)
        List<AssessmentEntity> assessments = assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
        if (!assessments.isEmpty()) {
            AssessmentEntity latest = assessments.get(0);
            long daysSince = ChronoUnit.DAYS.between(latest.getAssessmentDate().toLocalDate(), now);
            if (daysSince > 60) {
                long urgency = Math.max(0, 100 - daysSince);
                items.add(buildItem("ASSESSMENT_STALE", "DORA Assessment",
                    "Last assessment " + daysSince + " days ago", latest.getAssessmentDate().toString(),
                    (int) Math.max(0, Math.min(100, urgency)), "ICT_RISK_MANAGEMENT", "/assessment",
                    latest.getId()));
            }
        } else {
            items.add(buildItem("ASSESSMENT_STALE", "DORA Assessment",
                "No assessment completed yet", null,
                95, "ICT_RISK_MANAGEMENT", "/assessment", null));
        }

        // Sort by urgency descending
        items.sort((a, b) -> Integer.compare((int) b.get("urgency"), (int) a.get("urgency")));

        // Category counts
        Map<String, Long> byCat = items.stream()
            .collect(Collectors.groupingBy(i -> (String) i.get("category"), Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("totalItems", items.size());
        result.put("categoryCounts", byCat);
        result.put("overdue", items.stream().filter(i -> (int) i.get("urgency") >= 90).count());

        return result;
    }

    public Map<String, Object> getHealthScore(String userId, int days) {
        Map<String, Object> forecast = getForecast(userId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) forecast.get("items");

        LocalDate cutoff = LocalDate.now().plusDays(days);

        // Filter items within the time horizon
        List<Map<String, Object>> relevant = items.stream()
            .filter(i -> {
                String deadline = (String) i.get("deadline");
                if (deadline == null) return true; // No deadline = always relevant
                try {
                    LocalDate dl = LocalDate.parse(deadline.substring(0, 10));
                    return !dl.isAfter(cutoff);
                } catch (Exception e) {
                    return false;
                }
            }).collect(Collectors.toList());

        // Health score: 100 - (average urgency of relevant items)
        double avgUrgency = relevant.isEmpty() ? 0 :
            relevant.stream().mapToInt(i -> (int) i.get("urgency")).average().orElse(0);
        int healthScore = (int) Math.max(0, Math.min(100, 100 - avgUrgency));

        // Calculate for 30/60/90 day windows
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("healthScore", healthScore);
        result.put("days", days);
        result.put("itemCount", relevant.size());
        result.put("criticalItems", relevant.stream().filter(i -> (int) i.get("urgency") >= 80).count());

        // Multi-window scores
        Map<String, Integer> windowScores = new LinkedHashMap<>();
        for (int window : new int[]{30, 60, 90}) {
            LocalDate wCutoff = LocalDate.now().plusDays(window);
            List<Map<String, Object>> wItems = items.stream()
                .filter(i -> {
                    String deadline = (String) i.get("deadline");
                    if (deadline == null) return true;
                    try {
                        LocalDate dl = LocalDate.parse(deadline.substring(0, 10));
                        return !dl.isAfter(wCutoff);
                    } catch (Exception e) { return false; }
                }).collect(Collectors.toList());
            double wAvg = wItems.isEmpty() ? 0 :
                wItems.stream().mapToInt(i -> (int) i.get("urgency")).average().orElse(0);
            windowScores.put(window + "d", (int) Math.max(0, Math.min(100, 100 - wAvg)));
        }
        result.put("windowScores", windowScores);

        return result;
    }

    private Map<String, Object> buildItem(String category, String title, String description,
                                           String deadline, int urgency, String pillar,
                                           String actionLink, String sourceId) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("category", category);
        item.put("title", title);
        item.put("description", description);
        item.put("deadline", deadline);
        item.put("urgency", urgency);
        item.put("pillar", pillar);
        item.put("actionLink", actionLink);
        item.put("sourceId", sourceId);
        return item;
    }

    private int calculateUrgency(long daysUntil) {
        if (daysUntil < 0) return 100; // Overdue
        if (daysUntil <= 1) return 95;
        if (daysUntil <= 7) return 85;
        if (daysUntil <= 14) return 70;
        if (daysUntil <= 30) return 55;
        if (daysUntil <= 60) return 35;
        return 15;
    }
}
