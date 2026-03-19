package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiActObligationRepository extends JpaRepository<AiActObligationEntity, String> {

    List<AiActObligationEntity> findByAiSystemIdOrderBySortOrder(String aiSystemId);

    void deleteAllByAiSystemId(String aiSystemId);

    Optional<AiActObligationEntity> findByIdAndAiSystemId(String id, String aiSystemId);

    @Query("SELECT o.status, COUNT(o) FROM AiActObligationEntity o WHERE o.aiSystemId = :aiSystemId GROUP BY o.status")
    List<Object[]> countByAiSystemIdGroupedByStatus(@Param("aiSystemId") String aiSystemId);

    long countByAiSystemId(String aiSystemId);

    long countByAiSystemIdAndStatus(String aiSystemId, String status);

    @Query("SELECT COUNT(o) FROM AiActObligationEntity o WHERE o.userId = :userId")
    long countByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(o) FROM AiActObligationEntity o WHERE o.userId = :userId AND o.status = 'COMPLETED'")
    long countCompletedByUserId(@Param("userId") String userId);
}
