package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AutopilotInsightRepository extends JpaRepository<AutopilotInsightEntity, String> {

  List<AutopilotInsightEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<AutopilotInsightEntity> findByUserIdAndStatusOrderByCreatedAtDesc(
      String userId, String status);

  List<AutopilotInsightEntity> findByUserIdAndStatusInOrderByCreatedAtDesc(
      String userId, List<String> statuses);

  List<AutopilotInsightEntity> findByUserIdAndSeverityAndStatusInOrderByCreatedAtDesc(
      String userId, String severity, List<String> statuses);

  Optional<AutopilotInsightEntity> findByUserIdAndDeduplicationKey(
      String userId, String deduplicationKey);

  long countByUserIdAndStatus(String userId, String status);

  long countByUserIdAndSeverityAndStatusIn(String userId, String severity, List<String> statuses);

  long countByUserIdAndStatusIn(String userId, List<String> statuses);

  List<AutopilotInsightEntity> findByUserIdAndStatusAndSnoozeUntilBefore(
      String userId, String status, LocalDateTime now);

  void deleteByUserIdAndDeduplicationKey(String userId, String deduplicationKey);
}
