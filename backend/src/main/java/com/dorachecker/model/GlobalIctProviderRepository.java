package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface GlobalIctProviderRepository
    extends JpaRepository<GlobalIctProviderEntity, String> {

  // Search by name (case-insensitive, partial match)
  @Query(
      "SELECT g FROM GlobalIctProviderEntity g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY g.usageCount DESC, g.name ASC")
  List<GlobalIctProviderEntity> searchByName(@Param("query") String query);

  // Search by name with limit
  @Query(
      value =
          "SELECT * FROM global_ict_providers WHERE LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY usage_count DESC, name ASC LIMIT :limit",
      nativeQuery = true)
  List<GlobalIctProviderEntity> searchByNameWithLimit(
      @Param("query") String query, @Param("limit") int limit);

  // Find by exact name (for duplicate check)
  Optional<GlobalIctProviderEntity> findByNameIgnoreCase(String name);

  // Find all verified providers
  List<GlobalIctProviderEntity> findByIsVerifiedTrueOrderByUsageCountDesc();

  // Find by service type
  List<GlobalIctProviderEntity> findByServiceTypeIgnoreCaseOrderByUsageCountDesc(
      String serviceType);

  // Find by country code
  List<GlobalIctProviderEntity> findByCountryCodeIgnoreCaseOrderByUsageCountDesc(
      String countryCode);

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

  // Crawler-specific methods

  // Find by registration code (Estonian business registry)
  Optional<GlobalIctProviderEntity> findByRegistrationCode(String registrationCode);

  // Find by source
  List<GlobalIctProviderEntity> findBySource(String source);

  // Find providers that can be updated by crawler (not user-modified)
  @Query(
      "SELECT g FROM GlobalIctProviderEntity g WHERE g.source = :source AND (g.isUserModified = false OR g.isUserModified IS NULL)")
  List<GlobalIctProviderEntity> findCrawlerUpdatableBySource(@Param("source") String source);

  // Find by name and source for upsert
  Optional<GlobalIctProviderEntity> findByNameIgnoreCaseAndSource(String name, String source);

  // Count by source
  long countBySource(String source);

  // Count CTPPs
  long countByIsCtppTrue();

  // Find by EMTAK code
  List<GlobalIctProviderEntity> findByEmtakCodeStartingWith(String emtakPrefix);

  // Advanced search with country and service type filters
  @Query(
      value =
          "SELECT * FROM global_ict_providers WHERE "
              + "LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) "
              + "AND (:country IS NULL OR country_code = :country) "
              + "AND (:serviceType IS NULL OR service_type = :serviceType) "
              + "ORDER BY is_ctpp DESC, name ASC LIMIT 20",
      nativeQuery = true)
  List<GlobalIctProviderEntity> searchProviders(
      @Param("query") String query,
      @Param("country") String country,
      @Param("serviceType") String serviceType);
}
