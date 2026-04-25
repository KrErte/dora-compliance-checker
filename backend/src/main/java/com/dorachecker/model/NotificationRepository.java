package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, String> {
  List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<NotificationEntity> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);

  long countByUserIdAndIsReadFalse(String userId);
}
