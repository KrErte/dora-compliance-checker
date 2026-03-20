package com.dorachecker.service;

import com.dorachecker.model.AiActAlertEntity;
import com.dorachecker.model.AiActAlertRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiActAlertService {

    private final AiActAlertRepository alertRepository;

    public AiActAlertService(AiActAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public Page<AiActAlertEntity> getAlerts(String userId, int page, int size) {
        return alertRepository.findByUserIdAndDismissedFalseOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    public long getUnreadCount(String userId) {
        return alertRepository.countByUserIdAndIsReadFalseAndDismissedFalse(userId);
    }

    @Transactional
    public void markAsRead(String alertId, String userId) {
        alertRepository.findById(alertId).ifPresent(alert -> {
            if (userId.equals(alert.getUserId())) {
                alert.setRead(true);
                alertRepository.save(alert);
            }
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        alertRepository.markAllAsRead(userId);
    }

    @Transactional
    public void dismiss(String alertId, String userId) {
        alertRepository.findById(alertId).ifPresent(alert -> {
            if (userId.equals(alert.getUserId())) {
                alert.setDismissed(true);
                alertRepository.save(alert);
            }
        });
    }

    public boolean existsRecentAlert(String userId, String aiSystemId,
                                      AiActAlertEntity.AlertType type, String title,
                                      java.time.LocalDateTime since) {
        return alertRepository.existsRecentAlert(userId, aiSystemId, type, title, since);
    }

    @Transactional
    public AiActAlertEntity createAlert(String userId, String aiSystemId,
                                         AiActAlertEntity.AlertType type,
                                         AiActAlertEntity.Severity severity,
                                         String title, String message) {
        AiActAlertEntity alert = new AiActAlertEntity();
        alert.setUserId(userId);
        alert.setAiSystemId(aiSystemId);
        alert.setAlertType(type);
        alert.setSeverity(severity);
        alert.setTitle(title);
        alert.setMessage(message);
        return alertRepository.save(alert);
    }
}
