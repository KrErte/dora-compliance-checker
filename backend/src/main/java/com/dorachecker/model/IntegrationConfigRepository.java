package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IntegrationConfigRepository
    extends JpaRepository<IntegrationConfigEntity, String> {
  List<IntegrationConfigEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<IntegrationConfigEntity> findByUserIdAndEnabledTrue(String userId);

  void deleteByIdAndUserId(String id, String userId);
}
