package com.dorachecker.service;

import com.dorachecker.model.AiActAlertEntity;
import com.dorachecker.model.AiActObligationEntity;
import com.dorachecker.model.AiActObligationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class AiActDeadlineAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(AiActDeadlineAlertScheduler.class);

    private final AiActObligationRepository obligationRepository;
    private final AiActAlertService alertService;
    private final ResendEmailService emailService;

    public AiActDeadlineAlertScheduler(AiActObligationRepository obligationRepository,
                                        AiActAlertService alertService,
                                        ResendEmailService emailService) {
        this.obligationRepository = obligationRepository;
        this.alertService = alertService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 8 * * *") // Daily at 8 AM
    @Transactional
    public void checkDeadlines() {
        log.info("Running AI Act deadline alert check");
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(14);

        List<AiActObligationEntity> upcoming = obligationRepository.findAll().stream()
                .filter(o -> o.getDueDate() != null)
                .filter(o -> !"COMPLETED".equals(o.getStatus()) && !"NOT_APPLICABLE".equals(o.getStatus()))
                .filter(o -> !o.getDueDate().isAfter(warningDate))
                .toList();

        int created = 0;
        for (AiActObligationEntity obligation : upcoming) {
            int daysLeft = (int) today.until(obligation.getDueDate()).getDays();

            AiActAlertEntity.Severity severity;
            String title;

            if (obligation.getDueDate().isBefore(today)) {
                severity = AiActAlertEntity.Severity.CRITICAL;
                title = "OVERDUE: " + obligation.getArticleTitle();
            } else if (daysLeft <= 3) {
                severity = AiActAlertEntity.Severity.HIGH;
                title = "Due in " + daysLeft + " days: " + obligation.getArticleTitle();
            } else {
                severity = AiActAlertEntity.Severity.MEDIUM;
                title = "Due in " + daysLeft + " days: " + obligation.getArticleTitle();
            }

            // Skip if a similar alert was already created today
            boolean alreadyExists = alertService.existsRecentAlert(
                    obligation.getUserId(), obligation.getAiSystemId(),
                    AiActAlertEntity.AlertType.DEADLINE, title,
                    LocalDateTime.now().minusHours(20));
            if (alreadyExists) continue;

            alertService.createAlert(
                    obligation.getUserId(),
                    obligation.getAiSystemId(),
                    AiActAlertEntity.AlertType.DEADLINE,
                    severity,
                    title,
                    "Obligation '" + obligation.getArticleTitle() + "' is due on " + obligation.getDueDate()
            );
            created++;
        }
        log.info("Created {} AI Act deadline alerts", created);
    }
}
