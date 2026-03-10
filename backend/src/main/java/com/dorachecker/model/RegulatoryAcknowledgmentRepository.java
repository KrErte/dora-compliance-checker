package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegulatoryAcknowledgmentRepository extends JpaRepository<RegulatoryAcknowledgmentEntity, String> {

    boolean existsByUserIdAndUpdateId(String userId, String updateId);

    List<RegulatoryAcknowledgmentEntity> findByUserId(String userId);

    long countByUserId(String userId);
}
