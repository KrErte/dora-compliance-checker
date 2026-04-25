package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceProfileRepository
    extends JpaRepository<ComplianceProfileEntity, String> {
  Optional<ComplianceProfileEntity> findByUserId(String userId);

  boolean existsByUserId(String userId);

  void deleteByUserId(String userId);
}
