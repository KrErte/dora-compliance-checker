package com.dorachecker.service;

import com.dorachecker.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MonitoredContractService {

    private final MonitoredContractRepository monitoredRepo;
    private final ContractAnalysisRepository analysisRepo;
    private final ContractAnalysisService analysisService;
    private final ContractAlertService alertService;

    public MonitoredContractService(MonitoredContractRepository monitoredRepo,
                                     ContractAnalysisRepository analysisRepo,
                                     ContractAnalysisService analysisService,
                                     ContractAlertService alertService) {
        this.monitoredRepo = monitoredRepo;
        this.analysisRepo = analysisRepo;
        this.analysisService = analysisService;
        this.alertService = alertService;
    }

    public MonitoredContractEntity startMonitoring(String contractAnalysisId, String contractText, String userId) {
        // Check if already monitored
        monitoredRepo.findByContractAnalysisIdAndUserId(contractAnalysisId, userId)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("See leping on juba seire all: " + existing.getId());
                });

        ContractAnalysisEntity analysis = analysisRepo.findById(contractAnalysisId)
                .orElseThrow(() -> new IllegalArgumentException("Analüüsi ei leitud: " + contractAnalysisId));

        MonitoredContractEntity monitored = new MonitoredContractEntity(
                userId, contractAnalysisId,
                analysis.getCompanyName(), analysis.getContractName(),
                analysis.getFileName(), contractText,
                analysis.getScorePercentage(), analysis.getComplianceLevel()
        );

        return monitoredRepo.save(monitored);
    }

    public List<MonitoredContractEntity> getContracts(String userId) {
        return monitoredRepo.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public MonitoredContractEntity getContract(String id, String userId) {
        MonitoredContractEntity contract = monitoredRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seiratavat lepingut ei leitud: " + id));
        if (!contract.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Leping ei kuulu kasutajale");
        }
        return contract;
    }

    public MonitoredContractEntity pause(String id, String userId) {
        MonitoredContractEntity contract = getContract(id, userId);
        contract.setMonitoringStatus("PAUSED");
        contract.setUpdatedAt(LocalDateTime.now());
        return monitoredRepo.save(contract);
    }

    public MonitoredContractEntity resume(String id, String userId) {
        MonitoredContractEntity contract = getContract(id, userId);
        contract.setMonitoringStatus("ACTIVE");
        contract.setUpdatedAt(LocalDateTime.now());
        return monitoredRepo.save(contract);
    }

    public MonitoredContractEntity reanalyze(String id, String userId) {
        MonitoredContractEntity contract = getContract(id, userId);

        Double previousScore = contract.getCurrentScore();

        // Re-analyze using stored contract text
        ContractAnalysisResult result = analysisService.analyzeFromText(
                contract.getContractText(),
                contract.getCompanyName(),
                contract.getContractName(),
                contract.getFileName(),
                userId
        );

        // Update monitored contract with new results
        contract.setCurrentScore(result.scorePercentage());
        contract.setCurrentLevel(result.complianceLevel());
        contract.setLastAnalysisId(result.id());
        contract.setLastAnalysisDate(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());
        monitoredRepo.save(contract);

        // Create alert if score changed significantly
        if (previousScore != null) {
            double diff = result.scorePercentage() - previousScore;
            if (Math.abs(diff) >= 2.0) {
                String severity = diff < -10 ? "HIGH" : diff < 0 ? "MEDIUM" : "LOW";
                String direction = diff < 0 ? "langes" : "tõusis";
                alertService.createScoreChangeAlert(
                        userId, contract.getId(),
                        "Skoor " + direction,
                        String.format("Lepingu \"%s\" skoor %s %.1f%%-lt %.1f%%-le.",
                                contract.getContractName(), direction, previousScore, result.scorePercentage()),
                        severity, previousScore, result.scorePercentage()
                );
            }
        }

        return contract;
    }

    public List<MonitoredContractEntity> getActiveContracts() {
        return monitoredRepo.findByMonitoringStatus("ACTIVE");
    }
}
