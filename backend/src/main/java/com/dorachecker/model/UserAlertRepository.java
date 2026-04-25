package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAlertRepository extends JpaRepository<UserAlertEntity, String> {
  List<UserAlertEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<UserAlertEntity> findByUserIdAndIsReadFalse(String userId);

  long countByUserIdAndIsReadFalse(String userId);

  boolean existsByUserIdAndRegulatoryUpdateId(String userId, String regulatoryUpdateId);
}
