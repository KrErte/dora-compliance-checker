package com.dorachecker.model;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiSystemRepository extends JpaRepository<AiSystemEntity, String>, JpaSpecificationExecutor<AiSystemEntity> {

    Page<AiSystemEntity> findByUserIdAndDeletedFalse(String userId, Pageable pageable);

    long countByUserIdAndDeletedFalse(String userId);

    Optional<AiSystemEntity> findByIdAndUserIdAndDeletedFalse(String id, String userId);

    @Query("SELECT COUNT(a) FROM AiSystemEntity a WHERE a.userId = :userId AND a.deleted = false AND a.riskLevel = :riskLevel")
    long countByUserIdAndRiskLevel(@Param("userId") String userId, @Param("riskLevel") String riskLevel);

    @Query("SELECT a.riskLevel, COUNT(a) FROM AiSystemEntity a WHERE a.userId = :userId AND a.deleted = false AND a.riskLevel IS NOT NULL GROUP BY a.riskLevel")
    java.util.List<Object[]> countByRiskLevelGrouped(@Param("userId") String userId);
}
