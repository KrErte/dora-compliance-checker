package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduledReportRepository extends JpaRepository<ScheduledReportEntity, String> {

    List<ScheduledReportEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<ScheduledReportEntity> findByEnabledTrueAndNextRunAtBefore(LocalDateTime now);
}
