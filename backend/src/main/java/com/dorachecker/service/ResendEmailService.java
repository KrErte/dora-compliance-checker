package com.dorachecker.service;

import com.dorachecker.model.ContactMessage;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ResendEmailService {

  private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
  private static final String RESEND_API_URL = "https://api.resend.com/emails";

  private final WebClient webClient;
  private final String fromEmail;
  private final String toEmail;
  private final boolean enabled;
  private final EmailTemplateService templateService;

  public ResendEmailService(
      @Value("${resend.api-key:}") String apiKey,
      @Value("${resend.from-email}") String fromEmail,
      @Value("${resend.to-email}") String toEmail,
      EmailTemplateService templateService) {
    this.fromEmail = fromEmail;
    this.toEmail = toEmail;
    this.enabled = apiKey != null && !apiKey.isBlank();
    this.templateService = templateService;

    this.webClient =
        WebClient.builder()
            .baseUrl(RESEND_API_URL)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();

    if (!enabled) {
      log.warn("Resend API key not configured - email notifications disabled");
    }
  }

  public void sendContactNotification(ContactMessage msg) {
    if (!enabled) {
      log.debug("Email sending skipped - Resend API key not configured");
      return;
    }

    String subject =
        "Uus kontaktipäring: " + (msg.getReason() != null ? msg.getReason() : "Üldine");
    String html = buildEmailHtml(msg);

    Map<String, Object> payload =
        Map.of(
            "from", fromEmail,
            "to", toEmail,
            "subject", subject,
            "html", html);

    webClient
        .post()
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(payload)
        .retrieve()
        .bodyToMono(String.class)
        .subscribe(
            response ->
                log.info("Contact notification email sent successfully for: {}", msg.getEmail()),
            error ->
                log.error(
                    "Failed to send contact notification email for {}: {}",
                    msg.getEmail(),
                    error.getMessage()));
  }

  public void sendEmail(String recipientEmail, String subject, String htmlContent) {
    if (!enabled) {
      log.debug("Email sending skipped - Resend API key not configured");
      return;
    }

    Map<String, Object> payload =
        Map.of(
            "from", fromEmail,
            "to", recipientEmail,
            "subject", subject,
            "html", htmlContent);

    webClient
        .post()
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(payload)
        .retrieve()
        .bodyToMono(String.class)
        .subscribe(
            response -> log.info("Email sent successfully to: {}", recipientEmail),
            error ->
                log.error("Failed to send email to {}: {}", recipientEmail, error.getMessage()));
  }

  public void sendPasswordResetEmail(String recipientEmail, String resetUrl) {
    String html = templateService.renderPasswordReset(resetUrl);
    sendEmail(recipientEmail, "Reset Your Password - DoraAudit", html);
  }

  public void sendTeamInvitationEmail(
      String recipientEmail, String inviterName, String organizationName, String acceptUrl) {
    String html = templateService.renderTeamInvitation(inviterName, organizationName, acceptUrl);
    sendEmail(recipientEmail, "You're Invited to " + organizationName + " - DoraAudit", html);
  }

  public void sendTaskAssignmentEmail(String recipientEmail, String taskTitle, String systemName) {
    String html =
        templateService.renderTaskAssignment(
            taskTitle, systemName, getFrontendUrl() + "/dashboard");
    sendEmail(recipientEmail, "New Task: " + taskTitle + " - DoraAudit", html);
  }

  public void sendDeadlineAlertEmail(
      String recipientEmail,
      String obligationTitle,
      String systemName,
      String dueDate,
      int daysLeft) {
    String html =
        templateService.renderDeadlineAlert(
            obligationTitle, systemName, dueDate, daysLeft, getFrontendUrl() + "/dashboard");
    String prefix = daysLeft <= 0 ? "OVERDUE: " : "Deadline Alert: ";
    sendEmail(recipientEmail, prefix + obligationTitle + " - DoraAudit", html);
  }

  public void sendWeeklyDigestEmail(
      String recipientEmail,
      String userName,
      int totalAssessments,
      int complianceScore,
      int completedThisWeek,
      int overdueCount,
      List<String> upcomingDeadlines) {
    String html =
        templateService.renderWeeklyDigest(
            userName,
            totalAssessments,
            complianceScore,
            completedThisWeek,
            overdueCount,
            upcomingDeadlines,
            getFrontendUrl() + "/dashboard");
    sendEmail(recipientEmail, "Weekly Compliance Digest - DoraAudit", html);
  }

  private String getFrontendUrl() {
    return "https://doraaudit.eu";
  }

  private String buildEmailHtml(ContactMessage msg) {
    String timestamp =
        msg.getCreatedAt() != null
            ? msg.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
            : "N/A";

    return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #1a56db; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                        .field { margin-bottom: 16px; }
                        .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
                        .value { margin-top: 4px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
                        .message-box { white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin: 0;">Uus kontaktipäring - DoraAudit</h2>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Nimi</div>
                                <div class="value">%s</div>
                            </div>
                            <div class="field">
                                <div class="label">E-post</div>
                                <div class="value"><a href="mailto:%s">%s</a></div>
                            </div>
                            <div class="field">
                                <div class="label">Teema</div>
                                <div class="value">%s</div>
                            </div>
                            <div class="field">
                                <div class="label">Sõnum</div>
                                <div class="value message-box">%s</div>
                            </div>
                            <div class="field">
                                <div class="label">Kuupäev</div>
                                <div class="value">%s</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
        .formatted(
            escapeHtml(msg.getName()),
            escapeHtml(msg.getEmail()),
            escapeHtml(msg.getEmail()),
            escapeHtml(msg.getReason() != null ? msg.getReason() : "Täpsustamata"),
            escapeHtml(msg.getMessage()),
            timestamp);
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
