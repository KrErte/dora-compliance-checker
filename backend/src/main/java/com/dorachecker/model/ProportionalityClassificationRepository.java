package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProportionalityClassificationRepository
    extends JpaRepository<ProportionalityClassificationEntity, String> {
  Optional<ProportionalityClassificationEntity> findByUserId(String userId);
}
