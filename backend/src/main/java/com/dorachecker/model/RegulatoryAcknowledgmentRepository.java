package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegulatoryAcknowledgmentRepository
    extends JpaRepository<RegulatoryAcknowledgmentEntity, String> {

  boolean existsByUserIdAndUpdateId(String userId, String updateId);

  List<RegulatoryAcknowledgmentEntity> findByUserId(String userId);

  long countByUserId(String userId);
}
