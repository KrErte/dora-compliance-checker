package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlobalIctProviderRepository extends JpaRepository<GlobalIctProviderEntity, String> {

    // Search by name (case-insensitive, partial match)
    @Query("SELECT g FROM GlobalIctProviderEntity g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY g.usageCount DESC, g.name ASC")
    List<GlobalIctProviderEntity> searchByName(@Param("query") String query);

    // Search by name with limit
    @Query(value = "SELECT * FROM global_ict_providers WHERE LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY usage_count DESC, name ASC LIMIT :limit", nativeQuery = true)
    List<GlobalIctProviderEntity> searchByNameWithLimit(@Param("query") String query, @Param("limit") int limit);

    // Find by exact name (for duplicate check)
    Optional<GlobalIctProviderEntity> findByNameIgnoreCase(String name);

    // Find all verified providers
    List<GlobalIctProviderEntity> findByIsVerifiedTrueOrderByUsageCountDesc();

    // Find by service type
    List<GlobalIctProviderEntity> findByServiceTypeIgnoreCaseOrderByUsageCountDesc(String serviceType);

    // Find by country code
    List<GlobalIctProviderEntity> findByCountryCodeIgnoreCaseOrderByUsageCountDesc(String countryCode);

    // Find CTPPs (Critical Third-Party Providers)
    List<GlobalIctProviderEntity> findByIsCtppTrueOrderByNameAsc();

    // Increment usage count when provider is added to user's supply chain
    @Modifying
    @Transactional
    @Query("UPDATE GlobalIctProviderEntity g SET g.usageCount = g.usageCount + 1 WHERE g.id = :id")
    void incrementUsageCount(@Param("id") String id);

    // Get most popular providers
    List<GlobalIctProviderEntity> findTop20ByOrderByUsageCountDesc();

    // Count total providers
    long count();
}
