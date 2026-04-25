package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Unified alert service consolidating compliance alerts, contract alerts, user alerts, alert
 * matching, and digest scheduling.
 */
@Service
public class AlertService {

  private static final Logger log = LoggerFactory.getLogger(AlertService.class);

  // Compliance alert repositories
  private final EvidenceRepository evidenceRepository;
  private final RemediationItemRepository remediationRepository;
  private final IncidentReportRepository incidentRepository;
  private final IctProviderRepository ictProviderRepository;
  private final AssessmentRepository assessmentRepository;

  // Contract alert repository
  private final ContractAlertRepository contractAlertRepository;

  // User alert repositories
  private final UserAlertRepository userAlertRepository;
  private final RegulatoryUpdateRepository updateRepository;

  // Alert matching + digest
  private final ComplianceProfileRepository profileRepository;
  private final AlertDigestRepository digestRepository;
  private final UserRepository userRepository;
  private final ResendEmailService emailService;

  @Value("${alert.digest.enabled:false}")
  private boolean digestEnabled;

  public AlertService(
      EvidenceRepository evidenceRepository,
      RemediationItemRepository remediationRepository,
      IncidentReportRepository incidentRepository,
      IctProviderRepository ictProviderRepository,
      AssessmentRepository assessmentRepository,
      ContractAlertRepository contractAlertRepository,
      UserAlertRepository userAlertRepository,
      RegulatoryUpdateRepository updateRepository,
      ComplianceProfileRepository profileRepository,
      AlertDigestRepository digestRepository,
      UserRepository userRepository,
      ResendEmailService emailService) {
    this.evidenceRepository = evidenceRepository;
    this.remediationRepository = remediationRepository;
    this.incidentRepository = incidentRepository;
    this.ictProviderRepository = ictProviderRepository;
    this.assessmentRepository = assessmentRepository;
    this.contractAlertRepository = contractAlertRepository;
    this.userAlertRepository = userAlertRepository;
    this.updateRepository = updateRepository;
    this.profileRepository = profileRepository;
    this.digestRepository = digestRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  // ===== Compliance Alerts (transient, computed per-request) =====

  public List<Map<String, Object>> getComplianceAlerts(String userId) {
    List<Map<String, Object>> alerts = new ArrayList<>();

    checkEvidenceAlerts(userId, alerts);
    checkRemediationAlerts(userId, alerts);
    checkIncidentAlerts(userId, alerts);
    checkThirdPartyAlerts(userId, alerts);
    checkAssessmentAlerts(userId, alerts);

    Map<String, Integer> severityOrder = Map.of("CRITICAL", 0, "WARNING", 1, "INFO", 2);
    alerts.sort(
        (a, b) -> {
          int sa = severityOrder.getOrDefault((String) a.get("severity"), 3);
          int sb = severityOrder.getOrDefault((String) b.get("severity"), 3);
          return sa - sb;
        });

    return alerts;
  }

  public Map<String, Long> getComplianceAlertCounts(String userId) {
    List<Map<String, Object>> alerts = getComplianceAlerts(userId);
    long critical = alerts.stream().filter(a -> "CRITICAL".equals(a.get("severity"))).count();
    long warning = alerts.stream().filter(a -> "WARNING".equals(a.get("severity"))).count();
    long info = alerts.stream().filter(a -> "INFO".equals(a.get("severity"))).count();
    return Map.of(
        "critical", critical, "warning", warning, "info", info, "total", (long) alerts.size());
  }

  // ===== Contract Alerts (persisted) =====

  public List<ContractAlertEntity> getContractAlerts(String userId) {
    return contractAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public List<ContractAlertEntity> getUnreadContractAlerts(String userId) {
    return contractAlertRepository.findByUserIdAndIsReadFalse(userId);
  }

  public long getUnreadContractAlertCount(String userId) {
    return contractAlertRepository.countByUserIdAndIsReadFalse(userId);
  }

  public void markContractAlertAsRead(String alertId, String userId) {
    ContractAlertEntity alert =
        contractAlertRepository
            .findById(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Teavitust ei leitud: " + alertId));
    if (!alert.getUserId().equals(userId)) {
      throw new IllegalArgumentException("Teavitus ei kuulu kasutajale");
    }
    alert.setRead(true);
    contractAlertRepository.save(alert);
  }

  public ContractAlertEntity createContractAlert(
      String userId,
      String monitoredContractId,
      String alertType,
      String title,
      String message,
      String severity) {
    ContractAlertEntity alert =
        new ContractAlertEntity(userId, monitoredContractId, alertType, title, message, severity);
    return contractAlertRepository.save(alert);
  }

  public ContractAlertEntity createScoreChangeAlert(
      String userId,
      String monitoredContractId,
      String title,
      String message,
      String severity,
      Double previousScore,
      Double newScore) {
    ContractAlertEntity alert =
        new ContractAlertEntity(
            userId, monitoredContractId, "SCORE_CHANGED", title, message, severity);
    alert.setPreviousScore(previousScore);
    alert.setNewScore(newScore);
    return contractAlertRepository.save(alert);
  }

  public ContractAlertEntity createRegulatoryAlert(
      String userId,
      String monitoredContractId,
      String regulatoryUpdateId,
      String title,
      String message,
      String severity) {
    ContractAlertEntity alert =
        new ContractAlertEntity(
            userId, monitoredContractId, "NEW_REGULATION", title, message, severity);
    alert.setRegulatoryUpdateId(regulatoryUpdateId);
    return contractAlertRepository.save(alert);
  }

  // ===== User Alerts (persisted, regulatory-update-linked) =====

  public List<UserAlertEntity> getUserAlerts(String userId) {
    return userAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public long getUnreadUserAlertCount(String userId) {
    return userAlertRepository.countByUserIdAndIsReadFalse(userId);
  }

  public Optional<UserAlertEntity> getUserAlert(String userId, String alertId) {
    return userAlertRepository.findById(alertId).filter(a -> a.getUserId().equals(userId));
  }

  public Optional<RegulatoryUpdateEntity> getRegulatoryUpdate(String updateId) {
    return updateRepository.findById(updateId);
  }

  public void markUserAlertRead(String userId, String alertId) {
    userAlertRepository
        .findById(alertId)
        .filter(a -> a.getUserId().equals(userId))
        .ifPresent(
            a -> {
              a.setRead(true);
              a.setReadAt(LocalDateTime.now());
              userAlertRepository.save(a);
            });
  }

  public void markAllUserAlertsRead(String userId) {
    List<UserAlertEntity> unread = userAlertRepository.findByUserIdAndIsReadFalse(userId);
    LocalDateTime now = LocalDateTime.now();
    for (UserAlertEntity alert : unread) {
      alert.setRead(true);
      alert.setReadAt(now);
    }
    userAlertRepository.saveAll(unread);
  }

  // ===== Alert Matching =====

  public void matchAndCreateAlerts(RegulatoryUpdateEntity update) {
    List<ComplianceProfileEntity> profiles = profileRepository.findAll();
    if (profiles.isEmpty()) {
      log.debug("Vastavusprofiile pole, hoiatusi ei looda");
      return;
    }

    Set<String> updateRegulations = parseCommaSet(update.getRegulations());
    Set<String> updateCompanyTypes = parseCommaSet(update.getCompanyTypes());
    Set<String> updateCountries = parseCommaSet(update.getCountries());

    int matched = 0;
    for (ComplianceProfileEntity profile : profiles) {
      if (!profile.isAlertDashboard()) continue;

      boolean matches = isMatch(profile, updateRegulations, updateCompanyTypes, updateCountries);
      if (!matches) continue;

      if (userAlertRepository.existsByUserIdAndRegulatoryUpdateId(
          profile.getUserId(), update.getId())) {
        continue;
      }

      UserAlertEntity alert = new UserAlertEntity();
      alert.setUserId(profile.getUserId());
      alert.setRegulatoryUpdateId(update.getId());
      alert.setDeliveredVia("DASHBOARD");
      userAlertRepository.save(alert);
      matched++;
    }

    if (matched > 0) {
      log.info(
          "Regulatiivsele uuendusele '{}' loodi {} hoiatust",
          truncate(update.getTitle(), 60),
          matched);
    }
  }

  // ===== Digest Scheduling =====

  @Scheduled(cron = "${alert.digest.daily.cron:0 0 8 * * *}")
  public void sendDailyDigest() {
    if (!digestEnabled) return;
    sendDigest(
        "DAILY", ComplianceProfileEntity.AlertFrequency.DAILY, LocalDateTime.now().minusDays(1));
  }

  @Scheduled(cron = "${alert.digest.weekly.cron:0 0 8 * * MON}")
  public void sendWeeklyDigest() {
    if (!digestEnabled) return;
    sendDigest(
        "WEEKLY", ComplianceProfileEntity.AlertFrequency.WEEKLY, LocalDateTime.now().minusWeeks(1));
  }

  // ===== Private: Compliance alert checks =====

  private void checkEvidenceAlerts(String userId, List<Map<String, Object>> alerts) {
    List<EvidenceEntity> items = evidenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    if (items.isEmpty()) return;

    LocalDate today = LocalDate.now();
    int expired = 0;
    int expiringSoon = 0;
    int expiringUrgent = 0;

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
          createComplianceAlert(
              "CRITICAL",
              "EVIDENCE",
              "evidence_expired",
              expired + " evidence document(s) have expired",
              "Expired evidence weakens your audit readiness. Upload renewed documents to maintain compliance.",
              "/evidence-vault"));
    }
    if (expiringUrgent > 0) {
      alerts.add(
          createComplianceAlert(
              "CRITICAL",
              "EVIDENCE",
              "evidence_expiring_7d",
              expiringUrgent + " evidence document(s) expire within 7 days",
              "Renew these documents immediately to avoid audit gaps.",
              "/evidence-vault"));
    }
    if (expiringSoon > 0) {
      alerts.add(
          createComplianceAlert(
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
          createComplianceAlert(
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
          createComplianceAlert(
              "CRITICAL",
              "REMEDIATION",
              "remediation_high_overdue",
              highOverdue + " high-priority remediation action(s) overdue",
              "Critical and high-priority items past their deadline require immediate attention.",
              "/remediation"));
    } else if (overdue > 0) {
      alerts.add(
          createComplianceAlert(
              "WARNING",
              "REMEDIATION",
              "remediation_overdue",
              overdue + " remediation action(s) past deadline",
              "Review overdue items and update their status or extend deadlines.",
              "/remediation"));
    }

    if (criticalOpen > 0 && highOverdue == 0) {
      alerts.add(
          createComplianceAlert(
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

    if (overdueInitial > 0) {
      alerts.add(
          createComplianceAlert(
              "CRITICAL",
              "INCIDENT",
              "incident_initial_overdue",
              overdueInitial + " initial incident report(s) overdue",
              "DORA requires initial reports within 4 hours. Submit immediately to avoid regulatory penalties.",
              "/incident-reporting"));
    }
    if (overdueIntermediate > 0) {
      alerts.add(
          createComplianceAlert(
              "CRITICAL",
              "INCIDENT",
              "incident_intermediate_overdue",
              overdueIntermediate + " intermediate incident report(s) overdue",
              "Intermediate reports are due within 72 hours of the incident.",
              "/incident-reporting"));
    }
    if (overdueFinal > 0) {
      alerts.add(
          createComplianceAlert(
              "WARNING",
              "INCIDENT",
              "incident_final_overdue",
              overdueFinal + " final incident report(s) overdue",
              "Final reports should be submitted within 1 month. Complete these reports.",
              "/incident-reporting"));
    }

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
          createComplianceAlert(
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
          createComplianceAlert(
              "CRITICAL",
              "THIRD_PARTY",
              "provider_no_exit",
              criticalWithoutExit + " critical provider(s) without exit strategy",
              "DORA Art. 28 requires exit strategies for all critical ICT providers.",
              "/supply-chain"));
    }
    if (highRisk > 0) {
      alerts.add(
          createComplianceAlert(
              "WARNING",
              "THIRD_PARTY",
              "provider_high_risk",
              highRisk + " provider(s) with high risk score (8+)",
              "Review these providers and implement risk mitigation measures.",
              "/supply-chain"));
    }
    if (contractsExpiring > 0) {
      alerts.add(
          createComplianceAlert(
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
          createComplianceAlert(
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
          createComplianceAlert(
              "WARNING",
              "ASSESSMENT",
              "assessment_stale",
              "Last assessment is " + (daysSinceAssessment / 30) + " months old",
              "Regular assessments ensure compliance tracking accuracy. Run a new assessment.",
              "/assessment"));
    } else if (daysSinceAssessment > 90) {
      alerts.add(
          createComplianceAlert(
              "INFO",
              "ASSESSMENT",
              "assessment_aging",
              "Last assessment was " + (daysSinceAssessment / 30) + " months ago",
              "Consider running a new assessment to track your compliance progress.",
              "/assessment"));
    }

    if (latest.getScorePercentage() < 40) {
      alerts.add(
          createComplianceAlert(
              "CRITICAL",
              "ASSESSMENT",
              "assessment_critical_score",
              "Assessment score critically low (" + Math.round(latest.getScorePercentage()) + "%)",
              "Your organization may not meet DORA minimum requirements. Review and address gaps urgently.",
              "/results/" + latest.getId()));
    } else if (latest.getScorePercentage() < 60) {
      alerts.add(
          createComplianceAlert(
              "WARNING",
              "ASSESSMENT",
              "assessment_low_score",
              "Assessment score below target (" + Math.round(latest.getScorePercentage()) + "%)",
              "Focus on improving low-scoring areas to strengthen compliance posture.",
              "/results/" + latest.getId()));
    }
  }

  private Map<String, Object> createComplianceAlert(
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

  // ===== Private: Alert matching helpers =====

  private boolean isMatch(
      ComplianceProfileEntity profile,
      Set<String> updateRegulations,
      Set<String> updateCompanyTypes,
      Set<String> updateCountries) {
    if (updateRegulations.isEmpty() && updateCompanyTypes.isEmpty() && updateCountries.isEmpty()) {
      return true;
    }

    Set<String> profileRegulations = new HashSet<>(profile.getRegulationsList());
    boolean regulationMatch =
        updateRegulations.isEmpty()
            || profileRegulations.isEmpty()
            || !java.util.Collections.disjoint(profileRegulations, updateRegulations);

    String profileType = profile.getCompanyType() != null ? profile.getCompanyType().name() : "";
    boolean companyMatch =
        updateCompanyTypes.isEmpty()
            || profileType.isEmpty()
            || updateCompanyTypes.contains(profileType)
            || updateCompanyTypes.contains("OTHER");

    String profileCountry = profile.getCountry() != null ? profile.getCountry() : "";
    boolean countryMatch =
        updateCountries.isEmpty()
            || profileCountry.isEmpty()
            || updateCountries.contains(profileCountry)
            || updateCountries.contains("EU");

    return regulationMatch && companyMatch && countryMatch;
  }

  private Set<String> parseCommaSet(String commaStr) {
    if (commaStr == null || commaStr.isBlank()) return java.util.Collections.emptySet();
    return java.util.Arrays.stream(commaStr.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toSet());
  }

  // ===== Private: Digest helpers =====

  private void sendDigest(
      String digestType, ComplianceProfileEntity.AlertFrequency frequency, LocalDateTime since) {
    log.info("Alustan {} digest e-kirjade saatmist...", digestType);
    int sent = 0;

    List<ComplianceProfileEntity> profiles =
        profileRepository.findAll().stream()
            .filter(p -> p.getAlertFrequency() == frequency)
            .filter(ComplianceProfileEntity::isAlertEmail)
            .collect(Collectors.toList());

    for (ComplianceProfileEntity profile : profiles) {
      try {
        List<UserAlertEntity> unreadAlerts =
            userAlertRepository.findByUserIdAndIsReadFalse(profile.getUserId());
        List<UserAlertEntity> recentAlerts =
            unreadAlerts.stream()
                .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(since))
                .collect(Collectors.toList());

        if (recentAlerts.isEmpty()) continue;

        Optional<UserEntity> userOpt = userRepository.findById(profile.getUserId());
        if (userOpt.isEmpty()) continue;
        String email = userOpt.get().getEmail();
        if (email == null || email.isBlank()) continue;

        String html = buildDigestHtml(recentAlerts, digestType);
        String subject =
            digestType.equals("DAILY")
                ? "DoraAudit: P\u00e4evane regulatiivne kokkuv\u00f5te ("
                    + recentAlerts.size()
                    + " hoiatust)"
                : "DoraAudit: N\u00e4dala regulatiivne kokkuv\u00f5te ("
                    + recentAlerts.size()
                    + " hoiatust)";

        emailService.sendEmail(email, subject, html);

        AlertDigestEntity digest = new AlertDigestEntity();
        digest.setUserId(profile.getUserId());
        digest.setDigestType(digestType);
        digest.setPeriodStart(since);
        digest.setPeriodEnd(LocalDateTime.now());
        digest.setSentAt(LocalDateTime.now());
        digest.setAlertCount(recentAlerts.size());
        digestRepository.save(digest);

        sent++;
      } catch (Exception e) {
        log.error(
            "Digest saatmine eba\u00f5nnestus kasutajale {}: {}",
            profile.getUserId(),
            e.getMessage());
      }
    }

    log.info("{} digest e-kirja saadetud {} kasutajale", digestType, sent);
  }

  private String buildDigestHtml(List<UserAlertEntity> alerts, String digestType) {
    StringBuilder sb = new StringBuilder();
    sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><style>");
    sb.append(
        "body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:0}");
    sb.append(".container{max-width:600px;margin:0 auto;padding:20px}");
    sb.append(
        ".header{background:linear-gradient(135deg,#059669,#0891b2);padding:24px;border-radius:12px 12px 0 0;text-align:center}");
    sb.append(".header h1{margin:0;color:#fff;font-size:20px}");
    sb.append(".header p{margin:8px 0 0;color:rgba(255,255,255,.8);font-size:13px}");
    sb.append(
        ".content{background:#1e293b;padding:20px;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px}");
    sb.append(
        ".alert-card{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px;margin-bottom:12px}");
    sb.append(
        ".badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase}");
    sb.append(
        ".badge-critical{background:#7f1d1d;color:#fca5a5}.badge-high{background:#7c2d12;color:#fdba74}");
    sb.append(
        ".badge-medium{background:#713f12;color:#fde047}.badge-low{background:#1e3a5f;color:#93c5fd}");
    sb.append(".badge-info{background:#374151;color:#9ca3af}");
    sb.append(".alert-title{color:#f1f5f9;font-size:14px;font-weight:600;margin:8px 0 4px}");
    sb.append(".alert-meta{color:#94a3b8;font-size:11px}");
    sb.append(".alert-summary{color:#cbd5e1;font-size:12px;margin-top:6px;line-height:1.5}");
    sb.append(
        ".cta{display:inline-block;background:linear-gradient(135deg,#059669,#0891b2);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-top:16px}");
    sb.append(".footer{text-align:center;padding:16px;color:#64748b;font-size:11px}");
    sb.append("</style></head><body><div class='container'>");

    sb.append("<div class='header'><h1>DoraAudit Regulatiivne Kokkuv\u00f5te</h1>");
    sb.append("<p>")
        .append(digestType.equals("DAILY") ? "P\u00e4evane" : "N\u00e4dala")
        .append(" \u00fclevaade \u2014 ");
    sb.append(alerts.size()).append(" uut hoiatust</p></div>");

    sb.append("<div class='content'>");
    for (UserAlertEntity alert : alerts) {
      Optional<RegulatoryUpdateEntity> updateOpt =
          updateRepository.findById(alert.getRegulatoryUpdateId());
      RegulatoryUpdateEntity update = updateOpt.orElse(null);

      String severity =
          update != null && update.getSeverity() != null ? update.getSeverity() : "INFO";
      String badgeClass = "badge-" + severity.toLowerCase();

      sb.append("<div class='alert-card'>");
      sb.append("<span class='badge ")
          .append(badgeClass)
          .append("'>")
          .append(severity)
          .append("</span>");
      sb.append("<div class='alert-title'>")
          .append(escapeHtml(update != null ? update.getTitle() : "Regulatiivne uuendus"))
          .append("</div>");
      sb.append("<div class='alert-meta'>")
          .append(escapeHtml(update != null ? update.getSource() : ""))
          .append("</div>");
      if (update != null && update.getAiSummary() != null) {
        sb.append("<div class='alert-summary'>")
            .append(escapeHtml(update.getAiSummary()))
            .append("</div>");
      }
      sb.append("</div>");
    }

    sb.append(
        "<div style='text-align:center'><a href='https://doraaudit.eu/alerts' class='cta'>Vaata k\u00f5iki hoiatusi</a></div>");
    sb.append("</div>");
    sb.append(
        "<div class='footer'>DoraAudit \u2014 DORA vastavusplatvorm Balti finantsasutustele</div>");
    sb.append("</div></body></html>");

    return sb.toString();
  }

  private String escapeHtml(String input) {
    if (input == null) return "";
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }

  private String truncate(String text, int max) {
    if (text == null) return "";
    return text.length() <= max ? text : text.substring(0, max) + "...";
  }
}
