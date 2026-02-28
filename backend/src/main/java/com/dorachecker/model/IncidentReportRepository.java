package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface IncidentReportRepository extends JpaRepository<IncidentReportEntity, String> {

    List<IncidentReportEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<IncidentReportEntity> findByUserIdAndReportingStatusOrderByCreatedAtDesc(String userId, String reportingStatus);

    @Query("SELECT i FROM IncidentReportEntity i WHERE i.userId = :userId AND i.isMajor = true ORDER BY i.createdAt DESC")
    List<IncidentReportEntity> findMajorIncidents(String userId);

    @Query("SELECT i FROM IncidentReportEntity i WHERE i.reportingStatus NOT IN ('CLOSED', 'FINAL_SENT') " +
           "AND ((i.initialReportDueAt IS NOT NULL AND i.initialReportSentAt IS NULL AND i.initialReportDueAt < :now) " +
           "OR (i.intermediateReportDueAt IS NOT NULL AND i.intermediateReportSentAt IS NULL AND i.intermediateReportDueAt < :now) " +
           "OR (i.finalReportDueAt IS NOT NULL AND i.finalReportSentAt IS NULL AND i.finalReportDueAt < :now))")
    List<IncidentReportEntity> findOverdueReports(LocalDateTime now);

    long countByUserId(String userId);

    long countByUserIdAndIsMajorTrue(String userId);

    long countByUserIdAndReportingStatus(String userId, String status);
}
