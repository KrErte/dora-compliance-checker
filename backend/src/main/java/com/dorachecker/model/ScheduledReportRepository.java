package com.dorachecker.model;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduledReportRepository extends JpaRepository<ScheduledReportEntity, String> {

  List<ScheduledReportEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<ScheduledReportEntity> findByEnabledTrueAndNextRunAtBefore(LocalDateTime now);
}
