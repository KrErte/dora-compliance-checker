package com.dorachecker.model;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantBrandingRepository extends JpaRepository<TenantBrandingEntity, String> {

  Optional<TenantBrandingEntity> findByUserId(String userId);

  Optional<TenantBrandingEntity> findByCustomDomain(String customDomain);
}
