package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfigEntity, String> {
    List<IntegrationConfigEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<IntegrationConfigEntity> findByUserIdAndEnabledTrue(String userId);
    void deleteByIdAndUserId(String id, String userId);
}
