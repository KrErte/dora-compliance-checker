package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AlertDigestService {

  private static final Logger log = LoggerFactory.getLogger(AlertDigestService.class);

  private final ComplianceProfileRepository profileRepository;
  private final UserAlertRepository alertRepository;
  private final RegulatoryUpdateRepository updateRepository;
  private final AlertDigestRepository digestRepository;
  private final UserRepository userRepository;
  private final ResendEmailService emailService;

  @Value("${alert.digest.enabled:false}")
  private boolean digestEnabled;

  public AlertDigestService(
      ComplianceProfileRepository profileRepository,
      UserAlertRepository alertRepository,
      RegulatoryUpdateRepository updateRepository,
      AlertDigestRepository digestRepository,
      UserRepository userRepository,
      ResendEmailService emailService) {
    this.profileRepository = profileRepository;
    this.alertRepository = alertRepository;
    this.updateRepository = updateRepository;
    this.digestRepository = digestRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  /** Daily digest at 08:00 UTC. */
  @Scheduled(cron = "${alert.digest.daily.cron:0 0 8 * * *}")
  public void sendDailyDigest() {
    if (!digestEnabled) return;
    sendDigest(
        "DAILY", ComplianceProfileEntity.AlertFrequency.DAILY, LocalDateTime.now().minusDays(1));
  }

  /** Weekly digest on Monday at 08:00 UTC. */
  @Scheduled(cron = "${alert.digest.weekly.cron:0 0 8 * * MON}")
  public void sendWeeklyDigest() {
    if (!digestEnabled) return;
    sendDigest(
        "WEEKLY", ComplianceProfileEntity.AlertFrequency.WEEKLY, LocalDateTime.now().minusWeeks(1));
  }

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
            alertRepository.findByUserIdAndIsReadFalse(profile.getUserId());
        // Filter to alerts created since the period start
        List<UserAlertEntity> recentAlerts =
            unreadAlerts.stream()
                .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(since))
                .collect(Collectors.toList());

        if (recentAlerts.isEmpty()) continue;

        // Get user email
        Optional<UserEntity> userOpt = userRepository.findById(profile.getUserId());
        if (userOpt.isEmpty()) continue;
        String email = userOpt.get().getEmail();
        if (email == null || email.isBlank()) continue;

        // Build and send email
        String html = buildDigestHtml(recentAlerts, digestType);
        String subject =
            digestType.equals("DAILY")
                ? "DoraAudit: Päevane regulatiivne kokkuvõte (" + recentAlerts.size() + " hoiatust)"
                : "DoraAudit: Nädala regulatiivne kokkuvõte (" + recentAlerts.size() + " hoiatust)";

        emailService.sendEmail(email, subject, html);

        // Record digest
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
            "Digest saatmine ebaõnnestus kasutajale {}: {}", profile.getUserId(), e.getMessage());
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

    sb.append("<div class='header'><h1>DoraAudit Regulatiivne Kokkuvõte</h1>");
    sb.append("<p>")
        .append(digestType.equals("DAILY") ? "Päevane" : "Nädala")
        .append(" ülevaade — ");
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
        "<div style='text-align:center'><a href='https://doraaudit.eu/alerts' class='cta'>Vaata kõiki hoiatusi</a></div>");
    sb.append("</div>");
    sb.append(
        "<div class='footer'>DoraAudit — DORA vastavusplatvorm Balti finantsasutustele</div>");
    sb.append("</div></body></html>");

    return sb.toString();
  }

  private String escapeHtml(String input) {
    if (input == null) return "";
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}
