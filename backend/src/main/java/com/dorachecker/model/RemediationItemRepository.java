package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface RemediationItemRepository extends JpaRepository<RemediationItemEntity, String> {

    @Modifying
    @Transactional
    @Query("UPDATE RemediationItemEntity r SET r.status = :status, r.updatedAt = CURRENT_TIMESTAMP WHERE r.id IN :ids AND r.userId = :userId")
    int bulkUpdateStatus(@Param("ids") List<String> ids, @Param("userId") String userId, @Param("status") String status);

    @Modifying
    @Transactional
    @Query("UPDATE RemediationItemEntity r SET r.priority = :priority, r.updatedAt = CURRENT_TIMESTAMP WHERE r.id IN :ids AND r.userId = :userId")
    int bulkUpdatePriority(@Param("ids") List<String> ids, @Param("userId") String userId, @Param("priority") String priority);

    @Transactional
    void deleteByIdInAndUserId(List<String> ids, String userId);

    List<RemediationItemEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<RemediationItemEntity> findByUserIdAndStatusOrderByPriorityAsc(String userId, String status);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, String status);

    List<RemediationItemEntity> findByDueDateAndStatusNot(LocalDate dueDate, String status);

    List<RemediationItemEntity> findByDueDateBetweenAndStatusNot(LocalDate start, LocalDate end, String status);
}
