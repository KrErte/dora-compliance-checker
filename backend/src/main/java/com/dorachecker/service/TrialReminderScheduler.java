package com.dorachecker.service;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class TrialReminderScheduler {

  private static final Logger log = LoggerFactory.getLogger(TrialReminderScheduler.class);

  private final UserRepository userRepository;
  private final ResendEmailService emailService;

  public TrialReminderScheduler(UserRepository userRepository, ResendEmailService emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  @Scheduled(cron = "0 0 9 * * *")
  public void sendTrialExpiryReminders() {
    LocalDateTime threeDaysFromNow = LocalDateTime.now().plusDays(3);
    LocalDateTime start = threeDaysFromNow.minusHours(12);
    LocalDateTime end = threeDaysFromNow.plusHours(12);

    List<UserEntity> expiringUsers = userRepository.findByTrialEndsAtBetween(start, end);

    if (expiringUsers.isEmpty()) {
      log.debug("No trial expiry reminders to send today");
      return;
    }

    log.info("Sending trial expiry reminders to {} users", expiringUsers.size());

    for (UserEntity user : expiringUsers) {
      if (user.isEmailOptOut()) {
        log.debug("Skipping opted-out user: {}", user.getEmail());
        continue;
      }
      try {
        String subject = "Teie DoraAudit Professional prooviaeg l\u00f5ppeb peagi";
        String html = buildReminderEmail(user);
        emailService.sendEmail(user.getEmail(), subject, html);
        log.info("Trial reminder sent to: {}", user.getEmail());
      } catch (Exception e) {
        log.error("Failed to send trial reminder to {}: {}", user.getEmail(), e.getMessage());
      }
    }
  }

  private String getOrCreateUnsubscribeToken(UserEntity user) {
    if (user.getUnsubscribeToken() == null) {
      user.setUnsubscribeToken(UUID.randomUUID().toString());
      userRepository.save(user);
    }
    return user.getUnsubscribeToken();
  }

  private String buildReminderEmail(UserEntity user) {
    String name = user.getFullName() != null ? user.getFullName() : user.getEmail().split("@")[0];
    return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
                        .container { max-width: 600px; margin: 20px auto; }
                        .header { background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
                        .cta { display: inline-block; background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
                        .features { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
                        .footer { text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin: 0;">Teie prooviaeg l\u00f5ppeb 3 p\u00e4eva p\u00e4rast</h2>
                        </div>
                        <div class="content">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>Teie DoraAudit <strong>Professional</strong> prooviaeg l\u00f5ppeb peagi. P\u00e4rast prooviaja l\u00f5ppu piirdub teie juurdep\u00e4\u00e4s tasuta funktsioonidega.</p>
                            <div class="features">
                                <p style="margin: 0 0 8px; font-weight: bold;">Professional plaan sisaldab:</p>
                                <ul style="margin: 0; padding-left: 20px;">
                                    <li>PDF ja Excel eksport</li>
                                    <li>Vastavustunnistus</li>
                                    <li>Tegevuskava PDF</li>
                                    <li>E-posti teavitused</li>
                                </ul>
                            </div>
                            <p style="text-align: center;">
                                <a href="https://doraaudit.eu/pricing" class="cta">Uuenda plaani &rarr;</a>
                            </p>
                            <p style="color: #6b7280; font-size: 14px;">Kui teil on k\u00fcsimusi, v\u00f5tke meiega \u00fchendust aadressil info@doraaudit.eu</p>
                        </div>
                        <div class="footer">
                            &copy; 2026 DoraAudit. K\u00f5ik \u00f5igused kaitstud.<br>
                            <a href="https://doraaudit.eu/api/auth/unsubscribe?token=%s" style="color: #9ca3af; text-decoration: underline;">Loobu turunduskirjadest</a>
                        </div>
                    </div>
                </body>
                </html>
                """
        .formatted(name, getOrCreateUnsubscribeToken(user));
  }
}
