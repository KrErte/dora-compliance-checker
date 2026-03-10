package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RemediationItemRepository extends JpaRepository<RemediationItemEntity, String> {

    List<RemediationItemEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<RemediationItemEntity> findByUserIdAndStatusOrderByPriorityAsc(String userId, String status);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, String status);

    List<RemediationItemEntity> findByDueDateAndStatusNot(LocalDate dueDate, String status);

    List<RemediationItemEntity> findByDueDateBetweenAndStatusNot(LocalDate start, LocalDate end, String status);
}
