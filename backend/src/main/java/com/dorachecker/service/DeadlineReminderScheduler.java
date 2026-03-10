package com.dorachecker.service;

import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeadlineReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeadlineReminderScheduler.class);

    private final RemediationItemRepository remediationRepository;
    private final UserRepository userRepository;
    private final ResendEmailService emailService;

    public DeadlineReminderScheduler(
            RemediationItemRepository remediationRepository,
            UserRepository userRepository,
            ResendEmailService emailService
    ) {
        this.remediationRepository = remediationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDeadlineReminders() {
        LocalDate today = LocalDate.now();
        LocalDate threeDays = today.plusDays(3);
        LocalDate oneDay = today.plusDays(1);

        // Find items due in 3 days
        List<RemediationItemEntity> dueSoon = remediationRepository.findByDueDateAndStatusNot(threeDays, "COMPLETED");
        // Find items due tomorrow
        List<RemediationItemEntity> dueTomorrow = remediationRepository.findByDueDateAndStatusNot(oneDay, "COMPLETED");

        // Merge and group by userId
        Map<String, List<RemediationItemEntity>> byUser = new HashMap<>();
        for (RemediationItemEntity item : dueSoon) {
            byUser.computeIfAbsent(item.getUserId(), k -> new ArrayList<>()).add(item);
        }
        for (RemediationItemEntity item : dueTomorrow) {
            byUser.computeIfAbsent(item.getUserId(), k -> new ArrayList<>()).add(item);
        }

        if (byUser.isEmpty()) {
            log.debug("No deadline reminders to send today");
            return;
        }

        log.info("Sending deadline reminders to {} users", byUser.size());

        for (Map.Entry<String, List<RemediationItemEntity>> entry : byUser.entrySet()) {
            String userId = entry.getKey();
            List<RemediationItemEntity> items = entry.getValue();

            Optional<UserEntity> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) continue;

            UserEntity user = userOpt.get();
            if (user.isEmailOptOut()) {
                log.debug("Skipping opted-out user: {}", user.getEmail());
                continue;
            }

            try {
                String subject = "DORA tähtaeg läheneb – " + items.size() + " ülesanne" + (items.size() > 1 ? "t" : "");
                String html = buildReminderEmail(user, items);
                emailService.sendEmail(user.getEmail(), subject, html);
                log.info("Deadline reminder sent to {} for {} items", user.getEmail(), items.size());
            } catch (Exception e) {
                log.error("Failed to send deadline reminder to {}: {}", user.getEmail(), e.getMessage());
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

    private String buildReminderEmail(UserEntity user, List<RemediationItemEntity> items) {
        String name = user.getFullName() != null ? user.getFullName() : user.getEmail().split("@")[0];
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        StringBuilder itemRows = new StringBuilder();
        for (RemediationItemEntity item : items) {
            String priorityColor = switch (item.getPriority()) {
                case "CRITICAL" -> "#ef4444";
                case "HIGH" -> "#f97316";
                case "MEDIUM" -> "#eab308";
                default -> "#3b82f6";
            };
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), item.getDueDate());
            itemRows.append("""
                    <tr>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
                            <span style="display:inline-block;width:8px;height:8px;border-radius:50%%;background:%s;margin-right:8px;"></span>
                            %s
                        </td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: %s;">%d päeva</td>
                    </tr>
                    """.formatted(
                    priorityColor,
                    escapeHtml(item.getTitle()),
                    item.getDueDate().format(fmt),
                    daysLeft <= 1 ? "#ef4444" : "#f97316",
                    daysLeft
            ));
        }

        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
                    <div style="max-width: 600px; margin: 20px auto;">
                        <div style="background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h2 style="margin: 0;">DORA tähtajad lähenevad</h2>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>Teil on <strong>%d</strong> DORA vastavuse ülesannet, mille tähtaeg on peagi:</p>
                            <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                                <thead>
                                    <tr style="background: #f9fafb;">
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Ülesanne</th>
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Tähtaeg</th>
                                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Aega jäänud</th>
                                    </tr>
                                </thead>
                                <tbody>%s</tbody>
                            </table>
                            <p style="text-align: center;">
                                <a href="https://doraaudit.eu/remediation"
                                   style="display: inline-block; background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                                   Vaata ülesandeid &rarr;
                                </a>
                            </p>
                            <p style="color: #6b7280; font-size: 14px;">Kui teil on küsimusi, võtke meiega ühendust aadressil info@doraaudit.eu</p>
                        </div>
                        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
                            &copy; 2026 DoraAudit. Kõik õigused kaitstud.<br>
                            <a href="https://doraaudit.eu/api/auth/unsubscribe?token=%s" style="color: #9ca3af; text-decoration: underline;">Loobu turunduskirjadest</a>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(escapeHtml(name), items.size(), itemRows.toString(), getOrCreateUnsubscribeToken(user));
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
