package com.dorachecker.model;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AiActAlertRepository extends JpaRepository<AiActAlertEntity, String> {

    Page<AiActAlertEntity> findByUserIdAndDismissedFalseOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndIsReadFalseAndDismissedFalse(String userId);

    @Modifying
    @Query("UPDATE AiActAlertEntity a SET a.isRead = true WHERE a.userId = :userId AND a.isRead = false")
    void markAllAsRead(@Param("userId") String userId);

    @Query("SELECT COUNT(a) > 0 FROM AiActAlertEntity a WHERE a.userId = :userId AND a.aiSystemId = :aiSystemId AND a.alertType = :alertType AND a.title = :title AND a.createdAt > :since")
    boolean existsRecentAlert(@Param("userId") String userId,
                               @Param("aiSystemId") String aiSystemId,
                               @Param("alertType") AiActAlertEntity.AlertType alertType,
                               @Param("title") String title,
                               @Param("since") LocalDateTime since);
}
