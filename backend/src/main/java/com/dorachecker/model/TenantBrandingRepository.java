package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantBrandingRepository extends JpaRepository<TenantBrandingEntity, String> {

    Optional<TenantBrandingEntity> findByUserId(String userId);

    Optional<TenantBrandingEntity> findByCustomDomain(String customDomain);
}
