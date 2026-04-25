package com.dorachecker.service;

import com.dorachecker.model.RegulatoryUpdateEntity;
import com.dorachecker.model.RegulatoryUpdateRepository;
import com.dorachecker.model.UserAlertEntity;
import com.dorachecker.model.UserAlertRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserAlertService {

  private final UserAlertRepository alertRepository;
  private final RegulatoryUpdateRepository updateRepository;

  public UserAlertService(
      UserAlertRepository alertRepository, RegulatoryUpdateRepository updateRepository) {
    this.alertRepository = alertRepository;
    this.updateRepository = updateRepository;
  }

  public List<UserAlertEntity> getAlerts(String userId) {
    return alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public long getUnreadCount(String userId) {
    return alertRepository.countByUserIdAndIsReadFalse(userId);
  }

  public Optional<UserAlertEntity> getAlert(String userId, String alertId) {
    return alertRepository.findById(alertId).filter(a -> a.getUserId().equals(userId));
  }

  public Optional<RegulatoryUpdateEntity> getRegulatoryUpdate(String updateId) {
    return updateRepository.findById(updateId);
  }

  public void markRead(String userId, String alertId) {
    alertRepository
        .findById(alertId)
        .filter(a -> a.getUserId().equals(userId))
        .ifPresent(
            a -> {
              a.setRead(true);
              a.setReadAt(LocalDateTime.now());
              alertRepository.save(a);
            });
  }

  public void markAllRead(String userId) {
    List<UserAlertEntity> unread = alertRepository.findByUserIdAndIsReadFalse(userId);
    LocalDateTime now = LocalDateTime.now();
    for (UserAlertEntity alert : unread) {
      alert.setRead(true);
      alert.setReadAt(now);
    }
    alertRepository.saveAll(unread);
  }
}
