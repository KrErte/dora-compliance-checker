package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class ComplianceAlertService {

  private final EvidenceRepository evidenceRepository;
  private final RemediationItemRepository remediationRepository;
  private final IncidentReportRepository incidentRepository;
  private final IctProviderRepository ictProviderRepository;
  private final AssessmentRepository assessmentRepository;

  public ComplianceAlertService(
      EvidenceRepository evidenceRepository,
      RemediationItemRepository remediationRepository,
      IncidentReportRepository incidentRepository,
      IctProviderRepository ictProviderRepository,
      AssessmentRepository assessmentRepository) {
    this.evidenceRepository = evidenceRepository;
    this.remediationRepository = remediationRepository;
    this.incidentRepository = incidentRepository;
    this.ictProviderRepository = ictProviderRepository;
    this.assessmentRepository = assessmentRepository;
  }

  public List<Map<String, Object>> getComplianceAlerts(String userId) {
    List<Map<String, Object>> alerts = new ArrayList<>();

    checkEvidenceAlerts(userId, alerts);
    checkRemediationAlerts(userId, alerts);
    checkIncidentAlerts(userId, alerts);
    checkThirdPartyAlerts(userId, alerts);
    checkAssessmentAlerts(userId, alerts);

    // Sort: CRITICAL first, then WARNING, then INFO
    Map<String, Integer> severityOrder = Map.of("CRITICAL", 0, "WARNING", 1, "INFO", 2);
    alerts.sort(
        (a, b) -> {
          int sa = severityOrder.getOrDefault((String) a.get("severity"), 3);
          int sb = severityOrder.getOrDefault((String) b.get("severity"), 3);
          return sa - sb;
        });

    return alerts;
  }

  public Map<String, Long> getAlertCounts(String userId) {
    List<Map<String, Object>> alerts = getComplianceAlerts(userId);
    long critical = alerts.stream().filter(a -> "CRITICAL".equals(a.get("severity"))).count();
    long warning = alerts.stream().filter(a -> "WARNING".equals(a.get("severity"))).count();
    long info = alerts.stream().filter(a -> "INFO".equals(a.get("severity"))).count();
    return Map.of(
        "critical", critical, "warning", warning, "info", info, "total", (long) alerts.size());
  }

  private void checkEvidenceAlerts(String userId, List<Map<String, Object>> alerts) {
    List<EvidenceEntity> items = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    if (items.isEmpty()) return;

    LocalDate today = LocalDate.now();
    int expired = 0;
    int expiringSoon = 0; // within 30 days
    int expiringUrgent = 0; // within 7 days

    for (EvidenceEntity item : items) {
      if (item.getExpiryDate() == null) continue;
      long daysUntil = ChronoUnit.DAYS.between(today, item.getExpiryDate());
      if (daysUntil < 0) {
        expired++;
      } else if (daysUntil <= 7) {
        expiringUrgent++;
      } else if (daysUntil <= 30) {
        expiringSoon++;
      }
    }

    if (expired > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "EVIDENCE",
              "evidence_expired",
              expired + " evidence document(s) have expired",
              "Expired evidence weakens your audit readiness. Upload renewed documents to maintain compliance.",
              "/evidence-vault"));
    }
    if (expiringUrgent > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "EVIDENCE",
              "evidence_expiring_7d",
              expiringUrgent + " evidence document(s) expire within 7 days",
              "Renew these documents immediately to avoid audit gaps.",
              "/evidence-vault"));
    }
    if (expiringSoon > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "EVIDENCE",
              "evidence_expiring_30d",
              expiringSoon + " evidence document(s) expire within 30 days",
              "Plan document renewals to ensure continuous coverage.",
              "/evidence-vault"));
    }

    long unverified = items.stream().filter(e -> "PENDING".equals(e.getStatus())).count();
    if (unverified > 5) {
      alerts.add(
          createAlert(
              "WARNING",
              "EVIDENCE",
              "evidence_unverified",
              unverified + " evidence documents pending verification",
              "Verified evidence scores higher during audits. Review and verify your pending documents.",
              "/evidence-vault"));
    }
  }

  private void checkRemediationAlerts(String userId, List<Map<String, Object>> alerts) {
    List<RemediationItemEntity> openItems =
        remediationRepository.findByUserIdAndStatusOrderByPriorityAsc(userId, "OPEN");
    LocalDate today = LocalDate.now();

    long overdue =
        openItems.stream()
            .filter(r -> r.getDueDate() != null && r.getDueDate().isBefore(today))
            .count();

    long criticalOpen = openItems.stream().filter(r -> "CRITICAL".equals(r.getPriority())).count();

    long highOverdue =
        openItems.stream()
            .filter(
                r ->
                    ("CRITICAL".equals(r.getPriority()) || "HIGH".equals(r.getPriority()))
                        && r.getDueDate() != null
                        && r.getDueDate().isBefore(today))
            .count();

    if (highOverdue > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "REMEDIATION",
              "remediation_high_overdue",
              highOverdue + " high-priority remediation action(s) overdue",
              "Critical and high-priority items past their deadline require immediate attention.",
              "/remediation"));
    } else if (overdue > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "REMEDIATION",
              "remediation_overdue",
              overdue + " remediation action(s) past deadline",
              "Review overdue items and update their status or extend deadlines.",
              "/remediation"));
    }

    if (criticalOpen > 0 && highOverdue == 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "REMEDIATION",
              "remediation_critical_open",
              criticalOpen + " critical remediation action(s) still open",
              "Open critical items significantly impact your audit readiness score.",
              "/remediation"));
    }
  }

  private void checkIncidentAlerts(String userId, List<Map<String, Object>> alerts) {
    List<IncidentReportEntity> incidents =
        incidentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    LocalDateTime now = LocalDateTime.now();

    long overdueInitial =
        incidents.stream()
            .filter(
                i ->
                    i.getInitialReportDueAt() != null
                        && i.getInitialReportSentAt() == null
                        && i.getInitialReportDueAt().isBefore(now))
            .count();

    long overdueIntermediate =
        incidents.stream()
            .filter(
                i ->
                    i.getIntermediateReportDueAt() != null
                        && i.getIntermediateReportSentAt() == null
                        && i.getIntermediateReportDueAt().isBefore(now))
            .count();

    long overdueFinal =
        incidents.stream()
            .filter(
                i ->
                    i.getFinalReportDueAt() != null
                        && i.getFinalReportSentAt() == null
                        && i.getFinalReportDueAt().isBefore(now))
            .count();

    long totalOverdue = overdueInitial + overdueIntermediate + overdueFinal;

    if (overdueInitial > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "INCIDENT",
              "incident_initial_overdue",
              overdueInitial + " initial incident report(s) overdue",
              "DORA requires initial reports within 4 hours. Submit immediately to avoid regulatory penalties.",
              "/incident-reporting"));
    }
    if (overdueIntermediate > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "INCIDENT",
              "incident_intermediate_overdue",
              overdueIntermediate + " intermediate incident report(s) overdue",
              "Intermediate reports are due within 72 hours of the incident.",
              "/incident-reporting"));
    }
    if (overdueFinal > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "INCIDENT",
              "incident_final_overdue",
              overdueFinal + " final incident report(s) overdue",
              "Final reports should be submitted within 1 month. Complete these reports.",
              "/incident-reporting"));
    }

    // Upcoming deadlines (within 24 hours)
    long urgentDeadlines =
        incidents.stream()
            .filter(
                i -> {
                  if (i.getInitialReportDueAt() != null
                      && i.getInitialReportSentAt() == null
                      && i.getInitialReportDueAt().isAfter(now)
                      && i.getInitialReportDueAt().isBefore(now.plusHours(24))) return true;
                  if (i.getIntermediateReportDueAt() != null
                      && i.getIntermediateReportSentAt() == null
                      && i.getIntermediateReportDueAt().isAfter(now)
                      && i.getIntermediateReportDueAt().isBefore(now.plusHours(24))) return true;
                  return false;
                })
            .count();

    if (urgentDeadlines > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "INCIDENT",
              "incident_deadline_24h",
              urgentDeadlines + " incident report deadline(s) within 24 hours",
              "Complete and submit these reports before the deadline expires.",
              "/incident-reporting"));
    }
  }

  private void checkThirdPartyAlerts(String userId, List<Map<String, Object>> alerts) {
    List<IctProviderEntity> providers =
        ictProviderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    if (providers.isEmpty()) return;

    long criticalWithoutExit =
        providers.stream()
            .filter(p -> p.isCritical() && !Boolean.TRUE.equals(p.getHasExitStrategy()))
            .count();

    long highRisk =
        providers.stream().filter(p -> p.getRiskScore() != null && p.getRiskScore() >= 8).count();

    LocalDate today = LocalDate.now();
    long contractsExpiring =
        providers.stream()
            .filter(
                p ->
                    p.getContractEndDate() != null
                        && ChronoUnit.DAYS.between(today, p.getContractEndDate()) <= 90
                        && ChronoUnit.DAYS.between(today, p.getContractEndDate()) >= 0)
            .count();

    if (criticalWithoutExit > 0) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "THIRD_PARTY",
              "provider_no_exit",
              criticalWithoutExit + " critical provider(s) without exit strategy",
              "DORA Art. 28 requires exit strategies for all critical ICT providers.",
              "/supply-chain"));
    }
    if (highRisk > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "THIRD_PARTY",
              "provider_high_risk",
              highRisk + " provider(s) with high risk score (8+)",
              "Review these providers and implement risk mitigation measures.",
              "/supply-chain"));
    }
    if (contractsExpiring > 0) {
      alerts.add(
          createAlert(
              "WARNING",
              "THIRD_PARTY",
              "provider_contract_expiring",
              contractsExpiring + " provider contract(s) expiring within 90 days",
              "Plan contract renewals and ensure DORA-compliant clauses are included.",
              "/supply-chain"));
    }
  }

  private void checkAssessmentAlerts(String userId, List<Map<String, Object>> alerts) {
    List<AssessmentEntity> assessments =
        assessmentRepository.findAll().stream()
            .filter(a -> userId.equals(a.getUserId()))
            .sorted((a, b) -> b.getAssessmentDate().compareTo(a.getAssessmentDate()))
            .toList();

    if (assessments.isEmpty()) {
      alerts.add(
          createAlert(
              "WARNING",
              "ASSESSMENT",
              "no_assessment",
              "No DORA assessment completed",
              "Complete your first self-assessment to establish a compliance baseline.",
              "/assessment"));
      return;
    }

    AssessmentEntity latest = assessments.get(0);
    long daysSinceAssessment =
        ChronoUnit.DAYS.between(latest.getAssessmentDate(), LocalDateTime.now());

    if (daysSinceAssessment > 180) {
      alerts.add(
          createAlert(
              "WARNING",
              "ASSESSMENT",
              "assessment_stale",
              "Last assessment is " + (daysSinceAssessment / 30) + " months old",
              "Regular assessments ensure compliance tracking accuracy. Run a new assessment.",
              "/assessment"));
    } else if (daysSinceAssessment > 90) {
      alerts.add(
          createAlert(
              "INFO",
              "ASSESSMENT",
              "assessment_aging",
              "Last assessment was " + (daysSinceAssessment / 30) + " months ago",
              "Consider running a new assessment to track your compliance progress.",
              "/assessment"));
    }

    if (latest.getScorePercentage() < 40) {
      alerts.add(
          createAlert(
              "CRITICAL",
              "ASSESSMENT",
              "assessment_critical_score",
              "Assessment score critically low (" + Math.round(latest.getScorePercentage()) + "%)",
              "Your organization may not meet DORA minimum requirements. Review and address gaps urgently.",
              "/results/" + latest.getId()));
    } else if (latest.getScorePercentage() < 60) {
      alerts.add(
          createAlert(
              "WARNING",
              "ASSESSMENT",
              "assessment_low_score",
              "Assessment score below target (" + Math.round(latest.getScorePercentage()) + "%)",
              "Focus on improving low-scoring areas to strengthen compliance posture.",
              "/results/" + latest.getId()));
    }
  }

  private Map<String, Object> createAlert(
      String severity,
      String category,
      String alertKey,
      String title,
      String message,
      String link) {
    Map<String, Object> alert = new LinkedHashMap<>();
    alert.put("severity", severity);
    alert.put("category", category);
    alert.put("alertKey", alertKey);
    alert.put("title", title);
    alert.put("message", message);
    alert.put("link", link);
    alert.put("timestamp", LocalDateTime.now().toString());
    return alert;
  }
}
