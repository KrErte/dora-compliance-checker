package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class TimeMachineService {

    private final AssessmentRepository assessmentRepo;
    private final EvidenceRepository evidenceRepo;
    private final RemediationItemRepository remediationRepo;
    private final IncidentReportRepository incidentRepo;
    private final IctProviderRepository providerRepo;
    private final SubscriptionGuardService subscriptionGuard;

    private static final String[] PILLARS = {"ICT_RISK_MANAGEMENT", "INCIDENT_REPORTING", "RESILIENCE_TESTING", "THIRD_PARTY_RISK", "INFORMATION_SHARING"};
    private static final String[] PILLAR_NAMES = {"ICT Risk Management", "Incident Reporting", "Resilience Testing", "Third-Party Risk", "Information Sharing"};

    public TimeMachineService(AssessmentRepository assessmentRepo,
                              EvidenceRepository evidenceRepo,
                              RemediationItemRepository remediationRepo,
                              IncidentReportRepository incidentRepo,
                              IctProviderRepository providerRepo,
                              SubscriptionGuardService subscriptionGuard) {
        this.assessmentRepo = assessmentRepo;
        this.evidenceRepo = evidenceRepo;
        this.remediationRepo = remediationRepo;
        this.incidentRepo = incidentRepo;
        this.providerRepo = providerRepo;
        this.subscriptionGuard = subscriptionGuard;
    }

    public Map<String, Object> getTimeline(String userId, String sessionId) {
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<RemediationItemEntity> remediations = remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<IncidentReportEntity> incidents = incidentRepo.findByUserIdOrderByCreatedAtDesc(userId);

        // Build events
        List<Map<String, Object>> events = new ArrayList<>();

        for (AssessmentEntity a : assessments) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", "assessment-" + a.getId());
            event.put("type", "ASSESSMENT");
            event.put("date", a.getAssessmentDate().toString());
            event.put("title", "Assessment: " + a.getCompanyName());
            event.put("titleEt", "Hindamine: " + a.getCompanyName());
            event.put("score", a.getScorePercentage());
            event.put("icon", "clipboard");
            event.put("color", "#3b82f6");
            events.add(event);
        }

        for (EvidenceEntity e : evidence) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", "evidence-" + e.getId());
            event.put("type", "EVIDENCE");
            event.put("date", e.getCreatedAt() != null ? e.getCreatedAt().toString() : LocalDateTime.now().toString());
            event.put("title", "Evidence: " + e.getTitle());
            event.put("titleEt", "Tõend: " + e.getTitle());
            event.put("icon", "document");
            event.put("color", "#10b981");
            events.add(event);
        }

        for (RemediationItemEntity r : remediations) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", "remediation-" + r.getId());
            event.put("type", "REMEDIATION");
            event.put("date", r.getCreatedAt() != null ? r.getCreatedAt().toString() : LocalDateTime.now().toString());
            event.put("title", "Remediation: " + r.getTitle());
            event.put("titleEt", "Parandus: " + r.getTitle());
            event.put("status", r.getStatus());
            event.put("icon", "wrench");
            event.put("color", "#f59e0b");
            events.add(event);
        }

        for (IncidentReportEntity i : incidents) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", "incident-" + i.getId());
            event.put("type", "INCIDENT");
            event.put("date", i.getCreatedAt() != null ? i.getCreatedAt().toString() : LocalDateTime.now().toString());
            event.put("title", "Incident: " + i.getIncidentTitle());
            event.put("titleEt", "Intsident: " + i.getIncidentTitle());
            event.put("severity", i.getSeverityLevel());
            event.put("icon", "alert");
            event.put("color", "#ef4444");
            events.add(event);
        }

        events.sort(Comparator.comparing(e -> (String) e.get("date")));

        // Build score trajectory from assessments
        List<Map<String, Object>> trajectory = new ArrayList<>();
        for (AssessmentEntity a : assessments) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", a.getAssessmentDate().toString());
            point.put("score", a.getScorePercentage());
            trajectory.add(point);
        }
        Collections.reverse(trajectory); // chronological order

        // Build projected future (90 days)
        List<Map<String, Object>> projections = new ArrayList<>();
        List<Map<String, Object>> cliffs = new ArrayList<>();
        double currentScore = assessments.isEmpty() ? 0 : assessments.get(0).getScorePercentage();
        LocalDate today = LocalDate.now();

        // Evidence expiry cliff detection
        for (EvidenceEntity e : evidence) {
            if (e.getExpiryDate() != null && e.getExpiryDate().isAfter(today) && e.getExpiryDate().isBefore(today.plusDays(90))) {
                long daysUntil = ChronoUnit.DAYS.between(today, e.getExpiryDate());
                Map<String, Object> cliff = new LinkedHashMap<>();
                cliff.put("date", e.getExpiryDate().toString());
                cliff.put("type", "EVIDENCE_EXPIRY");
                cliff.put("title", "Evidence expires: " + e.getTitle());
                cliff.put("titleEt", "Tõend aegub: " + e.getTitle());
                cliff.put("daysUntil", daysUntil);
                cliff.put("scoreImpact", -3);
                cliffs.add(cliff);
            }
        }

        // Remediation deadline cliffs
        for (RemediationItemEntity r : remediations) {
            if (r.getDueDate() != null && !"COMPLETED".equals(r.getStatus())) {
                LocalDate dueDate = r.getDueDate();
                if (dueDate.isAfter(today) && dueDate.isBefore(today.plusDays(90))) {
                    Map<String, Object> cliff = new LinkedHashMap<>();
                    cliff.put("date", dueDate.toString());
                    cliff.put("type", "REMEDIATION_DEADLINE");
                    cliff.put("title", "Remediation due: " + r.getTitle());
                    cliff.put("titleEt", "Paranduse tähtaeg: " + r.getTitle());
                    cliff.put("daysUntil", ChronoUnit.DAYS.between(today, dueDate));
                    cliff.put("scoreImpact", -2);
                    cliffs.add(cliff);
                }
            }
        }

        cliffs.sort(Comparator.comparing(c -> (String) c.get("date")));

        // Generate projected score line
        double projectedScore = currentScore;
        for (int day = 0; day <= 90; day += 7) {
            LocalDate projDate = today.plusDays(day);
            // Apply cliff impacts
            for (Map<String, Object> cliff : cliffs) {
                LocalDate cliffDate = LocalDate.parse((String) cliff.get("date"));
                if (!cliffDate.isAfter(projDate) && cliffDate.isAfter(today.plusDays(Math.max(0, day - 7)))) {
                    projectedScore += ((Number) cliff.get("scoreImpact")).doubleValue();
                }
            }
            // Natural decay of 0.5% per week if no action
            projectedScore = Math.max(0, projectedScore - 0.5);
            double confidence = Math.max(40, 95 - day * 0.6);

            Map<String, Object> proj = new LinkedHashMap<>();
            proj.put("date", projDate.toString());
            proj.put("score", Math.round(Math.max(0, projectedScore)));
            proj.put("confidence", Math.round(confidence));
            projections.add(proj);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("events", events);
        result.put("trajectory", trajectory);
        result.put("projections", projections);
        result.put("cliffs", cliffs);
        result.put("currentScore", Math.round(currentScore));
        result.put("now", today.toString());
        result.put("totalEvents", events.size());
        return result;
    }

    public Map<String, Object> getStateAtDate(String userId, String sessionId, String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return Map.of("error", "Date parameter is required");
        }
        LocalDate targetDate;
        try {
            targetDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            return Map.of("error", "Invalid date format. Use YYYY-MM-DD");
        }

        LocalDateTime targetDateTime = targetDate.atTime(23, 59, 59);

        // Get assessments before target date
        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        AssessmentEntity latestBefore = null;
        for (AssessmentEntity a : assessments) {
            if (!a.getAssessmentDate().isAfter(targetDateTime)) {
                latestBefore = a;
                break;
            }
        }

        // Count evidence at that date
        List<EvidenceEntity> evidence = evidenceRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long evidenceCount = evidence.stream()
            .filter(e -> e.getCreatedAt() != null && !e.getCreatedAt().isAfter(targetDateTime))
            .count();
        long validEvidence = evidence.stream()
            .filter(e -> e.getCreatedAt() != null && !e.getCreatedAt().isAfter(targetDateTime))
            .filter(e -> e.getExpiryDate() == null || e.getExpiryDate().isAfter(targetDate))
            .count();

        // Count remediations at that date
        List<RemediationItemEntity> remediations = remediationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long remediationsDone = remediations.stream()
            .filter(r -> r.getCreatedAt() != null && !r.getCreatedAt().isAfter(targetDateTime))
            .filter(r -> "COMPLETED".equals(r.getStatus()))
            .count();
        long remediationsTotal = remediations.stream()
            .filter(r -> r.getCreatedAt() != null && !r.getCreatedAt().isAfter(targetDateTime))
            .count();

        // Count incidents at that date
        List<IncidentReportEntity> incidents = incidentRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long incidentCount = incidents.stream()
            .filter(i -> i.getCreatedAt() != null && !i.getCreatedAt().isAfter(targetDateTime))
            .count();

        // Calculate pillar scores
        double baseScore = latestBefore != null ? latestBefore.getScorePercentage() : 0;
        boolean isPast = targetDate.isBefore(LocalDate.now());
        boolean isFuture = targetDate.isAfter(LocalDate.now());

        List<Map<String, Object>> pillarScores = new ArrayList<>();
        for (int i = 0; i < PILLARS.length; i++) {
            double variation = (i * 7.3 + baseScore * 0.13) % 20 - 10;
            double pillarScore = Math.max(0, Math.min(100, baseScore + variation));
            Map<String, Object> ps = new LinkedHashMap<>();
            ps.put("pillar", PILLARS[i]);
            ps.put("name", PILLAR_NAMES[i]);
            ps.put("score", Math.round(pillarScore));
            ps.put("status", pillarScore >= 70 ? "HEALTHY" : pillarScore >= 40 ? "MODERATE" : "CRITICAL");
            pillarScores.add(ps);
        }

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("date", targetDate.toString());
        state.put("zone", isFuture ? "FUTURE" : isPast ? "PAST" : "PRESENT");
        state.put("overallScore", Math.round(baseScore));
        state.put("pillarScores", pillarScores);
        state.put("evidenceCount", evidenceCount);
        state.put("validEvidence", validEvidence);
        state.put("remediationsCompleted", remediationsDone);
        state.put("remediationsTotal", remediationsTotal);
        state.put("incidentCount", incidentCount);
        if (isFuture) {
            state.put("confidence", Math.max(40, 95 - ChronoUnit.DAYS.between(LocalDate.now(), targetDate) * 0.6));
        }
        if (latestBefore != null) {
            state.put("assessmentId", latestBefore.getId());
            state.put("assessmentDate", latestBefore.getAssessmentDate().toString());
        }
        return state;
    }

    public Map<String, Object> whatIfScenario(String userId, String sessionId, Map<String, Object> body) {
        String scenarioId = body != null ? (String) body.get("scenarioId") : null;
        if (scenarioId == null) {
            return Map.of("error", "scenarioId is required");
        }

        List<AssessmentEntity> assessments = assessmentRepo.findByUserIdOrderByAssessmentDateDesc(userId);
        double currentScore = assessments.isEmpty() ? 0 : assessments.get(0).getScorePercentage();
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> scenarioTrajectory = new ArrayList<>();
        String scenarioName, scenarioNameEt, scenarioColor;
        int months;

        switch (scenarioId) {
            case "started_earlier":
                scenarioName = "Started 6 Months Ago";
                scenarioNameEt = "Alustasime 6 kuud tagasi";
                scenarioColor = "#10b981";
                months = 6;
                for (int w = 0; w <= 26; w++) {
                    double score = Math.min(100, currentScore * 0.3 + (w * 2.8));
                    scenarioTrajectory.add(Map.of(
                        "date", today.minusMonths(6).plusWeeks(w).toString(),
                        "score", Math.round(score)
                    ));
                }
                break;
            case "do_nothing":
                scenarioName = "Do Nothing for 3 Months";
                scenarioNameEt = "Ei tee midagi 3 kuud";
                scenarioColor = "#ef4444";
                months = 3;
                for (int w = 0; w <= 12; w++) {
                    double score = Math.max(0, currentScore - (w * 2.1));
                    scenarioTrajectory.add(Map.of(
                        "date", today.plusWeeks(w).toString(),
                        "score", Math.round(score)
                    ));
                }
                break;
            case "double_pace":
                scenarioName = "Double Our Pace";
                scenarioNameEt = "Kahekordistame tempot";
                scenarioColor = "#8b5cf6";
                months = 6;
                for (int w = 0; w <= 24; w++) {
                    double score = Math.min(100, currentScore + (w * 3.5));
                    scenarioTrajectory.add(Map.of(
                        "date", today.plusWeeks(w).toString(),
                        "score", Math.round(score)
                    ));
                }
                break;
            case "regulatory_change":
                scenarioName = "Regulatory Change Hits";
                scenarioNameEt = "Regulatiivne muudatus";
                scenarioColor = "#f59e0b";
                months = 3;
                for (int w = 0; w <= 12; w++) {
                    double score;
                    if (w < 2) score = currentScore;
                    else if (w < 4) score = currentScore - 15 + (w - 2) * 2;
                    else score = Math.min(100, currentScore - 11 + (w - 4) * 2.5);
                    scenarioTrajectory.add(Map.of(
                        "date", today.plusWeeks(w).toString(),
                        "score", Math.round(Math.max(0, Math.min(100, score)))
                    ));
                }
                break;
            default:
                return Map.of("error", "Unknown scenario: " + scenarioId);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioId", scenarioId);
        result.put("name", scenarioName);
        result.put("nameEt", scenarioNameEt);
        result.put("color", scenarioColor);
        result.put("currentScore", Math.round(currentScore));
        result.put("trajectory", scenarioTrajectory);
        if (!scenarioTrajectory.isEmpty()) {
            result.put("endScore", scenarioTrajectory.get(scenarioTrajectory.size() - 1).get("score"));
        }
        return result;
    }
}
