package com.dorachecker.service;

import com.dorachecker.model.MonitoredContractEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuardianScheduler {

    private static final Logger log = LoggerFactory.getLogger(GuardianScheduler.class);

    private final MonitoredContractService monitoredContractService;

    @Value("${guardian.scheduler.enabled:false}")
    private boolean schedulerEnabled;

    public GuardianScheduler(MonitoredContractService monitoredContractService) {
        this.monitoredContractService = monitoredContractService;
    }

    /**
     * Weekly re-analysis of all active monitored contracts.
     * Runs every Monday at 03:00 to minimize impact.
     * Uses AI (Claude) for re-analysis, so gated by config flag.
     */
    @Scheduled(cron = "${guardian.scheduler.cron:0 0 3 * * MON}")
    public void reanalyzeActiveContracts() {
        if (!schedulerEnabled) {
            log.debug("Guardian scheduler disabled — skipping re-analysis");
            return;
        }

        List<MonitoredContractEntity> activeContracts = monitoredContractService.getActiveContracts();
        log.info("Guardian scheduler: starting re-analysis of {} active contracts", activeContracts.size());

        int success = 0;
        int failed = 0;

        for (MonitoredContractEntity contract : activeContracts) {
            try {
                monitoredContractService.reanalyze(contract.getId(), contract.getUserId());
                success++;
                log.info("Re-analyzed contract '{}' (ID: {}) for user {}",
                        contract.getContractName(), contract.getId(), contract.getUserId());
            } catch (Exception e) {
                failed++;
                log.error("Failed to re-analyze contract '{}' (ID: {}): {}",
                        contract.getContractName(), contract.getId(), e.getMessage());
            }
        }

        log.info("Guardian scheduler complete: {} succeeded, {} failed out of {} total",
                success, failed, activeContracts.size());
    }
}
