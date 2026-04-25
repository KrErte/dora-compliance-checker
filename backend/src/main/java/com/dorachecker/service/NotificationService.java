package com.dorachecker.service;

import com.dorachecker.model.NotificationEntity;
import com.dorachecker.model.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  private final NotificationRepository repository;

  public NotificationService(NotificationRepository repository) {
    this.repository = repository;
  }

  public NotificationEntity create(
      String userId, String type, String title, String message, String link, String severity) {
    NotificationEntity entity =
        new NotificationEntity(userId, type, title, message, link, severity);
    return repository.save(entity);
  }

  public List<NotificationEntity> getByUser(String userId) {
    return repository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public List<NotificationEntity> getUnread(String userId) {
    return repository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
  }

  public long getUnreadCount(String userId) {
    return repository.countByUserIdAndIsReadFalse(userId);
  }

  public void markAsRead(String id, String userId) {
    repository
        .findById(id)
        .filter(e -> e.getUserId().equals(userId))
        .ifPresent(
            e -> {
              e.setRead(true);
              repository.save(e);
            });
  }

  public void markAllAsRead(String userId) {
    List<NotificationEntity> unread =
        repository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    for (NotificationEntity e : unread) {
      e.setRead(true);
    }
    repository.saveAll(unread);
  }
}
