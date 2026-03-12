package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegulatoryTranslationRepository extends JpaRepository<RegulatoryTranslationEntity, String> {
    List<RegulatoryTranslationEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<RegulatoryTranslationEntity> findByUserIdAndRegulatoryUpdateId(String userId, String regulatoryUpdateId);
    long countByUserId(String userId);
    long countByUserIdAndStatus(String userId, String status);
}
