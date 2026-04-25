package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegulatorPortalTokenRepository
    extends JpaRepository<RegulatorPortalTokenEntity, String> {

  Optional<RegulatorPortalTokenEntity> findByToken(String token);

  List<RegulatorPortalTokenEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
