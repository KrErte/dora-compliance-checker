package com.dorachecker.service;

import com.dorachecker.model.EvidenceEntity;
import com.dorachecker.model.EvidenceRepository;
import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class EvidenceExpiryScheduler {

  private static final Logger log = LoggerFactory.getLogger(EvidenceExpiryScheduler.class);

  private final EvidenceRepository evidenceRepository;
  private final UserRepository userRepository;
  private final ResendEmailService emailService;

  public EvidenceExpiryScheduler(
      EvidenceRepository evidenceRepository,
      UserRepository userRepository,
      ResendEmailService emailService) {
    this.evidenceRepository = evidenceRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  @Scheduled(cron = "0 0 7 * * *")
  public void sendExpiryReminders() {
    LocalDate today = LocalDate.now();
    LocalDate sevenDays = today.plusDays(7);
    LocalDate thirtyDays = today.plusDays(30);

    List<EvidenceEntity> expiringSoon =
        evidenceRepository.findByExpiryDateBetweenAndStatusNot(today, thirtyDays, "EXPIRED");

    if (expiringSoon.isEmpty()) {
      log.debug("No evidence expiry reminders to send today");
      return;
    }

    // Group by userId
    Map<String, List<EvidenceEntity>> byUser = new HashMap<>();
    for (EvidenceEntity item : expiringSoon) {
      byUser.computeIfAbsent(item.getUserId(), k -> new ArrayList<>()).add(item);
    }

    log.info(
        "Sending evidence expiry reminders to {} users for {} items",
        byUser.size(),
        expiringSoon.size());

    for (Map.Entry<String, List<EvidenceEntity>> entry : byUser.entrySet()) {
      String userId = entry.getKey();
      List<EvidenceEntity> items = entry.getValue();

      Optional<UserEntity> userOpt = userRepository.findById(userId);
      if (userOpt.isEmpty()) continue;

      UserEntity user = userOpt.get();
      if (user.isEmailOptOut()) {
        log.debug("Skipping opted-out user: {}", user.getEmail());
        continue;
      }

      try {
        String subject =
            "Tõendite aegumise meeldetuletus – "
                + items.size()
                + " dokument"
                + (items.size() > 1 ? "i" : "");
        String html = buildExpiryEmail(user, items);
        emailService.sendEmail(user.getEmail(), subject, html);
        log.info("Evidence expiry reminder sent to {} for {} items", user.getEmail(), items.size());
      } catch (Exception e) {
        log.error(
            "Failed to send evidence expiry reminder to {}: {}", user.getEmail(), e.getMessage());
      }
    }
  }

  private String getOrCreateUnsubscribeToken(UserEntity user) {
    if (user.getUnsubscribeToken() == null) {
      user.setUnsubscribeToken(UUID.randomUUID().toString());
    }
    return user.getUnsubscribeToken();
  }

  private String buildExpiryEmail(UserEntity user, List<EvidenceEntity> items) {
    String name = user.getFullName() != null ? user.getFullName() : user.getEmail().split("@")[0];
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    StringBuilder itemRows = new StringBuilder();
    for (EvidenceEntity item : items) {
      long daysLeft =
          java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), item.getExpiryDate());
      String urgencyColor = daysLeft <= 7 ? "#ef4444" : "#f97316";
      itemRows.append(
          """
                    <tr>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: %s;">%d päeva</td>
                    </tr>
                    """
              .formatted(
                  escapeHtml(item.getTitle()),
                  item.getCategory(),
                  item.getExpiryDate().format(fmt),
                  urgencyColor,
                  daysLeft));
    }

    return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
                    <div style="max-width: 600px; margin: 20px auto;">
                        <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h2 style="margin: 0;">Tõendid aeguvad peagi</h2>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>Teil on <strong>%d</strong> tõendit, mis aeguvad lähiajal:</p>
                            <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                                <thead>
                                    <tr style="background: #f9fafb;">
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Dokument</th>
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Kategooria</th>
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Aegub</th>
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Aega jäänud</th>
                                    </tr>
                                </thead>
                                <tbody>%s</tbody>
                            </table>
                            <p style="text-align: center;">
                                <a href="https://doraaudit.eu/evidence-vault"
                                   style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                                   Vaata tõendeid &rarr;
                                </a>
                            </p>
                        </div>
                        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
                            &copy; 2026 DoraAudit. Kõik õigused kaitstud.<br>
                            <a href="https://doraaudit.eu/api/auth/unsubscribe?token=%s" style="color: #9ca3af; text-decoration: underline;">Loobu turunduskirjadest</a>
                        </div>
                    </div>
                </body>
                </html>
                """
        .formatted(
            escapeHtml(name), items.size(), itemRows.toString(), getOrCreateUnsubscribeToken(user));
  }

  private String escapeHtml(String input) {
    if (input == null) return "";
    return input
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }
}
