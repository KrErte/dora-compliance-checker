package com.dorachecker.service;

import com.dorachecker.model.ContractAlertEntity;
import com.dorachecker.model.ContractAlertRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContractAlertService {

    private final ContractAlertRepository alertRepository;

    public ContractAlertService(ContractAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public List<ContractAlertEntity> getAlerts(String userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ContractAlertEntity> getUnreadAlerts(String userId) {
        return alertRepository.findByUserIdAndIsReadFalse(userId);
    }

    public long getUnreadCount(String userId) {
        return alertRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(String alertId, String userId) {
        ContractAlertEntity alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Teavitust ei leitud: " + alertId));
        if (!alert.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Teavitus ei kuulu kasutajale");
        }
        alert.setRead(true);
        alertRepository.save(alert);
    }

    public ContractAlertEntity createAlert(String userId, String monitoredContractId,
                                            String alertType, String title, String message,
                                            String severity) {
        ContractAlertEntity alert = new ContractAlertEntity(
                userId, monitoredContractId, alertType, title, message, severity
        );
        return alertRepository.save(alert);
    }

    public ContractAlertEntity createScoreChangeAlert(String userId, String monitoredContractId,
                                                       String title, String message,
                                                       String severity,
                                                       Double previousScore, Double newScore) {
        ContractAlertEntity alert = new ContractAlertEntity(
                userId, monitoredContractId, "SCORE_CHANGED", title, message, severity
        );
        alert.setPreviousScore(previousScore);
        alert.setNewScore(newScore);
        return alertRepository.save(alert);
    }

    public ContractAlertEntity createRegulatoryAlert(String userId, String monitoredContractId,
                                                      String regulatoryUpdateId,
                                                      String title, String message,
                                                      String severity) {
        ContractAlertEntity alert = new ContractAlertEntity(
                userId, monitoredContractId, "NEW_REGULATION", title, message, severity
        );
        alert.setRegulatoryUpdateId(regulatoryUpdateId);
        return alertRepository.save(alert);
    }
}
