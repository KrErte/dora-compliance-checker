package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlertDigestRepository extends JpaRepository<AlertDigestEntity, String> {
    Optional<AlertDigestEntity> findTopByUserIdOrderBySentAtDesc(String userId);
}
