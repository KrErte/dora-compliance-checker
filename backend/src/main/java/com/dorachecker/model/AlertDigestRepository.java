package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertDigestRepository extends JpaRepository<AlertDigestEntity, String> {
  Optional<AlertDigestEntity> findTopByUserIdOrderBySentAtDesc(String userId);
}
