package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProportionalityClassificationRepository extends JpaRepository<ProportionalityClassificationEntity, String> {
    Optional<ProportionalityClassificationEntity> findByUserId(String userId);
}
