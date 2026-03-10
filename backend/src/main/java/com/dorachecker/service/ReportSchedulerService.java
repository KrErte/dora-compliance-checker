package com.dorachecker.service;

import com.dorachecker.model.ScheduledReportEntity;
import com.dorachecker.model.ScheduledReportRepository;
import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ReportSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReportSchedulerService.class);

    private final ScheduledReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PdfExportService pdfExportService;
    private final ResendEmailService emailService;

    public ReportSchedulerService(
            ScheduledReportRepository reportRepository,
            UserRepository userRepository,
            PdfExportService pdfExportService,
            ResendEmailService emailService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.pdfExportService = pdfExportService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 6 * * *")
    public void processScheduledReports() {
        List<ScheduledReportEntity> dueReports = reportRepository
                .findByEnabledTrueAndNextRunAtBefore(LocalDateTime.now());

        if (dueReports.isEmpty()) {
            log.debug("No scheduled reports due");
            return;
        }

        log.info("Processing {} scheduled reports", dueReports.size());

        for (ScheduledReportEntity report : dueReports) {
            try {
                userRepository.findById(report.getUserId()).ifPresent(user -> {
                    // Send notification email about report generation
                    String recipients = report.getRecipients() != null ? report.getRecipients() : user.getEmail();
                    for (String email : recipients.split(",")) {
                        String trimmedEmail = email.trim();
                        if (!trimmedEmail.isBlank()) {
                            String subject = "DoraAudit – Scheduled " + report.getReportType() + " Report";
                            String html = buildReportEmail(user, report);
                            emailService.sendEmail(trimmedEmail, subject, html);
                        }
                    }
                });

                report.setLastRunAt(LocalDateTime.now());
                report.setNextRunAt(calculateNextRun(report));
                reportRepository.save(report);
                log.info("Scheduled report {} processed successfully", report.getId());
            } catch (Exception e) {
                log.error("Failed to process scheduled report {}: {}", report.getId(), e.getMessage());
            }
        }
    }

    public LocalDateTime calculateNextRun(ScheduledReportEntity report) {
        LocalDateTime now = LocalDateTime.now();
        if ("WEEKLY".equals(report.getFrequency())) {
            int dayOfWeek = report.getDayOfWeek() != null ? report.getDayOfWeek() : 1;
            DayOfWeek targetDay = DayOfWeek.of(dayOfWeek);
            return now.with(TemporalAdjusters.next(targetDay)).withHour(6).withMinute(0).withSecond(0);
        } else {
            int dayOfMonth = report.getDayOfMonth() != null ? report.getDayOfMonth() : 1;
            LocalDateTime next = now.plusMonths(1).withDayOfMonth(Math.min(dayOfMonth, 28))
                    .withHour(6).withMinute(0).withSecond(0);
            return next;
        }
    }

    private String buildReportEmail(UserEntity user, ScheduledReportEntity report) {
        String name = user.getFullName() != null ? user.getFullName() : user.getEmail().split("@")[0];
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
                    <div style="max-width: 600px; margin: 20px auto;">
                        <div style="background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h2 style="margin: 0;">Ajastatud aruanne valmis</h2>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>Teie ajastatud <strong>%s</strong> aruanne on valmis. Logige sisse platvormile, et see alla laadida.</p>
                            <p style="text-align: center;">
                                <a href="https://doraaudit.eu/dashboard"
                                   style="display: inline-block; background: linear-gradient(135deg, #059669, #0891b2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                                   Ava DoraAudit &rarr;
                                </a>
                            </p>
                        </div>
                        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
                            &copy; 2026 DoraAudit. Kõik õigused kaitstud.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(escapeHtml(name), report.getReportType());
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }
}
