package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvidenceRepository extends JpaRepository<EvidenceEntity, String> {

    List<EvidenceEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<EvidenceEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    List<EvidenceEntity> findByUserIdAndPillarOrderByCreatedAtDesc(String userId, String pillar);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, String status);

    void deleteByUserId(String userId);
}
