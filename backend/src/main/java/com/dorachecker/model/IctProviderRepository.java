package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface IctProviderRepository extends JpaRepository<IctProviderEntity, String> {

    List<IctProviderEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<IctProviderEntity> findByUserIdAndIsCriticalTrueOrderByRiskScoreDesc(String userId);

    long countByUserId(String userId);

    long countByUserIdAndRiskScoreGreaterThanEqual(String userId, Integer riskScore);

    @Modifying
    @Transactional
    void deleteByIdAndUserId(String id, String userId);
}
