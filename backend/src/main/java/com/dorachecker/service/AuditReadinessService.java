package com.dorachecker.service;

import com.dorachecker.model.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AuditReadinessService {

  private final AssessmentRepository assessmentRepository;
  private final EvidenceRepository evidenceRepository;
  private final RemediationItemRepository remediationRepository;
  private final IncidentReportRepository incidentRepository;
  private final IctProviderRepository ictProviderRepository;
  private final RoiRegisterRepository roiRegisterRepository;
  private final MonitoredContractRepository monitoredContractRepository;

  public AuditReadinessService(
      AssessmentRepository assessmentRepository,
      EvidenceRepository evidenceRepository,
      RemediationItemRepository remediationRepository,
      IncidentReportRepository incidentRepository,
      IctProviderRepository ictProviderRepository,
      RoiRegisterRepository roiRegisterRepository,
      MonitoredContractRepository monitoredContractRepository) {
    this.assessmentRepository = assessmentRepository;
    this.evidenceRepository = evidenceRepository;
    this.remediationRepository = remediationRepository;
    this.incidentRepository = incidentRepository;
    this.ictProviderRepository = ictProviderRepository;
    this.roiRegisterRepository = roiRegisterRepository;
    this.monitoredContractRepository = monitoredContractRepository;
  }

  public Map<String, Object> getReadinessScore(String userId) {
    Map<String, Object> result = new LinkedHashMap<>();

    // 1. Assessment Score (weight: 25%)
    Map<String, Object> assessment = computeAssessmentScore(userId);
    // 2. Evidence Coverage (weight: 20%)
    Map<String, Object> evidence = computeEvidenceScore(userId);
    // 3. Remediation Progress (weight: 20%)
    Map<String, Object> remediation = computeRemediationScore(userId);
    // 4. Incident Readiness (weight: 15%)
    Map<String, Object> incidents = computeIncidentScore(userId);
    // 5. Third-Party Risk (weight: 10%)
    Map<String, Object> thirdParty = computeThirdPartyScore(userId);
    // 6. RoI Completeness (weight: 10%)
    Map<String, Object> roi = computeRoiScore(userId);

    double assessmentScore = (double) assessment.get("score");
    double evidenceScore = (double) evidence.get("score");
    double remediationScore = (double) remediation.get("score");
    double incidentScore = (double) incidents.get("score");
    double thirdPartyScore = (double) thirdParty.get("score");
    double roiScore = (double) roi.get("score");

    // Weighted composite
    double overallScore =
        assessmentScore * 0.25
            + evidenceScore * 0.20
            + remediationScore * 0.20
            + incidentScore * 0.15
            + thirdPartyScore * 0.10
            + roiScore * 0.10;

    String level;
    if (overallScore >= 80) level = "EXCELLENT";
    else if (overallScore >= 60) level = "GOOD";
    else if (overallScore >= 40) level = "AT_RISK";
    else level = "CRITICAL";

    result.put("overallScore", Math.round(overallScore));
    result.put("level", level);

    // Module breakdowns
    result.put(
        "modules",
        Map.of(
            "assessment", assessment,
            "evidence", evidence,
            "remediation", remediation,
            "incidents", incidents,
            "thirdParty", thirdParty,
            "roi", roi));

    // Pillar scores
    result.put("pillars", computePillarScores(userId));

    // Top action items
    result.put(
        "actions",
        computeActionItems(userId, assessment, evidence, remediation, incidents, thirdParty, roi));

    return result;
  }

  private Map<String, Object> computeAssessmentScore(String userId) {
    List<AssessmentEntity> assessments =
        assessmentRepository.findAll().stream()
            .filter(a -> userId.equals(a.getUserId()))
            .sorted((a, b) -> b.getAssessmentDate().compareTo(a.getAssessmentDate()))
            .toList();

    if (assessments.isEmpty()) {
      return Map.of(
          "score",
          0.0,
          "label",
          "Assessment",
          "detail",
          "No assessment completed",
          "count",
          0,
          "latest",
          "");
    }

    AssessmentEntity latest = assessments.get(0);
    double score = latest.getScorePercentage();

    return Map.of(
        "score",
        score,
        "label",
        "Assessment",
        "detail",
        latest.getComplianceLevel(),
        "count",
        assessments.size(),
        "latest",
        latest.getAssessmentDate().toString());
  }

  private Map<String, Object> computeEvidenceScore(String userId) {
    long total = evidenceRepository.countByUserId(userId);
    if (total == 0) {
      return Map.of(
          "score",
          0.0,
          "label",
          "Evidence Vault",
          "detail",
          "No evidence uploaded",
          "total",
          0L,
          "verified",
          0L,
          "expired",
          0L,
          "coveragePercent",
          0);
    }

    long verified = evidenceRepository.countByUserIdAndStatus(userId, "VERIFIED");
    long expired = evidenceRepository.countByUserIdAndStatus(userId, "EXPIRED");

    // Score based on: verification rate (60%) + no-expiry penalty (40%)
    double verificationRate = (double) verified / total * 100;
    double expiryPenalty = total > 0 ? (double) expired / total * 100 : 0;
    double score = verificationRate * 0.6 + (100 - expiryPenalty) * 0.4;

    // Also factor in article coverage
    List<EvidenceEntity> items = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    Set<Integer> coveredArticles = new HashSet<>();
    for (EvidenceEntity item : items) {
      if (item.getArticleNumbers() != null) {
        for (String art : item.getArticleNumbers().split(",")) {
          try {
            coveredArticles.add(Integer.parseInt(art.trim()));
          } catch (NumberFormatException ignored) {
          }
        }
      }
    }
    int coveragePercent = (int) Math.round((double) coveredArticles.size() / 26.0 * 100);

    // Blend: 70% verification + 30% article coverage
    score = score * 0.7 + coveragePercent * 0.3;

    return Map.of(
        "score",
        Math.min(score, 100),
        "label",
        "Evidence Vault",
        "detail",
        verified + "/" + total + " verified",
        "total",
        total,
        "verified",
        verified,
        "expired",
        expired,
        "coveragePercent",
        coveragePercent);
  }

  private Map<String, Object> computeRemediationScore(String userId) {
    long total = remediationRepository.countByUserId(userId);
    if (total == 0) {
      return Map.of(
          "score",
          50.0,
          "label",
          "Remediation",
          "detail",
          "No actions tracked",
          "total",
          0L,
          "completed",
          0L,
          "open",
          0L);
    }

    long completed = remediationRepository.countByUserIdAndStatus(userId, "COMPLETED");
    long open = remediationRepository.countByUserIdAndStatus(userId, "OPEN");
    long inProgress = remediationRepository.countByUserIdAndStatus(userId, "IN_PROGRESS");

    double completionRate = (double) completed / total * 100;
    // Give partial credit for in-progress items
    double progressCredit = (double) inProgress / total * 50;
    double score = completionRate + progressCredit;

    // Penalty for many open critical items
    List<RemediationItemEntity> openCritical =
        remediationRepository.findByUserIdAndStatusOrderByPriorityAsc(userId, "OPEN").stream()
            .filter(r -> "CRITICAL".equals(r.getPriority()) || "HIGH".equals(r.getPriority()))
            .toList();
    if (!openCritical.isEmpty()) {
      score = Math.max(0, score - openCritical.size() * 5);
    }

    return Map.of(
        "score",
        Math.min(score, 100),
        "label",
        "Remediation",
        "detail",
        completed + "/" + total + " completed",
        "total",
        total,
        "completed",
        completed,
        "open",
        open);
  }

  private Map<String, Object> computeIncidentScore(String userId) {
    long total = incidentRepository.countByUserId(userId);
    if (total == 0) {
      // Having incident process ready is good even without incidents
      return Map.of(
          "score",
          60.0,
          "label",
          "Incidents",
          "detail",
          "No incidents reported",
          "total",
          0L,
          "closed",
          0L,
          "overdue",
          0L);
    }

    long closed = incidentRepository.countByUserIdAndReportingStatus(userId, "CLOSED");
    long finalSent = incidentRepository.countByUserIdAndReportingStatus(userId, "FINAL_SENT");
    long resolved = closed + finalSent;

    double resolutionRate = (double) resolved / total * 100;

    // Check for overdue reports
    List<IncidentReportEntity> allIncidents =
        incidentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    long overdue =
        allIncidents.stream()
            .filter(
                i ->
                    i.getInitialReportDueAt() != null
                        && i.getInitialReportSentAt() == null
                        && i.getInitialReportDueAt().isBefore(java.time.LocalDateTime.now()))
            .count();

    double score = resolutionRate;
    if (overdue > 0) score = Math.max(0, score - overdue * 15);

    return Map.of(
        "score",
        Math.min(score, 100),
        "label",
        "Incidents",
        "detail",
        resolved + "/" + total + " resolved",
        "total",
        total,
        "closed",
        resolved,
        "overdue",
        overdue);
  }

  private Map<String, Object> computeThirdPartyScore(String userId) {
    List<IctProviderEntity> providers =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    if (providers.isEmpty()) {
      return Map.of(
          "score",
          30.0,
          "label",
          "Third-Party Risk",
          "detail",
          "No providers registered",
          "total",
          0,
          "withExitStrategy",
          0,
          "critical",
          0);
    }

    long total = providers.size();
    long critical = providers.stream().filter(IctProviderEntity::isCritical).count();
    long withExitStrategy =
        providers.stream().filter(p -> Boolean.TRUE.equals(p.getHasExitStrategy())).count();

    // Score: base 40 + exit strategy coverage (30) + risk assessment (30)
    double exitCoverage = total > 0 ? (double) withExitStrategy / total * 100 : 0;
    long highRisk = ictProviderRepository.countByUserIdAndRiskScoreGreaterThanEqual(userId, 7);
    double riskPenalty = total > 0 ? (double) highRisk / total * 30 : 0;

    double score = 40 + exitCoverage * 0.3 + (30 - riskPenalty);

    return Map.of(
        "score",
        Math.min(score, 100),
        "label",
        "Third-Party Risk",
        "detail",
        withExitStrategy + "/" + total + " with exit strategy",
        "total",
        (long) total,
        "withExitStrategy",
        withExitStrategy,
        "critical",
        critical);
  }

  private Map<String, Object> computeRoiScore(String userId) {
    List<RoiRegisterEntity> registers =
        roiRegisterRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    if (registers.isEmpty()) {
      return Map.of(
          "score", 0.0, "label", "Register of Information", "detail", "No RoI entries", "count", 0);
    }

    // Score based on having entries + status
    long validCount =
        registers.stream()
            .filter(
                r ->
                    r.getStatus() == RoiRegisterEntity.Status.VALID
                        || r.getStatus() == RoiRegisterEntity.Status.EXPORTED)
            .count();
    long total = registers.size();

    double score = Math.min(100, (double) validCount / Math.max(total, 1) * 80 + 20);

    return Map.of(
        "score",
        score,
        "label",
        "Register of Information",
        "detail",
        validCount + "/" + total + " validated",
        "count",
        (long) total);
  }

  private Map<String, Object> computePillarScores(String userId) {
    // Simplified pillar scores based on evidence coverage + remediation
    String[] pillars = {
      "ICT_RISK_MANAGEMENT", "INCIDENT_MANAGEMENT", "TESTING", "THIRD_PARTY", "INFORMATION_SHARING"
    };
    Map<String, Object> pillarScores = new LinkedHashMap<>();

    for (String pillar : pillars) {
      List<EvidenceEntity> pillarEvidence =
          evidenceRepository.findByUserIdAndPillarOrderByCreatedAtDesc(userId, pillar);
      long evidenceCount = pillarEvidence.size();
      long verifiedCount =
          pillarEvidence.stream().filter(e -> "VERIFIED".equals(e.getStatus())).count();

      List<RemediationItemEntity> pillarRemediation =
          remediationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
              .filter(r -> pillar.equals(r.getPillar()))
              .toList();
      long remTotal = pillarRemediation.size();
      long remCompleted =
          pillarRemediation.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();

      double evidenceScore = evidenceCount > 0 ? (double) verifiedCount / evidenceCount * 100 : 0;
      double remScore = remTotal > 0 ? (double) remCompleted / remTotal * 100 : 50;

      double pillarScore = evidenceScore * 0.5 + remScore * 0.5;

      pillarScores.put(
          pillar,
          Map.of(
              "score", Math.round(pillarScore),
              "evidenceCount", evidenceCount,
              "verifiedCount", verifiedCount,
              "remediationTotal", remTotal,
              "remediationCompleted", remCompleted));
    }

    return pillarScores;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, String>> computeActionItems(
      String userId,
      Map<String, Object> assessment,
      Map<String, Object> evidence,
      Map<String, Object> remediation,
      Map<String, Object> incidents,
      Map<String, Object> thirdParty,
      Map<String, Object> roi) {

    List<Map<String, String>> actions = new ArrayList<>();

    if ((double) assessment.get("score") == 0) {
      actions.add(
          Map.of(
              "priority",
              "HIGH",
              "action",
              "Complete your first DORA self-assessment",
              "module",
              "assessment",
              "impact",
              "+25 points"));
    } else if ((double) assessment.get("score") < 60) {
      actions.add(
          Map.of(
              "priority",
              "MEDIUM",
              "action",
              "Improve assessment score — review low-scoring areas",
              "module",
              "assessment",
              "impact",
              "+10-15 points"));
    }

    if ((double) evidence.get("score") == 0) {
      actions.add(
          Map.of(
              "priority",
              "HIGH",
              "action",
              "Upload compliance evidence to the Evidence Vault",
              "module",
              "evidence",
              "impact",
              "+20 points"));
    } else {
      long expired = (long) evidence.get("expired");
      if (expired > 0) {
        actions.add(
            Map.of(
                "priority",
                "HIGH",
                "action",
                "Replace " + expired + " expired evidence document(s)",
                "module",
                "evidence",
                "impact",
                "+" + (expired * 3) + " points"));
      }
      long unverified = (long) evidence.get("total") - (long) evidence.get("verified") - expired;
      if (unverified > 0) {
        actions.add(
            Map.of(
                "priority",
                "MEDIUM",
                "action",
                "Verify " + unverified + " pending evidence document(s)",
                "module",
                "evidence",
                "impact",
                "+" + (unverified * 2) + " points"));
      }
    }

    long openRem = (long) remediation.get("open");
    if (openRem > 0) {
      actions.add(
          Map.of(
              "priority",
              "HIGH",
              "action",
              "Resolve " + openRem + " open remediation action(s)",
              "module",
              "remediation",
              "impact",
              "+" + (openRem * 3) + " points"));
    }

    long overdueInc = (long) incidents.get("overdue");
    if (overdueInc > 0) {
      actions.add(
          Map.of(
              "priority",
              "CRITICAL",
              "action",
              "Submit " + overdueInc + " overdue incident report(s)",
              "module",
              "incidents",
              "impact",
              "+" + (overdueInc * 5) + " points"));
    }

    if ((double) thirdParty.get("score") < 50) {
      actions.add(
          Map.of(
              "priority",
              "MEDIUM",
              "action",
              "Register ICT providers and add exit strategies",
              "module",
              "thirdParty",
              "impact",
              "+10 points"));
    }

    if ((double) roi.get("score") == 0) {
      actions.add(
          Map.of(
              "priority",
              "MEDIUM",
              "action",
              "Create your Register of Information (Art. 28)",
              "module",
              "roi",
              "impact",
              "+10 points"));
    }

    // Sort by priority: CRITICAL > HIGH > MEDIUM
    actions.sort(
        (a, b) -> {
          Map<String, Integer> order = Map.of("CRITICAL", 0, "HIGH", 1, "MEDIUM", 2);
          return order.getOrDefault(a.get("priority"), 3)
              - order.getOrDefault(b.get("priority"), 3);
        });

    return actions.size() > 5 ? actions.subList(0, 5) : actions;
  }
}
