package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SsoConfigRepository extends JpaRepository<SsoConfigEntity, String> {
  List<SsoConfigEntity> findByOrganizationId(String organizationId);

  Optional<SsoConfigEntity> findByOrganizationIdAndStatus(
      String organizationId, SsoConfigEntity.SsoStatus status);
}
