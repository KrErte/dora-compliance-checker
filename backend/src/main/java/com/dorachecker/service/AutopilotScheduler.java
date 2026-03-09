package com.dorachecker.service;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.AssessmentEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AutopilotScheduler {

    private static final Logger log = LoggerFactory.getLogger(AutopilotScheduler.class);

    private final AutopilotService autopilotService;
    private final AssessmentRepository assessmentRepository;
    private final SubscriptionGuardService subscriptionGuard;

    @Value("${autopilot.scheduler.enabled:false}")
    private boolean schedulerEnabled;

    public AutopilotScheduler(AutopilotService autopilotService,
                               AssessmentRepository assessmentRepository,
                               SubscriptionGuardService subscriptionGuard) {
        this.autopilotService = autopilotService;
        this.assessmentRepository = assessmentRepository;
        this.subscriptionGuard = subscriptionGuard;
    }

    @Scheduled(cron = "${autopilot.scheduler.cron:0 0 4 * * *}")
    public void dailyScan() {
        if (!schedulerEnabled) {
            log.debug("Autopilot scheduler disabled — skipping daily scan");
            return;
        }

        // Get distinct user IDs who have assessments
        Set<String> userIds = assessmentRepository.findAll().stream()
            .map(AssessmentEntity::getUserId)
            .filter(id -> id != null && !id.isEmpty())
            .collect(Collectors.toSet());

        log.info("Autopilot scheduler: scanning {} users with assessments", userIds.size());

        int success = 0;
        int skipped = 0;
        int failed = 0;

        for (String userId : userIds) {
            try {
                if (!subscriptionGuard.isPremium(userId, null)) {
                    skipped++;
                    continue;
                }
                autopilotService.runScan(userId);
                success++;
            } catch (Exception e) {
                failed++;
                log.error("Autopilot scan failed for user {}: {}", userId, e.getMessage());
            }
        }

        log.info("Autopilot scheduler complete: {} scanned, {} skipped (free tier), {} failed",
            success, skipped, failed);
    }
}
