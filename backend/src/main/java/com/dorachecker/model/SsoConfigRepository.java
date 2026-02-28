package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SsoConfigRepository extends JpaRepository<SsoConfigEntity, String> {
    List<SsoConfigEntity> findByOrganizationId(String organizationId);
    Optional<SsoConfigEntity> findByOrganizationIdAndStatus(String organizationId, SsoConfigEntity.SsoStatus status);
}
