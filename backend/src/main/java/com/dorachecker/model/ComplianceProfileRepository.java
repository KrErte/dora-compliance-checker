package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComplianceProfileRepository extends JpaRepository<ComplianceProfileEntity, String> {
    Optional<ComplianceProfileEntity> findByUserId(String userId);
    boolean existsByUserId(String userId);
    void deleteByUserId(String userId);
}
