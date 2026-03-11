package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegulatorPortalTokenRepository extends JpaRepository<RegulatorPortalTokenEntity, String> {

    Optional<RegulatorPortalTokenEntity> findByToken(String token);

    List<RegulatorPortalTokenEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
